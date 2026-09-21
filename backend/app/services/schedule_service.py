from datetime import datetime, date, timedelta, time
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from app.models.fixed_schedule import FixedSchedule, FixedScheduleOccurrence
from app.models.task import Task
from app.schemas.fixed_schedule import FixedScheduleCreate, FixedScheduleUpdate, FixedScheduleOut, FreeTimeResponse, ScheduleTimeBlock
from app.schemas.calendar import ScheduleOccurrenceView
from app.schemas.task import ConflictItem, ConflictCheckResponse

def parse_time_str(t_str: str) -> time:
    parts = t_str.split(":")
    return time(int(parts[0]), int(parts[1]))

def time_to_hours(t_str: str) -> float:
    parts = t_str.split(":")
    return int(parts[0]) + int(parts[1]) / 60.0

def times_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    s1, e1 = time_to_hours(start1), time_to_hours(end1)
    s2, e2 = time_to_hours(start2), time_to_hours(end2)
    return max(s1, s2) < min(e1, e2)

class ScheduleService:
    @classmethod
    def get_schedule_by_id(cls, db: Session, schedule_id: int) -> Optional[FixedSchedule]:
        return db.query(FixedSchedule).options(joinedload(FixedSchedule.occurrences)).filter(FixedSchedule.id == schedule_id).first()

    @classmethod
    def list_schedules(cls, db: Session, is_active: Optional[bool] = None) -> List[FixedSchedule]:
        query = db.query(FixedSchedule).options(joinedload(FixedSchedule.occurrences))
        if is_active is not None:
            query = query.filter(FixedSchedule.is_active == is_active)
        return query.order_by(FixedSchedule.day_of_week, FixedSchedule.start_time).all()

    @classmethod
    def create_schedule(cls, db: Session, schedule_in: FixedScheduleCreate) -> FixedSchedule:
        schedule = FixedSchedule(**schedule_in.model_dump())
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule

    @classmethod
    def update_schedule(cls, db: Session, schedule_id: int, schedule_in: FixedScheduleUpdate) -> Optional[FixedSchedule]:
        schedule = db.query(FixedSchedule).filter(FixedSchedule.id == schedule_id).first()
        if not schedule:
            return None
        for field, val in schedule_in.model_dump(exclude_unset=True).items():
            setattr(schedule, field, val)
        schedule.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(schedule)
        return schedule

    @classmethod
    def delete_schedule(cls, db: Session, schedule_id: int) -> bool:
        schedule = db.query(FixedSchedule).filter(FixedSchedule.id == schedule_id).first()
        if not schedule:
            return False
        db.delete(schedule)
        db.commit()
        return True

    @classmethod
    def set_occurrence_override(
        cls,
        db: Session,
        schedule_id: int,
        occ_date: date,
        status: str = "NORMAL",  # NORMAL, SKIPPED, MODIFIED
        override_start: Optional[str] = None,
        override_end: Optional[str] = None,
        notes: Optional[str] = None
    ) -> FixedScheduleOccurrence:
        occ = db.query(FixedScheduleOccurrence).filter(
            FixedScheduleOccurrence.fixed_schedule_id == schedule_id,
            FixedScheduleOccurrence.occurrence_date == occ_date
        ).first()

        if not occ:
            occ = FixedScheduleOccurrence(
                fixed_schedule_id=schedule_id,
                occurrence_date=occ_date,
                status=status,
                override_start_time=override_start,
                override_end_time=override_end,
                notes=notes
            )
            db.add(occ)
        else:
            occ.status = status
            occ.override_start_time = override_start
            occ.override_end_time = override_end
            occ.notes = notes

        db.commit()
        db.refresh(occ)
        return occ

    @classmethod
    def get_occurrences_for_date(cls, db: Session, target_date: date) -> List[ScheduleOccurrenceView]:
        # Monday is 0, Sunday is 6
        dow = target_date.weekday()

        # Query all active fixed schedules matching this day of week
        schedules = db.query(FixedSchedule).options(joinedload(FixedSchedule.occurrences)).filter(
            FixedSchedule.is_active == True,
            FixedSchedule.day_of_week == dow
        ).all()

        results: List[ScheduleOccurrenceView] = []

        for sched in schedules:
            # Check date boundaries if set
            if sched.start_date and target_date < sched.start_date:
                continue
            if sched.end_date and target_date > sched.end_date:
                continue

            # Check override
            occ_override = next((o for o in sched.occurrences if o.occurrence_date == target_date), None)

            if occ_override and occ_override.status == "SKIPPED":
                continue

            start_t = sched.start_time
            end_t = sched.end_time
            status_label = "NORMAL"
            is_overridden = False

            if occ_override and occ_override.status == "MODIFIED":
                if occ_override.override_start_time:
                    start_t = occ_override.override_start_time
                if occ_override.override_end_time:
                    end_t = occ_override.override_end_time
                status_label = "MODIFIED"
                is_overridden = True

            results.append(ScheduleOccurrenceView(
                fixed_schedule_id=sched.id,
                title=sched.title,
                category=sched.category,
                color=sched.color,
                icon=getattr(sched, "icon", "📌") or "📌",
                description=sched.description,
                start_time=start_t,
                end_time=end_t,
                location=sched.location,
                status=status_label,
                is_overridden=is_overridden
            ))

        # Sort by start_time
        results.sort(key=lambda x: x.start_time)
        return results

    @classmethod
    def check_conflict(
        cls,
        db: Session,
        start_datetime: datetime,
        end_datetime: datetime,
        exclude_task_id: Optional[int] = None
    ) -> ConflictCheckResponse:
        target_date = start_datetime.date()
        start_str = start_datetime.strftime("%H:%M")
        end_str = end_datetime.strftime("%H:%M")

        occurrences = cls.get_occurrences_for_date(db, target_date)
        conflicts: List[ConflictItem] = []

        for occ in occurrences:
            if times_overlap(start_str, end_str, occ.start_time, occ.end_time):
                conflicts.append(ConflictItem(
                    fixed_schedule_id=occ.fixed_schedule_id,
                    title=occ.title,
                    category=occ.category,
                    start_time=occ.start_time,
                    end_time=occ.end_time,
                    date=target_date.isoformat()
                ))

        return ConflictCheckResponse(
            has_conflict=len(conflicts) > 0,
            conflicts=conflicts
        )

    @classmethod
    def calculate_free_time(cls, db: Session, target_date: date) -> FreeTimeResponse:
        occurrences = cls.get_occurrences_for_date(db, target_date)
        blocks: List[ScheduleTimeBlock] = []
        total_sched_hours = 0.0

        for occ in occurrences:
            duration = max(0.0, time_to_hours(occ.end_time) - time_to_hours(occ.start_time))
            total_sched_hours += duration
            blocks.append(ScheduleTimeBlock(
                id=occ.fixed_schedule_id,
                title=occ.title,
                category=occ.category,
                start_time=occ.start_time,
                end_time=occ.end_time,
                duration_hours=round(duration, 2)
            ))

        free_time = max(0.0, 24.0 - total_sched_hours)
        return FreeTimeResponse(
            date=target_date.isoformat(),
            day_of_week=target_date.weekday(),
            total_day_hours=24.0,
            total_scheduled_hours=round(total_sched_hours, 2),
            free_time_hours=round(free_time, 2),
            blocks=blocks
        )
