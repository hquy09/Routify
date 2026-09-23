from datetime import datetime, date, timedelta
import calendar as pycalendar
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.task import Task
from app.models.calendar_note import CalendarNote
from app.models.course import CourseNode
from app.schemas.calendar import (
    CalendarWeeklyResponse, CalendarDayView, DaySummaryStats,
    CalendarMonthlyResponse, CalendarMonthDayView, CalendarNoteOut
)
from app.services.task_service import TaskService
from app.services.schedule_service import ScheduleService

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

class CalendarService:
    @classmethod
    def _build_day_view(cls, db: Session, current_date: date, today: date) -> CalendarDayView:
        is_today = (current_date == today)
        day_str = current_date.isoformat()
        day_name = DAY_NAMES[current_date.weekday()]

        # 1. Fixed Schedule occurrences
        sched_occurrences = ScheduleService.get_occurrences_for_date(db, current_date)

        # 2. Free time calculation
        free_time_resp = ScheduleService.calculate_free_time(db, current_date)

        # 3. Tasks for this date
        now_dt = datetime.now()
        day_tasks_all = db.query(Task).options(
            joinedload(Task.subtasks),
            joinedload(Task.attachments),
            joinedload(Task.goal),
            joinedload(Task.project),
            joinedload(Task.course_node).joinedload(CourseNode.course),
            joinedload(Task.scheduled_with_fixed),
            joinedload(Task.transferred_from)
        ).all()
        active_fixed_ids = {occ.fixed_schedule_id for occ in sched_occurrences}
        day_tasks = [
            t for t in day_tasks_all
            if (t.due_datetime and t.due_datetime.date() == current_date) or
               (t.start_datetime and t.start_datetime.date() == current_date) or
               (t.completed_datetime and t.completed_datetime.date() == current_date) or
               (t.scheduled_with_fixed_id and t.scheduled_with_fixed_id in active_fixed_ids and t.status != "COMPLETED")
        ]
        formatted_tasks = [TaskService._format_task_out(t) for t in day_tasks]

        # 4. Summary stats
        completed_c = sum(1 for t in day_tasks if t.status == "COMPLETED")
        partial_c = sum(1 for t in day_tasks if t.status == "PARTIAL")
        delayed_c = sum(1 for t in day_tasks if t.status == "DELAYED" or (t.due_datetime and t.due_datetime < now_dt and t.status in ["TODO", "IN_PROGRESS", "PARTIAL"]))
        todo_c = sum(1 for t in day_tasks if t.status in ["TODO", "IN_PROGRESS"] and not (t.due_datetime and t.due_datetime < now_dt))
        total_c = len(day_tasks)

        stats = DaySummaryStats(
            completed=completed_c,
            partial=partial_c,
            delayed=delayed_c,
            todo=todo_c,
            total=total_c
        )

        # 5. Notes
        notes = db.query(CalendarNote).filter(CalendarNote.note_date == current_date).all()
        notes_out = [
            CalendarNoteOut(id=n.id, note_date=n.note_date, content=n.content, created_at=n.created_at)
            for n in notes
        ]

        return CalendarDayView(
            date=day_str,
            day_name=day_name,
            day_of_week=current_date.weekday(),
            is_today=is_today,
            stats=stats,
            free_time_hours=free_time_resp.free_time_hours,
            tasks=formatted_tasks,
            fixed_schedules=sched_occurrences,
            notes=notes_out
        )

    @classmethod
    def get_daily_view(cls, db: Session, ref_date: Optional[date] = None) -> CalendarDayView:
        today = datetime.now().date()
        if ref_date is None:
            ref_date = today
        return cls._build_day_view(db, ref_date, today)

    @classmethod
    def get_weekly_view(cls, db: Session, ref_date: Optional[date] = None) -> CalendarWeeklyResponse:
        today = datetime.now().date()
        if ref_date is None:
            ref_date = today

        # Monday is weekday 0
        w_start = ref_date - timedelta(days=ref_date.weekday())
        w_end = w_start + timedelta(days=6)
        year, week_num, _ = w_start.isocalendar()

        days_out: List[CalendarDayView] = []
        for offset in range(7):
            current_date = w_start + timedelta(days=offset)
            days_out.append(cls._build_day_view(db, current_date, today))

        return CalendarWeeklyResponse(
            start_date=w_start.isoformat(),
            end_date=w_end.isoformat(),
            week_number=week_num,
            year=year,
            days=days_out
        )

    @classmethod
    def get_monthly_view(cls, db: Session, year: int, month: int) -> CalendarMonthlyResponse:
        today = datetime.now().date()
        cal = pycalendar.Calendar(firstweekday=0)  # Monday first
        month_days = cal.monthdatescalendar(year, month)

        tasks = db.query(Task).all()

        month_name = pycalendar.month_name[month]
        total_completed = 0
        total_incomplete = 0
        total_delayed = 0

        days_out: List[CalendarMonthDayView] = []

        for week in month_days:
            for day_d in week:
                is_curr_m = (day_d.month == month)
                is_today = (day_d == today)

                # Tasks for day_d
                d_tasks = [
                    t for t in tasks
                    if (t.completed_datetime and t.completed_datetime.date() == day_d) or
                       (t.start_datetime and t.start_datetime.date() == day_d) or
                       (t.due_datetime and t.due_datetime.date() == day_d)
                ]

                comp = sum(1 for t in d_tasks if t.status == "COMPLETED")
                inc = sum(1 for t in d_tasks if t.status in ["TODO", "IN_PROGRESS", "PARTIAL"])
                del_ = sum(1 for t in d_tasks if t.status == "DELAYED" or (t.due_datetime and t.due_datetime < datetime.now() and t.status in ["TODO", "IN_PROGRESS", "PARTIAL"]))
                pts = sum((t.difficulty or 1) for t in d_tasks if t.status == "COMPLETED")

                if is_curr_m:
                    total_completed += comp
                    total_incomplete += inc
                    total_delayed += del_

                # Heat level: 0: 0, 1: 1-2, 2: 3-4, 3: 5-7, 4: 8+
                if comp == 0:
                    lvl = 0
                elif comp <= 2:
                    lvl = 1
                elif comp <= 4:
                    lvl = 2
                elif comp <= 7:
                    lvl = 3
                else:
                    lvl = 4

                days_out.append(CalendarMonthDayView(
                    date=day_d.isoformat(),
                    day_of_month=day_d.day,
                    is_current_month=is_curr_m,
                    is_today=is_today,
                    completed_count=comp,
                    incomplete_count=inc,
                    delayed_count=del_,
                    difficulty_points=pts,
                    heat_level=lvl
                ))

        denom = total_completed + total_incomplete + total_delayed
        completion_rate = round((total_completed / denom * 100.0), 1) if denom > 0 else 0.0

        return CalendarMonthlyResponse(
            year=year,
            month=month,
            month_name=month_name,
            total_completed=total_completed,
            total_incomplete=total_incomplete,
            total_delayed=total_delayed,
            completion_rate=completion_rate,
            days=days_out
        )
