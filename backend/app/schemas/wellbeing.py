from typing import List, Optional
from pydantic import BaseModel

class CourseLoadContribution(BaseModel):
    course_id: int
    course_title: str
    color: str
    instructor: Optional[str] = None
    countdown_id: Optional[int] = None
    countdown_title: Optional[str] = None
    countdown_days_left: Optional[int] = None
    countdown_icon: Optional[str] = None
    total_remaining_minutes: int
    total_remaining_lessons: int
    daily_study_minutes_needed: float
    percentage_of_total_study: float
    cognitive_weight: str  # "CAO", "TRUNG BÌNH", "NHẸ"

class StudyStreamItem(BaseModel):
    course_id: int
    course_title: str
    color: str
    duration_minutes: int
    focus_type: str  # "DEEP_WORK", "LIGHT_REVIEW", "PRACTICE"
    recommended_window: str  # "Sáng sớm", "Buổi tối", "Thời gian rảnh"

class WellbeingDayDetail(BaseModel):
    day_key: str  # MON, TUE, WED, THU, FRI, SAT, SUN
    day_name: str  # Thứ Hai, Thứ Ba...
    day_number: int  # 0=Mon, 6=Sun
    sleep_minutes: int
    sleep_hours: float
    fixed_minutes: int
    fixed_hours: float
    fixed_schedule_names: List[str] = []
    routine_minutes: int
    total_study_minutes: int
    total_study_hours: float
    awake_available_minutes: int
    free_minutes: int
    free_hours: float
    workload_ratio: float
    efficiency_score: float
    status: str  # OPTIMAL, MODERATE, BURNOUT_RISK
    is_sleep_deprived: bool = False
    streams: List[StudyStreamItem] = []

class WellbeingCustomConfig(BaseModel):
    max_daily_focus_hours: float = 6.0
    min_free_hours: float = 2.0
    sleep_target_hours: float = 7.5
    sleep_bedtime: str = "23:00"
    sleep_wake_time: str = "07:00"
    workload_threshold: float = 80.0
    energy_level: str = "NORMAL"  # RECHARGED, NORMAL, FATIGUED, EXHAUSTED
    stream_strategy: str = "BALANCED_BLOCKS"  # BALANCED_BLOCKS, ADAPTIVE, EVEN_SPREAD
    is_calibrated: bool = False

class TensionSummary(BaseModel):
    tension_level: str  # LOW, BALANCED, STRAIN, EXTREME
    tension_label: str  # "Thư thái", "Tập trung tối ưu", "Căng thẳng", "Quá tải"
    tension_score: float  # hours of focus load
    weekly_risk_level: str  # OPTIMAL, MODERATE, BURNOUT_RISK
    color_code: str  # #10b981, #0284c7, #f59e0b, #ef4444
    icon: str  # 😌, 🎯, ⚡, 🔥

class GlobalWellbeingAnalysis(BaseModel):
    total_courses_count: int
    active_courses_count: int
    total_remaining_study_minutes: int
    total_remaining_study_hours: float
    total_remaining_lessons: int
    combined_daily_study_minutes: float
    combined_daily_study_hours: float
    courses_contribution: List[CourseLoadContribution]
    days: List[WellbeingDayDetail]
    config: WellbeingCustomConfig
    tension: TensionSummary
    weekly_burnout_risk_level: str  # OPTIMAL, MODERATE, BURNOUT_RISK
    high_risk_days: List[str] = []
    smart_recommendation: str
    rebalance_summary: str
