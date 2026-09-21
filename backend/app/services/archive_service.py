from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.task import Task
from app.models.analytics import ArchiveRecord, WeeklyReview
from app.models.course import CourseNode
from app.schemas.analytics import ArchiveRecordOut, WeeklyReviewOut

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

class ArchiveService:
    @classmethod
    def finalize_week(cls, db: Session, year: int, week_number: int) -> ArchiveRecordOut:
        # Start and end date for this week
        w_start = date.fromisocalendar(year, week_number, 1)
        w_end = w_start + timedelta(days=6)
        month = w_start.month

        tasks = db.query(Task).all()
        w_tasks = [
            t for t in tasks
            if (t.completed_datetime and w_start <= t.completed_datetime.date() <= w_end) or
               (t.due_datetime and w_start <= t.due_datetime.date() <= w_end)
        ]

        total = len(w_tasks)
        completed = sum(1 for t in w_tasks if t.status == "COMPLETED")
        delayed = sum(1 for t in w_tasks if t.status == "DELAYED")
        partial = sum(1 for t in w_tasks if t.status == "PARTIAL")
        cancelled = sum(1 for t in w_tasks if t.status == "CANCELLED")

        denom = completed + delayed + (total - completed - delayed - cancelled)
        rate = round((completed / denom * 100.0), 1) if denom > 0 else 0.0
        difficulty_pts = sum((t.difficulty or 1) for t in w_tasks if t.status == "COMPLETED")

        # Leaf study progress average
        all_nodes = db.query(CourseNode).all()
        leaf_nodes = [n for n in all_nodes if not any(c.parent_id == n.id for c in all_nodes)]
        study_progress = (sum(n.progress for n in leaf_nodes) / len(leaf_nodes)) if leaf_nodes else 0.0

        existing = db.query(ArchiveRecord).filter(
            ArchiveRecord.year == year,
            ArchiveRecord.week_number == week_number
        ).first()

        if not existing:
            existing = ArchiveRecord(
                year=year,
                month=month,
                week_number=week_number,
                total_tasks=total,
                completed_tasks=completed,
                delayed_tasks=delayed,
                partial_tasks=partial,
                cancelled_tasks=cancelled,
                completion_rate=rate,
                difficulty_points=difficulty_pts,
                study_progress=round(study_progress, 1),
                streak=0,
                finalized_at=datetime.utcnow()
            )
            db.add(existing)
        else:
            existing.total_tasks = total
            existing.completed_tasks = completed
            existing.delayed_tasks = delayed
            existing.partial_tasks = partial
            existing.cancelled_tasks = cancelled
            existing.completion_rate = rate
            existing.difficulty_points = difficulty_pts
            existing.study_progress = round(study_progress, 1)
            existing.finalized_at = datetime.utcnow()

        db.commit()
        db.refresh(existing)

        review = db.query(WeeklyReview).filter(
            WeeklyReview.year == year,
            WeeklyReview.week_number == week_number
        ).first()
        review_out = WeeklyReviewOut.model_validate(review) if review else None

        return ArchiveRecordOut(
            id=existing.id,
            year=existing.year,
            month=existing.month,
            week_number=existing.week_number,
            total_tasks=existing.total_tasks,
            completed_tasks=existing.completed_tasks,
            delayed_tasks=existing.delayed_tasks,
            partial_tasks=existing.partial_tasks,
            cancelled_tasks=existing.cancelled_tasks,
            completion_rate=existing.completion_rate,
            difficulty_points=existing.difficulty_points,
            study_progress=existing.study_progress,
            streak=existing.streak,
            finalized_at=existing.finalized_at,
            review=review_out
        )

    @classmethod
    def list_archives(cls, db: Session) -> Dict[str, Any]:
        """Returns archive hierarchy: Year -> Month -> List of weekly records."""
        records = db.query(ArchiveRecord).order_by(desc(ArchiveRecord.year), desc(ArchiveRecord.week_number)).all()
        tree: Dict[int, Dict[str, List[ArchiveRecordOut]]] = {}

        for r in records:
            if r.year not in tree:
                tree[r.year] = {}
            m_name = MONTH_NAMES[r.month] if 1 <= r.month <= 12 else f"Month {r.month}"
            if m_name not in tree[r.year]:
                tree[r.year][m_name] = []

            review = db.query(WeeklyReview).filter(
                WeeklyReview.year == r.year,
                WeeklyReview.week_number == r.week_number
            ).first()
            review_out = WeeklyReviewOut.model_validate(review) if review else None

            tree[r.year][m_name].append(ArchiveRecordOut(
                id=r.id,
                year=r.year,
                month=r.month,
                week_number=r.week_number,
                total_tasks=r.total_tasks,
                completed_tasks=r.completed_tasks,
                delayed_tasks=r.delayed_tasks,
                partial_tasks=r.partial_tasks,
                cancelled_tasks=r.cancelled_tasks,
                completion_rate=r.completion_rate,
                difficulty_points=r.difficulty_points,
                study_progress=r.study_progress,
                streak=r.streak,
                finalized_at=r.finalized_at,
                review=review_out
            ))

        return tree
