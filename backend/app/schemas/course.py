from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    instructor: Optional[str] = None
    color: str = "#10b981"
    countdown_id: Optional[int] = None
    cover_style: Optional[str] = "DEFAULT"
    cover_config: Optional[str] = None
    mastery_points: Optional[int] = 0
    mastery_level: Optional[int] = 1

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    color: Optional[str] = None
    countdown_id: Optional[int] = None
    cover_style: Optional[str] = None
    cover_config: Optional[str] = None
    mastery_points: Optional[int] = None
    mastery_level: Optional[int] = None

class CourseNodeBase(BaseModel):
    title: str
    type: str = "LESSON"  # COURSE, SECTION, CHAPTER, LESSON, TOPIC, RESOURCE
    description: Optional[str] = None
    notes: Optional[str] = None
    video_url: Optional[str] = None
    document_url: Optional[str] = None
    duration: Optional[int] = None
    estimated_study_time: Optional[int] = None
    difficulty: Optional[int] = None
    status: str = "NOT_STARTED"  # NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED
    progress: float = 0.0
    order_index: int = 0

class CourseNodeCreate(CourseNodeBase):
    course_id: int
    parent_id: Optional[int] = None

class CourseNodeUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    video_url: Optional[str] = None
    document_url: Optional[str] = None
    duration: Optional[int] = None
    estimated_study_time: Optional[int] = None
    difficulty: Optional[int] = None
    status: Optional[str] = None
    progress: Optional[float] = None
    order_index: Optional[int] = None
    parent_id: Optional[int] = None

class CourseNodeOut(CourseNodeBase):
    id: int
    course_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    has_children: bool = False
    course_title: Optional[str] = None

    class Config:
        from_attributes = True

class CourseNodeTreeOut(CourseNodeOut):
    children: List["CourseNodeTreeOut"] = []

class CourseOut(CourseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    total_nodes_count: int = 0
    completed_nodes_count: int = 0
    overall_progress: float = 0.0

    # Countdown and Pace fields
    countdown_id: Optional[int] = None
    countdown_title: Optional[str] = None
    countdown_target_date: Optional[datetime] = None
    countdown_days_left: Optional[int] = None
    countdown_icon: Optional[str] = None
    remaining_duration_minutes: Optional[int] = None
    remaining_lessons_count: Optional[int] = None
    estimated_daily_study_minutes: Optional[float] = None
    estimated_daily_lessons: Optional[float] = None

    class Config:
        from_attributes = True

class CourseDetailOut(CourseOut):
    root_nodes: List[CourseNodeTreeOut] = []

class CreateStudyTaskRequest(BaseModel):
    lesson_id: int
    title: Optional[str] = None
    due_datetime: Optional[datetime] = None
    difficulty: Optional[int] = 2
    priority: Optional[str] = "MEDIUM"
    goal_id: Optional[int] = None
    project_id: Optional[int] = None
    fixed_schedule_id: Optional[int] = None
    subtask_titles: Optional[List[str]] = None
    notes: Optional[str] = None

# Burnout & Sleep Analysis Models
class BurnoutDayDetail(BaseModel):
    day_key: str  # MON, TUE, WED, THU, FRI, SAT, SUN
    day_name: str  # Thứ Hai, Thứ Ba...
    day_number: int  # 0=Mon, 6=Sun
    sleep_minutes: int
    sleep_hours: float
    fixed_minutes: int
    fixed_hours: float
    routine_minutes: int
    target_study_minutes: int
    target_study_hours: float
    awake_available_minutes: int
    free_minutes: int
    free_hours: float
    workload_ratio: float
    efficiency_score: float
    status: str  # OPTIMAL, MODERATE, BURNOUT_RISK
    is_sleep_deprived: bool = False
    fixed_schedules_count: int = 0
    fixed_schedule_names: List[str] = []
    recommended_study_minutes: int = 0

class BurnoutCustomConfig(BaseModel):
    max_daily_focus_hours: float = 6.0
    min_free_hours: float = 2.0
    sleep_target_hours: float = 7.5
    sleep_bedtime: str = "23:00"
    sleep_wake_time: str = "07:00"
    workload_threshold: float = 80.0
    energy_level: str = "NORMAL"  # RECHARGED, NORMAL, FATIGUED, EXHAUSTED
    is_calibrated: bool = False

class BurnoutAnalysisOut(BaseModel):
    course_id: int
    course_title: str
    countdown_id: Optional[int] = None
    countdown_title: Optional[str] = None
    countdown_days_left: Optional[int] = None
    total_remaining_minutes: int
    total_remaining_lessons: int
    average_daily_study_minutes: float
    config: BurnoutCustomConfig
    days: List[BurnoutDayDetail]
    weekly_burnout_risk_level: str  # OPTIMAL, MODERATE, BURNOUT_RISK
    high_risk_days: List[str] = []
    smart_recommendation: str
    rebalance_summary: str
