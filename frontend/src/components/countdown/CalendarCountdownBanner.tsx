import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon, Clock, ChevronDown, ChevronUp,
  Plus, Edit2, ChevronLeft, ChevronRight, Pin, Sparkles, AlertCircle,
  Circle, LayoutGrid, CheckCircle2, RotateCcw
} from 'lucide-react';
import { CountdownItem } from '../../types';
import { Button } from '../ui/button';
import { isLightColor, getReadableColorOnLight } from '../../utils/colorUtils';

interface CalendarCountdownBannerProps {
  countdowns: CountdownItem[];
  onOpenCreate: () => void;
  onOpenEdit: (item: CountdownItem) => void;
  onUpdateItem?: (id: number, data: Partial<CountdownItem>) => Promise<void>;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

interface ProgressStats {
  remainingPct: number;      // 0 to 100
  elapsedPct: number;        // 0 to 100
  totalDays: number;
  remainingDays: number;
  formattedRemaining: string; // e.g. "99.8%"
  formattedElapsed: string;   // e.g. "0.2%"
}

const pad = (n: number) => String(n).padStart(2, '0');

function calculateTimeRemaining(targetIso: string): TimeRemaining {
  const targetDate = new Date(targetIso);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    const absMs = Math.abs(diffMs);
    const totalSecs = Math.floor(absMs / 1000);
    return {
      days: Math.floor(totalSecs / 86400),
      hours: Math.floor((totalSecs % 86400) / 3600),
      minutes: Math.floor((totalSecs % 3600) / 60),
      seconds: totalSecs % 60,
      isPast: true,
      totalSeconds: -totalSecs,
    };
  }

  const totalSecs = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSecs / 86400),
    hours: Math.floor((totalSecs % 86400) / 3600),
    minutes: Math.floor((totalSecs % 3600) / 60),
    seconds: totalSecs % 60,
    isPast: false,
    totalSeconds: totalSecs,
  };
}

function calculateProgressStats(targetDateIso: string, createdAtIso?: string, now: Date = new Date()): ProgressStats {
  const targetMs = new Date(targetDateIso).getTime();
  const nowMs = now.getTime();

  if (targetMs <= nowMs) {
    return {
      remainingPct: 0,
      elapsedPct: 100,
      totalDays: 0,
      remainingDays: 0,
      formattedRemaining: '0%',
      formattedElapsed: '100%',
    };
  }

  let createdMs = createdAtIso ? new Date(createdAtIso).getTime() : 0;
  if (!createdMs || isNaN(createdMs) || createdMs >= targetMs) {
    // Default fallback: 30 days or the difference if target is sooner
    createdMs = targetMs - (30 * 86400 * 1000);
  }

  if (createdMs > nowMs) {
    createdMs = nowMs;
  }

  const totalDurationMs = Math.max(targetMs - createdMs, 60 * 1000);
  const remainingMs = Math.max(0, targetMs - nowMs);
  const rawRemainingPct = (remainingMs / totalDurationMs) * 100;
  const remainingPct = Math.min(100, Math.max(0, rawRemainingPct));
  const elapsedPct = Math.min(100, Math.max(0, 100 - remainingPct));

  let formattedRemaining: string;
  if (remainingPct >= 99.9 && remainingPct < 100) {
    formattedRemaining = '99.9%';
  } else if (remainingPct > 0 && remainingPct <= 0.1) {
    formattedRemaining = '0.1%';
  } else {
    formattedRemaining = `${remainingPct.toFixed(1)}%`;
  }

  let formattedElapsed: string;
  if (elapsedPct >= 99.9 && elapsedPct < 100) {
    formattedElapsed = '99.9%';
  } else if (elapsedPct > 0 && elapsedPct <= 0.1) {
    formattedElapsed = '0.1%';
  } else {
    formattedElapsed = `${elapsedPct.toFixed(1)}%`;
  }

  const totalDays = Math.max(1, Math.ceil(totalDurationMs / (86400 * 1000)));
  const remainingDays = Math.floor(remainingMs / (86400 * 1000));

  return {
    remainingPct,
    elapsedPct,
    totalDays,
    remainingDays,
    formattedRemaining,
    formattedElapsed,
  };
}

