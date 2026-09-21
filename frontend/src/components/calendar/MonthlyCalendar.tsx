import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { CalendarMonthlyResponse } from '../../types';
import { Button } from '../ui/button';
import { toLocalDateString } from '../../utils/dateUtils';

interface MonthlyCalendarProps {
  data: CalendarMonthlyResponse | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (dateStr: string) => void;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  data,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}) => {
  if (!data) {
    return (
      <div className="p-16 text-center text-slate-500 animate-pulse text-sm">
        Đang tải lịch tháng...
      </div>
    );
  }

  const weekDays = [
    { label: 'Thứ 2', short: 'T2' },
    { label: 'Thứ 3', short: 'T3' },
    { label: 'Thứ 4', short: 'T4' },
    { label: 'Thứ 5', short: 'T5' },
    { label: 'Thứ 6', short: 'T6' },
    { label: 'Thứ 7', short: 'T7' },
    { label: 'Chủ nhật', short: 'CN' },
  ];

  // Subtle heat tint for cells based on productivity level (0 to 4)
  const heatCellStyles: Record<number, string> = {
    0: 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs',
    1: 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700/60',
    2: 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-600/70',
    3: 'bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700/70 hover:border-emerald-400 dark:hover:border-emerald-500/80',
    4: 'bg-emerald-100 dark:bg-emerald-800/45 border-emerald-400 dark:border-emerald-600/90 shadow-xs hover:border-emerald-500',
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar: Month Navigation & Monthly KPIs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Month Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-900 dark:text-neutral-100 shadow-2xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                Tháng {data.month} / {data.year}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">({data.month_name})</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mật độ năng suất & tổng quan nhiệm vụ trong tháng</p>
          </div>
        </div>

        {/* Month KPIs Bar (Unified inline layout) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400">Hoàn thành:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{data.total_completed}</span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">Chưa xong:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{data.total_incomplete}</span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-500 dark:text-slate-400">Chậm trễ:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{data.total_delayed}</span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Tỷ lệ:</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono text-sm">{data.completion_rate}%</span>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-1.5 self-end lg:self-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevMonth}
            title="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextMonth}
            title="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 2. Calendar Grid with Horizontal Scroll Protection (Never squished) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days of Week Header Bar */}
          <div className="grid grid-cols-7 gap-2 pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 text-center">
            {weekDays.map((wd, i) => (
              <div key={i} className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                <span>{wd.label}</span>
              </div>
            ))}
          </div>

          {/* Month Days Grid: 7 clean columns */}
          <div className="grid grid-cols-7 gap-2">
            {data.days.map((day) => {
              const cellStyle = heatCellStyles[day.heat_level] || heatCellStyles[0];
              const totalDayTasks = day.completed_count + day.incomplete_count + day.delayed_count;
              const todayStr = toLocalDateString();
              const isPast = day.date < todayStr;

              return (
                <div
                  key={day.date}
                  onClick={() => onSelectDay(day.date)}
                  className={`rounded-xl border p-2.5 min-h-[100px] flex flex-col justify-between transition-all duration-150 cursor-pointer ${cellStyle} ${
                    !day.is_current_month
                      ? 'opacity-35 hover:opacity-60 bg-slate-50/50 dark:bg-slate-900/30'
                      : isPast
                      ? 'opacity-85 hover:opacity-100'
                      : ''
                  } ${day.is_today ? 'ring-2 ring-neutral-900 dark:ring-neutral-100 shadow-md' : ''}`}
                >
                  {/* Top Row: Date Number & Points badge */}
                  <div className="flex items-center justify-between">
                    {day.is_today ? (
                      <span className="w-6 h-6 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center shadow-xs">
                        {day.day_of_month}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold ${
                            !day.is_current_month
                              ? 'text-slate-400 dark:text-slate-500'
                              : isPast
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-200'
                          }`}
                        >
                          {day.day_of_month}
                        </span>
                        {isPast && day.is_current_month && (
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">✓</span>
                        )}
                      </div>
                    )}

                    {day.difficulty_points > 0 && (
                      <span
                        title={`${day.difficulty_points} điểm độ khó hoàn thành`}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold"
                      >
                        <Flame className="w-2.5 h-2.5 fill-current" />
                        <span>+{day.difficulty_points}</span>
                      </span>
                    )}
                  </div>

                  {/* Middle / Bottom Content: Compact Horizontal Task Summary Badges */}
                  <div className="mt-2 space-y-1.5">
                    {totalDayTasks > 0 ? (
                      <>
                        {/* Horizontal badge pills row */}
                        <div className="flex flex-wrap items-center gap-1">
                          {day.completed_count > 0 && (
                            <span
                              title={`${day.completed_count} nhiệm vụ đã hoàn thành`}
                              className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-transparent font-semibold text-[10px] flex items-center gap-0.5"
                            >
                              <span>✓</span>
                              <span>{day.completed_count}</span>
                            </span>
                          )}
                          {day.incomplete_count > 0 && (
                            <span
                              title={`${day.incomplete_count} nhiệm vụ chưa hoàn thành`}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-transparent text-[10px] flex items-center gap-0.5"
                            >
                              <span>○</span>
                              <span>{day.incomplete_count}</span>
                            </span>
                          )}
                          {day.delayed_count > 0 && (
                            <span
                              title={`${day.delayed_count} nhiệm vụ chậm trễ`}
                              className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-transparent font-semibold text-[10px] flex items-center gap-0.5"
                            >
                              <span>!</span>
                              <span>{day.delayed_count}</span>
                            </span>
                          )}
                        </div>

                        {/* Subtle Mini Progress Bar for the day */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              day.completed_count === totalDayTasks ? 'bg-emerald-500' : 'bg-neutral-900 dark:bg-neutral-100'
                            }`}
                            style={{
                              width: `${Math.round((day.completed_count / totalDayTasks) * 100)}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-slate-400 dark:text-slate-600 italic">Trống</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Helper Footer Notice */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-2">
        <span>💡 Bấm vào một ngày bất kỳ để mở thời khóa biểu chi tiết của tuần đó.</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40" />
            <span>Đã hoàn thành</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40" />
            <span>Chậm trễ</span>
          </span>
        </div>
      </div>
    </div>
  );
};
