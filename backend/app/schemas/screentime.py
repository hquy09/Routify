from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class ScreenTimeLogBase(BaseModel):
    category: str
    minutes_spent: int = Field(..., ge=1, description="Minutes spent")
    app_name: Optional[str] = None
    notes: Optional[str] = None

class ScreenTimeLogCreate(ScreenTimeLogBase):
    log_date: Optional[date] = None

class ScreenTimeLogOut(ScreenTimeLogBase):
    id: int
    log_date: date
    created_at: datetime

    class Config:
        from_attributes = True

class ScreenTimeLimitBase(BaseModel):
    category: str
    label: Optional[str] = None
    category_type: str = "DISTRACTION"  # DISTRACTION, PRODUCTIVE, OTHER
    daily_limit_minutes: int = Field(..., ge=0)
    is_active: bool = True
    description: Optional[str] = None

class ScreenTimeLimitCreate(ScreenTimeLimitBase):
    pass

class ScreenTimeLimitUpdate(BaseModel):
    label: Optional[str] = None
    category_type: Optional[str] = None
    daily_limit_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

class ScreenTimeLimitOut(ScreenTimeLimitBase):
    id: int

    class Config:
        from_attributes = True

class CategoryUsage(BaseModel):
    category: str
    category_label: str
    category_type: str
    minutes_spent: int
    daily_limit_minutes: int
    percentage: float
    status: str  # SAFE, WARNING, VIOLATED
    exceeded_minutes: int

class DailyDisciplineSummary(BaseModel):
    date: str
    rating: float  # 0.0 to 10.0 scale
    rating_tier: str  # EXCELLENT, GOOD, FAIR, ALERT
    rating_label_vi: str  # Xuất sắc, Tốt, Cần cải thiện, Báo động
    total_minutes: int
    study_work_minutes: int
    entertainment_social_minutes: int
    violations_count: int
    categories: List[CategoryUsage]
    logs: List[ScreenTimeLogOut]

class WeeklyDisciplineDay(BaseModel):
    date: str
    day_name_vi: str
    rating: float
    study_work_minutes: int
    entertainment_social_minutes: int
    has_violation: bool

class ScreenTimeOverview(BaseModel):
    today: DailyDisciplineSummary
    weekly_trend: List[WeeklyDisciplineDay]
    average_rating_7d: float
    limits: List[ScreenTimeLimitOut]
