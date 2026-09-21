from datetime import datetime, date
from sqlalchemy import Text, DateTime, Date, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base

class CalendarNote(Base):
    __tablename__ = "calendar_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    note_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
