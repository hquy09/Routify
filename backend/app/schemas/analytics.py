from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class HeatmapDay(BaseModel):
    date: str
    count: int
    difficulty_points: int
    level: int  # 0 to 4

class BarChartItem(BaseModel):
    label: str
    completed: int
    delayed: int
    partial: int
    difficulty_points: int

class BarChartResponse(BaseModel):
    filter_by: str  # DAY, WEEK, MONTH, YEAR
    items: List[BarChartItem] = []

class GoalProgressItem(BaseModel):
    goal_id: int
    title: str
    category: Optional[str] = None
    completed_tasks: int
    total_tasks: int
    completion_rate: float

class ProjectProgressItem(BaseModel):
    project_id: int
    title: str
    goal_title: Optional[str] = None
    color: str
    completed_tasks: int
    total_tasks: int
    completion_rate: float

class DashboardStatsResponse(BaseModel):
    tasks_completed: int
    tasks_delayed: int
    tasks_partial: int
    tasks_incomplete: int
    completion_rate_today: float
    completion_rate_this_week: float
    completion_rate_this_month: float
    total_difficulty_points: int
    current_streak: int
    best_streak: int
    streak_active_today: bool

    goals: List[GoalProgressItem] = []
    projects: List[ProjectProgressItem] = []

class DailyBreakdownItem(BaseModel):
    date: str
    day_name_vi: str
    completed_tasks: int = 0
    delayed_tasks: int = 0
    difficulty_points: int = 0
    screentime_hours: float = 0.0
    consistency_score: float = 10.0
    is_best_day: bool = False
    is_worst_day: bool = False
    status_tone: str = "NORMAL"  # "EXCELLENT", "GOOD", "WARNING", "REST"

class DelayedTaskAuditItem(BaseModel):
    id: int
    title: str
    due_date: Optional[str] = None
    is_force_majeure: bool = False
    reason: str = ""
    status: str = "DELAYED"

class CourseWeekProgressItem(BaseModel):
    course_id: int
    course_title: str
    color: str
    completed_lessons: int
    total_study_minutes: int

class WeeklyReviewCreate(BaseModel):
    year: int
    week_number: int
    what_went_well: Optional[str] = None
    what_needs_improvement: Optional[str] = None
    delayed_tasks_reflection: Optional[str] = None
    next_week_changes: Optional[str] = None

class WeeklyReviewOut(BaseModel):
    id: Optional[int] = 0
    year: int
    week_number: int
    start_date: date
    end_date: date
    is_finalized: bool = False

    # Performance & Grade
    performance_grade: str = "A"  # A+, A, B, C, D
    overall_score: float = 90.0  # 0 to 100
    executive_summary: str = ""

    # Task metrics
    total_tasks: int = 0
    completed_tasks: int = 0
    delayed_tasks: int = 0
    partial_tasks: int = 0
    cancelled_tasks: int = 0
    completion_rate: float = 0.0
    difficulty_points: int = 0
    streak: int = 0
    best_day: Optional[str] = None
    worst_day: Optional[str] = None

    # Consistency & Force Majeure
    consistency_score: float = 10.0
    stability_pct: float = 95.0
    force_majeure_count: int = 0
    unexcused_delay_count: int = 0

    # Screen Time & Digital Balance
    total_screentime_hours: float = 0.0
    study_work_screentime_hours: float = 0.0
    entertainment_screentime_hours: float = 0.0
    screentime_violations_count: int = 0

    # Cognitive Load & Wellbeing
    avg_daily_focus_hours: float = 0.0
    burnout_risk_level: str = "LOW"  # "LOW", "MODERATE", "BURNOUT_RISK"

    # 7-day Breakdown
    daily_breakdown: List[DailyBreakdownItem] = []

    # Course Progress
    courses_progress: List[CourseWeekProgressItem] = []

    # Delayed Task Audit
    delayed_audits: List[DelayedTaskAuditItem] = []

    # Auto-draft reflections (AI / Analytical Assistant recommendations)
    draft_what_went_well: str = ""
    draft_what_needs_improvement: str = ""
    draft_delayed_reflection: str = ""
    draft_next_week_changes: str = ""

    # User Reflections
    what_went_well: Optional[str] = None
    what_needs_improvement: Optional[str] = None
    delayed_tasks_reflection: Optional[str] = None
    next_week_changes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ArchiveRecordOut(BaseModel):
    id: int
    year: int
    month: int
    week_number: int
    total_tasks: int
    completed_tasks: int
    delayed_tasks: int
    partial_tasks: int
    cancelled_tasks: int
    completion_rate: float
    difficulty_points: int
    study_progress: float
    streak: int
    finalized_at: datetime
    review: Optional[WeeklyReviewOut] = None

    class Config:
        from_attributes = True

class ArchiveYearGroup(BaseModel):
    year: int
    months: Dict[str, List[ArchiveRecordOut]]
