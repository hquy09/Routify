from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Text, DateTime, Date, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base

class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    completed_tasks: Mapped[int] = mapped_column(Integer, default=0)
    delayed_tasks: Mapped[int] = mapped_column(Integer, default=0)
    partial_tasks: Mapped[int] = mapped_column(Integer, default=0)
    cancelled_tasks: Mapped[int] = mapped_column(Integer, default=0)
    completion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    difficulty_points: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)

    best_day: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    worst_day: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    what_went_well: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    what_needs_improvement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    delayed_tasks_reflection: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_week_changes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ArchiveRecord(Base):
    __tablename__ = "archive_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    month: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    week_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    total_tasks: Mapped[int] = mapped_column(Integer, default=0)
    completed_tasks: Mapped[int] = mapped_column(Integer, default=0)
    delayed_tasks: Mapped[int] = mapped_column(Integer, default=0)
    partial_tasks: Mapped[int] = mapped_column(Integer, default=0)
    cancelled_tasks: Mapped[int] = mapped_column(Integer, default=0)
    completion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    difficulty_points: Mapped[int] = mapped_column(Integer, default=0)
    study_progress: Mapped[float] = mapped_column(Float, default=0.0)
    streak: Mapped[int] = mapped_column(Integer, default=0)

    snapshot_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    finalized_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
