from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class FixedScheduleOccurrenceBase(BaseModel):
    occurrence_date: date
    override_start_time: Optional[str] = None
    override_end_time: Optional[str] = None
    status: str = "NORMAL"  # NORMAL, SKIPPED, MODIFIED
    notes: Optional[str] = None

class FixedScheduleOccurrenceCreate(FixedScheduleOccurrenceBase):
    fixed_schedule_id: int

class FixedScheduleOccurrenceOut(FixedScheduleOccurrenceBase):
    id: int
    fixed_schedule_id: int

    class Config:
        from_attributes = True


class FixedScheduleBase(BaseModel):
    title: str
    description: Optional[str] = None
    # 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    day_of_week: int = Field(ge=0, le=6)
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    repeat_rule: str = "WEEKLY"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    category: str = "STUDY"  # SCHOOL, STUDY, WORK, EXERCISE, SLEEP, PERSONAL, OTHER
    color: str = "#6366f1"
    icon: Optional[str] = "📌"
    location: Optional[str] = None
    is_active: bool = True

class FixedScheduleCreate(FixedScheduleBase):
    pass

class FixedScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    repeat_rule: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    category: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class FixedScheduleOut(FixedScheduleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    occurrences: List[FixedScheduleOccurrenceOut] = []

    class Config:
        from_attributes = True


class ScheduleTimeBlock(BaseModel):
    id: int
    title: str
    category: str
    start_time: str
    end_time: str
    duration_hours: float

class FreeTimeResponse(BaseModel):
    date: str
    day_of_week: int
    total_day_hours: float = 24.0
    total_scheduled_hours: float
    free_time_hours: float
    blocks: List[ScheduleTimeBlock] = []
