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
  // Enhanced visual styling & auras
  gradientBg: string;
  glowShadow: string;
  cardBorder: string;
  textColor: string;
  tagline: string;
}

export const COURSE_RANK_TIERS: CourseRankTier[] = [
  {
    level: 1,
    title: 'Tập Sự',
    min_xp: 0,
    max_xp: 250,
    icon: '🛡️',
    color: '#64748b',
    bgColor: 'bg-slate-100/90 dark:bg-slate-800/90',
    borderColor: 'border-slate-300 dark:border-slate-700',
    badgeClass: 'bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
    description: 'Khởi đầu hành trình học tập và làm quen với bộ môn',
    gradientBg: 'linear-gradient(135deg, #475569, #1e293b)',
    glowShadow: '0 0 10px rgba(100, 116, 139, 0.2)',
    cardBorder: 'border-slate-300 dark:border-slate-700',
    textColor: 'text-slate-700 dark:text-slate-200',
    tagline: 'Khởi Nguyên Tinh Thần',
  },
  {
    level: 2,
    title: 'Đồng Khắc Kỷ',
    min_xp: 251,
    max_xp: 750,
    icon: '🥉',
    color: '#b45309',
    bgColor: 'bg-gradient-to-br from-amber-100/80 via-orange-50 to-amber-100/60 dark:from-amber-950/70 dark:via-orange-950/50 dark:to-amber-950/50',
    borderColor: 'border-amber-400 dark:border-amber-700',
    badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold',
    description: 'Bắt đầu rèn giũa thói quen đều đặn mỗi ngày',
    gradientBg: 'linear-gradient(135deg, #b45309, #78350f)',
    glowShadow: '0 0 14px rgba(180, 83, 9, 0.35)',
    cardBorder: 'border-amber-400 dark:border-amber-700',
    textColor: 'text-amber-800 dark:text-amber-300',
    tagline: 'Lửa Thử Vàng, Rèn Giũa Thép',
  },
  {
    level: 3,
    title: 'Bạc Rèn Luyện',
    min_xp: 751,
    max_xp: 1800,
    icon: '🥈',
    color: '#94a3b8',
    bgColor: 'bg-gradient-to-br from-slate-200/90 via-zinc-100 to-slate-200/70 dark:from-slate-800/90 dark:via-zinc-800/80 dark:to-slate-800/70',
    borderColor: 'border-slate-400 dark:border-slate-500',
    badgeClass: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-400 dark:border-slate-500 font-bold',
    description: 'Nắm vững các khái niệm cơ bản và thao tác chuẩn xác',
    gradientBg: 'linear-gradient(135deg, #94a3b8, #475569)',
    glowShadow: '0 0 16px rgba(148, 163, 184, 0.4)',
    cardBorder: 'border-slate-400 dark:border-slate-500',
    textColor: 'text-slate-800 dark:text-slate-100',
    tagline: 'Bạc Sterling Sáng Rõ',
  },
  {
    level: 4,
    title: 'Vàng Kiên Trì',
    min_xp: 1801,
    max_xp: 3500,
    icon: '🥇',
    color: '#eab308',
    bgColor: 'bg-gradient-to-br from-yellow-100 via-amber-50 to-amber-100 dark:from-yellow-950/60 dark:via-amber-950/50 dark:to-yellow-950/40',
    borderColor: 'border-amber-400 dark:border-yellow-500',
    badgeClass: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black border border-amber-300 shadow-xs',
    description: 'Sự kiên định vượt trội, chủ động giải quyết bài tập hóc búa',
    gradientBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    glowShadow: '0 0 20px rgba(245, 158, 11, 0.45)',
    cardBorder: 'border-amber-400 dark:border-amber-500',
    textColor: 'text-amber-800 dark:text-amber-300',
    tagline: 'Hoàng Kim Kiên Định',
  },
  {
    level: 5,
    title: 'Bạch Kim Tập Trung',
    min_xp: 3501,
    max_xp: 6000,
    icon: '💠',
    color: '#06b6d4',
    bgColor: 'bg-gradient-to-br from-cyan-100 via-teal-50 to-cyan-100 dark:from-cyan-950/70 dark:via-teal-950/50 dark:to-cyan-950/60',
    borderColor: 'border-cyan-400 dark:border-cyan-600',
    badgeClass: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-black border border-cyan-300 shadow-xs',
    description: 'Trạng thái tập trung sâu (Deep Work), hiểu sâu bản chất kiến thức',
    gradientBg: 'linear-gradient(135deg, #06b6d4, #0d9488)',
    glowShadow: '0 0 22px rgba(6, 182, 212, 0.5)',
    cardBorder: 'border-cyan-400 dark:border-cyan-500',
    textColor: 'text-cyan-700 dark:text-cyan-300 font-bold',
    tagline: 'Bạch Kim Lam Ngọc - Deep Work',
  },
  {
    level: 6,
    title: 'Kim Cương Chuyên Sâu',
    min_xp: 6001,
    max_xp: 10000,
    icon: '💎',
    color: '#3b82f6',
    bgColor: 'bg-gradient-to-br from-blue-100 via-indigo-50 to-blue-100 dark:from-blue-950/70 dark:via-indigo-950/50 dark:to-blue-950/60',
    borderColor: 'border-blue-400 dark:border-blue-500',
    badgeClass: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black border border-blue-300 shadow-xs',
    description: 'Làm chủ chuyên đề, xử lý mượt mà bài tập nâng cao phân hóa',
    gradientBg: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
    glowShadow: '0 0 24px rgba(59, 130, 246, 0.55)',
    cardBorder: 'border-blue-400 dark:border-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300 font-bold',
    tagline: 'Lam Bảo Ngọc Bất Diệt',
  },
  {
    level: 7,
    title: 'Tinh Anh Đỉnh Cao',
    min_xp: 10001,
    max_xp: 16000,
    icon: '⚡',
    color: '#8b5cf6',
    bgColor: 'bg-gradient-to-br from-purple-100 via-fuchsia-50 to-indigo-100 dark:from-purple-950/70 dark:via-fuchsia-950/50 dark:to-indigo-950/60',
    borderColor: 'border-purple-400 dark:border-purple-500',
    badgeClass: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black border border-purple-300 shadow-sm ring-1 ring-purple-400/50',
    description: 'Nằm trong top người học vượt trội với tốc độ thẩm thấu cực nhanh',
    gradientBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    glowShadow: '0 0 28px rgba(139, 92, 246, 0.6)',
    cardBorder: 'border-purple-400 dark:border-purple-500',
    textColor: 'text-purple-700 dark:text-purple-300 font-extrabold',
    tagline: 'Tử Tinh Lôi Điện Ma Thuật',
  },
  {
    level: 8,
    title: 'Đại Tông Sư',
    min_xp: 16001,
    max_xp: 25000,
    icon: '👑',
    color: '#ec4899',
    bgColor: 'bg-gradient-to-br from-pink-100 via-rose-50 to-pink-100 dark:from-pink-950/70 dark:via-rose-950/50 dark:to-pink-950/60',
    borderColor: 'border-pink-400 dark:border-rose-500',
    badgeClass: 'bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 text-white font-black border border-rose-300 shadow-sm ring-1 ring-rose-400/50',
    description: 'Đạt cảnh giới thông tuệ toàn bộ cây kiến thức của khóa học',
    gradientBg: 'linear-gradient(135deg, #ec4899, #be123c)',
    glowShadow: '0 0 30px rgba(236, 72, 153, 0.65)',
    cardBorder: 'border-pink-400 dark:border-rose-500',
    textColor: 'text-pink-700 dark:text-pink-300 font-black',
    tagline: 'Xích Huyết Hoàng Kim Ruby',
  },
  {
    level: 9,
    title: 'Chiến Thần Học Thuật',
    min_xp: 25001,
    max_xp: 40000,
    icon: '⚔️',
    color: '#f97316',
    bgColor: 'bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 dark:from-amber-950/80 dark:via-orange-950/70 dark:to-rose-950/80',
    borderColor: 'border-orange-500 dark:border-orange-400',
    badgeClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white font-black border border-amber-300 shadow-md ring-2 ring-orange-400/60',
    description: 'Cày cuốc phi thường, không ngại thử thách cam go nào',
    gradientBg: 'linear-gradient(135deg, #f97316, #dc2626)',
    glowShadow: '0 0 34px rgba(249, 115, 22, 0.7)',
    cardBorder: 'border-orange-500 dark:border-orange-400',
    textColor: 'text-orange-600 dark:text-orange-400 font-black',
    tagline: 'Thái Dương Viêm Đế Thần Tướng',
  },
  {
    level: 10,
    title: 'Tuyệt Đối Thần Vương',
    min_xp: 40001,
    max_xp: 60000,
    icon: '🌌',
    color: '#a855f7',
    bgColor: 'bg-gradient-to-br from-purple-100 via-indigo-100 to-cyan-100 dark:from-purple-950/90 dark:via-indigo-950/90 dark:to-cyan-950/80',
    borderColor: 'border-purple-500 dark:border-purple-400',
    badgeClass: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-black border border-purple-300 shadow-lg ring-2 ring-purple-400/80 animate-pulse',
    description: 'Cảnh giới tuyệt đối tối cao không giới hạn của học vấn',
    gradientBg: 'linear-gradient(135deg, #9333ea, #4f46e5, #06b6d4)',
    glowShadow: '0 0 40px rgba(168, 85, 247, 0.8)',
    cardBorder: 'border-purple-500 dark:border-purple-400',
    textColor: 'text-purple-700 dark:text-purple-300 font-black',
    tagline: 'Cực Quang Hư Không Vũ Trụ',
  },
  {
    level: 11,
    title: 'Vô Thượng Thần Thoại',
    min_xp: 60001,
    max_xp: 60001,
    icon: '👑',
    color: '#f59e0b',
    bgColor: 'bg-gradient-to-br from-amber-100 via-rose-100 to-purple-100 dark:from-amber-950/95 dark:via-rose-950/90 dark:to-purple-950/95',
    borderColor: 'border-amber-400 dark:border-amber-300',
    badgeClass: 'bg-gradient-to-r from-amber-400 via-rose-500 via-purple-600 to-cyan-400 text-white font-black border border-amber-300 shadow-xl ring-2 ring-amber-300 animate-pulse',
    description: 'Cảnh giới Thần Thoại Vô Cực - 5 Tầng Thần Cảnh tiến hóa hào quang động theo điểm tích lũy',
    gradientBg: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6, #06b6d4)',
    glowShadow: '0 0 50px rgba(245, 158, 11, 0.85)',
    cardBorder: 'border-amber-400 dark:border-amber-300',
    textColor: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 font-black',
    tagline: 'Thần Cảnh Vô Song - Vĩnh Hằng Bất Diệt',
  },
];

