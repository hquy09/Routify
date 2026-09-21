import math
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.course import Course, CourseNode
from app.models.fixed_schedule import FixedSchedule
from app.models.sync import AppSetting
from app.models.countdown import Countdown
from app.models.task import Task
from app.schemas.wellbeing import (
    GlobalWellbeingAnalysis,
    CourseLoadContribution,
    WellbeingDayDetail,
    StudyStreamItem,
    WellbeingCustomConfig,
    TensionSummary,
)

DAY_NAMES = [
    ("MON", "Thứ Hai", 0),
    ("TUE", "Thứ Ba", 1),
    ("WED", "Thứ Tư", 2),
    ("THU", "Thứ Năm", 3),
    ("FRI", "Thứ Sáu", 4),
    ("SAT", "Thứ Bảy", 5),
    ("SUN", "Chủ Nhật", 6),
]


class WellbeingService:
    @classmethod
    def get_global_wellbeing_analysis(
        cls,
        db: Session,
        custom_config: Optional[WellbeingCustomConfig] = None
    ) -> GlobalWellbeingAnalysis:
        # 1. Load config or fallback from AppSetting
        settings_rows = db.query(AppSetting).all()
        settings_dict = {s.key: s.value for s in settings_rows}

        if custom_config:
            config = custom_config
        else:
            config = WellbeingCustomConfig(
                max_daily_focus_hours=float(settings_dict.get("burnout_max_daily_focus_hours", "6.0")),
                min_free_hours=float(settings_dict.get("burnout_min_free_hours", "2.0")),
                sleep_target_hours=float(settings_dict.get("sleep_target_hours", "7.5")),
                sleep_bedtime=settings_dict.get("sleep_bedtime", "23:00"),
                sleep_wake_time=settings_dict.get("sleep_wake_time", "07:00"),
                workload_threshold=float(settings_dict.get("burnout_workload_threshold", "80.0")),
                energy_level=settings_dict.get("burnout_energy_level", "NORMAL"),
                stream_strategy=settings_dict.get("wellbeing_stream_strategy", "BALANCED_BLOCKS"),
                is_calibrated=settings_dict.get("burnout_is_calibrated", "false").lower() == "true",
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

        # 2. Query all courses and calculate remaining duration and daily required pace
        all_courses = db.query(Course).all()
        today = datetime.now().date()

        courses_contribution: List[CourseLoadContribution] = []
        total_remaining_study_minutes = 0
        total_remaining_lessons_all = 0
        combined_daily_study_minutes = 0.0

        for course in all_courses:
            # Query all nodes of this course
            nodes = db.query(CourseNode).filter(CourseNode.course_id == course.id).all()
            parent_ids = {n.parent_id for n in nodes if n.parent_id is not None}
            
            # Incomplete leaf nodes
            incomplete_leaves = [
                n for n in nodes
                if n.id not in parent_ids and n.status != "COMPLETED"
            ]

            remaining_dur = sum((n.duration or 45) for n in incomplete_leaves)
            remaining_lessons = len(incomplete_leaves)
            total_remaining_study_minutes += remaining_dur
            total_remaining_lessons_all += remaining_lessons

            # Check linked countdown
            countdown_id = course.countdown_id
            countdown_title = None
            countdown_days_left = None
            countdown_icon = None

            if countdown_id:
                cd = db.query(Countdown).filter(Countdown.id == countdown_id).first()
                if cd:
                    countdown_title = cd.title
                    countdown_icon = cd.icon or "🎯"
                    days_diff = (cd.target_date.date() - today).days
                    countdown_days_left = max(1, days_diff)

            # Daily minutes calculation for this course
            if remaining_dur <= 0:
                daily_needed = 0.0
            elif countdown_days_left:
                daily_needed = round(remaining_dur / countdown_days_left, 1)
            else:
                # Default baseline 30 days or min 25 mins
                daily_needed = round(max(20.0, remaining_dur / 30.0), 1)

            combined_daily_study_minutes += daily_needed

            # Cognitive weight assessment
            if daily_needed >= 60 or remaining_dur >= 1800:
                cog_weight = "CAO"
            elif daily_needed >= 30:
                cog_weight = "TRUNG BÌNH"
            else:
                cog_weight = "NHẸ"

            courses_contribution.append(
                CourseLoadContribution(
                    course_id=course.id,
                    course_title=course.title,
                    color=course.color or "#10b981",
                    instructor=course.instructor,
                    countdown_id=countdown_id,
                    countdown_title=countdown_title,
                    countdown_days_left=countdown_days_left,
                    countdown_icon=countdown_icon,
                    total_remaining_minutes=remaining_dur,
                    total_remaining_lessons=remaining_lessons,
                    daily_study_minutes_needed=daily_needed,
                    percentage_of_total_study=0.0,  # calculated below
                    cognitive_weight=cog_weight,
                )
            )

        # Calculate percentages of contribution
        active_courses = [c for c in courses_contribution if c.daily_study_minutes_needed > 0]
        for c in courses_contribution:
            if combined_daily_study_minutes > 0:
                c.percentage_of_total_study = round((c.daily_study_minutes_needed / combined_daily_study_minutes) * 100, 1)
            else:
                c.percentage_of_total_study = 0.0

        # Sort courses: highest daily demand first
        courses_contribution.sort(key=lambda x: x.daily_study_minutes_needed, reverse=True)

        # 3. Load FixedSchedules
        all_fixed = db.query(FixedSchedule).filter(FixedSchedule.is_active == True).all()

        # 4. 7-Day Matrix Analysis
        base_days: List[Dict[str, Any]] = []
        for day_key, day_name, day_num in DAY_NAMES:
            day_schedules = [fs for fs in all_fixed if fs.day_of_week == day_num]
            
            # SLEEP check
            sleep_schedule = next((fs for fs in day_schedules if fs.category == "SLEEP"), None)
            if sleep_schedule:
                try:
                    sh, sm = map(int, sleep_schedule.start_time.split(":"))
                    eh, em = map(int, sleep_schedule.end_time.split(":"))
                    s_mins = sh * 60 + sm
                    e_mins = eh * 60 + em
                    dur = e_mins - s_mins if e_mins >= s_mins else (1440 - s_mins) + e_mins
                    day_sleep_minutes = dur
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

            routine_minutes = 105  # Standard life routine buffer
            awake_available_minutes = max(0, 1440 - day_sleep_minutes)

            # Study efficiency score calculation
            # Sleep factor
            if day_sleep_minutes >= 450:
                e_sleep = 1.0
            elif day_sleep_minutes >= 420:
                e_sleep = 0.92
            elif day_sleep_minutes >= 360:
                e_sleep = 0.78
            else:
                e_sleep = 0.55

            # Fixed schedule density factor
            if day_fixed_minutes <= 240:
                e_density = 1.0
            elif day_fixed_minutes <= 420:
                e_density = 0.88
            else:
                e_density = 0.72

            base_days.append({
                "day_key": day_key,
                "day_name": day_name,
                "day_number": day_num,
                "sleep_minutes": day_sleep_minutes,
                "sleep_hours": round(day_sleep_minutes / 60, 1),
                "fixed_minutes": day_fixed_minutes,
                "fixed_hours": round(day_fixed_minutes / 60, 1),
                "fixed_schedule_names": schedule_names,
                "routine_minutes": routine_minutes,
                "awake_available_minutes": awake_available_minutes,
                "e_sleep": e_sleep,
                "e_density": e_density,
                "is_sleep_deprived": is_sleep_deprived,
                "streams": []
            })

        # 5. Smart Study Stream Allocation Algorithm
        # Distribute study sessions across 7 days based on strategy
        total_weekly_target_minutes = int(combined_daily_study_minutes * 7)

        # Baseline per-day target:
        strategy = (config.stream_strategy or "BALANCED_BLOCKS").upper()

        if strategy == "EVEN_SPREAD" or len(active_courses) <= 1:
            # Even spread: every course distributed daily
            for d in base_days:
                d_streams: List[StudyStreamItem] = []
                for c in active_courses:
                    d_streams.append(
                        StudyStreamItem(
                            course_id=c.course_id,
                            course_title=c.course_title,
                            color=c.color,
                            duration_minutes=int(round(c.daily_study_minutes_needed)),
                            focus_type="PRACTICE" if c.cognitive_weight == "TRUNG BÌNH" else ("DEEP_WORK" if c.cognitive_weight == "CAO" else "LIGHT_REVIEW"),
                            recommended_window="Buổi tối" if d["fixed_minutes"] > 240 else "Thời gian rảnh",
                        )
                    )
                d["streams"] = d_streams
        elif strategy == "ADAPTIVE":
            # Adaptive: Reduce on days with high fixed schedule, shift to days with low fixed schedule
            # First assign baseline
            daily_target = int(combined_daily_study_minutes)
            for d in base_days:
                # Capacity penalty if fixed is heavy
                if d["fixed_minutes"] >= 360:  # >= 6h fixed
                    day_target = max(20, int(daily_target * 0.4))
                elif d["fixed_minutes"] <= 120:  # <= 2h fixed (e.g. weekend)
                    day_target = int(daily_target * 1.4)
                else:
                    day_target = daily_target
                
                # Assign top courses to this target
                rem = day_target
                d_streams = []
                for c in active_courses:
                    if rem <= 0:
                        break
                    stream_dur = min(rem, max(20, int(c.daily_study_minutes_needed * 1.3)))
                    rem -= stream_dur
                    d_streams.append(
                        StudyStreamItem(
                            course_id=c.course_id,
                            course_title=c.course_title,
                            color=c.color,
                            duration_minutes=stream_dur,
                            focus_type="DEEP_WORK" if stream_dur >= 45 else "LIGHT_REVIEW",
                            recommended_window="Sáng sớm" if d["fixed_minutes"] > 300 else "Thời gian rảnh",
                        )
                    )
                d["streams"] = d_streams
        else:
            # Default: BALANCED_BLOCKS (Luồng học theo Khối chuyên sâu)
            # Alternate courses between odd days (Mon, Wed, Fri, Sun) and even days (Tue, Thu, Sat)
            # to prevent cognitive fragmenting and context switching.
            group_a = [c for idx, c in enumerate(active_courses) if idx % 2 == 0]
            group_b = [c for idx, c in enumerate(active_courses) if idx % 2 == 1]
            if not group_b:
                group_b = group_a

            for d in base_days:
                day_num = d["day_number"]
                selected_group = group_a if day_num in [0, 2, 4, 6] else group_b
                
                # If day has high fixed schedule, prefer shorter practice/review
                is_heavy_day = d["fixed_minutes"] >= 360
                d_streams = []
                for c in selected_group:
                    # Double pace because of alternating days (roughly 1.8x)
                    dur = int(round(c.daily_study_minutes_needed * 1.75))
                    if is_heavy_day:
                        dur = max(25, int(dur * 0.6))
                        focus = "LIGHT_REVIEW"
                        window = "Buổi tối"
                    else:
                        focus = "DEEP_WORK" if dur >= 45 else "PRACTICE"
                        window = "Thời gian rảnh"

                    d_streams.append(
                        StudyStreamItem(
                            course_id=c.course_id,
                            course_title=c.course_title,
                            color=c.color,
                            duration_minutes=dur,
                            focus_type=focus,
                            recommended_window=window,
                        )
                    )
                d["streams"] = d_streams

        # 6. Finalize Days & Calculate Burnout Risk
        final_days: List[WellbeingDayDetail] = []
        high_risk_days: List[str] = []

        for d in base_days:
            total_study_mins = sum(s.duration_minutes for s in d["streams"])
            if total_study_mins == 0 and combined_daily_study_minutes > 0:
                total_study_mins = int(combined_daily_study_minutes)

            committed_minutes = d["fixed_minutes"] + total_study_mins + d["routine_minutes"]
            free_minutes = max(0, 1440 - d["sleep_minutes"] - committed_minutes)
            workload_ratio = round((committed_minutes / max(1, d["awake_available_minutes"])) * 100, 1)

            # Free buffer factor for efficiency
            if free_minutes >= 120:
                e_buffer = 1.0
            elif free_minutes >= 60:
                e_buffer = 0.88
            else:
                e_buffer = 0.70

            raw_eff = d["e_sleep"] * d["e_density"] * e_buffer * energy_mult * 100.0
            efficiency_score = round(min(100.0, max(15.0, raw_eff)), 1)

            actual_focus_load = d["fixed_minutes"] + total_study_mins

            if (
                actual_focus_load > effective_capacity_minutes
                or free_minutes < min_free_minutes
                or workload_ratio > config.workload_threshold
                or d["is_sleep_deprived"]
            ):
                status = "BURNOUT_RISK"
                high_risk_days.append(d["day_name"])
            elif (
                actual_focus_load > effective_capacity_minutes * 0.75
                or free_minutes < min_free_minutes * 1.3
                or workload_ratio > config.workload_threshold * 0.85
            ):
                status = "MODERATE"
            else:
                status = "OPTIMAL"

            final_days.append(
                WellbeingDayDetail(
                    day_key=d["day_key"],
                    day_name=d["day_name"],
                    day_number=d["day_number"],
                    sleep_minutes=d["sleep_minutes"],
                    sleep_hours=d["sleep_hours"],
                    fixed_minutes=d["fixed_minutes"],
                    fixed_hours=d["fixed_hours"],
                    fixed_schedule_names=d["fixed_schedule_names"],
                    routine_minutes=d["routine_minutes"],
                    total_study_minutes=total_study_mins,
                    total_study_hours=round(total_study_mins / 60, 1),
                    awake_available_minutes=d["awake_available_minutes"],
                    free_minutes=free_minutes,
                    free_hours=round(free_minutes / 60, 1),
                    workload_ratio=workload_ratio,
                    efficiency_score=efficiency_score,
                    status=status,
                    is_sleep_deprived=d["is_sleep_deprived"],
                    streams=d["streams"],
                )
            )

        # 7. Overall Risk & Tension Details
        if len(high_risk_days) >= 4:
            weekly_risk = "BURNOUT_RISK"
            smart_rec = (
                f"🚨 CẢNH BÁO QUÁ TẢI NGHIÊM TRỌNG: Bạn có {len(high_risk_days)} ngày trong tuần ({', '.join(high_risk_days)}) "
                f"vượt ngưỡng chịu tải {config.workload_threshold}%. Não bộ đang chịu áp lực cộng dồn lớn từ cả lịch cố định và các khóa học. "
                f"Cần giảm tải môn học hoặc điều chỉnh lại deadline đếm ngược ngay để tránh kiệt sức."
            )
        elif len(high_risk_days) >= 1:
            weekly_risk = "MODERATE"
            smart_rec = (
                f"⚡ CẢNH BÁO NGUY CƠ BURNOUT CỤC BỘ: Các ngày {', '.join(high_risk_days)} có lịch dày, quỹ thời gian rảnh dưới {config.min_free_hours}h. "
                f"Phân luồng thông minh đã tự động dời bớt môn nặng sang các ngày rảnh hơn để bảo vệ nhịp sinh học."
            )
        else:
            weekly_risk = "OPTIMAL"
            smart_rec = (
                f"✅ LỘ TRÌNH RẤT TỐI ƯU & BỀN VỮNG: Tất cả {len(active_courses)} khóa học đều được dung hòa hoàn hảo với giấc ngủ và lịch cố định. "
                f"Thời gian nghỉ ngơi đạt chuẩn giúp não bộ củng cố trí nhớ dài hạn (Long-term Memory Consolidation)."
            )

        rebalance_summary = (
            f"Tổng cộng {len(all_courses)} khóa học ({len(active_courses)} đang học), cần học tổng cộng ~{round(combined_daily_study_minutes)} phút/ngày "
            f"({round(combined_daily_study_minutes / 60, 1)} giờ/ngày). Chiến lược: {strategy}."
        )

        # Tension details for slider and topbar
        max_focus = config.max_daily_focus_hours
        if max_focus <= 4.0:
            tension_summary = TensionSummary(
                tension_level="LOW",
                tension_label="Thư thái",
                tension_score=max_focus,
                weekly_risk_level=weekly_risk,
                color_code="#10b981",
                icon="😌",
            )
        elif max_focus <= 6.5:
            tension_summary = TensionSummary(
                tension_level="BALANCED",
                tension_label="Tập trung tối ưu",
                tension_score=max_focus,
                weekly_risk_level=weekly_risk,
                color_code="#0284c7",
                icon="🎯",
            )
        elif max_focus <= 8.0:
            tension_summary = TensionSummary(
                tension_level="STRAIN",
                tension_label="Căng thẳng tích tụ",
                tension_score=max_focus,
                weekly_risk_level=weekly_risk,
                color_code="#f59e0b",
                icon="⚡",
            )
        else:
            tension_summary = TensionSummary(
                tension_level="EXTREME",
                tension_label="Độ căng cực đại",
                tension_score=max_focus,
                weekly_risk_level=weekly_risk,
                color_code="#ef4444",
                icon="🔥",
            )

        return GlobalWellbeingAnalysis(
            total_courses_count=len(all_courses),
            active_courses_count=len(active_courses),
            total_remaining_study_minutes=total_remaining_study_minutes,
            total_remaining_study_hours=round(total_remaining_study_minutes / 60, 1),
            total_remaining_lessons=total_remaining_lessons_all,
            combined_daily_study_minutes=round(combined_daily_study_minutes, 1),
            combined_daily_study_hours=round(combined_daily_study_minutes / 60, 1),
            courses_contribution=courses_contribution,
            days=final_days,
            config=config,
            tension=tension_summary,
            weekly_burnout_risk_level=weekly_risk,
            high_risk_days=high_risk_days,
            smart_recommendation=smart_rec,
            rebalance_summary=rebalance_summary,
        )

    @classmethod
    def calibrate_wellbeing(cls, db: Session) -> WellbeingCustomConfig:
        """
        Calibrate user workload capacity and energy from past 14 days of task performance.
        """
        two_weeks_ago = datetime.utcnow() - timedelta(days=14)
        tasks = db.query(Task).filter(Task.created_at >= two_weeks_ago).all()

        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.status == "COMPLETED")
        completion_rate = (completed_tasks / total_tasks) if total_tasks > 0 else 0.8

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
            "burnout_is_calibrated": "true",
        }

        for k, v in settings_to_update.items():
            s = db.query(AppSetting).filter(AppSetting.key == k).first()
            if not s:
                s = AppSetting(key=k, value=v)
                db.add(s)
            else:
                s.value = v

        db.commit()

        return WellbeingCustomConfig(
            max_daily_focus_hours=calibrated_focus_hours,
            min_free_hours=calibrated_min_free_hours,
            sleep_target_hours=7.5,
            sleep_bedtime="23:00",
            sleep_wake_time="07:00",
            workload_threshold=80.0,
            energy_level=energy_level,
            stream_strategy="BALANCED_BLOCKS",
            is_calibrated=True,
        )

    @classmethod
    def save_wellbeing_settings(cls, db: Session, config: WellbeingCustomConfig) -> bool:
        settings_to_update = {
            "burnout_max_daily_focus_hours": str(config.max_daily_focus_hours),
            "burnout_min_free_hours": str(config.min_free_hours),
            "sleep_target_hours": str(config.sleep_target_hours),
            "sleep_bedtime": config.sleep_bedtime,
            "sleep_wake_time": config.sleep_wake_time,
            "burnout_workload_threshold": str(config.workload_threshold),
            "burnout_energy_level": config.energy_level,
            "wellbeing_stream_strategy": config.stream_strategy,
            "burnout_is_calibrated": "true" if config.is_calibrated else "false",
        }

        for k, v in settings_to_update.items():
            s = db.query(AppSetting).filter(AppSetting.key == k).first()
            if not s:
                s = AppSetting(key=k, value=v)
                db.add(s)
            else:
                s.value = v

        db.commit()
        return True
