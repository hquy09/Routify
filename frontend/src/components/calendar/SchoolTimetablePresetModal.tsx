import React, { useState, useMemo } from 'react';
import {
  X, Calendar as CalendarIcon, Clock, Sparkles, BookOpen, Check,
  ChevronRight, School, Coffee, AlertCircle, Palette
} from 'lucide-react';
import { FixedSchedule } from '../../types';
import { Button } from '../ui/button';

interface SchoolTimetablePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (schedules: Partial<FixedSchedule>[]) => Promise<void>;
}

interface DayConfig {
  dayOfWeek: number; // 0=Mon..6=Sun
  dayName: string;
  shortName: string;
  enabled: boolean;
  periodsCount: number;
}

const COLOR_PRESETS = [
  { value: '#2563eb', label: 'Xanh Royal' },
  { value: '#059669', label: 'Xanh Ngọc' },
  { value: '#e11d48', label: 'Đỏ Ruby' },
  { value: '#d97706', label: 'Vàng Hổ Phách' },
  { value: '#7c3aed', label: 'Tím Thạch Anh' },
  { value: '#0891b2', label: 'Xanh Lam Cyan' },
  { value: '#4f46e5', label: 'Tím Indigo' },
  { value: '#ea580c', label: 'Cam Rực Rỡ' },
  { value: '#475569', label: 'Xám Slate' },
  { value: '#000000', label: 'Đen Onyx' },
];

const pad = (n: number) => String(n).padStart(2, '0');

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Compute individual periods and total end time for a given day
function computePeriodsForDay(
  startTimeStr: string,
  periodDuration: number,
  shortBreak: number,
  longRecess: number,
  recessAfterPeriod: number,
  periodCount: number
) {
  let currentMins = timeToMinutes(startTimeStr);
  const periods: { periodNum: number; start: string; end: string }[] = [];

  for (let i = 1; i <= periodCount; i++) {
    const start = minutesToTime(currentMins);
    const endMins = currentMins + periodDuration;
    const end = minutesToTime(endMins);

    periods.push({
      periodNum: i,
      start,
      end,
    });

    currentMins = endMins;
    if (i < periodCount) {
      if (i === recessAfterPeriod) {
        currentMins += longRecess; // Ra chơi lớn
      } else {
        currentMins += shortBreak; // Nghỉ giữa tiết
      }
    }
  }

  const sessionStart = periods.length > 0 ? periods[0].start : startTimeStr;
  const sessionEnd = periods.length > 0 ? periods[periods.length - 1].end : startTimeStr;

  return { periods, sessionStart, sessionEnd };
}

