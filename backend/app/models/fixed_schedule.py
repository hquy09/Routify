from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class FixedSchedule(Base):
    __tablename__ = "fixed_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)  # HH:MM
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)    # HH:MM

    repeat_rule: Mapped[str] = mapped_column(String(50), default="WEEKLY")
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # SCHOOL, STUDY, WORK, EXERCISE, SLEEP, PERSONAL, OTHER
    category: Mapped[str] = mapped_column(String(50), default="STUDY")
    color: Mapped[str] = mapped_column(String(50), default="#6366f1")
    icon: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default="📌")
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    course_id: Mapped[Optional[int]] = mapped_column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    course_node_id: Mapped[Optional[int]] = mapped_column(ForeignKey("course_nodes.id", ondelete="SET NULL"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    occurrences: Mapped[List["FixedScheduleOccurrence"]] = relationship("FixedScheduleOccurrence", back_populates="fixed_schedule", cascade="all, delete-orphan")
    scheduled_tasks = relationship("Task", back_populates="scheduled_with_fixed")
    course = relationship("Course")
    course_node = relationship("CourseNode")

    @property
    def course_title(self) -> Optional[str]:
        return self.course.title if self.course else None

    @property
    def course_node_title(self) -> Optional[str]:
        return self.course_node.title if self.course_node else None


class FixedScheduleOccurrence(Base):
    __tablename__ = "fixed_schedule_occurrences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fixed_schedule_id: Mapped[int] = mapped_column(ForeignKey("fixed_schedules.id", ondelete="CASCADE"), nullable=False)
    occurrence_date: Mapped[date] = mapped_column(Date, nullable=False)

    override_start_time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    override_end_time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # NORMAL, SKIPPED, MODIFIED
    status: Mapped[str] = mapped_column(String(50), default="NORMAL")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    fixed_schedule: Mapped["FixedSchedule"] = relationship("FixedSchedule", back_populates="occurrences")
