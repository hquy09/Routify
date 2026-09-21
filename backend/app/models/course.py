from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    color: Mapped[str] = mapped_column(String(50), default="#10b981")
    countdown_id: Mapped[Optional[int]] = mapped_column(ForeignKey("countdowns.id", ondelete="SET NULL"), nullable=True)
    cover_style: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="DEFAULT")
    cover_config: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mastery_points: Mapped[int] = mapped_column(Integer, default=0)
    mastery_level: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    nodes: Mapped[List["CourseNode"]] = relationship("CourseNode", back_populates="course", cascade="all, delete-orphan")
    countdown = relationship("Countdown")


class CourseNode(Base):
    __tablename__ = "course_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("course_nodes.id", ondelete="CASCADE"), nullable=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # COURSE, SECTION, CHAPTER, LESSON, TOPIC, RESOURCE
    type: Mapped[str] = mapped_column(String(50), default="LESSON")

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # in minutes
    estimated_study_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # in minutes
    difficulty: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1-5

    # NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED
    status: Mapped[str] = mapped_column(String(50), default="NOT_STARTED")
    progress: Mapped[float] = mapped_column(Float, default=0.0)  # 0.0 to 100.0

    order_index: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    course: Mapped["Course"] = relationship("Course", back_populates="nodes")
    parent = relationship("CourseNode", remote_side=[id], backref="children")
    tasks = relationship("Task", back_populates="course_node")
