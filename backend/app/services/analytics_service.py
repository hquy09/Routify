import math
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from app.models.task import Task
from app.models.goal import Goal, Project
from app.models.analytics import WeeklyReview, ArchiveRecord
from app.schemas.analytics import (
    DashboardStatsResponse, HeatmapDay, BarChartResponse, BarChartItem,
    GoalProgressItem, ProjectProgressItem, WeeklyReviewCreate, WeeklyReviewOut
)

class AnalyticsService:
    @classmethod
    def get_dashboard_stats(cls, db: Session) -> DashboardStatsResponse:
        tasks = db.query(Task).all()

        now = datetime.utcnow()
        today = now.date()
        week_start = today - timedelta(days=today.weekday())
        month_start = date(today.year, today.month, 1)

        completed = [t for t in tasks if t.status == "COMPLETED"]
        delayed = [t for t in tasks if t.status == "DELAYED"]
        partial = [t for t in tasks if t.status == "PARTIAL"]
        incomplete = [t for t in tasks if t.status in ["TODO", "IN_PROGRESS"]]
        cancelled = [t for t in tasks if t.status == "CANCELLED"]

        def calc_rate(items: List[Task]) -> float:
            c = sum(1 for t in items if t.status == "COMPLETED")
            d = sum(1 for t in items if t.status == "DELAYED")
            inc = sum(1 for t in items if t.status in ["TODO", "IN_PROGRESS", "PARTIAL", "TRANSFERRED"])
            denom = c + inc + d
            return round((c / denom * 100.0), 1) if denom > 0 else 0.0

        # Time filtered rates
        today_tasks = [
            t for t in tasks
            if (t.due_datetime and t.due_datetime.date() == today) or
               (t.completed_datetime and t.completed_datetime.date() == today)
        ]
        rate_today = calc_rate(today_tasks)

        week_tasks = [
            t for t in tasks
            if (t.due_datetime and t.due_datetime.date() >= week_start) or
               (t.completed_datetime and t.completed_datetime.date() >= week_start)
        ]
        rate_week = calc_rate(week_tasks)

        month_tasks = [
            t for t in tasks
            if (t.due_datetime and t.due_datetime.date() >= month_start) or
               (t.completed_datetime and t.completed_datetime.date() >= month_start)
        ]
        rate_month = calc_rate(month_tasks)

        # Difficulty points for completed tasks
        difficulty_pts = sum(t.difficulty for t in completed)

        # Streak calculation
        current_streak, best_streak, active_today = cls._calculate_streaks(tasks)

        # Goal analytics
        goals = db.query(Goal).all()
        goal_items: List[GoalProgressItem] = []
        for g in goals:
            g_tasks = [t for t in tasks if t.goal_id == g.id]
            g_completed = sum(1 for t in g_tasks if t.status == "COMPLETED")
            g_total = sum(1 for t in g_tasks if t.status != "CANCELLED")
            rate = round((g_completed / g_total * 100.0), 1) if g_total > 0 else 0.0
            goal_items.append(GoalProgressItem(
                goal_id=g.id,
                title=g.title,
                category=g.category,
                completed_tasks=g_completed,
                total_tasks=g_total,
                completion_rate=rate
            ))

        # Project analytics
        projects = db.query(Project).all()
        project_items: List[ProjectProgressItem] = []
        for p in projects:
            p_tasks = [t for t in tasks if t.project_id == p.id]
            p_completed = sum(1 for t in p_tasks if t.status == "COMPLETED")
            p_total = sum(1 for t in p_tasks if t.status != "CANCELLED")
            rate = round((p_completed / p_total * 100.0), 1) if p_total > 0 else 0.0
            project_items.append(ProjectProgressItem(
                project_id=p.id,
                title=p.title,
                goal_title=p.goal.title if p.goal else None,
                color=p.color or "#3b82f6",
                completed_tasks=p_completed,
                total_tasks=p_total,
                completion_rate=rate
            ))

        return DashboardStatsResponse(
            tasks_completed=len(completed),
            tasks_delayed=len(delayed),
            tasks_partial=len(partial),
            tasks_incomplete=len(incomplete),
            completion_rate_today=rate_today,
            completion_rate_this_week=rate_week,
            completion_rate_this_month=rate_month,
            total_difficulty_points=difficulty_pts,
            current_streak=current_streak,
            best_streak=best_streak,
            streak_active_today=active_today,
            goals=goal_items,
            projects=project_items
        )

    @classmethod
    def _calculate_streaks(cls, tasks: List[Task]) -> Tuple[int, int, bool]:
        # Collect distinct completion dates
        completion_dates = set()
        for t in tasks:
            if t.status == "COMPLETED" and t.completed_datetime:
                completion_dates.add(t.completed_datetime.date())

        if not completion_dates:
            return 0, 0, False

        today = datetime.utcnow().date()
        active_today = today in completion_dates

        # Calculate current streak backwards
        current_streak = 0
        check_date = today if active_today else (today - timedelta(days=1))
        while check_date in completion_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

        # Calculate best streak across all historical dates
        sorted_dates = sorted(list(completion_dates))
        best_streak = 0
        temp_streak = 0
        prev_date = None

        for d in sorted_dates:
            if prev_date is None or d == prev_date + timedelta(days=1):
                temp_streak += 1
            else:
                temp_streak = 1
            if temp_streak > best_streak:
                best_streak = temp_streak
            prev_date = d

        return current_streak, max(best_streak, current_streak), active_today

    @classmethod
    def get_heatmap_data(cls, db: Session, days_count: int = 180) -> List[HeatmapDay]:
        """Returns heatmap days for the last N days (default ~6 months)."""
        tasks = db.query(Task).all()
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=days_count)

        day_stats: Dict[date, Dict[str, int]] = {}
        for d_offset in range(days_count + 1):
            curr = start_date + timedelta(days=d_offset)
            day_stats[curr] = {"count": 0, "points": 0}

        for t in tasks:
            if t.status == "COMPLETED" and t.completed_datetime:
                t_date = t.completed_datetime.date()
                if t_date in day_stats:
                    day_stats[t_date]["count"] += 1
                    day_stats[t_date]["points"] += (t.difficulty or 1)

        results: List[HeatmapDay] = []
        for d in sorted(day_stats.keys()):
            cnt = day_stats[d]["count"]
            pts = day_stats[d]["points"]
            # Levels: 0: 0, 1: 1-2, 2: 3-4, 3: 5-7, 4: 8+
            if cnt == 0:
                lvl = 0
            elif cnt <= 2:
                lvl = 1
            elif cnt <= 4:
                lvl = 2
            elif cnt <= 7:
                lvl = 3
            else:
                lvl = 4

            results.append(HeatmapDay(
                date=d.isoformat(),
                count=cnt,
                difficulty_points=pts,
                level=lvl
            ))
        return results

    @classmethod
    def get_bar_chart_data(cls, db: Session, period: str = "DAY") -> BarChartResponse:
        tasks = db.query(Task).all()
        today = datetime.utcnow().date()
        items: List[BarChartItem] = []

        if period == "DAY":
            # Last 7 days
            for i in range(6, -1, -1):
                d = today - timedelta(days=i)
                label = d.strftime("%a %d/%m")  # e.g., Mon 08/09
                d_tasks = [t for t in tasks if (t.completed_datetime and t.completed_datetime.date() == d) or (t.due_datetime and t.due_datetime.date() == d)]
                comp = sum(1 for t in d_tasks if t.status == "COMPLETED")
                del_ = sum(1 for t in d_tasks if t.status == "DELAYED")
                part = sum(1 for t in d_tasks if t.status == "PARTIAL")
                pts = sum((t.difficulty or 1) for t in d_tasks if t.status == "COMPLETED")
                items.append(BarChartItem(label=label, completed=comp, delayed=del_, partial=part, difficulty_points=pts))

        elif period == "WEEK":
            # Last 6 weeks
            for w in range(5, -1, -1):
                ref_date = today - timedelta(weeks=w)
                year, week_num, _ = ref_date.isocalendar()
                label = f"W{week_num}"
                w_start = ref_date - timedelta(days=ref_date.weekday())
                w_end = w_start + timedelta(days=6)

                w_tasks = [
                    t for t in tasks
                    if (t.completed_datetime and w_start <= t.completed_datetime.date() <= w_end) or
                       (t.due_datetime and w_start <= t.due_datetime.date() <= w_end)
                ]
                comp = sum(1 for t in w_tasks if t.status == "COMPLETED")
                del_ = sum(1 for t in w_tasks if t.status == "DELAYED")
                part = sum(1 for t in w_tasks if t.status == "PARTIAL")
                pts = sum((t.difficulty or 1) for t in w_tasks if t.status == "COMPLETED")
                items.append(BarChartItem(label=label, completed=comp, delayed=del_, partial=part, difficulty_points=pts))

        elif period == "MONTH":
            # Last 6 months
            for m in range(5, -1, -1):
                # approximate month subtraction
                m_offset = today.month - m
                y = today.year
                while m_offset <= 0:
                    m_offset += 12
                    y -= 1
                label = f"{m_offset:02d}/{y}"
                m_tasks = [
                    t for t in tasks
                    if (t.completed_datetime and t.completed_datetime.year == y and t.completed_datetime.month == m_offset) or
                       (t.due_datetime and t.due_datetime.year == y and t.due_datetime.month == m_offset)
                ]
                comp = sum(1 for t in m_tasks if t.status == "COMPLETED")
                del_ = sum(1 for t in m_tasks if t.status == "DELAYED")
                part = sum(1 for t in m_tasks if t.status == "PARTIAL")
                pts = sum((t.difficulty or 1) for t in m_tasks if t.status == "COMPLETED")
                items.append(BarChartItem(label=label, completed=comp, delayed=del_, partial=part, difficulty_points=pts))

        return BarChartResponse(filter_by=period, items=items)

    @classmethod
    def get_weekly_review(cls, db: Session, year: int, week_number: int) -> WeeklyReviewOut:
        """
        Generate or retrieve full Executive Weekly Performance Report (Báo cáo Hiệu suất Tuần)
        even if not yet saved to database.
        """
        # Calculate start (Monday) and end (Sunday) date of ISO week
        d = date.fromisocalendar(year, week_number, 1)
        w_end = d + timedelta(days=6)
        now = datetime.now()
        today = now.date()

        tasks = db.query(Task).all()
        w_tasks = [
            t for t in tasks
            if (t.completed_datetime and d <= t.completed_datetime.date() <= w_end) or
               (t.due_datetime and d <= t.due_datetime.date() <= w_end)
        ]

        completed = sum(1 for t in w_tasks if t.status == "COMPLETED")
        delayed = sum(1 for t in w_tasks if t.status in ["DELAYED", "TRANSFERRED"] or (t.due_datetime and t.due_datetime.date() <= today and t.status in ["TODO", "IN_PROGRESS"] and (t.due_datetime.date() < today or (t.due_datetime.date() == today and t.due_datetime < now))))
        partial = sum(1 for t in w_tasks if t.status == "PARTIAL")
        cancelled = sum(1 for t in w_tasks if t.status == "CANCELLED")
        total_tasks_count = len(w_tasks)

        denom = completed + delayed + partial
        rate = round((completed / max(1, denom) * 100.0), 1) if denom > 0 else (100.0 if total_tasks_count == 0 else 0.0)
        pts = sum((t.difficulty or 1) for t in w_tasks if t.status == "COMPLETED")

        # 7-day breakdown & Screentime & Daily consistency
        from app.services.screentime_service import get_daily_summary
        from app.schemas.analytics import DailyBreakdownItem, DelayedTaskAuditItem, CourseWeekProgressItem

        daily_breakdown: List[DailyBreakdownItem] = []
        day_vi_names = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]
        day_points_map: Dict[str, int] = {}
        total_screentime_mins = 0
        study_work_mins = 0
        distraction_mins = 0
        violations_count = 0

        FORCE_MAJEURE_KEYWORDS = [
            "bất khả kháng", "ốm", "bệnh", "sự cố", "khẩn", "đột xuất",
            "mất điện", "mất mạng", "emergency", "sick", "cấp cứu",
            "tai nạn", "bão", "lũ", "hỏng máy", "thi đột xuất"
        ]

        fm_count = 0
        unexcused_count = 0
        delayed_audits: List[DelayedTaskAuditItem] = []

        for offset in range(7):
            day_d = d + timedelta(days=offset)
            day_name_vi = day_vi_names[offset]

            # Screentime
            try:
                st = get_daily_summary(db, day_d)
                day_st_hours = round(st.total_minutes / 60.0, 1)
                total_screentime_mins += st.total_minutes
                study_work_mins += st.study_work_minutes
                distraction_mins += st.entertainment_social_minutes
                violations_count += st.violations_count
                st_rating = st.rating
            except Exception:
                day_st_hours = 0.0
                st_rating = 10.0

            # Tasks of this day
            day_t_completed = sum(1 for t in w_tasks if t.status == "COMPLETED" and t.completed_datetime and t.completed_datetime.date() == day_d)
            day_t_pts = sum((t.difficulty or 1) for t in w_tasks if t.status == "COMPLETED" and t.completed_datetime and t.completed_datetime.date() == day_d)
            day_points_map[day_name_vi] = day_t_pts + (day_t_completed * 2)

            day_t_delayed = 0
            for t in w_tasks:
                if t.due_datetime and t.due_datetime.date() == day_d:
                    is_delayed = t.status in ["DELAYED", "TRANSFERRED"] or (t.status in ["TODO", "IN_PROGRESS"] and (day_d < today or (day_d == today and t.due_datetime < now)))
                    if is_delayed:
                        day_t_delayed += 1
                        desc_lower = (t.description or "").lower()
                        is_fm = any(kw in desc_lower for kw in FORCE_MAJEURE_KEYWORDS)
                        if is_fm:
                            fm_count += 1
                        else:
                            unexcused_count += 1
                        
                        delayed_audits.append(DelayedTaskAuditItem(
                            id=t.id,
                            title=t.title,
                            due_date=t.due_datetime.strftime("%d/%m %H:%M") if t.due_datetime else str(day_d),
                            is_force_majeure=is_fm,
                            reason="Bất khả kháng / Áp lực đột xuất" if is_fm else (t.description or "Chưa kịp hoàn thành"),
                            status=t.status
                        ))

            # Daily consistency estimation
            day_eval = day_t_completed + day_t_delayed
            if day_eval > 0:
                day_cons = round(max(3.0, min(10.0, ((day_t_completed / day_eval) * 10.0))), 1)
            else:
                day_cons = 10.0 if day_d <= today else 10.0

            tone = "NORMAL"
            if day_t_completed >= 3 or day_t_pts >= 5:
                tone = "EXCELLENT"
            elif day_t_delayed >= 2:
                tone = "WARNING"
            elif day_d > today:
                tone = "REST"

            daily_breakdown.append(DailyBreakdownItem(
                date=day_d.isoformat(),
                day_name_vi=day_name_vi,
                completed_tasks=day_t_completed,
                delayed_tasks=day_t_delayed,
                difficulty_points=day_t_pts,
                screentime_hours=day_st_hours,
                consistency_score=day_cons,
                is_best_day=False,
                is_worst_day=False,
                status_tone=tone
            ))

        # Best / Worst day
        best_day_name = max(day_points_map, key=day_points_map.get) if day_points_map and any(v > 0 for v in day_points_map.values()) else None
        worst_day_name = min(day_points_map, key=day_points_map.get) if day_points_map and any(v > 0 for v in day_points_map.values()) else None

        for item in daily_breakdown:
            if best_day_name and item.day_name_vi == best_day_name and item.completed_tasks > 0:
                item.is_best_day = True
            elif worst_day_name and item.day_name_vi == worst_day_name and item.delayed_tasks > 0:
                item.is_worst_day = True

        # Course progress
        courses_progress: List[CourseWeekProgressItem] = []
        try:
            from app.models.course import Course, Lesson
            active_courses = db.query(Course).all()
            for c in active_courses:
                c_tasks = [t for t in w_tasks if getattr(t, 'course_id', None) == c.id and t.status == "COMPLETED"]
                if c_tasks:
                    c_mins = sum(getattr(t, 'duration_minutes', 30) or 30 for t in c_tasks)
                    courses_progress.append(CourseWeekProgressItem(
                        course_id=c.id,
                        course_title=c.title,
                        color=c.color or "#4f46e5",
                        completed_lessons=len(c_tasks),
                        total_study_minutes=c_mins
                    ))
        except Exception:
            pass

        # Overall Consistency & Multi-day Metrics
        try:
            cons_data = cls.calculate_consistency_index(db, days_window=14)
            consistency_score = cons_data["score"]
            stability_pct = cons_data["metrics"]["stability_pct"]
        except Exception:
            consistency_score = 9.0
            stability_pct = 90.0

        # Cognitive Load Summary
        total_screentime_hours = round(total_screentime_mins / 60.0, 1)
        study_work_hours = round(study_work_mins / 60.0, 1)
        entertainment_hours = round(distraction_mins / 60.0, 1)
        avg_daily_focus = round((pts * 0.5 + study_work_hours) / 7.0, 1)
        burnout_risk = "BURNOUT_RISK" if (avg_daily_focus >= 7.5 or violations_count >= 5) else ("MODERATE" if avg_daily_focus >= 5.5 else "LOW")

        # Executive Grade Calculation
        overall_score = round(
            (rate * 0.45) +
            (consistency_score * 10 * 0.35) +
            (min(100.0, (pts / max(1, completed or 1)) * 30.0) * 0.20),
            1
        )
        overall_score = max(10.0, min(100.0, overall_score))

        if overall_score >= 90.0:
            performance_grade = "A+"
        elif overall_score >= 80.0:
            performance_grade = "A"
        elif overall_score >= 70.0:
            performance_grade = "B"
        elif overall_score >= 55.0:
            performance_grade = "C"
        else:
            performance_grade = "D"

        # Executive Summary Synthesis
        best_day_str = f" với đỉnh cao năng suất rơi vào {best_day_name}" if best_day_name else ""
        fm_str = f" Trong đó {fm_count} nhiệm vụ hoãn do nguyên nhân bất khả kháng được bảo lưu điểm tín nhiệm." if fm_count > 0 else ""
        exec_summary = (
            f"Tuần {week_number}/{year}: Bạn đạt tỷ lệ hoàn thành {rate}% ({completed}/{total_tasks_count} nhiệm vụ){best_day_str}. "
            f"Chỉ số Nhất quán đạt {consistency_score}/10 với độ ổn định thói quen {stability_pct}%. "
            f"Tổng thời lượng tập trung tích lũy đạt {study_work_hours} giờ.{fm_str} "
            f"Đánh giá tổng thể hiệu suất: Hạng {performance_grade} ({overall_score}/100)."
        )

        # Smart Auto-Draft Reflections based on real data
        draft_what_went_well = (
            f"Duy trì xuất sắc {completed} nhiệm vụ hoàn thành và tích lũy {pts} điểm kinh nghiệm. "
            f"Ngày hiệu quả nhất là {best_day_name or 'các ngày trong tuần'} với nhịp độ tập trung sâu. "
            f"Chỉ số nhất quán giữ vững ở mức {consistency_score}/10."
        )
        draft_what_needs_improvement = (
            f"Vẫn còn {delayed} nhiệm vụ bị tồn đọng/chậm trễ (trong đó {unexcused_count} nhiệm vụ do trì hoãn chủ quan). "
            f"Thời gian sử dụng thiết bị ngoài giờ cần được kiểm soát chặt hơn ({entertainment_hours}h giải trí, {violations_count} lần chạm ngưỡng)."
        )
        draft_delayed_reflection = (
            f"Các task bị hoãn chủ yếu do chưa lường trước lịch đột xuất hoặc đặt khối lượng quá dày. "
            f"{'Đã xử lý tốt việc ghi nhận ' + str(fm_count) + ' trường hợp bất khả kháng để bảo lưu tiến độ.' if fm_count > 0 else 'Cần phân bổ khung đệm 30 phút giữa các đầu việc lớn.'}"
        )
        draft_next_week_changes = (
            f"1. Áp dụng kỹ thuật Timeblocking 45 phút cho các nhiệm vụ ưu tiên trước 16:00.\n"
            f"2. Giới hạn thời gian mạng xã hội dưới 60 phút/ngày để giữ năng lượng nhận thức.\n"
            f"3. Đặt mục tiêu nâng tỷ lệ hoàn thành lên trên {min(100, int(rate + 10))}%."
        )

        # Query existing saved review in DB
        existing = db.query(WeeklyReview).filter(
            WeeklyReview.year == year,
            WeeklyReview.week_number == week_number
        ).first()

        is_finalized = existing is not None and bool(existing.what_went_well)

        return WeeklyReviewOut(
            id=existing.id if existing else 0,
            year=year,
            week_number=week_number,
            start_date=d,
            end_date=w_end,
            is_finalized=is_finalized,
            performance_grade=performance_grade,
            overall_score=overall_score,
            executive_summary=exec_summary,
            total_tasks=total_tasks_count,
            completed_tasks=completed,
            delayed_tasks=delayed,
            partial_tasks=partial,
            cancelled_tasks=cancelled,
            completion_rate=rate,
            difficulty_points=pts,
            streak=cls._calculate_streaks(tasks)[0],
            best_day=best_day_name,
            worst_day=worst_day_name,
            consistency_score=consistency_score,
            stability_pct=stability_pct,
            force_majeure_count=fm_count,
            unexcused_delay_count=unexcused_count,
            total_screentime_hours=total_screentime_hours,
            study_work_screentime_hours=study_work_hours,
            entertainment_screentime_hours=entertainment_hours,
            screentime_violations_count=violations_count,
            avg_daily_focus_hours=avg_daily_focus,
            burnout_risk_level=burnout_risk,
            daily_breakdown=daily_breakdown,
            courses_progress=courses_progress,
            delayed_audits=delayed_audits,
            draft_what_went_well=draft_what_went_well,
            draft_what_needs_improvement=draft_what_needs_improvement,
            draft_delayed_reflection=draft_delayed_reflection,
            draft_next_week_changes=draft_next_week_changes,
            what_went_well=existing.what_went_well if existing else None,
            what_needs_improvement=existing.what_needs_improvement if existing else None,
            delayed_tasks_reflection=existing.delayed_tasks_reflection if existing else None,
            next_week_changes=existing.next_week_changes if existing else None,
            created_at=existing.created_at if existing else datetime.utcnow()
        )

    @classmethod
    def save_weekly_review(cls, db: Session, review_in: WeeklyReviewCreate) -> WeeklyReviewOut:
        # Calculate start and end date of ISO week
        d = date.fromisocalendar(review_in.year, review_in.week_number, 1)
        w_end = d + timedelta(days=6)
        now = datetime.now()
        today = now.date()

        tasks = db.query(Task).all()
        w_tasks = [
            t for t in tasks
            if (t.completed_datetime and d <= t.completed_datetime.date() <= w_end) or
               (t.due_datetime and d <= t.due_datetime.date() <= w_end)
        ]

        completed = sum(1 for t in w_tasks if t.status == "COMPLETED")
        delayed = sum(1 for t in w_tasks if t.status in ["DELAYED", "TRANSFERRED"] or (t.due_datetime and t.due_datetime.date() <= today and t.status in ["TODO", "IN_PROGRESS"] and (t.due_datetime.date() < today or (t.due_datetime.date() == today and t.due_datetime < now))))
        partial = sum(1 for t in w_tasks if t.status == "PARTIAL")
        cancelled = sum(1 for t in w_tasks if t.status == "CANCELLED")
        denom = completed + delayed + partial
        rate = round((completed / max(1, denom) * 100.0), 1) if denom > 0 else 0.0
        pts = sum((t.difficulty or 1) for t in w_tasks if t.status == "COMPLETED")

        # Find best and worst days in this week
        day_completed_counts: Dict[str, int] = {}
        day_vi_names = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]
        for offset in range(7):
            day_d = d + timedelta(days=offset)
            day_name = day_vi_names[offset]
            day_c = sum(1 for t in w_tasks if t.status == "COMPLETED" and t.completed_datetime and t.completed_datetime.date() == day_d)
            day_completed_counts[day_name] = day_c

        best_day = max(day_completed_counts, key=day_completed_counts.get) if day_completed_counts and any(v > 0 for v in day_completed_counts.values()) else None
        worst_day = min(day_completed_counts, key=day_completed_counts.get) if day_completed_counts and any(v > 0 for v in day_completed_counts.values()) else None

        existing = db.query(WeeklyReview).filter(
            WeeklyReview.year == review_in.year,
            WeeklyReview.week_number == review_in.week_number
        ).first()

        if not existing:
            existing = WeeklyReview(
                year=review_in.year,
                week_number=review_in.week_number,
                start_date=d,
                end_date=w_end,
                completed_tasks=completed,
                delayed_tasks=delayed,
                partial_tasks=partial,
                cancelled_tasks=cancelled,
                completion_rate=rate,
                difficulty_points=pts,
                streak=cls._calculate_streaks(tasks)[0],
                best_day=best_day,
                worst_day=worst_day,
                what_went_well=review_in.what_went_well,
                what_needs_improvement=review_in.what_needs_improvement,
                delayed_tasks_reflection=review_in.delayed_tasks_reflection,
                next_week_changes=review_in.next_week_changes
            )
            db.add(existing)
        else:
            existing.completed_tasks = completed
            existing.delayed_tasks = delayed
            existing.partial_tasks = partial
            existing.cancelled_tasks = cancelled
            existing.completion_rate = rate
            existing.difficulty_points = pts
            existing.best_day = best_day
            existing.worst_day = worst_day
            existing.what_went_well = review_in.what_went_well
            existing.what_needs_improvement = review_in.what_needs_improvement
            existing.delayed_tasks_reflection = review_in.delayed_tasks_reflection
            existing.next_week_changes = review_in.next_week_changes

        db.commit()
        db.refresh(existing)
        return cls.get_weekly_review(db, review_in.year, review_in.week_number)

    @classmethod
    def calculate_consistency_index(cls, db: Session, days_window: int = 14) -> Dict[str, Any]:
        """
        Calculate multi-day Execution & Consistency Index (Chỉ số Nhất quán & Thực thi)
        using statistical formulas:
        1. Recency-weighted mean of daily execution & screentime ratings.
        2. Variance (phương sai) and standard deviation (độ lệch chuẩn) to measure habit stability
           (rewarding steady consistency, penalizing erratic performance swings).
        3. Fair evaluation of today's pending tasks (ongoing tasks not penalized prematurely).
        4. Analysis of task delays, isolating force majeure (hoãn bất khả kháng: sick, emergency,
           severe schedule overload >= 6.5h, etc.) which retain 85% credit and avoid delay penalties.
        """
        now = datetime.now()
        today = now.date()
        start_date = today - timedelta(days=days_window - 1)

        FORCE_MAJEURE_KEYWORDS = [
            "bất khả kháng", "ốm", "bệnh", "sự cố", "khẩn", "đột xuất",
            "mất điện", "mất mạng", "emergency", "sick", "cấp cứu",
            "tai nạn", "bão", "lũ", "hỏng máy", "thi đột xuất"
        ]

        from app.models.fixed_schedule import FixedSchedule
        active_fixed = db.query(FixedSchedule).filter(FixedSchedule.is_active == True).all()
        tasks = db.query(Task).all()

        daily_scores: List[float] = []
        weights: List[float] = []
        total_tasks_considered = 0
        total_completed_considered = 0
        total_delayed_considered = 0
        force_majeure_count = 0
        unexcused_delay_count = 0

        from app.services.screentime_service import get_daily_summary

        for i in range(days_window):
            day_date = start_date + timedelta(days=i)
            weight = 1.0 + (0.05 * i)
            weights.append(weight)

            try:
                st = get_daily_summary(db, day_date)
                st_rating = st.rating
            except Exception:
                st_rating = 10.0

            # Check fixed schedule overload on this day of week
            day_dow = day_date.weekday()
            day_schedules = [fs for fs in active_fixed if fs.day_of_week == day_dow and fs.category != "SLEEP"]
            day_fixed_mins = 0
            for fs in day_schedules:
                try:
                    sh, sm = map(int, fs.start_time.split(":"))
                    eh, em = map(int, fs.end_time.split(":"))
                    dur = (eh * 60 + em) - (sh * 60 + sm)
                    day_fixed_mins += dur if dur > 0 else 0
                except Exception:
                    pass
            is_overload_day = day_fixed_mins >= 390  # >= 6.5h

            # Tasks due or completed on this day
            day_tasks = [
                t for t in tasks
                if (t.due_datetime and t.due_datetime.date() == day_date)
                or (t.completed_datetime and t.completed_datetime.date() == day_date)
            ]

            day_task_score = 10.0
            if day_tasks:
                n_completed = 0
                n_fm = 0
                n_unexcused = 0
                n_pending_future = 0

                for t in day_tasks:
                    desc_lower = (t.description or "").lower()
                    is_fm = is_overload_day or any(kw in desc_lower for kw in FORCE_MAJEURE_KEYWORDS)

                    if t.status == "COMPLETED":
                        n_completed += 1
                        total_completed_considered += 1
                    elif t.status == "PARTIAL":
                        n_completed += 0.5
                        total_completed_considered += 1
                    elif t.status in ["DELAYED", "TRANSFERRED"]:
                        total_delayed_considered += 1
                        if is_fm:
                            n_fm += 1
                            force_majeure_count += 1
                        else:
                            n_unexcused += 1
                            unexcused_delay_count += 1
                    elif t.status in ["TODO", "IN_PROGRESS"]:
                        if day_date < today:
                            # Past day and not completed -> Delayed
                            total_delayed_considered += 1
                            if is_fm:
                                n_fm += 1
                                force_majeure_count += 1
                            else:
                                n_unexcused += 1
                                unexcused_delay_count += 1
                        elif day_date == today:
                            # Today: Check if due time has already passed
                            is_overdue_now = bool(t.due_datetime and t.due_datetime < now)
                            if is_overdue_now:
                                total_delayed_considered += 1
                                if is_fm:
                                    n_fm += 1
                                    force_majeure_count += 1
                                else:
                                    n_unexcused += 1
                                    unexcused_delay_count += 1
                            else:
                                # Still on schedule today -> do not penalize prematurely
                                n_pending_future += 1

                n_evaluated = n_completed + n_fm + n_unexcused
                total_tasks_considered += n_evaluated

                if n_evaluated > 0:
                    effective_done = n_completed + (n_fm * 0.85)
                    raw_task_score = (effective_done / n_evaluated) * 10.0
                    unexcused_penalty = n_unexcused * 0.8
                    day_task_score = max(2.0, min(10.0, raw_task_score - unexcused_penalty))
                else:
                    # All tasks today are upcoming or pending on schedule
                    day_task_score = 10.0

            combined_day = round((0.65 * day_task_score) + (0.35 * st_rating), 2)
            daily_scores.append(combined_day)

        sum_w = sum(weights)
        mu = sum(w * s for w, s in zip(weights, daily_scores)) / sum_w

        variance = sum(w * ((s - mu) ** 2) for w, s in zip(weights, daily_scores)) / sum_w
        std_dev = math.sqrt(max(0.0, variance))

        if std_dev <= 1.0:
            stability_adj = round(min(0.4, (1.0 - std_dev) * 0.4), 2)
        elif std_dev >= 2.2:
            stability_adj = -round(min(0.6, (std_dev - 2.2) * 0.3), 2)
        else:
            stability_adj = 0.0

        stability_pct = round(max(30.0, min(100.0, 100.0 - (std_dev * 20.0))), 1)

        if total_tasks_considered > 0:
            unexcused_rate = unexcused_delay_count / total_tasks_considered
            delay_penalty = -round(min(1.2, unexcused_rate * 2.5), 2)
        else:
            delay_penalty = 0.0

        final_score = round(max(1.0, min(10.0, mu + stability_adj + delay_penalty)), 1)

        if final_score >= 9.0:
            tier = "EXCELLENT"
            tier_label = "Xuất sắc (Nhất quán thép)"
        elif final_score >= 7.5:
            tier = "GOOD"
            tier_label = "Tốt (Phong độ ổn định)"
        elif final_score >= 5.5:
            tier = "AVERAGE"
            tier_label = "Khá (Cần kiên trì hơn)"
        else:
            tier = "NEEDS_IMPROVEMENT"
            tier_label = "Cần cải thiện (Dao động & Trì hoãn)"

        return {
            "score": final_score,
            "tier": tier,
            "tier_label": tier_label,
            "name": "Chỉ số Nhất quán",
            "label": tier_label,
            "violations": unexcused_delay_count,
            "metrics": {
                "mean": round(mu, 2),
                "variance": round(variance, 2),
                "std_dev": round(std_dev, 2),
                "stability_pct": stability_pct,
                "stability_adj": stability_adj,
                "delay_penalty": delay_penalty,
                "total_tasks_considered": total_tasks_considered,
                "completed_count": total_completed_considered,
                "total_delayed": total_delayed_considered,
                "force_majeure_count": force_majeure_count,
                "unexcused_delay_count": unexcused_delay_count,
                "window_days": days_window
            }
        }

    @classmethod
    def get_header_summary(cls, db: Session) -> Dict[str, Any]:
        tasks = db.query(Task).all()
        current_streak, best_streak, active_today = cls._calculate_streaks(tasks)

        now = datetime.now()
        today = now.date()

        # 1. Multi-day Statistical Execution & Consistency Index (Chỉ số Nhất quán)
        try:
            consistency_info = cls.calculate_consistency_index(db, days_window=14)
        except Exception as e:
            print(f"[HeaderSummary] Error computing consistency index: {e}")
            consistency_info = {
                "score": 10.0,
                "tier": "EXCELLENT",
                "tier_label": "Xuất sắc (Kỷ luật thép)",
                "name": "Chỉ số Nhất quán",
                "label": "Xuất sắc (Kỷ luật thép)",
                "violations": 0,
                "metrics": None
            }

        # 2. Upcoming / In-Progress Event or Task (Clearly categorized)
        upcoming_item = None
        candidates = []

        # From Fixed Schedules
        try:
            from app.services.schedule_service import ScheduleService
            occurrences = ScheduleService.get_occurrences_for_date(db, today)
            for occ in occurrences:
                if occ.status == "SKIPPED":
                    continue
                try:
                    s_h, s_m = map(int, occ.start_time.split(":"))
                    e_h, e_m = map(int, occ.end_time.split(":"))
                    start_dt = datetime.combine(today, datetime.min.time()).replace(hour=s_h, minute=s_m)
                    end_dt = datetime.combine(today, datetime.min.time()).replace(hour=e_h, minute=e_m)

                    cat = (occ.category or "OTHER").upper()
                    if cat == "SCHOOL":
                        type_label = "Lịch học trường"
                        badge_color = "amber"
                    elif cat == "WORK":
                        type_label = "Lịch công việc"
                        badge_color = "blue"
                    elif cat == "STUDY":
                        type_label = "Lịch tự học"
                        badge_color = "purple"
                    elif cat == "EXERCISE":
                        type_label = "Rèn luyện"
                        badge_color = "emerald"
                    else:
                        type_label = "Lịch cố định"
                        badge_color = "amber"

                    if start_dt <= now <= end_dt:
                        mins_left = max(0, int((end_dt - now).total_seconds() / 60))
                        candidates.append({
                            "type": "SCHEDULE",
                            "type_code": "SCHEDULE",
                            "type_label": type_label,
                            "id": occ.fixed_schedule_id,
                            "title": occ.title,
                            "time_str": f"{occ.start_time} - {occ.end_time}",
                            "start_time": occ.start_time,
                            "end_time": occ.end_time,
                            "status": "IN_PROGRESS",
                            "status_label": f"Đang diễn ra (còn {mins_left}p)",
                            "minutes_left": mins_left,
                            "category": occ.category,
                            "category_label": type_label,
                            "badge_color": badge_color,
                            "icon": occ.icon or "📌",
                            "sort_key": 0
                        })
                    elif start_dt > now:
                        mins_until = int((start_dt - now).total_seconds() / 60)
                        time_desc = f"sau {mins_until}p" if mins_until < 60 else f"lúc {occ.start_time}"
                        candidates.append({
                            "type": "SCHEDULE",
                            "type_code": "SCHEDULE",
                            "type_label": type_label,
                            "id": occ.fixed_schedule_id,
                            "title": occ.title,
                            "time_str": f"{occ.start_time} ({time_desc})",
                            "start_time": occ.start_time,
                            "end_time": occ.end_time,
                            "status": "UPCOMING",
                            "status_label": f"Sắp diễn ra ({time_desc})",
                            "minutes_left": mins_until,
                            "category": occ.category,
                            "category_label": type_label,
                            "badge_color": badge_color,
                            "icon": occ.icon or "📌",
                            "sort_key": mins_until
                        })
                except Exception:
                    pass
        except Exception:
            pass

        # From Tasks with due_datetime today
        pending_today_tasks = [
            t for t in tasks
            if t.status in ["TODO", "IN_PROGRESS"] and t.due_datetime and t.due_datetime.date() == today
        ]
        for t in pending_today_tasks:
            try:
                t_due = t.due_datetime
                diff_mins = int((t_due - now).total_seconds() / 60)
                t_time_str = t_due.strftime("%H:%M")
                is_course_task = bool(t.course_node_id)
                type_label = "Nhiệm vụ học" if is_course_task else "Nhiệm vụ"
                type_code = "COURSE_TASK" if is_course_task else "TASK"

                if diff_mins >= 0:
                    time_desc = f"sau {diff_mins}p" if diff_mins < 60 else f"lúc {t_time_str}"
                    candidates.append({
                        "type": "TASK",
                        "type_code": type_code,
                        "type_label": type_label,
                        "id": t.id,
                        "title": t.title,
                        "time_str": f"{t_time_str} ({time_desc})",
                        "start_time": t_time_str,
                        "end_time": None,
                        "status": "UPCOMING",
                        "status_label": f"Hạn chót ({time_desc})",
                        "minutes_left": diff_mins,
                        "category": "Nhiệm vụ",
                        "category_label": type_label,
                        "priority": t.priority,
                        "badge_color": "indigo" if is_course_task else "sky",
                        "icon": "📚" if is_course_task else "📝",
                        "sort_key": diff_mins
                    })
                elif -120 <= diff_mins < 0:
                    candidates.append({
                        "type": "TASK",
                        "type_code": type_code,
                        "type_label": type_label,
                        "id": t.id,
                        "title": t.title,
                        "time_str": f"{t_time_str} (quá hạn {abs(diff_mins)}p)",
                        "start_time": t_time_str,
                        "end_time": None,
                        "status": "OVERDUE",
                        "status_label": f"Quá hạn {abs(diff_mins)}p",
                        "minutes_left": diff_mins,
                        "category": "Nhiệm vụ",
                        "category_label": type_label,
                        "priority": t.priority,
                        "badge_color": "rose",
                        "icon": "⚠️",
                        "sort_key": 999999
                    })
            except Exception:
                pass

        if candidates:
            candidates.sort(key=lambda x: x["sort_key"])
            upcoming_item = candidates[0]

        # 3. Cognitive Load / Tension summary for Topbar (Formal name: Tải nhận thức)
        tension_info = None
        try:
            from app.services.wellbeing_service import WellbeingService
            wellbeing_data = WellbeingService.get_global_wellbeing_analysis(db)
            tension_info = wellbeing_data.tension.model_dump()
        except Exception as e:
            print(f"[HeaderSummary] Error computing tension: {e}")

        # 4. Telegram Connection Status for Topbar
        telegram_info = {
            "is_connected": False,
            "is_enabled": False,
            "has_token": False
        }
        try:
            from app.services.telegram_service import TelegramService
            tg_cfg = TelegramService.get_config(db)
            is_en = tg_cfg.get("is_enabled", False)
            has_tok = tg_cfg.get("has_token", False)
            has_chat = bool(tg_cfg.get("chat_id"))
            telegram_info = {
                "is_connected": is_en and has_tok and has_chat,
                "is_enabled": is_en,
                "has_token": has_tok
            }
        except Exception as e:
            print(f"[HeaderSummary] Error getting telegram status: {e}")

        # 5. SQLite Database file last modified timestamp
        db_last_saved = None
        try:
            from pathlib import Path
            from app.core.config import settings
            db_file = Path(settings.DATABASE_PATH)
            if db_file.exists():
                db_last_saved = datetime.fromtimestamp(db_file.stat().st_mtime).isoformat()
        except Exception as e:
            print(f"[HeaderSummary] Error getting db mtime: {e}")

        return {
            "current_streak": current_streak,
            "best_streak": best_streak,
            "streak_active_today": active_today,
            "discipline": consistency_info,  # Backwards compatibility
            "consistency": consistency_info,  # Formal statistical index
            "upcoming": upcoming_item,
            "tension": tension_info,
            "telegram": telegram_info,
            "db_last_saved": db_last_saved
        }
