from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.schemas.task import TaskOut
from app.schemas.fixed_schedule import FixedScheduleOut

class CalendarNoteBase(BaseModel):
    note_date: date
    content: str

class CalendarNoteCreate(CalendarNoteBase):
    pass

class CalendarNoteOut(CalendarNoteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ScheduleOccurrenceView(BaseModel):
    fixed_schedule_id: int
    title: str
    category: str
    color: str
    icon: Optional[str] = "📌"
    description: Optional[str] = None
    start_time: str
    end_time: str
    location: Optional[str] = None
    status: str = "NORMAL"  # NORMAL, MODIFIED, SKIPPED
    is_overridden: bool = False
    course_id: Optional[int] = None
    course_title: Optional[str] = None
    course_node_id: Optional[int] = None
    course_node_title: Optional[str] = None

class DaySummaryStats(BaseModel):
    completed: int = 0
    partial: int = 0
    delayed: int = 0
    todo: int = 0
    total: int = 0

class CalendarDayView(BaseModel):
    date: str
    day_name: str
    day_of_week: int
    is_today: bool
    stats: DaySummaryStats
    free_time_hours: float
    tasks: List[TaskOut] = []
    fixed_schedules: List[ScheduleOccurrenceView] = []
    notes: List[CalendarNoteOut] = []

class CalendarWeeklyResponse(BaseModel):
    start_date: str
    end_date: str
    week_number: int
    year: int
    days: List[CalendarDayView] = []

class CalendarMonthDayView(BaseModel):
    date: str
    day_of_month: int
    is_current_month: bool
    is_today: bool
    completed_count: int = 0
    incomplete_count: int = 0
    delayed_count: int = 0
    difficulty_points: int = 0
    heat_level: int = 0  # 0 to 4

class CalendarMonthlyResponse(BaseModel):
    year: int
    month: int
    month_name: str
    total_completed: int
    total_incomplete: int
    total_delayed: int
    completion_rate: float
    days: List[CalendarMonthDayView] = []
