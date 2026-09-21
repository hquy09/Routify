export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'PARTIAL'
  | 'COMPLETED'
  | 'DELAYED'
  | 'TRANSFERRED'
  | 'CANCELLED';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'Chưa hoàn thành',
  IN_PROGRESS: 'Đang thực hiện',
  PARTIAL: 'Hoàn thành một phần',
  COMPLETED: 'Đã hoàn thành',
  DELAYED: 'Chậm trễ',
  TRANSFERRED: 'Đã chuyển giao',
  CANCELLED: 'Đã hủy',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  TODO: { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
  IN_PROGRESS: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  PARTIAL: { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  COMPLETED: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  DELAYED: { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  TRANSFERRED: { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  CANCELLED: { bg: 'bg-slate-100 dark:bg-slate-800/40', text: 'text-slate-500 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
};

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const PRIORITY_CONFIG: Record<PriorityLevel, {
  label: string;
  shortLabel: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  description: string;
}> = {
  URGENT: {
    label: 'Khẩn cấp',
    shortLabel: 'Khẩn',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/70',
    textColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-300 dark:border-rose-800',
    dotColor: 'bg-rose-500',
    description: 'Nhiệm vụ tối quan trọng, thời hạn gấp, cần hoàn thành ngay lập tức',
  },
  HIGH: {
    label: 'Ưu tiên cao',
    shortLabel: 'Cao',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/70',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    description: 'Nhiệm vụ quan trọng trong ngày, cần ưu tiên hoàn thành sớm',
  },
  MEDIUM: {
    label: 'Trung bình',
    shortLabel: 'TB',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    dotColor: 'bg-blue-500',
    description: 'Nhiệm vụ tiêu chuẩn theo kế hoạch học tập & làm việc',
  },
  LOW: {
    label: 'Thấp',
    shortLabel: 'Thấp',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-200 dark:border-slate-700',
    dotColor: 'bg-slate-400',
    description: 'Nhiệm vụ phụ hoặc chuẩn bị trước, có thể linh hoạt chuyển dời',
  },
};

export const DIFFICULTY_CONFIG: Record<number, {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  points: number;
  description: string;
}> = {
  1: {
    label: 'Dễ (Easy)',
    shortLabel: 'D1',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    points: 1,
    description: 'Bài tập ngắn, việc vặt hoặc ôn nhanh dưới 15-30 phút (+1 điểm)',
  },
  2: {
    label: 'Bình thường (Normal)',
    shortLabel: 'D2',
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    border: 'border-sky-200 dark:border-sky-800',
    points: 2,
    description: 'Nội dung bài học chuẩn, làm bài tập về nhà mức trung bình (+2 điểm)',
  },
  3: {
    label: 'Khó (Hard)',
    shortLabel: 'D3',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    points: 3,
    description: 'Chuyên đề kiến thức sâu, dạng bài phân loại 8-9 điểm (+3 điểm)',
  },
  4: {
    label: 'Rất khó (Very Hard)',
    shortLabel: 'D4',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
    points: 4,
    description: 'Luyện đề thi thử thực chiến, dự án dài hoặc bài toán phức tạp (+4 điểm)',
  },
  5: {
    label: 'Cực khó (Extreme)',
    shortLabel: 'D5',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200 dark:border-rose-800',
    points: 5,
    description: 'Chinh phục bài toán điểm 10, kỳ thi HSG, thử thách vượt ngưỡng (+5 điểm)',
  },
};

export const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Easy', color: 'text-emerald-400' },
  2: { label: 'Normal', color: 'text-sky-400' },
  3: { label: 'Medium', color: 'text-amber-400' },
  4: { label: 'Hard', color: 'text-orange-400' },
  5: { label: 'Extreme', color: 'text-rose-500' },
};

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
}

export interface Attachment {
  id: number;
  task_id?: number;
  filename: string;
  file_type: 'PDF' | 'IMAGE' | 'DOCUMENT' | 'FILE' | 'URL';
  file_size: number;
  storage_path?: string;
  url?: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  goal_id?: number | null;
  project_id?: number | null;
  parent_task_id?: number | null;
  course_node_id?: number | null;
  scheduled_with_fixed_id?: number | null;
  start_datetime?: string | null;
  due_datetime?: string | null;
  completed_datetime?: string | null;
  difficulty: number; // 1 to 5
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: TaskStatus;
  recurrence_rule?: string | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  transferred_from_id?: number | null;
  transferred_to_id?: number | null;

  subtasks: Subtask[];
  attachments: Attachment[];
  subtasks_count: number;
  subtasks_completed_count: number;
  subtask_progress: number;

  goal_title?: string;
  project_title?: string;
  course_title?: string;
  scheduled_with_fixed_title?: string;
  transferred_from_title?: string;
  transferred_from_date?: string;
}

export interface Project {
  id: number;
  goal_id?: number | null;
  title: string;
  description?: string | null;
  color?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  target_date?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  projects: Project[];
}

export type CountdownCategory = 'EXAM' | 'GOAL' | 'EVENT' | 'OTHER';

export interface CountdownCoverConfig {
  align?: 'left' | 'center' | 'right';
  detail_mode?: 'SIMPLE' | 'DETAILED';
  gradient_color1?: string;
  gradient_color2?: string;
  swiss_direction?: 'CLOCKWISE' | 'COUNTER_CLOCKWISE';
  grid_shape?: 'SQUARE' | 'CIRCLE';
  grid_fill?: 'FILLED' | 'OUTLINE';
  grid_color?: string;
  bg_color?: string;
}

export interface CountdownItem {
  id: number;
  title: string;
  category: CountdownCategory;
  target_date: string;
  icon?: string;
  color?: string;
  display_mode?: 'CIRCULAR' | 'DOTS' | 'DIGITAL' | 'MINIMAL';
  cover_style?: 'DEFAULT' | 'FONTY' | 'SWISS' | 'GRID' | 'MINIMAL' | string;
  cover_config?: string | CountdownCoverConfig;
  notes?: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface FixedSchedule {
  id: number;
  title: string;
  description?: string | null;
  day_of_week: number; // 0=Mon..6=Sun
  start_time: string;  // HH:MM
  end_time: string;    // HH:MM
  repeat_rule: string;
  start_date?: string | null;
  end_date?: string | null;
  category: 'SCHOOL' | 'STUDY' | 'WORK' | 'EXERCISE' | 'SLEEP' | 'PERSONAL' | 'OTHER' | string;
  color: string;
  icon?: string;
  location?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleOccurrenceView {
  fixed_schedule_id: number;
  title: string;
  category: string;
  color: string;
  icon?: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: 'NORMAL' | 'SKIPPED' | 'MODIFIED';
  is_overridden: boolean;
}

export interface CalendarNote {
  id: number;
  note_date: string;
  content: string;
  created_at: string;
}

export interface DaySummaryStats {
  completed: number;
  partial: number;
  delayed: number;
  todo: number;
  total: number;
}

export interface CalendarDayView {
  date: string;
  day_name: string;
  day_of_week: number;
  is_today: boolean;
  stats: DaySummaryStats;
  free_time_hours: number;
  tasks: Task[];
  fixed_schedules: ScheduleOccurrenceView[];
  notes: CalendarNote[];
}

export interface CalendarWeeklyResponse {
  start_date: string;
  end_date: string;
  week_number: number;
  year: number;
  days: CalendarDayView[];
}

export interface CalendarMonthDayView {
  date: string;
  day_of_month: number;
  is_current_month: boolean;
  is_today: boolean;
  completed_count: number;
  incomplete_count: number;
  delayed_count: number;
  difficulty_points: number;
  heat_level: number; // 0 to 4
}

export interface CalendarMonthlyResponse {
  year: number;
  month: number;
  month_name: string;
  total_completed: number;
  total_incomplete: number;
  total_delayed: number;
  completion_rate: number;
  days: CalendarMonthDayView[];
}

export interface CourseNode {
  id: number;
  course_id: number;
  parent_id?: number;
  title: string;
  type: 'COURSE' | 'SECTION' | 'CHAPTER' | 'LESSON' | 'TOPIC' | 'RESOURCE';
  description?: string;
  notes?: string;
  video_url?: string;
  document_url?: string;
  duration?: number;
  estimated_study_time?: number;
  difficulty?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  progress: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  has_children?: boolean;
  children?: CourseNode[];
  course_title?: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  instructor?: string;
  color: string;
  countdown_id?: number | null;
  created_at: string;
  updated_at: string;
  total_nodes_count: number;
  completed_nodes_count: number;
  overall_progress: number;
  root_nodes?: CourseNode[];
  cover_style?: 'DEFAULT' | 'FONTY' | 'SWISS' | 'GRID' | 'MINIMAL' | string;
  cover_config?: string | CountdownCoverConfig;
  mastery_points?: number;
  mastery_level?: number;
  countdown_title?: string | null;
  countdown_target_date?: string | null;
  countdown_days_left?: number | null;
  countdown_icon?: string | null;
  remaining_duration_minutes?: number | null;
  remaining_lessons_count?: number | null;
  estimated_daily_study_minutes?: number | null;
  estimated_daily_lessons?: number | null;
}

export interface BurnoutDayDetail {
  day_key: string;
  day_name: string;
  day_number: number;
  sleep_minutes: number;
  sleep_hours: number;
  fixed_minutes: number;
  fixed_hours: number;
  routine_minutes: number;
  target_study_minutes: number;
  target_study_hours: number;
  awake_available_minutes: number;
  free_minutes: number;
  free_hours: number;
  workload_ratio: number;
  efficiency_score: number;
  status: 'OPTIMAL' | 'MODERATE' | 'BURNOUT_RISK';
  is_sleep_deprived: boolean;
  fixed_schedules_count: number;
  fixed_schedule_names: string[];
  recommended_study_minutes: number;
}

export interface BurnoutCustomConfig {
  max_daily_focus_hours: number;
  min_free_hours: number;
  sleep_target_hours: number;
  sleep_bedtime: string;
  sleep_wake_time: string;
  workload_threshold: number;
  energy_level: 'RECHARGED' | 'NORMAL' | 'FATIGUED' | 'EXHAUSTED';
  is_calibrated: boolean;
}

export interface BurnoutAnalysisOut {
  course_id: number;
  course_title: string;
  countdown_id?: number | null;
  countdown_title?: string | null;
  countdown_days_left?: number | null;
  total_remaining_minutes: number;
  total_remaining_lessons: number;
  average_daily_study_minutes: number;
  config: BurnoutCustomConfig;
  days: BurnoutDayDetail[];
  weekly_burnout_risk_level: 'OPTIMAL' | 'MODERATE' | 'BURNOUT_RISK';
  high_risk_days: string[];
  smart_recommendation: string;
  rebalance_summary: string;
}

export interface DashboardStats {
  tasks_completed: number;
  tasks_delayed: number;
  tasks_partial: number;
  tasks_incomplete: number;
  completion_rate_today: number;
  completion_rate_this_week: number;
  completion_rate_this_month: number;
  total_difficulty_points: number;
  current_streak: number;
  best_streak: number;
  streak_active_today: boolean;
  goals: {
    goal_id: number;
    title: string;
    category?: string;
    completed_tasks: number;
    total_tasks: number;
    completion_rate: number;
  }[];
  projects: {
    project_id: number;
    title: string;
    goal_title?: string;
    color: string;
    completed_tasks: number;
    total_tasks: number;
    completion_rate: number;
  }[];
}

export interface HeatmapDay {
  date: string;
  count: number;
  difficulty_points: number;
  level: number;
}

export interface BarChartItem {
  label: string;
  completed: number;
  delayed: number;
  partial: number;
  difficulty_points: number;
}

export interface DailyBreakdownItem {
  date: string;
  day_name_vi: string;
  completed_tasks: number;
  delayed_tasks: number;
  difficulty_points: number;
  screentime_hours: number;
  consistency_score: number;
  is_best_day: boolean;
  is_worst_day: boolean;
  status_tone: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'REST' | 'NORMAL';
}

export interface DelayedTaskAuditItem {
  id: number;
  title: string;
  due_date?: string | null;
  is_force_majeure: boolean;
  reason: string;
  status: string;
}

export interface CourseWeekProgressItem {
  course_id: number;
  course_title: string;
  color: string;
  completed_lessons: number;
  total_study_minutes: number;
}

export interface WeeklyReview {
  id?: number;
  year: number;
  week_number: number;
  start_date?: string;
  end_date?: string;
  is_finalized?: boolean;

  // Performance & Grade
  performance_grade?: string; // A+, A, B, C, D
  overall_score?: number; // 0 to 100
  executive_summary?: string;

  // Task metrics
  total_tasks?: number;
  completed_tasks?: number;
  delayed_tasks?: number;
  partial_tasks?: number;
  cancelled_tasks?: number;
  completion_rate?: number;
  difficulty_points?: number;
  streak?: number;
  best_day?: string;
  worst_day?: string;

  // Consistency & Force Majeure
  consistency_score?: number;
  stability_pct?: number;
  force_majeure_count?: number;
  unexcused_delay_count?: number;

  // Screentime & Digital Balance
  total_screentime_hours?: number;
  study_work_screentime_hours?: number;
  entertainment_screentime_hours?: number;
  screentime_violations_count?: number;

  // Cognitive Load & Wellbeing
  avg_daily_focus_hours?: number;
  burnout_risk_level?: string;

  // 7-day Breakdown
  daily_breakdown?: DailyBreakdownItem[];

  // Course Progress
  courses_progress?: CourseWeekProgressItem[];

  // Delayed Task Audit
  delayed_audits?: DelayedTaskAuditItem[];

  // Auto-draft reflections
  draft_what_went_well?: string;
  draft_what_needs_improvement?: string;
  draft_delayed_reflection?: string;
  draft_next_week_changes?: string;

  // User Reflections
  what_went_well?: string;
  what_needs_improvement?: string;
  delayed_tasks_reflection?: string;
  next_week_changes?: string;
  created_at?: string;
}

export interface ArchiveRecord {
  id: number;
  year: number;
  month: number;
  week_number: number;
  total_tasks: number;
  completed_tasks: number;
  delayed_tasks: number;
  partial_tasks: number;
  cancelled_tasks: number;
  completion_rate: number;
  difficulty_points: number;
  study_progress: number;
  streak: number;
  finalized_at: string;
  review?: WeeklyReview;
}

export interface ConflictItem {
  fixed_schedule_id: number;
  title: string;
  category: string;
  start_time: string;
  end_time: string;
  date: string;
}

export interface ConflictCheckResponse {
  has_conflict: boolean;
  conflicts: ConflictItem[];
}

export interface CategoryTypeConfig {
  id: string; // e.g. 'DISTRACTION', 'PRODUCTIVE', 'OTHER', or custom
  label: string;
  description?: string;
  color: string;
  effect: 'PENALTY' | 'BONUS' | 'NEUTRAL';
  is_custom?: boolean;
}

export const DEFAULT_CATEGORY_TYPES: CategoryTypeConfig[] = [
  {
    id: 'DISTRACTION',
    label: 'Xao nhãng',
    description: 'Ứng dụng giải trí, mạng xã hội - Trừ điểm nếu dùng quá định mức',
    color: '#f59e0b',
    effect: 'PENALTY',
    is_custom: false,
  },
  {
    id: 'PRODUCTIVE',
    label: 'Tập trung',
    description: 'Ứng dụng học tập, công việc - Khuyến khích & cộng điểm thưởng',
    color: '#10b981',
    effect: 'BONUS',
    is_custom: false,
  },
  {
    id: 'OTHER',
    label: 'Khác',
    description: 'Ứng dụng tiện ích, thông tin - Trung tính, không tính thưởng phạt',
    color: '#64748b',
    effect: 'NEUTRAL',
    is_custom: false,
  },
];

export interface ScreenTimeLimit {
  id: number;
  category: string;
  label?: string;
  category_type: string;
  daily_limit_minutes: number;
  is_active: boolean;
  description?: string;
}

export interface ScreenTimeLog {
  id: number;
  log_date: string;
  category: string;
  minutes_spent: number;
  app_name?: string;
  notes?: string;
  created_at: string;
}

export interface CategoryUsage {
  category: string;
  category_label: string;
  category_type: string;
  minutes_spent: number;
  daily_limit_minutes: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'VIOLATED';
  exceeded_minutes: number;
}

export interface DailyDisciplineSummary {
  date: string;
  rating: number; // 0.0 to 10.0 scale
  rating_tier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'ALERT';
  rating_label_vi: string;
  total_minutes: number;
  study_work_minutes: number;
  entertainment_social_minutes: number;
  violations_count: number;
  categories: CategoryUsage[];
  logs: ScreenTimeLog[];
}

export interface WeeklyDisciplineDay {
  date: string;
  day_name_vi: string;
  rating: number;
  study_work_minutes: number;
  entertainment_social_minutes: number;
  has_violation: boolean;
}

export interface ScreenTimeOverview {
  today: DailyDisciplineSummary;
  weekly_trend: WeeklyDisciplineDay[];
  average_rating_7d: number;
  limits: ScreenTimeLimit[];
}

export interface GoogleDriveStatus {
  connected: boolean;
  account_email?: string;
  folder_name?: string;
  auto_sync: boolean;
  last_sync?: string;
  client_ready: boolean;
}

export interface SyncHistoryItem {
  id: number;
  sync_type: string;
  status: string;
  details?: string;
  created_at: string;
}

export interface DisciplineRatingConfig {
  early_penalty_enabled: boolean;
  warning_threshold_pct: number;
  penalty_multiplier: number;
  early_penalty_rate: number;
}

export interface ConsistencyMetrics {
  mean: number;
  variance: number;
  std_dev: number;
  stability_pct: number;
  stability_adj: number;
  delay_penalty: number;
  total_tasks_considered: number;
  completed_count: number;
  total_delayed: number;
  force_majeure_count: number;
  unexcused_delay_count: number;
  window_days: number;
}

export interface ConsistencyInfo {
  score: number;
  tier: string;
  tier_label?: string;
  name?: string;
  label: string;
  violations: number;
  metrics?: ConsistencyMetrics | null;
}

export interface HeaderUpcomingItem {
  type: 'SCHEDULE' | 'TASK' | string;
  type_code?: 'SCHEDULE' | 'TASK' | 'COURSE_TASK' | string;
  type_label?: string;
  id: number;
  title: string;
  time_str: string;
  start_time: string;
  end_time?: string | null;
  status: 'IN_PROGRESS' | 'UPCOMING' | 'OVERDUE';
  status_label: string;
  minutes_left: number;
  category?: string;
  category_label?: string;
  priority?: string;
  difficulty?: number;
  badge_color?: string;
  icon?: string;
}

export interface HeaderSummary {
  current_streak: number;
  best_streak: number;
  streak_active_today: boolean;
  discipline: ConsistencyInfo;
  consistency?: ConsistencyInfo;
  upcoming: HeaderUpcomingItem | null;
  tension?: TensionSummary | null;
  telegram?: {
    is_connected: boolean;
    is_enabled: boolean;
    has_token: boolean;
  } | null;
  db_last_saved?: string | null;
}

export interface TensionSummary {
  tension_level: 'LOW' | 'BALANCED' | 'STRAIN' | 'EXTREME';
  tension_label: string;
  tension_score: number;
  weekly_risk_level: 'OPTIMAL' | 'MODERATE' | 'BURNOUT_RISK';
  color_code: string;
  icon: string;
}

export interface CourseLoadContribution {
  course_id: number;
  course_title: string;
  color: string;
  instructor?: string | null;
  countdown_id?: number | null;
  countdown_title?: string | null;
  countdown_days_left?: number | null;
  countdown_icon?: string | null;
  total_remaining_minutes: number;
  total_remaining_lessons: number;
  daily_study_minutes_needed: number;
  percentage_of_total_study: number;
  cognitive_weight: 'CAO' | 'TRUNG BÌNH' | 'NHẸ' | string;
}

export interface StudyStreamItem {
  course_id: number;
  course_title: string;
  color: string;
  duration_minutes: number;
  focus_type: 'DEEP_WORK' | 'LIGHT_REVIEW' | 'PRACTICE';
  recommended_window: string;
}

export interface WellbeingDayDetail {
  day_key: string;
  day_name: string;
  day_number: number;
  sleep_minutes: number;
  sleep_hours: number;
  fixed_minutes: number;
  fixed_hours: number;
  fixed_schedule_names: string[];
  routine_minutes: number;
  total_study_minutes: number;
  total_study_hours: number;
  awake_available_minutes: number;
  free_minutes: number;
  free_hours: number;
  workload_ratio: number;
  efficiency_score: number;
  status: 'OPTIMAL' | 'MODERATE' | 'BURNOUT_RISK';
  is_sleep_deprived: boolean;
  streams: StudyStreamItem[];
}

export interface WellbeingCustomConfig {
  max_daily_focus_hours: number;
  min_free_hours: number;
  sleep_target_hours: number;
  sleep_bedtime: string;
  sleep_wake_time: string;
  workload_threshold: number;
  energy_level: 'RECHARGED' | 'NORMAL' | 'FATIGUED' | 'EXHAUSTED';
  stream_strategy: 'BALANCED_BLOCKS' | 'ADAPTIVE' | 'EVEN_SPREAD' | string;
  is_calibrated: boolean;
}

export interface GlobalWellbeingAnalysis {
  total_courses_count: number;
  active_courses_count: number;
  total_remaining_study_minutes: number;
  total_remaining_study_hours: number;
  total_remaining_lessons: number;
  combined_daily_study_minutes: number;
  combined_daily_study_hours: number;
  courses_contribution: CourseLoadContribution[];
  days: WellbeingDayDetail[];
  config: WellbeingCustomConfig;
  tension: TensionSummary;
  weekly_burnout_risk_level: 'OPTIMAL' | 'MODERATE' | 'BURNOUT_RISK';
  high_risk_days: string[];
  smart_recommendation: string;
  rebalance_summary: string;
}
