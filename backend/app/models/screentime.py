from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Text, Integer, Float, Boolean, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base

class ScreenTimeLimit(Base):
    __tablename__ = "screen_time_limits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(50), unique=True, nullable=False) # Key/Slug e.g. SOCIAL, GAMING, CODE
    label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # Display name e.g. "Mạng xã hội", "Chơi game"
    category_type: Mapped[str] = mapped_column(String(100), default="DISTRACTION") # DISTRACTION, PRODUCTIVE, OTHER, or custom
    daily_limit_minutes: Mapped[int] = mapped_column(Integer, default=60) # 0 means unlimited
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class ScreenTimeLog(Base):
    __tablename__ = "screen_time_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    log_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    minutes_spent: Mapped[int] = mapped_column(Integer, nullable=False)
    app_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