export const SchoolTimetablePresetModal: React.FC<SchoolTimetablePresetModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
}) => {
  // General options
  const [title, setTitle] = useState('Học trên trường');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('🏫');
  const [generationMode, setGenerationMode] = useState<'SESSION_BLOCK' | 'PER_PERIOD'>('SESSION_BLOCK');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time parameters
  const [startTime, setStartTime] = useState('07:00');
  const [periodDuration, setPeriodDuration] = useState(45);
  const [shortBreak, setShortBreak] = useState(5);
  const [longRecess, setLongRecess] = useState(15);
  const [recessAfterPeriod, setRecessAfterPeriod] = useState(2); // sau tiết 2

  // Days of week config (Default: T2-T6 5 tiết, T7 4 tiết, CN nghỉ)
  const [daysConfig, setDaysConfig] = useState<DayConfig[]>([
    { dayOfWeek: 0, dayName: 'Thứ Hai', shortName: 'T2', enabled: true, periodsCount: 5 },
    { dayOfWeek: 1, dayName: 'Thứ Ba', shortName: 'T3', enabled: true, periodsCount: 5 },
    { dayOfWeek: 2, dayName: 'Thứ Tư', shortName: 'T4', enabled: true, periodsCount: 5 },
    { dayOfWeek: 3, dayName: 'Thứ Năm', shortName: 'T5', enabled: true, periodsCount: 5 },
    { dayOfWeek: 4, dayName: 'Thứ Sáu', shortName: 'T6', enabled: true, periodsCount: 5 },
    { dayOfWeek: 5, dayName: 'Thứ Bảy', shortName: 'T7', enabled: true, periodsCount: 4 },
    { dayOfWeek: 6, dayName: 'Chủ Nhật', shortName: 'CN', enabled: false, periodsCount: 0 },
  ]);

  // Quick preset applicator
  const applyQuickPreset = (type: 'STANDARD_T2_T7' | 'MON_FRI_ONLY' | 'ALL_5_PERIODS' | 'AFTERNOON') => {
    if (type === 'STANDARD_T2_T7') {
      setStartTime('07:00');
      setDaysConfig([
        { dayOfWeek: 0, dayName: 'Thứ Hai', shortName: 'T2', enabled: true, periodsCount: 5 },
        { dayOfWeek: 1, dayName: 'Thứ Ba', shortName: 'T3', enabled: true, periodsCount: 5 },
        { dayOfWeek: 2, dayName: 'Thứ Tư', shortName: 'T4', enabled: true, periodsCount: 5 },
        { dayOfWeek: 3, dayName: 'Thứ Năm', shortName: 'T5', enabled: true, periodsCount: 5 },
        { dayOfWeek: 4, dayName: 'Thứ Sáu', shortName: 'T6', enabled: true, periodsCount: 5 },
        { dayOfWeek: 5, dayName: 'Thứ Bảy', shortName: 'T7', enabled: true, periodsCount: 4 },
        { dayOfWeek: 6, dayName: 'Chủ Nhật', shortName: 'CN', enabled: false, periodsCount: 0 },
      ]);
    } else if (type === 'MON_FRI_ONLY') {
      setStartTime('07:00');
      setDaysConfig([
        { dayOfWeek: 0, dayName: 'Thứ Hai', shortName: 'T2', enabled: true, periodsCount: 5 },
        { dayOfWeek: 1, dayName: 'Thứ Ba', shortName: 'T3', enabled: true, periodsCount: 5 },
        { dayOfWeek: 2, dayName: 'Thứ Tư', shortName: 'T4', enabled: true, periodsCount: 5 },
        { dayOfWeek: 3, dayName: 'Thứ Năm', shortName: 'T5', enabled: true, periodsCount: 5 },
        { dayOfWeek: 4, dayName: 'Thứ Sáu', shortName: 'T6', enabled: true, periodsCount: 5 },
        { dayOfWeek: 5, dayName: 'Thứ Bảy', shortName: 'T7', enabled: false, periodsCount: 0 },
        { dayOfWeek: 6, dayName: 'Chủ Nhật', shortName: 'CN', enabled: false, periodsCount: 0 },
      ]);
    } else if (type === 'ALL_5_PERIODS') {
      setStartTime('07:00');
      setDaysConfig([
        { dayOfWeek: 0, dayName: 'Thứ Hai', shortName: 'T2', enabled: true, periodsCount: 5 },
        { dayOfWeek: 1, dayName: 'Thứ Ba', shortName: 'T3', enabled: true, periodsCount: 5 },
        { dayOfWeek: 2, dayName: 'Thứ Tư', shortName: 'T4', enabled: true, periodsCount: 5 },
        { dayOfWeek: 3, dayName: 'Thứ Năm', shortName: 'T5', enabled: true, periodsCount: 5 },
        { dayOfWeek: 4, dayName: 'Thứ Sáu', shortName: 'T6', enabled: true, periodsCount: 5 },
        { dayOfWeek: 5, dayName: 'Thứ Bảy', shortName: 'T7', enabled: true, periodsCount: 5 },
        { dayOfWeek: 6, dayName: 'Chủ Nhật', shortName: 'CN', enabled: false, periodsCount: 0 },
      ]);
    } else if (type === 'AFTERNOON') {
      setStartTime('13:00');
      setTitle('Học buổi chiều');
      setDaysConfig([
        { dayOfWeek: 0, dayName: 'Thứ Hai', shortName: 'T2', enabled: true, periodsCount: 5 },
        { dayOfWeek: 1, dayName: 'Thứ Ba', shortName: 'T3', enabled: true, periodsCount: 5 },
        { dayOfWeek: 2, dayName: 'Thứ Tư', shortName: 'T4', enabled: true, periodsCount: 5 },
        { dayOfWeek: 3, dayName: 'Thứ Năm', shortName: 'T5', enabled: true, periodsCount: 5 },
        { dayOfWeek: 4, dayName: 'Thứ Sáu', shortName: 'T6', enabled: true, periodsCount: 5 },
        { dayOfWeek: 5, dayName: 'Thứ Bảy', shortName: 'T7', enabled: false, periodsCount: 0 },
        { dayOfWeek: 6, dayName: 'Chủ Nhật', shortName: 'CN', enabled: false, periodsCount: 0 },
      ]);
    }
  };

  const toggleDay = (index: number) => {
    setDaysConfig((prev) => {
      const copy = [...prev];
      copy[index].enabled = !copy[index].enabled;
      if (copy[index].enabled && copy[index].periodsCount === 0) {
        copy[index].periodsCount = 5;
      }
      return copy;
    });
  };

  const changePeriodsCount = (index: number, delta: number) => {
    setDaysConfig((prev) => {
      const copy = [...prev];
      const nextCount = Math.min(10, Math.max(1, copy[index].periodsCount + delta));
      copy[index].periodsCount = nextCount;
      if (!copy[index].enabled && nextCount > 0) {
        copy[index].enabled = true;
      }
      return copy;
    });
  };

  // Compute preview for all enabled days
  const previewData = useMemo(() => {
    return daysConfig
      .filter((d) => d.enabled && d.periodsCount > 0)
      .map((d) => {
        const computed = computePeriodsForDay(
          startTime,
          periodDuration,
          shortBreak,
          longRecess,
          recessAfterPeriod,
          d.periodsCount
        );
        return {
          day: d,
          ...computed,
        };
      });
  }, [daysConfig, startTime, periodDuration, shortBreak, longRecess, recessAfterPeriod]);

  const totalWeeklyPeriods = previewData.reduce((acc, curr) => acc + curr.day.periodsCount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewData.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ngày có tiết học!');
      return;
    }

    setIsSubmitting(true);
    try {
      const schedulesToCreate: Partial<FixedSchedule>[] = [];

      for (const item of previewData) {
        if (generationMode === 'SESSION_BLOCK') {
          // Mode A: 1 unified block for the morning / afternoon session
          schedulesToCreate.push({
            title: title.trim() || 'Học trên trường',
            description: `${item.day.periodsCount} tiết học (${item.sessionStart} - ${item.sessionEnd})`,
            day_of_week: item.day.dayOfWeek,
            start_time: item.sessionStart,
            end_time: item.sessionEnd,
            repeat_rule: 'WEEKLY',
            category: 'SCHOOL',
            color,
            icon,
            location: location.trim() || undefined,
            is_active: true,
          });
        } else {
          // Mode B: Period by period breakdown
          for (const p of item.periods) {
            schedulesToCreate.push({
              title: `${title.trim() || 'Học'} - Tiết ${p.periodNum}`,
              description: `Tiết ${p.periodNum} (${p.start} - ${p.end})`,
              day_of_week: item.day.dayOfWeek,
              start_time: p.start,
              end_time: p.end,
              repeat_rule: 'WEEKLY',
              category: 'SCHOOL',
              color,
              icon,
              location: location.trim() || undefined,
              is_active: true,
            });
          }
        }
      }

      await onSaveBatch(schedulesToCreate);
      onClose();
    } catch (err: any) {
      console.error('Failed to create school timetable:', err);
      alert('Lỗi khi tạo thời khóa biểu: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl my-6 max-h-[92vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              🏫
            </span>
            <div>
              <h3 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base">
                Cài Đặt Nhanh Thời Khóa Biểu Trường Học
              </h3>
              <p className="text-[11px] text-neutral-500">
                Tự động tạo lịch học chuẩn hóa, tùy biến linh hoạt số tiết theo từng thứ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-3.5 space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            ⚡ Mẫu lịch phổ biến (Bấm để điền nhanh):
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyQuickPreset('STANDARD_T2_T7')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center gap-1"
            >
              <span>🎓 Chuẩn: T2-T6 (5 tiết) + T7 (4 tiết)</span>
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('MON_FRI_ONLY')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              Thứ 2 - Thứ 6 (5 tiết)
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('ALL_5_PERIODS')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              T2 - T7 đều 5 tiết
            </button>
            <button
              type="button"
              onClick={() => applyQuickPreset('AFTERNOON')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              Học buổi chiều (13:00)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {/* Section 1: Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
            <div>
              <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                Tên hoạt động
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Học trên trường (Chính khóa)"
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                Địa điểm / Phòng học
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Lớp 12A1 - THPT Chuyên..."
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>

            {/* Color & Icon */}
            <div className="sm:col-span-2 flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Màu sắc:</span>
                <div className="flex items-center gap-1.5">
                  {COLOR_PRESETS.slice(0, 6).map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-5 h-5 rounded-full border-2 transition ${
                        color === c.value ? 'scale-125 border-neutral-900 dark:border-white shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-neutral-300 dark:border-neutral-700 bg-transparent"
                    title="Chọn màu tự do"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Biểu tượng:</span>
                <input
                  type="text"
                  maxLength={3}
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-10 text-center font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg py-1"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Time parameters */}
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Khung giờ & Thời lượng tiết học:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[10px] text-neutral-500">Giờ vào lớp</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full mt-1 font-mono font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-1 text-center"
                />
              </div>

              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[10px] text-neutral-500">1 Tiết học</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min={20}
                    max={120}
                    value={periodDuration}
                    onChange={(e) => setPeriodDuration(Number(e.target.value))}
                    className="w-full font-mono font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-1 text-center"
                  />
                  <span className="text-[10px] text-neutral-500">phút</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[10px] text-neutral-500">Nghỉ giữa tiết</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={shortBreak}
                    onChange={(e) => setShortBreak(Number(e.target.value))}
                    className="w-full font-mono font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-1 text-center"
                  />
                  <span className="text-[10px] text-neutral-500">phút</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
                <span className="block text-[10px] text-neutral-500">Ra chơi lớn</span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={longRecess}
                    onChange={(e) => setLongRecess(Number(e.target.value))}
                    className="w-full font-mono font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-1 text-center"
                  />
                  <span className="text-[10px] text-neutral-500">phút</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Days of Week Period Customizer (THE CORE NON-RIGID FEATURE) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Số tiết từng thứ trong tuần (Bấm +/- để tùy biến):</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                Tổng cộng: {totalWeeklyPeriods} tiết/tuần
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {daysConfig.map((day, idx) => (
                <div
                  key={day.dayOfWeek}
                  className={`p-2.5 rounded-xl border transition-all ${
                    day.enabled
                      ? 'bg-white dark:bg-neutral-850 border-neutral-300 dark:border-neutral-700 shadow-2xs'
                      : 'bg-neutral-100/70 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`text-xs font-extrabold px-1.5 py-0.5 rounded transition ${
                        day.enabled
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                      }`}
                    >
                      {day.shortName}
                    </button>
                    <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {day.dayName}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      disabled={!day.enabled}
                      onClick={() => changePeriodsCount(idx, -1)}
                      className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold flex items-center justify-center disabled:opacity-30"
                    >
                      -
                    </button>
                    <div className="font-mono text-center">
                      <span className="text-sm font-black text-neutral-900 dark:text-neutral-100">
                        {day.enabled ? day.periodsCount : 0}
                      </span>
                      <span className="text-[9px] text-neutral-400 ml-0.5">tiết</span>
                    </div>
                    <button
                      type="button"
                      disabled={!day.enabled}
                      onClick={() => changePeriodsCount(idx, 1)}
                      className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold flex items-center justify-center disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Generation Mode (Block vs Individual Periods) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-neutral-800 dark:text-neutral-200">
              Kiểu hiển thị trên Lịch (Timeline):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGenerationMode('SESSION_BLOCK')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  generationMode === 'SESSION_BLOCK'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 shadow-2xs'
                    : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">📦 1 Khối cả buổi (Khuyên dùng)</span>
                  <span className={`w-2 h-2 rounded-full ${generationMode === 'SESSION_BLOCK' ? 'bg-blue-600' : 'bg-transparent'}`} />
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Mỗi ngày tạo 1 khối duy nhất (VD: T2-T6: 07:00-11:15, T7: 07:00-10:25). Rất gọn gàng, tránh làm rối mắt.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setGenerationMode('PER_PERIOD')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  generationMode === 'PER_PERIOD'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-100 shadow-2xs'
                    : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs">📑 Tách chi tiết từng tiết</span>
                  <span className={`w-2 h-2 rounded-full ${generationMode === 'PER_PERIOD' ? 'bg-blue-600' : 'bg-transparent'}`} />
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                  Tạo từng tiết 45p riêng biệt (Tiết 1, Tiết 2...). Phù hợp nếu bạn muốn đặt tên môn học cụ thể cho từng tiết.
                </p>
              </button>
            </div>
          </div>

          {/* Section 5: Live Calculated Schedule Preview */}
          <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-neutral-850/80 border border-blue-200/80 dark:border-neutral-800 space-y-1.5">
            <span className="font-bold text-[11px] text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Xem trước thời gian biểu sẽ được sinh ra:</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono">
              {previewData.map((item) => (
                <div
                  key={item.day.dayOfWeek}
                  className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between"
                >
                  <span className="font-bold text-blue-600 dark:text-blue-400">{item.day.shortName}:</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
                    {item.sessionStart} - {item.sessionEnd}
                  </span>
                  <span className="text-[9px] text-neutral-400">({item.day.periodsCount}t)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || previewData.length === 0}
            >
              {isSubmitting ? 'Đang tạo thời khóa biểu...' : `Lưu vào Lịch (${previewData.length} ngày)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
