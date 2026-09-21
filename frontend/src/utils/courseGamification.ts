/**
 * Course Gamification & EXP Mastery System
 * 10 Rank Tiers with exponential difficulty curve
 * Default: OFF (can be toggled in Settings)
 */

export interface CourseRankTier {
  level: number;
  title: string;
  min_xp: number;
  max_xp: number; // For progress calculation; infinity or high number for max tier
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  description: string;
}

export const COURSE_RANK_TIERS: CourseRankTier[] = [
  {
    level: 1,
    title: 'Tập Sự',
    min_xp: 0,
    max_xp: 250,
    icon: '🛡️',
    color: '#64748b',
    bgColor: 'bg-slate-100 dark:bg-slate-800/80',
    borderColor: 'border-slate-300 dark:border-slate-700',
    badgeClass: 'text-slate-600 dark:text-slate-300',
    description: 'Khởi đầu hành trình học tập và làm quen với bộ môn',
  },
  {
    level: 2,
    title: 'Đồng Khắc Kỷ',
    min_xp: 251,
    max_xp: 750,
    icon: '🥉',
    color: '#b45309',
    bgColor: 'bg-amber-100/70 dark:bg-amber-950/50',
    borderColor: 'border-amber-300 dark:border-amber-800',
    badgeClass: 'text-amber-800 dark:text-amber-300',
    description: 'Bắt đầu rèn giũa thói quen đều đặn mỗi ngày',
  },
  {
    level: 3,
    title: 'Bạc Rèn Luyện',
    min_xp: 751,
    max_xp: 1800,
    icon: '🥈',
    color: '#94a3b8',
    bgColor: 'bg-slate-200/80 dark:bg-slate-700/60',
    borderColor: 'border-slate-400 dark:border-slate-600',
    badgeClass: 'text-slate-800 dark:text-slate-200',
    description: 'Nắm vững các khái niệm cơ bản và thao tác chuẩn xác',
  },
  {
    level: 4,
    title: 'Vàng Kiên Trì',
    min_xp: 1801,
    max_xp: 3500,
    icon: '🥇',
    color: '#eab308',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950/60',
    borderColor: 'border-yellow-400 dark:border-yellow-700',
    badgeClass: 'text-yellow-700 dark:text-yellow-300',
    description: 'Sự kiên định vượt trội, chủ động giải quyết bài tập hóc búa',
  },
  {
    level: 5,
    title: 'Bạch Kim Tập Trung',
    min_xp: 3501,
    max_xp: 6000,
    icon: '💠',
    color: '#06b6d4',
    bgColor: 'bg-cyan-100 dark:bg-cyan-950/60',
    borderColor: 'border-cyan-400 dark:border-cyan-700',
    badgeClass: 'text-cyan-700 dark:text-cyan-300',
    description: 'Trạng thái tập trung sâu (Deep Work), hiểu sâu bản chất kiến thức',
  },
  {
    level: 6,
    title: 'Kim Cương Chuyên Sâu',
    min_xp: 6001,
    max_xp: 10000,
    icon: '💎',
    color: '#3b82f6',
    bgColor: 'bg-blue-100 dark:bg-blue-950/60',
    borderColor: 'border-blue-400 dark:border-blue-700',
    badgeClass: 'text-blue-700 dark:text-blue-300',
    description: 'Làm chủ chuyên đề, xử lý mượt mà bài tập nâng cao phân hóa',
  },
  {
    level: 7,
    title: 'Tinh Anh Đỉnh Cao',
    min_xp: 10001,
    max_xp: 16000,
    icon: '⚡',
    color: '#8b5cf6',
    bgColor: 'bg-purple-100 dark:bg-purple-950/60',
    borderColor: 'border-purple-400 dark:border-purple-700',
    badgeClass: 'text-purple-700 dark:text-purple-300',
    description: 'Nằm trong top người học vượt trội với tốc độ thẩm thấu cực nhanh',
  },
  {
    level: 8,
    title: 'Đại Tông Sư',
    min_xp: 16001,
    max_xp: 25000,
    icon: '👑',
    color: '#ec4899',
    bgColor: 'bg-pink-100 dark:bg-pink-950/60',
    borderColor: 'border-pink-400 dark:border-pink-700',
    badgeClass: 'text-pink-700 dark:text-pink-300',
    description: 'Đạt cảnh giới thông tuệ toàn bộ cây kiến thức của khóa học',
  },
  {
    level: 9,
    title: 'Chiến Thần Học Thuật',
    min_xp: 25001,
    max_xp: 40000,
    icon: '⚔️',
    color: '#f97316',
    bgColor: 'bg-gradient-to-r from-amber-100 to-rose-100 dark:from-amber-950/70 dark:to-rose-950/70',
    borderColor: 'border-orange-500 dark:border-orange-600',
    badgeClass: 'text-orange-700 dark:text-orange-300 font-extrabold',
    description: 'Cày cuốc phi thường, không ngại thử thách cam go nào',
  },
  {
    level: 10,
    title: 'Tuyệt Đối Thần Vương',
    min_xp: 40001,
    max_xp: 40001,
    icon: '🌌',
    color: '#a855f7',
    bgColor: 'bg-gradient-to-r from-purple-100 via-indigo-100 to-rose-100 dark:from-purple-950/80 dark:via-indigo-950/80 dark:to-rose-950/80',
    borderColor: 'border-purple-500 dark:border-purple-400',
    badgeClass: 'text-purple-800 dark:text-purple-200 font-black',
    description: 'Cảnh giới tuyệt đối tối cao không giới hạn của học vấn',
  },
];

export interface CourseMasteryCalculation {
  currentTier: CourseRankTier;
  nextTier: CourseRankTier | null;
  points: number;
  progressPercent: number;
  xpInCurrentTier: number;
  xpNeededForNext: number;
  isMaxRank: boolean;
}

export function getCourseMasteryInfo(points: number = 0): CourseMasteryCalculation {
  const safePoints = Math.max(0, points);

  // Find tier matching points
  let currentTier = COURSE_RANK_TIERS[0];
  for (const tier of COURSE_RANK_TIERS) {
    if (safePoints >= tier.min_xp) {
      currentTier = tier;
    }
  }

  const isMaxRank = currentTier.level === 10;
  const nextTier = isMaxRank ? null : (COURSE_RANK_TIERS.find((t) => t.level === currentTier.level + 1) || null);

  let progressPercent = 100;
  let xpInCurrentTier = 0;
  let xpNeededForNext = 0;

  if (nextTier) {
    const tierSpan = nextTier.min_xp - currentTier.min_xp;
    xpInCurrentTier = safePoints - currentTier.min_xp;
    xpNeededForNext = nextTier.min_xp - safePoints;
    progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentTier / Math.max(1, tierSpan)) * 100)));
  } else {
    xpInCurrentTier = safePoints - currentTier.min_xp;
    progressPercent = 100;
  }

  return {
    currentTier,
    nextTier,
    points: safePoints,
    progressPercent,
    xpInCurrentTier,
    xpNeededForNext,
    isMaxRank,
  };
}

const STORAGE_KEY = 'lifeos_course_gamification_enabled';

/**
 * Check whether gamification is enabled.
 * Default: FALSE (TẮT)
 */
export function isCourseGamificationEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Set gamification enabled/disabled and emit an update event
 */
export function setCourseGamificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('lifeos_gamification_updated', { detail: { enabled } }));
  } catch (err) {
    console.error('Failed to save course gamification setting:', err);
  }
}
