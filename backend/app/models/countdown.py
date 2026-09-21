from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base

class Countdown(Base):
    __tablename__ = "countdowns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="EXAM")  # EXAM, GOAL, EVENT, OTHER
    target_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default="🎓")
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="#000000")
    display_mode: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="CIRCULAR")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    cover_style: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="DEFAULT")
    cover_config: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
