from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Hierarchies and relations
    goal_id: Mapped[Optional[int]] = mapped_column(ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    parent_task_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    course_node_id: Mapped[Optional[int]] = mapped_column(ForeignKey("course_nodes.id", ondelete="SET NULL"), nullable=True)
    scheduled_with_fixed_id: Mapped[Optional[int]] = mapped_column(ForeignKey("fixed_schedules.id", ondelete="SET NULL"), nullable=True)

    # Timing
    start_datetime: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    due_datetime: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_datetime: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Classification & points
    difficulty: Mapped[int] = mapped_column(Integer, default=2)  # 1 (Easy) to 5 (Extreme)
    priority: Mapped[str] = mapped_column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH, URGENT

    # Status: TODO, IN_PROGRESS, PARTIAL, COMPLETED, DELAYED, TRANSFERRED, CANCELLED
    status: Mapped[str] = mapped_column(String(50), default="TODO")

    # Recurrence
    recurrence_rule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_recurring_template: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_template_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)

    # Transfer system (Important: keeps audit trail)
    transferred_from_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    transferred_to_id: Mapped[Optional[int]] = mapped_column(ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)

    # Timestamps & Archiving
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    goal = relationship("Goal", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")
    subtasks: Mapped[List["Subtask"]] = relationship("Subtask", back_populates="task", cascade="all, delete-orphan", order_by="Subtask.order_index")
    attachments: Mapped[List["Attachment"]] = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")

    # Self-referencing hierarchies
    parent_task = relationship("Task", remote_side=[id], backref="child_tasks", foreign_keys=[parent_task_id])
    transferred_from = relationship("Task", remote_side=[id], foreign_keys=[transferred_from_id])
    course_node = relationship("CourseNode", back_populates="tasks")
    scheduled_with_fixed = relationship("FixedSchedule", back_populates="scheduled_tasks")


class Subtask(Base):
    __tablename__ = "subtasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped["Task"] = relationship("Task", back_populates="subtasks")
