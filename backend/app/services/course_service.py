from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from app.models.course import Course, CourseNode
from app.models.countdown import Countdown
from app.models.fixed_schedule import FixedSchedule
from app.models.sync import AppSetting
from app.models.task import Task
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseOut, CourseDetailOut,
    CourseNodeCreate, CourseNodeUpdate, CourseNodeOut, CourseNodeTreeOut,
    CreateStudyTaskRequest, BurnoutAnalysisOut, BurnoutDayDetail, BurnoutCustomConfig
)
from app.schemas.task import TaskOut
from app.services.task_service import TaskService

DAY_NAMES = [
    ("MON", "Thứ Hai", 0),
    ("TUE", "Thứ Ba", 1),
    ("WED", "Thứ Tư", 2),
    ("THU", "Thứ Năm", 3),
    ("FRI", "Thứ Sáu", 4),
    ("SAT", "Thứ Bảy", 5),
    ("SUN", "Chủ Nhật", 6),
]

class CourseService:
    @classmethod
    def _calculate_course_pace(cls, db: Session, course: Course, nodes: List[CourseNode]) -> Dict[str, Any]:
        """Calculate countdown link, remaining minutes, remaining lessons, and daily study pace."""
        # Find leaf nodes (actual lessons/resources)
        leaf_nodes = [n for n in nodes if not any(child.parent_id == n.id for child in nodes)]
        incomplete_leaf_nodes = [n for n in leaf_nodes if n.status != "COMPLETED"]

        remaining_duration = sum((n.duration or 45) for n in incomplete_leaf_nodes)
        remaining_lessons = len(incomplete_leaf_nodes)

        countdown_title = None
        countdown_target_date = None
        countdown_days_left = None
        countdown_icon = None
        estimated_daily_study_minutes = None
        estimated_daily_lessons = None

        if course.countdown_id:
            cd = db.query(Countdown).filter(Countdown.id == course.countdown_id).first()
            if cd:
                countdown_title = cd.title
                countdown_target_date = cd.target_date
                countdown_icon = cd.icon or "🎓"
                days_diff = (cd.target_date.date() - datetime.now().date()).days
                countdown_days_left = max(1, days_diff)
                estimated_daily_study_minutes = round(remaining_duration / countdown_days_left, 1)
                estimated_daily_lessons = round(remaining_lessons / countdown_days_left, 2)

        return {
            "countdown_id": course.countdown_id,
            "countdown_title": countdown_title,
            "countdown_target_date": countdown_target_date,
            "countdown_days_left": countdown_days_left,
            "countdown_icon": countdown_icon,
            "remaining_duration_minutes": remaining_duration,
            "remaining_lessons_count": remaining_lessons,
            "estimated_daily_study_minutes": estimated_daily_study_minutes,
            "estimated_daily_lessons": estimated_daily_lessons,
        }

    @classmethod
    def list_courses(cls, db: Session) -> List[CourseOut]:
        courses = db.query(Course).all()
        results: List[CourseOut] = []
        for c in courses:
            nodes = db.query(CourseNode).filter(CourseNode.course_id == c.id).all()
            total_nodes = len(nodes)
            completed_nodes = sum(1 for n in nodes if n.status == "COMPLETED")
            
            # Leaf nodes progress average
            leaf_nodes = [n for n in nodes if not any(child.parent_id == n.id for child in nodes)]
            if leaf_nodes:
                overall_progress = sum(n.progress for n in leaf_nodes) / len(leaf_nodes)
            else:
                overall_progress = 0.0

            pace_info = cls._calculate_course_pace(db, c, nodes)

            results.append(CourseOut(
                id=c.id,
                title=c.title,
                description=c.description,
                instructor=c.instructor,
                color=c.color,
                cover_style=c.cover_style or "DEFAULT",
                cover_config=c.cover_config,
                mastery_points=c.mastery_points or 0,
                mastery_level=c.mastery_level or 1,
                created_at=c.created_at,
                updated_at=c.updated_at,
                total_nodes_count=total_nodes,
                completed_nodes_count=completed_nodes,
                overall_progress=round(overall_progress, 1),
                **pace_info
            ))
        return results

    @classmethod
    def get_course_detail(cls, db: Session, course_id: int) -> Optional[CourseDetailOut]:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return None

        all_nodes = db.query(CourseNode).filter(CourseNode.course_id == course_id).order_by(CourseNode.order_index).all()
        
        # Build node tree
        node_map: Dict[int, CourseNodeTreeOut] = {}
        for n in all_nodes:
            node_map[n.id] = CourseNodeTreeOut(
                id=n.id,
                course_id=n.course_id,
                parent_id=n.parent_id,
                title=n.title,
                type=n.type,
                description=n.description,
                notes=n.notes,
                video_url=n.video_url,
                document_url=n.document_url,
                duration=n.duration,
                estimated_study_time=n.estimated_study_time,
                difficulty=n.difficulty,
                status=n.status,
                progress=round(n.progress, 1),
                order_index=n.order_index,
                created_at=n.created_at,
                updated_at=n.updated_at,
                has_children=False,
                children=[]
            )

        root_nodes: List[CourseNodeTreeOut] = []
        for n in all_nodes:
            tree_item = node_map[n.id]
            if n.parent_id and n.parent_id in node_map:
                parent_item = node_map[n.parent_id]
                parent_item.children.append(tree_item)
                parent_item.has_children = True
            else:
                root_nodes.append(tree_item)

        total_nodes = len(all_nodes)
        completed_nodes = sum(1 for n in all_nodes if n.status == "COMPLETED")
        leaf_nodes = [n for n in all_nodes if not any(child.parent_id == n.id for child in all_nodes)]
        overall_progress = (sum(n.progress for n in leaf_nodes) / len(leaf_nodes)) if leaf_nodes else 0.0

        pace_info = cls._calculate_course_pace(db, course, all_nodes)

        return CourseDetailOut(
            id=course.id,
            title=course.title,
            description=course.description,
            instructor=course.instructor,
            color=course.color,
            cover_style=course.cover_style or "DEFAULT",
            cover_config=course.cover_config,
            mastery_points=course.mastery_points or 0,
            mastery_level=course.mastery_level or 1,
            created_at=course.created_at,
            updated_at=course.updated_at,
            total_nodes_count=total_nodes,
            completed_nodes_count=completed_nodes,
            overall_progress=round(overall_progress, 1),
            root_nodes=root_nodes,
            **pace_info
        )

    @classmethod
    def create_course(cls, db: Session, course_in: CourseCreate) -> Course:
        course = Course(**course_in.model_dump())
        db.add(course)
        db.commit()
        db.refresh(course)
        return course

    @classmethod
    def update_course(cls, db: Session, course_id: int, course_in: CourseUpdate) -> Optional[Course]:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return None
        update_data = course_in.model_dump(exclude_unset=True)
        for field, val in update_data.items():
            setattr(course, field, val)
        course.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(course)
        return course

    @classmethod
    def create_node(cls, db: Session, node_in: CourseNodeCreate) -> CourseNode:
        node_data = node_in.model_dump()
        node = CourseNode(**node_data)
        db.add(node)
        db.commit()
        db.refresh(node)

        # Bubble progress if created with progress/status
        cls._recalculate_parent_progress(db, node.parent_id)
        db.refresh(node)
        return node

    @classmethod
    def update_node(cls, db: Session, node_id: int, node_in: CourseNodeUpdate) -> Optional[CourseNode]:
        node = db.query(CourseNode).filter(CourseNode.id == node_id).first()
        if not node:
            return None

        old_status = node.status
        update_data = node_in.model_dump(exclude_unset=True)
        old_parent_id = node.parent_id

        # If status changed to COMPLETED, ensure progress is 100
        if "status" in update_data:
            if update_data["status"] == "COMPLETED":
                update_data["progress"] = 100.0
            elif update_data["status"] == "NOT_STARTED" and update_data.get("progress", node.progress) == 100.0:
                update_data["progress"] = 0.0

        # If progress changed, auto set status
        if "progress" in update_data and "status" not in update_data:
            prog = update_data["progress"]
            if prog >= 100.0:
                update_data["status"] = "COMPLETED"
            elif prog > 0.0:
                update_data["status"] = "IN_PROGRESS"
            else:
                update_data["status"] = "NOT_STARTED"

        for field, val in update_data.items():
            setattr(node, field, val)

        # Gamification: Award EXP when completing a node
        if old_status != "COMPLETED" and node.status == "COMPLETED":
            dur = node.duration or 30
            if dur < 20:
                gained_exp = 15
            elif dur <= 45:
                gained_exp = 30
            else:
                gained_exp = 50
            if getattr(node, 'type', '') in ["PRACTICE", "RESOURCE"]:
                gained_exp += 20

            course = db.query(Course).filter(Course.id == node.course_id).first()
            if course:
                course.mastery_points = (course.mastery_points or 0) + gained_exp
                pts = course.mastery_points
                if pts >= 40000:
                    course.mastery_level = 10  # Tuyệt Đối Thần Vương
                elif pts >= 25000:
                    course.mastery_level = 9   # Chiến Thần Học Thuật
                elif pts >= 16000:
                    course.mastery_level = 8   # Đại Tông Sư
                elif pts >= 10000:
                    course.mastery_level = 7   # Tinh Anh Đỉnh Cao
                elif pts >= 6000:
                    course.mastery_level = 6   # Kim Cương Chuyên Sâu
                elif pts >= 3500:
                    course.mastery_level = 5   # Bạch Kim Tập Trung
                elif pts >= 1800:
                    course.mastery_level = 4   # Vàng Kiên Trì
                elif pts >= 750:
                    course.mastery_level = 3   # Bạc Rèn Luyện
                elif pts >= 250:
                    course.mastery_level = 2   # Đồng Khắc Kỷ
                else:
                    course.mastery_level = 1   # Đồng Khởi Đầu

        node.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(node)

        # Recalculate parent progress
        cls._recalculate_parent_progress(db, node.parent_id)
        if old_parent_id and old_parent_id != node.parent_id:
            cls._recalculate_parent_progress(db, old_parent_id)

        db.refresh(node)
        return node

    @classmethod
    def _recalculate_parent_progress(cls, db: Session, parent_id: Optional[int]):
        """Recursively recalculate progress and status of parent nodes."""
        if not parent_id:
            return
        parent = db.query(CourseNode).filter(CourseNode.id == parent_id).first()
        if not parent:
            return

        children = db.query(CourseNode).filter(CourseNode.parent_id == parent_id).all()
        if not children:
            return

        avg_progress = sum(c.progress for c in children) / len(children)
        parent.progress = round(avg_progress, 1)

        if avg_progress >= 100.0:
            parent.status = "COMPLETED"
        elif avg_progress > 0.0:
            parent.status = "IN_PROGRESS"
        else:
            parent.status = "NOT_STARTED"

        parent.updated_at = datetime.utcnow()
        db.commit()

        # Recurse up tree
        cls._recalculate_parent_progress(db, parent.parent_id)

    @classmethod
    def delete_course(cls, db: Session, course_id: int) -> bool:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return False
        db.delete(course)
        db.commit()
        return True

    @classmethod
    def delete_node(cls, db: Session, node_id: int) -> bool:
        node = db.query(CourseNode).filter(CourseNode.id == node_id).first()
        if not node:
            return False
        parent_id = node.parent_id
        db.delete(node)
        db.commit()
        cls._recalculate_parent_progress(db, parent_id)
        return True

    @classmethod
    def create_study_task_from_lesson(cls, db: Session, req: CreateStudyTaskRequest) -> Optional[TaskOut]:
        node = db.query(CourseNode).filter(CourseNode.id == req.lesson_id).first()
        if not node:
            return None

        title = req.title or f"Học {node.title}"
        desc_parts = [f"Khóa học: Node ID {node.id} - {node.type}"]
        if node.description:
            desc_parts.append(node.description)
        if req.notes:
            desc_parts.append(f"Ghi chú: {req.notes}")

        task = Task(
            title=title,
            description="\n".join(desc_parts),
            course_node_id=node.id,
            goal_id=req.goal_id,
            project_id=req.project_id,
            scheduled_with_fixed_id=req.fixed_schedule_id,
            due_datetime=req.due_datetime or datetime.utcnow(),
            difficulty=req.difficulty or node.difficulty or 2,
            priority=req.priority or "MEDIUM",
            status="TODO"
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        if req.subtask_titles:
            from app.models.task import Subtask
            for idx, st_title in enumerate(req.subtask_titles):
                if st_title.strip():
                    st = Subtask(task_id=task.id, title=st_title.strip(), order_index=idx)
                    db.add(st)
            db.commit()
            db.refresh(task)

        return TaskService.get_task_by_id(db, task.id)

    @classmethod
    def analyze_burnout_risk(
        cls,
        db: Session,
        course_id: int,
        custom_config: Optional[BurnoutCustomConfig] = None
    ) -> BurnoutAnalysisOut:
        """
        Comprehensive multi-factor algorithm to analyze sleep, usable free time,
        study efficiency score (0-100%), and weekly burnout risk for all 7 days.
        """
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError(f"Course {course_id} not found")

        all_nodes = db.query(CourseNode).filter(CourseNode.course_id == course_id).all()
        leaf_nodes = [n for n in all_nodes if not any(child.parent_id == n.id for child in all_nodes)]
        incomplete_leaf_nodes = [n for n in leaf_nodes if n.status != "COMPLETED"]

        remaining_duration = sum((n.duration or 45) for n in incomplete_leaf_nodes)
        remaining_lessons = len(incomplete_leaf_nodes)

        countdown = None
        countdown_days_left = None
        countdown_title = None

        if course.countdown_id:
            countdown = db.query(Countdown).filter(Countdown.id == course.countdown_id).first()
            if countdown:
                countdown_title = countdown.title
                days_diff = (countdown.target_date.date() - datetime.now().date()).days
                countdown_days_left = max(1, days_diff)

        # Baseline target daily study minutes
        if countdown_days_left:
            baseline_daily_study = round(remaining_duration / countdown_days_left)
        else:
            baseline_daily_study = 60 if remaining_duration > 0 else 0

        # Load settings or use custom_config
        settings_rows = db.query(AppSetting).all()
        settings_dict = {s.key: s.value for s in settings_rows}

        if custom_config:
            config = custom_config
        else:
            config = BurnoutCustomConfig(
                max_daily_focus_hours=float(settings_dict.get("burnout_max_daily_focus_hours", "6.0")),
                min_free_hours=float(settings_dict.get("burnout_min_free_hours", "2.0")),
                sleep_target_hours=float(settings_dict.get("sleep_target_hours", "7.5")),
                sleep_bedtime=settings_dict.get("sleep_bedtime", "23:00"),
                sleep_wake_time=settings_dict.get("sleep_wake_time", "07:00"),
                workload_threshold=float(settings_dict.get("burnout_workload_threshold", "80.0")),
                energy_level=settings_dict.get("burnout_energy_level", "NORMAL"),
                is_calibrated=settings_dict.get("burnout_is_calibrated", "false").lower() == "true"
            )

        # Energy multiplier
        energy_map = {
            "RECHARGED": 1.15,
            "NORMAL": 1.0,
            "FATIGUED": 0.85,
            "EXHAUSTED": 0.70,
        }
        energy_mult = energy_map.get(config.energy_level.upper(), 1.0)
        effective_capacity_minutes = config.max_daily_focus_hours * 60 * energy_mult
        min_free_minutes = config.min_free_hours * 60

        # Load active FixedSchedules
        all_fixed = db.query(FixedSchedule).filter(FixedSchedule.is_active == True).all()

        days_details: List[BurnoutDayDetail] = []
        high_risk_days: List[str] = []

        total_weekly_target_minutes = baseline_daily_study * 7

        for day_key, day_name, day_num in DAY_NAMES:
            # Fixed schedules on this day
            day_schedules = [fs for fs in all_fixed if fs.day_of_week == day_num]
            
            # Check if there is explicit SLEEP fixed schedule
            sleep_schedule = next((fs for fs in day_schedules if fs.category == "SLEEP"), None)
            if sleep_schedule:
                # Parse start & end
                try:
                    sh, sm = map(int, sleep_schedule.start_time.split(":"))
                    eh, em = map(int, sleep_schedule.end_time.split(":"))
                    s_mins = sh * 60 + sm
                    e_mins = eh * 60 + em
                    if e_mins >= s_mins:
                        day_sleep_minutes = e_mins - s_mins
                    else:
                        day_sleep_minutes = (1440 - s_mins) + e_mins
                except Exception:
                    day_sleep_minutes = int(config.sleep_target_hours * 60)
            else:
                day_sleep_minutes = int(config.sleep_target_hours * 60)

            is_sleep_deprived = day_sleep_minutes < 390  # < 6.5h

            # Non-sleep fixed schedules
            non_sleep_schedules = [fs for fs in day_schedules if fs.category != "SLEEP"]
            day_fixed_minutes = 0
            schedule_names = []
            for fs in non_sleep_schedules:
                schedule_names.append(fs.title)
                try:
                    sh, sm = map(int, fs.start_time.split(":"))
                    eh, em = map(int, fs.end_time.split(":"))
                    s_mins = sh * 60 + sm
                    e_mins = eh * 60 + em
                    dur = e_mins - s_mins if e_mins >= s_mins else (1440 - s_mins) + e_mins
                    day_fixed_minutes += dur
                except Exception:
                    pass

            routine_minutes = 105  # 1.75h routine buffer
            awake_available_minutes = max(0, 1440 - day_sleep_minutes)
            actual_focus_load = day_fixed_minutes + baseline_daily_study
            committed_minutes = day_fixed_minutes + baseline_daily_study + routine_minutes
            free_minutes = max(0, 1440 - day_sleep_minutes - committed_minutes)
            workload_ratio = round((committed_minutes / max(1, awake_available_minutes)) * 100, 1)

            # Determine status
            if (
                actual_focus_load > effective_capacity_minutes
                or free_minutes < min_free_minutes
                or workload_ratio > config.workload_threshold
                or is_sleep_deprived
            ):
                status = "BURNOUT_RISK"
                high_risk_days.append(day_name)
            elif (
                actual_focus_load > effective_capacity_minutes * 0.75
                or free_minutes < min_free_minutes * 1.3
                or workload_ratio > config.workload_threshold * 0.85
            ):
                status = "MODERATE"
            else:
                status = "OPTIMAL"

            # Compute Study Efficiency Score (0-100%)
            # Sleep factor
            if day_sleep_minutes >= 450:  # >= 7.5h
                e_sleep = 1.0
            elif day_sleep_minutes >= 420:  # >= 7h
                e_sleep = 0.92
            elif day_sleep_minutes >= 360:  # >= 6h
                e_sleep = 0.78
            else:
                e_sleep = 0.55

            # Cognitive fatigue factor from day_fixed_minutes
            if day_fixed_minutes <= 240:  # <= 4h
                e_density = 1.0
            elif day_fixed_minutes <= 420:  # <= 7h
                e_density = 0.88
            else:
                e_density = 0.72

            # Free buffer factor
            if free_minutes >= 120:
                e_buffer = 1.0
            elif free_minutes >= 60:
                e_buffer = 0.88
            else:
                e_buffer = 0.70

            raw_eff = e_sleep * e_density * e_buffer * energy_mult * 100.0
            efficiency_score = round(min(100.0, max(15.0, raw_eff)), 1)

            days_details.append(BurnoutDayDetail(
                day_key=day_key,
                day_name=day_name,
                day_number=day_num,
                sleep_minutes=day_sleep_minutes,
                sleep_hours=round(day_sleep_minutes / 60, 1),
                fixed_minutes=day_fixed_minutes,
                fixed_hours=round(day_fixed_minutes / 60, 1),
                routine_minutes=routine_minutes,
                target_study_minutes=baseline_daily_study,
                target_study_hours=round(baseline_daily_study / 60, 1),
                awake_available_minutes=awake_available_minutes,
                free_minutes=free_minutes,
                free_hours=round(free_minutes / 60, 1),
                workload_ratio=workload_ratio,
                efficiency_score=efficiency_score,
                status=status,
                is_sleep_deprived=is_sleep_deprived,
                fixed_schedules_count=len(non_sleep_schedules),
                fixed_schedule_names=schedule_names,
                recommended_study_minutes=baseline_daily_study
            ))

        # Smart Adaptive Load Rebalance
        # Reallocate study load: reduce on BURNOUT_RISK days, shift to OPTIMAL days
        burnout_days = [d for d in days_details if d.status == "BURNOUT_RISK"]
        optimal_days = [d for d in days_details if d.status == "OPTIMAL"]
        moderate_days = [d for d in days_details if d.status == "MODERATE"]

        if burnout_days and (optimal_days or moderate_days):
            shifted_minutes_pool = 0
            for d in burnout_days:
                reduced_study = min(30, baseline_daily_study // 2)
                shifted_minutes_pool += (d.target_study_minutes - reduced_study)
                d.recommended_study_minutes = reduced_study

            # Distribute shifted pool to optimal/moderate days
            recipients = optimal_days if optimal_days else moderate_days
            extra_per_recipient = shifted_minutes_pool // len(recipients) if recipients else 0
            for d in recipients:
                d.recommended_study_minutes += extra_per_recipient

        # Summary & Recommendation
        if len(high_risk_days) >= 4:
            weekly_risk = "BURNOUT_RISK"
            smart_rec = (
                f"🚨 CẢNH BÁO QUÁ TẢI NGHIÊM TRỌNG: Bạn có {len(high_risk_days)} ngày trong tuần ({', '.join(high_risk_days)}) "
                f"bị quá ngưỡng chịu tải {config.workload_threshold}%. "
                f"Não bộ sẽ khó duy trì khả năng ghi nhớ dài hạn nếu không giảm bớt lịch hoặc điều chỉnh kỳ thi."
            )
        elif len(high_risk_days) >= 1:
            weekly_risk = "MODERATE"
            smart_rec = (
                f"⚡ NGUY CƠ BURNOUT CỤC BỘ: Các ngày {', '.join(high_risk_days)} có lịch dày đặc, thời gian rảnh dưới {config.min_free_hours}h. "
                f"Hệ thống đề xuất giảm tải học trong các ngày này xuống 20-30 phút và dồn sang cuối tuần để duy trì hiệu quả cao nhất."
            )
        else:
            weekly_risk = "OPTIMAL"
            smart_rec = (
                f"✅ LỘ TRÌNH RẤT TỐI ƯU & BỀN VỮNG: Quỹ thời gian rảnh và thời lượng ngủ đều đạt chuẩn khoa học. "
                f"Chỉ số hiệu quả học tập trung bình đạt mức cao. Hãy duy trì nhịp độ này!"
            )

        rebalance_summary = (
            f"Mục tiêu cả tuần: {total_weekly_target_minutes} phút ({round(total_weekly_target_minutes / 60, 1)} giờ). "
            f"Phân bổ thông minh đã điều tiết khối lượng học linh hoạt theo từng thứ trong tuần."
        )

        return BurnoutAnalysisOut(
            course_id=course.id,
            course_title=course.title,
            countdown_id=course.countdown_id,
            countdown_title=countdown_title,
            countdown_days_left=countdown_days_left,
            total_remaining_minutes=remaining_duration,
            total_remaining_lessons=remaining_lessons,
            average_daily_study_minutes=float(baseline_daily_study),
            config=config,
            days=days_details,
            weekly_burnout_risk_level=weekly_risk,
            high_risk_days=high_risk_days,
            smart_recommendation=smart_rec,
            rebalance_summary=rebalance_summary
        )

    @classmethod
    def calibrate_burnout(cls, db: Session, course_id: int) -> BurnoutCustomConfig:
        """
        Calibrate burnout parameters by analyzing past 14 days of task performance.
        Learns user's actual workload tolerance and completion rate.
        """
        two_weeks_ago = datetime.utcnow() - timedelta(days=14)
        tasks = db.query(Task).filter(Task.created_at >= two_weeks_ago).all()

        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.status == "COMPLETED")
        completion_rate = (completed_tasks / total_tasks) if total_tasks > 0 else 0.8

        # Adapt max_daily_focus_hours based on actual completion rate
        if completion_rate < 0.5:
            calibrated_focus_hours = 4.5
            calibrated_min_free_hours = 2.5
            energy_level = "FATIGUED"
        elif completion_rate < 0.75:
            calibrated_focus_hours = 5.5
            calibrated_min_free_hours = 2.0
            energy_level = "NORMAL"
        else:
            calibrated_focus_hours = 7.0
            calibrated_min_free_hours = 1.5
            energy_level = "RECHARGED"

        # Save to AppSetting
        settings_to_update = {
            "burnout_max_daily_focus_hours": str(calibrated_focus_hours),
            "burnout_min_free_hours": str(calibrated_min_free_hours),
            "burnout_energy_level": energy_level,
            "burnout_is_calibrated": "true"
        }

        for k, v in settings_to_update.items():
            s = db.query(AppSetting).filter(AppSetting.key == k).first()
            if not s:
                s = AppSetting(key=k, value=v)
                db.add(s)
            else:
                s.value = v

        db.commit()

        return BurnoutCustomConfig(
            max_daily_focus_hours=calibrated_focus_hours,
            min_free_hours=calibrated_min_free_hours,
            sleep_target_hours=7.5,
            sleep_bedtime="23:00",
            sleep_wake_time="07:00",
            workload_threshold=80.0,
            energy_level=energy_level,
            is_calibrated=True
        )