export interface MythicPrestigeStage {
  stage: number;
  romanNumeral: string;
  stageTitle: string;
  subtitle: string;
  starsCount: number;
  starsDisplay: string;
  auraName: string;
  auraColor: string;
  boxShadow: string;
  particleCount: number;
  pulseSpeedSec: number;
  surplusXP: number;
  nextStageXP: number | null;
  stageProgressPercent: number;
  isMaxPrestige: boolean;
}

export function getMythicPrestigeStage(points: number = 0): MythicPrestigeStage {
  const surplusXP = Math.max(0, points - 60000);

  if (surplusXP < 5000) {
    // Stage 1: 60,001 - 65,000
    const progress = Math.min(100, Math.round((surplusXP / 5000) * 100));
    return {
      stage: 1,
      romanNumeral: 'I',
      stageTitle: 'Tầng I: Khởi Thần',
      subtitle: 'Thức Tỉnh Thần Cách',
      starsCount: 1,
      starsDisplay: '⭐',
      auraName: 'Hào Quang Thần Tím (Cosmic Pulse)',
      auraColor: '#a855f7',
      boxShadow: '0 0 16px rgba(168, 85, 247, 0.45), inset 0 0 12px rgba(168, 85, 247, 0.2)',
      particleCount: 3,
      pulseSpeedSec: 3.0,
      surplusXP,
      nextStageXP: 65000,
      stageProgressPercent: progress,
      isMaxPrestige: false,
    };
  } else if (surplusXP < 15000) {
    // Stage 2: 65,001 - 75,000
    const progress = Math.min(100, Math.round(((surplusXP - 5000) / 10000) * 100));
    return {
      stage: 2,
      romanNumeral: 'II',
      stageTitle: 'Tầng II: Vạn Tượng',
      subtitle: 'Chuyển Vận Tinh Cầu',
      starsCount: 2,
      starsDisplay: '⭐⭐',
      auraName: 'Dải Cực Quang Huyền Bí (Celestial Aurora)',
      auraColor: '#06b6d4',
      boxShadow: '0 0 24px rgba(6, 182, 212, 0.5), 0 0 12px rgba(168, 85, 247, 0.4), inset 0 0 16px rgba(6, 182, 212, 0.25)',
      particleCount: 5,
      pulseSpeedSec: 2.3,
      surplusXP,
      nextStageXP: 75000,
      stageProgressPercent: progress,
      isMaxPrestige: false,
    };
  } else if (surplusXP < 30000) {
    // Stage 3: 75,001 - 90,000
    const progress = Math.min(100, Math.round(((surplusXP - 15000) / 15000) * 100));
    return {
      stage: 3,
      romanNumeral: 'III',
      stageTitle: 'Tầng III: Hỗn Độn',
      subtitle: 'Bão Siêu Tân Tinh',
      starsCount: 3,
      starsDisplay: '⭐⭐⭐',
      auraName: 'Bão Siêu Tân Tinh (Supernova Flare)',
      auraColor: '#f43f5e',
      boxShadow: '0 0 32px rgba(244, 63, 94, 0.6), 0 0 16px rgba(245, 158, 11, 0.5), inset 0 0 20px rgba(244, 63, 94, 0.3)',
      particleCount: 7,
      pulseSpeedSec: 1.8,
      surplusXP,
      nextStageXP: 90000,
      stageProgressPercent: progress,
      isMaxPrestige: false,
    };
  } else if (surplusXP < 50000) {
    // Stage 4: 90,001 - 110,000
    const progress = Math.min(100, Math.round(((surplusXP - 30000) / 20000) * 100));
    return {
      stage: 4,
      romanNumeral: 'IV',
      stageTitle: 'Tầng IV: Thái Cực',
      subtitle: 'Làm Chủ Quy Tắc Tối Thượng',
      starsCount: 4,
      starsDisplay: '⭐⭐⭐⭐',
      auraName: 'Sóng Xung Kích Thần Thánh (Hyper-Corona)',
      auraColor: '#eab308',
      boxShadow: '0 0 42px rgba(234, 179, 8, 0.7), 0 0 20px rgba(236, 72, 153, 0.6), inset 0 0 24px rgba(234, 179, 8, 0.35)',
      particleCount: 9,
      pulseSpeedSec: 1.3,
      surplusXP,
      nextStageXP: 110000,
      stageProgressPercent: progress,
      isMaxPrestige: false,
    };
  } else {
    // Stage 5+: 110,001+
    return {
      stage: 5,
      romanNumeral: 'V',
      stageTitle: 'Tầng V: Bất Diệt Vĩnh Hằng',
      subtitle: 'Đấng Sáng Tạo Thần Giới',
      starsCount: 5,
      starsDisplay: '⭐⭐⭐⭐⭐ 👑',
      auraName: 'Trường Lực Thần Giới Tối Cao (Omnipotent Godfield)',
      auraColor: '#f59e0b',
      boxShadow: '0 0 56px rgba(245, 158, 11, 0.85), 0 0 32px rgba(168, 85, 247, 0.75), 0 0 16px rgba(6, 182, 212, 0.6), inset 0 0 30px rgba(245, 158, 11, 0.45)',
      particleCount: 14,
      pulseSpeedSec: 0.9,
      surplusXP,
      nextStageXP: null,
      stageProgressPercent: 100,
      isMaxPrestige: true,
    };
  }
}