export const CalendarCountdownBanner: React.FC<CalendarCountdownBannerProps> = ({
  countdowns,
  onOpenCreate,
  onOpenEdit,
  onUpdateItem,
}) => {
  // Collapse state saved to localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('routify_calendar_countdown_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  // Circular view mode: 'REMAINING' (đo % còn lại) or 'ELAPSED' (đo % đã qua)
  const [circleGaugeType, setCircleGaugeType] = useState<'REMAINING' | 'ELAPSED'>('REMAINING');

  // Real-time ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('routify_calendar_countdown_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Safe index bounds
  const validIndex = useMemo(() => {
    if (countdowns.length === 0) return 0;
    return Math.min(currentIndex, countdowns.length - 1);
  }, [currentIndex, countdowns.length]);

  const activeItem = countdowns[validIndex] || null;

  // Active display mode with fallback
  const [bannerDisplayMode, setBannerDisplayMode] = useState<'CIRCULAR' | 'DOTS' | 'DIGITAL' | 'MINIMAL'>('CIRCULAR');

  useEffect(() => {
    if (activeItem?.display_mode) {
      setBannerDisplayMode(activeItem.display_mode);
    }
  }, [activeItem?.id, activeItem?.display_mode]);

  const handleModeChange = async (newMode: 'CIRCULAR' | 'DOTS' | 'DIGITAL' | 'MINIMAL') => {
    setBannerDisplayMode(newMode);
    if (activeItem && onUpdateItem) {
      try {
        await onUpdateItem(activeItem.id, { display_mode: newMode });
      } catch (err) {
        console.error('Failed to save display mode:', err);
      }
    }
  };

  const timeRemaining = useMemo(() => {
    if (!activeItem) return null;
    return calculateTimeRemaining(activeItem.target_date);
  }, [activeItem, now]);

  const progressStats = useMemo(() => {
    if (!activeItem) return null;
    return calculateProgressStats(activeItem.target_date, activeItem.created_at, now);
  }, [activeItem, now]);

  const coverConfig: any = useMemo(() => {
    if (!activeItem?.cover_config) return {};
    if (typeof activeItem.cover_config === 'string') {
      try {
        return JSON.parse(activeItem.cover_config);
      } catch {
        return {};
      }
    }
    return activeItem.cover_config;
  }, [activeItem?.cover_config]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : countdowns.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < countdowns.length - 1 ? prev + 1 : 0));
  };

  if (countdowns.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span className="text-base">🎓</span>
          <span className="font-medium">Bạn chưa đặt đếm ngược ngày thi hoặc mục tiêu nào.</span>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs transition hover:opacity-90"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm đếm ngược</span>
        </button>
      </div>
    );
  }

  if (!activeItem || !timeRemaining || !progressStats) {
    return null;
  }

  // Format date display
  const targetDateObj = new Date(activeItem.target_date);
  const targetFormatted = `${pad(targetDateObj.getDate())}/${pad(targetDateObj.getMonth() + 1)}/${targetDateObj.getFullYear()} lúc ${pad(targetDateObj.getHours())}:${pad(targetDateObj.getMinutes())}`;

  // Theme color for this item
  const itemColor = activeItem.color && activeItem.color.startsWith('#') ? activeItem.color : '#000000';
  const isCustomColor = itemColor.toLowerCase() !== '#000000' && itemColor.toLowerCase() !== '#171717';

  // SVG circle calculation
  const circleRadius = 64;
  const circleCircumference = 2 * Math.PI * circleRadius; // ~402.12

  // Gauge percentage: default is REMAINING (shows remaining time on circle)
  const activeGaugePct = circleGaugeType === 'REMAINING'
    ? progressStats.remainingPct
    : progressStats.elapsedPct;

  const strokeDashoffset = circleCircumference - (activeGaugePct / 100) * circleCircumference;

  const coverStyle = activeItem?.cover_style || 'DEFAULT';
  const textAlign = coverConfig.align || 'left';
  const isFonty = coverStyle === 'FONTY';
  const fontyGradient = isFonty
    ? `linear-gradient(135deg, ${coverConfig.gradient_color1 || '#4f46e5'}, ${coverConfig.gradient_color2 || '#ec4899'})`
    : undefined;
  const isSwiss = coverStyle === 'SWISS';
  const isCounterClockwise = isSwiss && coverConfig.swiss_direction === 'COUNTER_CLOCKWISE';
  const isGridStyle = coverStyle === 'GRID';
  const gridShape = coverConfig.grid_shape || 'CIRCLE';
  const gridFill = coverConfig.grid_fill || 'FILLED';
  const gridColor = coverConfig.grid_color || itemColor;
  const detailMode = coverConfig.detail_mode || 'SIMPLE';

  // -------------------------------------------------------------
  // MODE 1: COLLAPSED TOP BAR (Thanh dải trên cùng)
  // -------------------------------------------------------------
  if (isCollapsed) {
    return (
      <div
        className="bg-white dark:bg-neutral-900 border rounded-xl px-3.5 py-2 shadow-xs flex items-center justify-between transition-all select-none"
        style={{ borderColor: isCustomColor ? `${itemColor}40` : undefined }}
      >
        <div className="flex items-center gap-3 overflow-hidden text-xs">
          <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
            <span className="text-base">{activeItem.icon || '🎓'}</span>
            <span className="truncate max-w-[160px] sm:max-w-[240px]">{activeItem.title}</span>
            {activeItem.is_pinned && (
              <div className="relative inline-flex items-center shrink-0 ml-0.5">
                <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 opacity-75 blur-[2.5px] animate-pinned-aura pointer-events-none" />
                <span className="relative inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-neutral-900 text-amber-300 dark:bg-neutral-950 dark:text-amber-300 border border-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                  <Pin className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span className="hidden sm:inline">GHIM</span>
                </span>
              </div>
            )}
          </div>

          <div
            className="flex items-center gap-1.5 font-mono font-bold text-xs px-2.5 py-0.5 rounded-md shrink-0"
            style={{
              backgroundColor: isCustomColor ? `${itemColor}15` : undefined,
              color: isCustomColor
                ? (isLightColor(itemColor) ? getReadableColorOnLight(itemColor) : itemColor)
                : undefined,
            }}
          >
            {timeRemaining.isPast ? (
              <span className="text-neutral-500 font-sans">Đã diễn ra</span>
            ) : (
              <>
                <span className="font-extrabold">{timeRemaining.days}</span>
                <span className="text-[10px] font-sans font-normal opacity-70">ngày</span>
                <span className="font-extrabold">{pad(timeRemaining.hours)}</span>
                <span className="text-[10px] font-sans font-normal opacity-50">:</span>
                <span className="font-extrabold">{pad(timeRemaining.minutes)}</span>
                <span className="text-[10px] font-sans font-normal opacity-50">:</span>
                <span className="font-extrabold">{pad(timeRemaining.seconds)}</span>
              </>
            )}
          </div>

          {/* % Còn lại badge in collapsed mode */}
          {!timeRemaining.isPast && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: isCustomColor ? `${itemColor}15` : undefined,
                color: isCustomColor ? itemColor : undefined,
              }}
            >
              ⏳ Còn {progressStats.formattedRemaining}
            </span>
          )}

          {countdowns.length > 1 && (
            <div className="hidden md:flex items-center gap-1 text-[11px] text-neutral-400">
              <span>({validIndex + 1}/{countdowns.length})</span>
              <button
                type="button"
                onClick={handlePrev}
                className="hover:text-neutral-900 dark:hover:text-white p-0.5 rounded"
                title="Sự kiện trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="hover:text-neutral-900 dark:hover:text-white p-0.5 rounded"
                title="Sự kiện kế tiếp"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenCreate}
            className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition"
            title="Thêm đếm ngược mới"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <span>Mở rộng</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODE 2: EXPANDED HERO BANNER (Khối to đếm ngược truyền cảm hứng)
  // -------------------------------------------------------------
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-sm transition-all select-none ${
        isFonty
          ? 'text-white border-transparent'
          : 'bg-white dark:bg-neutral-900'
      }`}
      style={{
        background: fontyGradient,
        borderColor: !isFonty && isCustomColor ? `${itemColor}45` : undefined,
        boxShadow: isFonty
          ? `0 6px 28px -4px ${coverConfig.gradient_color1 || '#4f46e5'}40`
          : isCustomColor
          ? `0 4px 24px -6px ${itemColor}25`
          : undefined,
      }}
    >
      {/* Background ambient accents */}
      {!isFonty && (
        <div
          className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors"
          style={{ backgroundColor: isCustomColor ? itemColor : '#737373' }}
        />
      )}

      <div className="p-4 sm:p-5 relative z-10 space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className={`flex items-center gap-2.5 flex-1 min-w-0 ${
            textAlign === 'center' ? 'justify-center text-center' : textAlign === 'right' ? 'justify-end text-right' : 'justify-start text-left'
          }`}>
            <span className="text-2xl sm:text-3xl shrink-0">{activeItem.icon || '🎓'}</span>
            <div className={textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'}>
              <div className={`flex items-center gap-2 flex-wrap ${
                textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : 'justify-start'
              }`}>
                {/* Category tag */}
                <div className="relative inline-flex items-center">
                  {activeItem.is_pinned && (
                    <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400/30 via-orange-400/30 to-yellow-300/30 blur-[2px] animate-pinned-aura pointer-events-none" />
                  )}
                  <span
                    className={`relative inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full transition-all ${
                      isFonty ? 'bg-white/20 text-white' : ''
                    }`}
                    style={{
                      backgroundColor: !isFonty && isCustomColor ? `${itemColor}20` : undefined,
                      color: !isFonty && isCustomColor
                        ? (isLightColor(itemColor) ? getReadableColorOnLight(itemColor) : itemColor)
                        : undefined,
                      border: activeItem.is_pinned
                        ? '1px solid rgba(251, 191, 36, 0.55)'
                        : !isFonty && isCustomColor
                        ? `1px solid ${itemColor}40`
                        : undefined,
                    }}
                  >
                    {activeItem.category === 'EXAM'
                      ? 'Ngày thi quan trọng'
                      : activeItem.category === 'GOAL'
                      ? 'Mục tiêu đích'
                      : activeItem.category === 'EVENT'
                      ? 'Sự kiện / Cột mốc'
                      : 'Đếm ngược'}
                  </span>
                </div>

                {/* Pinned Tag with Special Surrounding Aura Effect */}
                {activeItem.is_pinned && (
                  <div className="relative inline-flex items-center group">
                    {/* Glowing animated aura surrounding the tag */}
                    <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 opacity-80 blur-[3.5px] animate-pinned-aura pointer-events-none" />
                    
                    {/* The tag badge itself */}
                    <span className="relative inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-neutral-900 text-amber-300 dark:bg-neutral-950 dark:text-amber-300 border border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.45)] select-none">
                      <Pin className="w-3 h-3 fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
                      <span>ĐÃ GHIM</span>
                      <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
                    </span>
                  </div>
                )}

                {/* % Còn lại highlight badge on top */}
                {!timeRemaining.isPast && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                      isFonty ? 'bg-white/20 text-white' : ''
                    }`}
                    style={{
                      backgroundColor: !isFonty && isCustomColor ? `${itemColor}15` : undefined,
                      color: !isFonty && isCustomColor
                        ? (isLightColor(itemColor) ? getReadableColorOnLight(itemColor) : itemColor)
                        : undefined,
                    }}
                  >
                    ⏳ Còn {progressStats.formattedRemaining}
                  </span>
                )}
              </div>
              <h2 className={`text-base sm:text-lg font-extrabold mt-0.5 tracking-tight ${
                isFonty ? 'text-white drop-shadow-sm' : 'text-neutral-900 dark:text-neutral-100'
              }`}>
                {activeItem.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {/* Live Display Mode Switcher (Vòng tròn, Dấu chấm, Thẻ số) */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg text-[10px]">
              <button
                type="button"
                onClick={() => handleModeChange('CIRCULAR')}
                className={`px-2 py-1 rounded-md font-semibold transition ${
                  bannerDisplayMode === 'CIRCULAR'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Đếm theo Vòng tròn thời gian"
              >
                ⭕ Vòng tròn
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('DOTS')}
                className={`px-2 py-1 rounded-md font-semibold transition ${
                  bannerDisplayMode === 'DOTS'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Đếm theo Dấu chấm (Dot Matrix)"
              >
                ⠿ Dấu chấm
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('DIGITAL')}
                className={`px-2 py-1 rounded-md font-semibold transition ${
                  bannerDisplayMode === 'DIGITAL'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Đếm theo Thẻ số điện tử"
              >
                ◫ Thẻ số
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenEdit(activeItem)}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition"
                title="Chỉnh sửa đếm ngược này"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onOpenCreate}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition"
                title="Thêm đếm ngược mới"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={toggleCollapse}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                title="Thu gọn lên thanh trên cùng"
              >
                <span>Thu gọn</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------- */}
        {/* MAIN VISUALIZATION AREA ACCORDING TO DISPLAY MODE */}
        {/* -------------------------------------------------- */}
        {timeRemaining.isPast ? (
          <div className="p-6 rounded-xl bg-neutral-100 dark:bg-neutral-850 text-center space-y-1">
            <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              🎉 Đã đến ngày diễn ra!
            </div>
            <div className="text-xs text-neutral-500">
              Sự kiện diễn ra vào {targetFormatted}
            </div>
          </div>
        ) : bannerDisplayMode === 'CIRCULAR' ? (
          /* MODE A: CIRCULAR RING (VÒNG TRÒN THỜI GIAN) */
          <div className="py-2 flex flex-col md:flex-row items-center justify-around gap-6">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center">
              <svg
                className={`w-full h-full transform ${
                  isCounterClockwise ? '-rotate-90 scale-x-[-1]' : '-rotate-90'
                }`}
                viewBox="0 0 160 160"
              >
                {/* Background Track Circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={circleRadius}
                  stroke="currentColor"
                  strokeWidth="10"
                  className={isFonty ? "text-white/20 fill-none" : "text-neutral-100 dark:text-neutral-800 fill-none"}
                />
                {/* Active Progress Circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={circleRadius}
                  stroke={isFonty ? "#ffffff" : isCustomColor ? itemColor : 'currentColor'}
                  strokeWidth="10"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`fill-none transition-all duration-700 ease-out ${
                    !isCustomColor && !isFonty ? 'text-neutral-900 dark:text-white' : ''
                  }`}
                />
              </svg>

              {/* Inside Circle Data */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isFonty ? 'text-white/80' : 'text-neutral-400'}`}>
                  Thời gian còn lại
                </span>
                <span className={`font-mono text-3xl sm:text-4xl font-black tracking-tight leading-none mt-0.5 ${isFonty ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>
                  {timeRemaining.days}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isFonty ? 'text-white/80' : 'text-neutral-500'}`}>
                  Ngày
                </span>
                {/* Prominent % Còn lại inside circle */}
                <div
                  className={`mt-1 font-mono text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1 ${
                    isFonty ? 'bg-white/20 text-white' : ''
                  }`}
                  style={{
                    backgroundColor: !isFonty && isCustomColor ? `${itemColor}20` : undefined,
                    color: !isFonty && isCustomColor
                      ? (isLightColor(itemColor) ? getReadableColorOnLight(itemColor) : itemColor)
                      : undefined,
                  }}
                >
                  <span>⏳ Còn lại</span>
                  <span>{progressStats.formattedRemaining}</span>
                </div>
                {isSwiss && (
                  <span className={`text-[9px] font-mono mt-0.5 ${isFonty ? 'text-white/70' : 'text-neutral-400'}`}>
                    {isCounterClockwise ? '↺ Ngược kim' : '↻ Thuận kim'}
                  </span>
                )}
              </div>
            </div>

            {/* Accompanying Stats Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 flex-1 max-w-md w-full">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center flex flex-col justify-center">
                <span className="font-mono text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  {pad(timeRemaining.hours)}
                </span>
                <span className="text-[10px] font-bold uppercase text-neutral-500 mt-0.5">Giờ</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center flex flex-col justify-center">
                <span className="font-mono text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  {pad(timeRemaining.minutes)}
                </span>
                <span className="text-[10px] font-bold uppercase text-neutral-500 mt-0.5">Phút</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-center flex flex-col justify-center">
                <span
                  className="font-mono text-xl sm:text-2xl font-black"
                  style={{
                    color: isCustomColor
                      ? (isLightColor(itemColor) ? getReadableColorOnLight(itemColor) : itemColor)
                      : undefined
                  }}
                >
                  {pad(timeRemaining.seconds)}
                </span>
                <span className="text-[10px] font-bold uppercase text-neutral-500 mt-0.5">Giây</span>
              </div>

              {/* % Còn lại & Tiến độ Bar with Switcher */}
              <div className="col-span-3 p-3 rounded-xl bg-neutral-50/90 dark:bg-neutral-850/80 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-200">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: itemColor }} />
                    <span>⏳ Thời gian còn lại:</span>
                    <strong
                      className="font-mono font-black text-sm"
                      style={{
                        color: isCustomColor
                          ? (isLightColor(itemColor) ? getReadableColorOnLight(itemColor) : itemColor)
                          : undefined
                      }}
                    >
                      {progressStats.formattedRemaining}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCircleGaugeType((prev) => prev === 'REMAINING' ? 'ELAPSED' : 'REMAINING')}
                    className="text-[10px] font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline"
                    title="Bấm để đổi thước đo vòng tròn"
                  >
                    Vòng tròn đo: {circleGaugeType === 'REMAINING' ? '% Còn lại' : '% Đã qua'}
                  </button>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressStats.remainingPct}%`,
                      backgroundColor: isCustomColor ? itemColor : '#171717',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                  <span>Đã trôi qua: <strong>{progressStats.formattedElapsed}</strong></span>
                  <span>Tổng lộ trình: <strong>{progressStats.totalDays} ngày</strong></span>
                </div>
              </div>
            </div>
          </div>
        ) : bannerDisplayMode === 'DOTS' ? (
          /* MODE B: DOT MATRIX (ĐẾM THEO DẤU CHẤM) */
          <div className="py-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 font-mono">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl sm:text-4xl font-black tracking-tight"
                  style={{ color: isCustomColor ? itemColor : undefined }}
                >
                  {timeRemaining.days}
                </span>
                <span className="text-sm font-sans font-bold text-neutral-500">ngày còn lại</span>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-full ml-1"
                  style={{
                    backgroundColor: isCustomColor ? `${itemColor}15` : undefined,
                    color: isCustomColor ? itemColor : undefined,
                  }}
                >
                  ⏳ Còn lại {progressStats.formattedRemaining}
                </span>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                Từng dấu chấm biểu trưng cho 1 ngày trên lộ trình đến đích
              </div>
            </div>

            {/* The Dot Matrix Grid (up to 60 dots representing the milestone timeline) */}
            <div className={`p-4 rounded-xl border ${isFonty ? 'bg-white/10 border-white/20' : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800'}`}>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {Array.from({ length: Math.min(60, Math.max(timeRemaining.days, 15)) }).map((_, idx) => {
                  const isCurrent = idx === 0;
                  const isElapsed = idx > timeRemaining.days;
                  const effectiveColor = isGridStyle ? gridColor : itemColor;

                  return (
                    <div
                      key={idx}
                      className="group relative"
                      title={`Ngày ${idx + 1}`}
                    >
                      <div
                        className={`w-3.5 h-3.5 transition-all duration-300 flex items-center justify-center ${
                          gridShape === 'SQUARE' ? 'rounded-xs' : 'rounded-full'
                        } ${
                          gridFill === 'OUTLINE' && !isCurrent ? 'border-2 bg-transparent' : ''
                        } ${
                          isCurrent
                            ? 'scale-125 ring-4 ring-offset-1 animate-pulse'
                            : isElapsed
                            ? isFonty ? 'bg-white/20 opacity-30' : 'bg-neutral-200 dark:bg-neutral-700 opacity-40'
                            : 'hover:scale-125 shadow-xs'
                        }`}
                        style={{
                          backgroundColor:
                            gridFill === 'OUTLINE' && !isCurrent
                              ? 'transparent'
                              : isCurrent || !isElapsed
                              ? (isFonty ? '#ffffff' : effectiveColor)
                              : undefined,
                          borderColor:
                            gridFill === 'OUTLINE' || isCurrent
                              ? (isFonty ? '#ffffff' : effectiveColor)
                              : undefined,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Status footer with % Còn lại */}
              <div className="mt-3 pt-2.5 border-t border-neutral-200/60 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-neutral-500 font-mono">
                <span>⏱️ Live: {pad(timeRemaining.hours)}:{pad(timeRemaining.minutes)}:{pad(timeRemaining.seconds)}</span>
                <div className="flex items-center gap-3">
                  <span>⏳ Còn lại: <strong className="text-neutral-800 dark:text-neutral-200">{progressStats.formattedRemaining}</strong></span>
                  <span>•</span>
                  <span>Đã qua: <strong>{progressStats.formattedElapsed}</strong></span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* MODE C: DIGITAL FLIP CARDS (THẺ SỐ ĐIỆN TỬ) */
          <div className="py-2 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
              {/* Card 1: Ngày */}
              <div
                className={`relative overflow-hidden rounded-xl border p-3.5 sm:p-4 flex flex-col items-center justify-center shadow-xs transition-all ${
                  !isCustomColor
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                    : isLightColor(itemColor)
                    ? 'text-neutral-950 border-neutral-300'
                    : 'text-white border-transparent'
                }`}
                style={{
                  backgroundColor: isCustomColor ? itemColor : undefined,
                  boxShadow: isCustomColor ? `0 4px 16px -4px ${itemColor}40` : undefined,
                }}
              >
                {/* Horizontal split slit line for authentic digital flip clock look */}
                <div className={`absolute inset-x-0 top-1/2 h-[1px] pointer-events-none ${isLightColor(itemColor) ? 'bg-black/15' : 'bg-black/20 dark:bg-white/20'}`} />
                <span className="font-mono text-3xl sm:text-5xl font-black tracking-tight leading-none">
                  {timeRemaining.days}
                </span>
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1.5 ${isLightColor(itemColor) ? 'text-neutral-900/80 font-extrabold' : 'opacity-90'}`}>
                  Ngày
                </span>
              </div>

              {/* Card 2: Giờ */}
              <div
                className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 p-3.5 sm:p-4 flex flex-col items-center justify-center shadow-2xs"
                style={{
                  borderColor: isCustomColor ? `${itemColor}40` : undefined,
                }}
              >
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-neutral-300/60 dark:bg-neutral-700/60 pointer-events-none" />
                <span className="font-mono text-3xl sm:text-5xl font-black tracking-tight leading-none">
                  {pad(timeRemaining.hours)}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-neutral-500 mt-1.5">
                  Giờ
                </span>
              </div>

              {/* Card 3: Phút */}
              <div
                className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-900 dark:text-neutral-100 p-3.5 sm:p-4 flex flex-col items-center justify-center shadow-2xs"
                style={{
                  borderColor: isCustomColor ? `${itemColor}40` : undefined,
                }}
              >
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-neutral-300/60 dark:bg-neutral-700/60 pointer-events-none" />
                <span className="font-mono text-3xl sm:text-5xl font-black tracking-tight leading-none">
                  {pad(timeRemaining.minutes)}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-neutral-500 mt-1.5">
                  Phút
                </span>
              </div>

              {/* Card 4: Giây */}
              <div
                className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 p-3.5 sm:p-4 flex flex-col items-center justify-center shadow-2xs"
                style={{
                  borderColor: isCustomColor ? `${itemColor}60` : undefined,
                }}
              >
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-neutral-300/60 dark:bg-neutral-700/60 pointer-events-none" />
                <span
                  className="font-mono text-3xl sm:text-5xl font-black tracking-tight leading-none"
                  style={{
                    color: isCustomColor
                      ? (isLightColor(itemColor) ? getReadableColorOnLight(itemColor) : itemColor)
                      : undefined
                  }}
                >
                  {pad(timeRemaining.seconds)}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-neutral-500 mt-1.5">
                  Giây
                </span>
              </div>
            </div>

            {/* % Còn lại Progress Bar inside Digital Cards Mode */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <span className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 shrink-0">
                  ⏳ Còn lại:
                  <span className="font-mono font-black text-sm" style={{ color: isCustomColor ? itemColor : undefined }}>
                    {progressStats.formattedRemaining}
                  </span>
                </span>
                <div className="flex-1 sm:w-56 bg-neutral-200 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressStats.remainingPct}%`,
                      backgroundColor: isCustomColor ? itemColor : '#171717',
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                <span>Đã qua: <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{progressStats.formattedElapsed}</strong></span>
                <span>•</span>
                <span>Chặng đường: <strong className="font-semibold text-neutral-700 dark:text-neutral-300">{progressStats.totalDays} ngày</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Footer info: target date, notes, event carousel switcher */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Clock className="w-3.5 h-3.5 shrink-0 text-neutral-700 dark:text-neutral-300" />
            <span>Thời điểm: <strong className="text-neutral-800 dark:text-neutral-200">{targetFormatted}</strong></span>
            {activeItem.notes && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="italic truncate max-w-[280px]">"{activeItem.notes}"</span>
              </>
            )}
          </div>

          {countdowns.length > 1 && (
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-[11px] font-medium">
                {validIndex + 1} / {countdowns.length} sự kiện
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1 rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                  title="Sự kiện trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1 rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                  title="Sự kiện tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