export interface CourseMasteryCalculation {
  currentTier: CourseRankTier;
  nextTier: CourseRankTier | null;
  points: number;
  progressPercent: number;
  xpInCurrentTier: number;
  xpNeededForNext: number;
  isMaxRank: boolean;
  mythicStage?: MythicPrestigeStage;
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

  const isMaxRank = currentTier.level === 11;
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

  const mythicStage = isMaxRank ? getMythicPrestigeStage(safePoints) : undefined;

  return {
    currentTier,
    nextTier,
    points: safePoints,
    progressPercent,
    xpInCurrentTier,
    xpNeededForNext,
    isMaxRank,
    mythicStage,
  };
}

/**
 * Calculate user's overall top mastery from course list
 */
export function getTopCourseMastery(courses: Array<{ id: number; title: string; mastery_points?: number; mastery_level?: number }>) {
  if (!courses || courses.length === 0) {
    return {
      topCourse: null,
      topPoints: 0,
      masteryInfo: getCourseMasteryInfo(0),
      totalXP: 0,
    };
  }

  let topCourse = courses[0];
  let maxPoints = topCourse.mastery_points || 0;
  let totalXP = 0;

  for (const c of courses) {
    const pts = c.mastery_points || 0;
    totalXP += pts;
    if (pts > maxPoints) {
      maxPoints = pts;
      topCourse = c;
    }
  }

  return {
    topCourse,
    topPoints: maxPoints,
    masteryInfo: getCourseMasteryInfo(maxPoints),
    totalXP,
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
