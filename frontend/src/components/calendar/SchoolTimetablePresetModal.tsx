import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X, Calendar as CalendarIcon, Clock, Sparkles, BookOpen, Check,
  School, Coffee, AlertCircle, RotateCcw, Trash2, CheckCircle2,
  Settings2, Plus, ArrowRight, ArrowDown
} from 'lucide-react';
import { FixedSchedule, Course } from '../../types';
import { api } from '../../services/api';
import { Button } from '../ui/button';

interface SchoolTimetablePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (schedules: Partial<FixedSchedule>[], replaceCategory?: string) => Promise<void>;
}

interface PeriodDef {
  periodNum: number;
  label: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  session: 'MORNING' | 'AFTERNOON';
}

interface DayColumn {
  dayOfWeek: number; // 0=Mon, ..., 6=Sun
  name: string;
  shortName: string;
  enabled: boolean;
}

const COMMON_SUBJECTS = [
  { name: 'Toán', color: '#0d9488' },
  { name: 'Ngữ Văn', color: '#e11d48' },
  { name: 'Tiếng Anh', color: '#2563eb' },
  { name: 'Vật Lý', color: '#6366f1' },
  { name: 'Hóa Học', color: '#ea580c' },
  { name: 'Sinh Học', color: '#059669' },
  { name: 'Lịch Sử', color: '#b45309' },
  { name: 'Địa Lý', color: '#4d7c0f' },
  { name: 'Tin Học', color: '#0284c7' },
  { name: 'GDCD', color: '#7c3aed' },
  { name: 'GDQP', color: '#475569' },
  { name: 'Thể Dục', color: '#16a34a' },
  { name: 'Chào Cờ', color: '#dc2626' },
  { name: 'Sinh Hoạt', color: '#4f46e5' },
];

const DEFAULT_DAYS: DayColumn[] = [
  { dayOfWeek: 0, name: 'Thứ Hai', shortName: 'T2', enabled: true },
  { dayOfWeek: 1, name: 'Thứ Ba', shortName: 'T3', enabled: true },
  { dayOfWeek: 2, name: 'Thứ Tư', shortName: 'T4', enabled: true },
  { dayOfWeek: 3, name: 'Thứ Năm', shortName: 'T5', enabled: true },
  { dayOfWeek: 4, name: 'Thứ Sáu', shortName: 'T6', enabled: true },
  { dayOfWeek: 5, name: 'Thứ Bảy', shortName: 'T7', enabled: true },
  { dayOfWeek: 6, name: 'Chủ Nhật', shortName: 'CN', enabled: false },
];

const DEFAULT_MORNING_PERIODS: PeriodDef[] = [
  { periodNum: 1, label: 'Tiết 1', startTime: '07:00', endTime: '07:45', session: 'MORNING' },
  { periodNum: 2, label: 'Tiết 2', startTime: '07:45', endTime: '08:30', session: 'MORNING' },
  { periodNum: 3, label: 'Tiết 3', startTime: '08:45', endTime: '09:30', session: 'MORNING' },
  { periodNum: 4, label: 'Tiết 4', startTime: '09:30', endTime: '10:15', session: 'MORNING' },
  { periodNum: 5, label: 'Tiết 5', startTime: '10:15', endTime: '11:00', session: 'MORNING' },
];

const DEFAULT_AFTERNOON_PERIODS: PeriodDef[] = [
  { periodNum: 6, label: 'Tiết 6', startTime: '13:00', endTime: '13:45', session: 'AFTERNOON' },
  { periodNum: 7, label: 'Tiết 7', startTime: '13:45', endTime: '14:30', session: 'AFTERNOON' },
  { periodNum: 8, label: 'Tiết 8', startTime: '14:45', endTime: '15:30', session: 'AFTERNOON' },
  { periodNum: 9, label: 'Tiết 9', startTime: '15:30', endTime: '16:15', session: 'AFTERNOON' },
  { periodNum: 10, label: 'Tiết 10', startTime: '16:15', endTime: '17:00', session: 'AFTERNOON' },
];

export const SchoolTimetablePresetModal: React.FC<SchoolTimetablePresetModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
}) => {
  // Days & Periods Configuration
  const [days, setDays] = useState<DayColumn[]>(DEFAULT_DAYS);
  const [periods, setPeriods] = useState<PeriodDef[]>(DEFAULT_MORNING_PERIODS);
  const [hasAfternoon, setHasAfternoon] = useState(false);

  // Time generator parameters
  const [genStartTime, setGenStartTime] = useState('07:00');
  const [genDuration, setGenDuration] = useState(45);
  const [genShortBreak, setGenShortBreak] = useState(0);
  const [genRecessAfter, setGenRecessAfter] = useState(2);
  const [genRecessDuration, setGenRecessDuration] = useState(15);
  const [showTimeGenerator, setShowTimeGenerator] = useState(false);

  // Table Grid: key is `${dayOfWeek}_${periodNum}` -> subject name string
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [focusedCell, setFocusedCell] = useState<{ dayOfWeek: number; periodNum: number } | null>(null);

  // General settings
  const [location, setLocation] = useState('');
  const [replaceOldSchoolSchedules, setReplaceOldSchoolSchedules] = useState(true);
  const [autoMapCourses, setAutoMapCourses] = useState(true);
  const [defaultColor, setDefaultColor] = useState('#e11d48');
  const [colorBySubject, setColorBySubject] = useState(true);

  // Data loading & submit
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // School Sync (THPT Ngô Gia Tự)
  const [schoolClasses, setSchoolClasses] = useState<{ id: number; code: string; name: string; grade: number; shift: string }[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | 'ALL'>('ALL');
  const [selectedClassCode, setSelectedClassCode] = useState<string>('');
  const [isLoadingSchoolData, setIsLoadingSchoolData] = useState(false);
  const [syncSuccessNotice, setSyncSuccessNotice] = useState<string | null>(null);

  // Input refs for keyboard navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (isOpen) {
      api.courses.list()
        .then(setCourses)
        .catch((err) => console.warn('Failed to load courses in timetable modal:', err));

      api.schedules.getSchoolClasses()
        .then((classes) => {
          setSchoolClasses(classes);
          if (classes.length > 0) {
            setSelectedClassCode((prev) => prev || classes[0].code);
          }
        })
        .catch((err) => console.warn('Failed to load school classes:', err));
    }
  }, [isOpen]);

  const handleSyncFromSchool = async () => {
    if (!selectedClassCode) return;
    setIsLoadingSchoolData(true);
    try {
      const res = await api.schedules.getSchoolTimetable(selectedClassCode);
      setGrid(res.grid);
      setLocation(`Lớp ${res.class_code} - ${res.school_name}`);
      setSyncSuccessNotice(`Đã nạp thành công ${res.slots_count} tiết học của lớp ${res.class_code} từ website trường THPT Ngô Gia Tự!`);
      setTimeout(() => setSyncSuccessNotice(null), 6000);
    } catch (err: any) {
      console.error('Failed to sync school timetable:', err);
      alert('Lỗi nạp TKB từ web trường: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsLoadingSchoolData(false);
    }
  };

  // Handle afternoon session toggle
  const handleToggleAfternoon = () => {
    if (!hasAfternoon) {
      setPeriods([...DEFAULT_MORNING_PERIODS, ...DEFAULT_AFTERNOON_PERIODS]);
      setHasAfternoon(true);
    } else {
      setPeriods(DEFAULT_MORNING_PERIODS);
      setHasAfternoon(false);
      // Clean up afternoon cells from grid
      setGrid((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          const [, pNum] = k.split('_').map(Number);
          if (pNum > 5) delete next[k];
        });
        return next;
      });
    }
  };

  // Synchronized Period Time change: updates time for periodNum across ALL days
  const handleUpdatePeriodTime = (periodNum: number, field: 'startTime' | 'endTime', value: string) => {
    setPeriods((prev) =>
      prev.map((p) => (p.periodNum === periodNum ? { ...p, [field]: value } : p))
    );
  };

  // Recalculate all period times in sync based on generator params
  const handleApplyTimeGenerator = () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const toTimeStr = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${pad(h)}:${pad(m)}`;
    };

    let curMins = toMinutes(genStartTime);
    const updated = periods.map((p) => {
      if (p.session === 'AFTERNOON' && p.periodNum === 6) {
        // Reset to 13:00 for afternoon if morning ended earlier
        curMins = Math.max(curMins + 60, 13 * 60);
      }
      const start = toTimeStr(curMins);
      const endMins = curMins + genDuration;
      const end = toTimeStr(endMins);

      // Advance minutes for next period
      curMins = endMins;
      if (p.periodNum === genRecessAfter) {
        curMins += genRecessDuration;
      } else {
        curMins += genShortBreak;
      }

      return {
        ...p,
        startTime: start,
        endTime: end,
      };
    });

    setPeriods(updated);
    setShowTimeGenerator(false);
  };

  // Toggle active days
  const handleToggleDay = (dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, enabled: !d.enabled } : d))
    );
  };

  // Grid Cell change
  const handleCellChange = (dayOfWeek: number, periodNum: number, value: string) => {
    setGrid((prev) => ({
      ...prev,
      [`${dayOfWeek}_${periodNum}`]: value,
    }));
  };

  // Fill active cell with subject chip and auto advance downward
  const handlePickSubject = (subjName: string) => {
    const targetCell = focusedCell || { dayOfWeek: 0, periodNum: 1 };
    handleCellChange(targetCell.dayOfWeek, targetCell.periodNum, subjName);

    // Auto-advance focus to next period in the same day
    const nextPeriodNum = targetCell.periodNum + 1;
    const existsNext = periods.some((p) => p.periodNum === nextPeriodNum);
    if (existsNext) {
      const nextKey = `${targetCell.dayOfWeek}_${nextPeriodNum}`;
      setFocusedCell({ dayOfWeek: targetCell.dayOfWeek, periodNum: nextPeriodNum });
      setTimeout(() => {
        inputRefs.current[nextKey]?.focus();
      }, 50);
    }
  };

  // Keyboard navigation across the matrix (Arrow keys, Enter, Tab)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    dayOfWeek: number,
    periodNum: number
  ) => {
    const activeDays = days.filter((d) => d.enabled);
    const dayIndices = activeDays.map((d) => d.dayOfWeek);
    const curDayIdx = dayIndices.indexOf(dayOfWeek);

    const moveFocus = (targetDay: number, targetPeriod: number) => {
      const key = `${targetDay}_${targetPeriod}`;
      if (inputRefs.current[key]) {
        e.preventDefault();
        inputRefs.current[key]?.focus();
        setFocusedCell({ dayOfWeek: targetDay, periodNum: targetPeriod });
      }
    };

    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      const nextPeriod = periodNum + 1;
      if (periods.some((p) => p.periodNum === nextPeriod)) {
        moveFocus(dayOfWeek, nextPeriod);
      }
    } else if (e.key === 'ArrowUp') {
      const prevPeriod = periodNum - 1;
      if (periods.some((p) => p.periodNum === prevPeriod)) {
        moveFocus(dayOfWeek, prevPeriod);
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      if (curDayIdx < dayIndices.length - 1) {
        moveFocus(dayIndices[curDayIdx + 1], periodNum);
      } else {
        const nextPeriod = periodNum + 1;
        if (periods.some((p) => p.periodNum === nextPeriod)) {
          moveFocus(dayIndices[0], nextPeriod);
        }
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      if (curDayIdx > 0) {
        moveFocus(dayIndices[curDayIdx - 1], periodNum);
      } else {
        const prevPeriod = periodNum - 1;
        if (periods.some((p) => p.periodNum === prevPeriod)) {
          moveFocus(dayIndices[dayIndices.length - 1], prevPeriod);
        }
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length && curDayIdx < dayIndices.length - 1) {
        moveFocus(dayIndices[curDayIdx + 1], periodNum);
      }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && curDayIdx > 0) {
        moveFocus(dayIndices[curDayIdx - 1], periodNum);
      }
    }
  };

  // Quick preset loader (Ban KHTN sample)
  const handleLoadSampleTimetable = () => {
    const sample: Record<string, string> = {
      // T2 (Mon)
      '0_1': 'Chào Cờ', '0_2': 'Toán', '0_3': 'Toán', '0_4': 'Ngữ Văn', '0_5': 'Ngữ Văn',
      // T3 (Tue)
      '1_1': 'Vật Lý', '1_2': 'Vật Lý', '1_3': 'Hóa Học', '1_4': 'Tiếng Anh', '1_5': 'Tiếng Anh',
      // T4 (Wed)
      '2_1': 'Toán', '2_2': 'Toán', '2_3': 'Sinh Học', '2_4': 'Lịch Sử', '2_5': 'Địa Lý',
      // T5 (Thu)
      '3_1': 'Hóa Học', '3_2': 'Hóa Học', '3_3': 'Ngữ Văn', '3_4': 'Tiếng Anh', '3_5': 'Tin Học',
      // T6 (Fri)
      '4_1': 'Vật Lý', '4_2': 'Toán', '4_3': 'GDCD', '4_4': 'GDQP', '4_5': 'Thể Dục',
      // T7 (Sat)
      '5_1': 'Tiếng Anh', '5_2': 'Sinh Học', '5_3': 'Ôn Tập', '5_4': 'Sinh Hoạt',
    };
    setGrid(sample);
  };

  // Clear entire grid
  const handleClearGrid = () => {
    if (window.confirm('Bạn có chắc muốn xóa trắng toàn bộ môn học trong bảng?')) {
      setGrid({});
    }
  };

  // Stats calculation
  const totalSlotsCount = useMemo(() => {
    let count = 0;
    Object.values(grid).forEach((v) => {
      if (v && v.trim().length > 0) count++;
    });
    return count;
  }, [grid]);

  // Submit and save batch
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalSlotsCount === 0) {
      alert('Vui lòng nhập ít nhất 1 môn học vào thời khóa biểu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeDays = days.filter((d) => d.enabled);
      const schedulesToCreate: Partial<FixedSchedule>[] = [];

      for (const day of activeDays) {
        for (const period of periods) {
          const key = `${day.dayOfWeek}_${period.periodNum}`;
          const subject = (grid[key] || '').trim();
          if (!subject) continue;

          // Resolve Course ID if matching
          let matchedCourseId: number | undefined = undefined;
          if (autoMapCourses && courses.length > 0) {
            const cleanSubj = subject.toLowerCase();
            const matched = courses.find((c) => {
              const cTitle = c.title.toLowerCase();
              return cleanSubj.includes(cTitle) || cTitle.includes(cleanSubj);
            });
            if (matched) {
              matchedCourseId = matched.id;
            }
          }

          // Resolve Color
          let itemColor = defaultColor;
          if (colorBySubject) {
            const foundSubj = COMMON_SUBJECTS.find(
              (s) => subject.toLowerCase().includes(s.name.toLowerCase())
            );
            if (foundSubj) {
              itemColor = foundSubj.color;
            }
          }

          schedulesToCreate.push({
            title: subject,
            category: 'SCHOOL',
            day_of_week: day.dayOfWeek,
            start_time: period.startTime,
            end_time: period.endTime,
            repeat_rule: 'WEEKLY',
            color: itemColor,
            icon: '🏫',
            location: location.trim() || undefined,
            description: `Tiết ${period.periodNum} (${period.startTime} - ${period.endTime})`,
            course_id: matchedCourseId,
            is_active: true,
          });
        }
      }

      await onSaveBatch(
        schedulesToCreate,
        replaceOldSchoolSchedules ? 'SCHOOL' : undefined
      );

      onClose();
    } catch (err: any) {
      console.error('Failed to save timetable grid:', err);
      alert('Lỗi lưu thời khóa biểu: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const activeDays = days.filter((d) => d.enabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl my-4 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              🏫
            </span>
            <div>
              <h3 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base sm:text-lg flex items-center gap-2">
                <span>Nhập Nhanh Thời Khóa Biểu Trường Học</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                  {totalSlotsCount} tiết đã nhập
                </span>
              </h3>
              <p className="text-xs text-neutral-500">
                Bảng ma trận theo các thứ, chỉnh sửa giờ đồng bộ cho tất cả các ngày
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smart Direct Sync from THPT Ngô Gia Tự */}
        <div className="my-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-500/25 dark:border-blue-500/35 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] tracking-wider uppercase shadow-2xs">
              ⚡ SMART SYNC
            </span>
            <div>
              <span className="font-extrabold text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm">
                Đồng Bộ Trực Tiếp Từ Web THPT Ngô Gia Tự (Đắk Lắk)
              </span>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Tự động giải mã & điền toàn bộ thời khóa biểu của lớp bạn trong 1 click
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setSelectedGrade(val);
                const filtered = schoolClasses.filter((c) => val === 'ALL' || c.grade === val);
                if (filtered.length > 0) setSelectedClassCode(filtered[0].code);
              }}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả khối ({schoolClasses.length} lớp)</option>
              <option value={10}>Khối 10 (13 lớp)</option>
              <option value={11}>Khối 11 (12 lớp)</option>
              <option value={12}>Khối 12 (12 lớp)</option>
            </select>

            {/* Class Dropdown */}
            <select
              value={selectedClassCode}
              onChange={(e) => setSelectedClassCode(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 min-w-[105px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {schoolClasses
                .filter((c) => selectedGrade === 'ALL' || c.grade === selectedGrade)
                .map((c) => (
                  <option key={c.code} value={c.code}>
                    Lớp {c.code}
                  </option>
                ))}
            </select>

            {/* Sync Button */}
            <Button
              type="button"
              size="sm"
              onClick={handleSyncFromSchool}
              disabled={isLoadingSchoolData || !selectedClassCode}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs h-8"
            >
              {isLoadingSchoolData ? (
                <span className="flex items-center gap-1.5 animate-pulse">
                  <span>⏳ Đang giải mã TKB...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Điền Lên Bảng</span>
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Sync Success Notification Banner */}
        {syncSuccessNotice && (
          <div className="mb-2 p-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{syncSuccessNotice}</span>
            </span>
            <button
              type="button"
              onClick={() => setSyncSuccessNotice(null)}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800/80 shrink-0 text-xs">
          {/* Day Toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-neutral-600 dark:text-neutral-400 text-[11px] uppercase mr-1">
              Các thứ:
            </span>
            {days.map((d) => (
              <button
                key={d.dayOfWeek}
                type="button"
                onClick={() => handleToggleDay(d.dayOfWeek)}
                className={`px-2 py-1 rounded-md font-bold transition text-xs ${
                  d.enabled
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-neutral-200'
                }`}
                title={`Bật/tắt ${d.name}`}
              >
                {d.shortName}
              </button>
            ))}
          </div>

          {/* Quick Presets & Session Switch */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleAfternoon}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition text-xs flex items-center gap-1.5 ${
                hasAfternoon
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <span>{hasAfternoon ? '☀️ Sáng + 🌙 Chiều (10 tiết)' : '+ Thêm Buổi Chiều (Tiết 6-10)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTimeGenerator(!showTimeGenerator)}
              className="px-2.5 py-1 rounded-lg font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Đồng bộ khung giờ</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSampleTimetable}
              className="px-2.5 py-1 rounded-lg font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 border border-neutral-300 dark:border-neutral-700"
            >
              ⚡ Mẫu KHTN
            </button>

            <button
              type="button"
              onClick={handleClearGrid}
              className="p-1 text-slate-400 hover:text-rose-500 rounded"
              title="Xóa trắng bảng"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Time Synchronizer Sub-panel (Expandable) */}
        {showTimeGenerator && (
          <div className="p-3 my-2 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl space-y-2 text-xs shrink-0 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Cấu hình tự động tính & đồng bộ khung giờ cho tất cả các ngày:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowTimeGenerator(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Giờ vào lớp (Tiết 1)</label>
                <input
                  type="time"
                  value={genStartTime}
                  onChange={(e) => setGenStartTime(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 font-mono text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Thời lượng 1 tiết</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={20}
                    max={90}
                    value={genDuration}
                    onChange={(e) => setGenDuration(Number(e.target.value))}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 font-mono text-center font-bold"
                  />
                  <span className="text-[10px] text-neutral-500">phút</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Nghỉ giữa tiết</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={genShortBreak}
                    onChange={(e) => setGenShortBreak(Number(e.target.value))}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 font-mono text-center font-bold"
                  />
                  <span className="text-[10px] text-neutral-500">phút</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-500 mb-0.5">Ra chơi lớn</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={45}
                    value={genRecessDuration}
                    onChange={(e) => setGenRecessDuration(Number(e.target.value))}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 font-mono text-center font-bold"
                  />
                  <span className="text-[10px] text-neutral-500">phút</span>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyTimeGenerator}
                  className="w-full h-7 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  ⚡ Đồng bộ ngay
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Subject Chips Bar */}
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 border-b border-neutral-100 dark:border-neutral-800">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Điền nhanh:</span>
          </span>
          {COMMON_SUBJECTS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => handlePickSubject(s.name)}
              className="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 transition hover:scale-105 active:scale-95 shadow-2xs border"
              style={{
                backgroundColor: `${s.color}15`,
                borderColor: `${s.color}40`,
                color: s.color,
              }}
              title={`Click để điền môn ${s.name} vào ô đang chọn`}
            >
              + {s.name}
            </button>
          ))}
        </div>

        {/* Main Matrix Table Grid */}
        <div className="flex-1 overflow-auto my-2 border border-neutral-200 dark:border-neutral-800 rounded-xl relative shadow-2xs">
          <table className="w-full border-collapse text-xs select-none">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20">
                <th className="p-2.5 text-left font-bold text-neutral-600 dark:text-neutral-400 min-w-[130px] border-r border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <span>Tiết & Giờ học</span>
                    <span className="text-[10px] text-neutral-400 font-normal">(Đồng bộ)</span>
                  </div>
                </th>
                {activeDays.map((day) => (
                  <th
                    key={day.dayOfWeek}
                    className="p-2.5 text-center font-bold text-neutral-800 dark:text-neutral-200 border-r border-neutral-200 dark:border-neutral-800 min-w-[110px]"
                  >
                    <span className="text-blue-600 dark:text-blue-400">{day.shortName}</span>
                    <span className="text-[10px] text-neutral-400 block font-normal">{day.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p, pIdx) => {
                const isAfternoonStart = p.session === 'AFTERNOON' && p.periodNum === 6;
                const isRecessBefore = p.periodNum === 3; // Ra chơi giữa tiết 2 và tiết 3

                return (
                  <React.Fragment key={p.periodNum}>
                    {/* Recess Break Banner in Morning */}
                    {isRecessBefore && (
                      <tr className="bg-amber-50/60 dark:bg-amber-950/20 border-y border-amber-200/50 dark:border-amber-900/30 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        <td className="p-1 px-2.5 flex items-center gap-1 border-r border-amber-200/50 dark:border-amber-900/30">
                          <Coffee className="w-3 h-3 text-amber-600" />
                          <span>Giờ ra chơi lớn</span>
                        </td>
                        <td colSpan={activeDays.length} className="text-center italic opacity-75">
                          Nghỉ ngơi 15 - 20 phút
                        </td>
                      </tr>
                    )}

                    {/* Afternoon Session Divider */}
                    {isAfternoonStart && (
                      <tr className="bg-blue-50/80 dark:bg-blue-950/30 border-y border-blue-200 dark:border-blue-900 text-[10px] font-extrabold text-blue-900 dark:text-blue-200">
                        <td className="p-1 px-2.5 flex items-center gap-1 border-r border-blue-200 dark:border-blue-900">
                          <span>🌙 Buổi Chiều</span>
                        </td>
                        <td colSpan={activeDays.length} className="text-center italic">
                          Thời khóa biểu học buổi chiều (Tiết 6 - Tiết 10)
                        </td>
                      </tr>
                    )}

                    <tr className="border-b border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/50 transition">
                      {/* Synchronized Period Time Column Header */}
                      <td className="p-2 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-neutral-800 dark:text-neutral-200 text-xs">
                            {p.label}
                          </span>
                          {/* Inline Time Editor that syncs to all days for this period */}
                          <div className="flex items-center gap-0.5 font-mono text-[11px]">
                            <input
                              type="time"
                              value={p.startTime}
                              onChange={(e) => handleUpdatePeriodTime(p.periodNum, 'startTime', e.target.value)}
                              className="w-13 text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-0.5 py-0.5 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                              title={`Chỉnh giờ bắt đầu ${p.label} (đồng bộ tất cả các ngày)`}
                            />
                            <span className="text-neutral-400">-</span>
                            <input
                              type="time"
                              value={p.endTime}
                              onChange={(e) => handleUpdatePeriodTime(p.periodNum, 'endTime', e.target.value)}
                              className="w-13 text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-0.5 py-0.5 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                              title={`Chỉnh giờ kết thúc ${p.label} (đồng bộ tất cả các ngày)`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Day Cells */}
                      {activeDays.map((day) => {
                        const cellKey = `${day.dayOfWeek}_${p.periodNum}`;
                        const value = grid[cellKey] || '';
                        const isFocused =
                          focusedCell?.dayOfWeek === day.dayOfWeek &&
                          focusedCell?.periodNum === p.periodNum;

                        // Subject color badge if matched
                        const matchedSubj = COMMON_SUBJECTS.find((s) =>
                          value.toLowerCase().includes(s.name.toLowerCase())
                        );

                        return (
                          <td
                            key={day.dayOfWeek}
                            className={`p-1.5 border-r border-neutral-200 dark:border-neutral-800 transition ${
                              isFocused
                                ? 'bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-inset ring-blue-500'
                                : ''
                            }`}
                          >
                            <div className="relative">
                              <input
                                ref={(el) => {
                                  inputRefs.current[cellKey] = el;
                                }}
                                type="text"
                                value={value}
                                onChange={(e) =>
                                  handleCellChange(day.dayOfWeek, p.periodNum, e.target.value)
                                }
                                onFocus={() =>
                                  setFocusedCell({ dayOfWeek: day.dayOfWeek, periodNum: p.periodNum })
                                }
                                onKeyDown={(e) => handleKeyDown(e, day.dayOfWeek, p.periodNum)}
                                placeholder="—"
                                className={`w-full text-center font-bold rounded-md px-1.5 py-1 text-xs transition border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  value
                                    ? matchedSubj
                                      ? 'border-transparent text-neutral-900 dark:text-neutral-100 shadow-2xs'
                                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                                    : 'bg-transparent border-transparent text-neutral-400 hover:border-neutral-200 dark:hover:border-neutral-700'
                                }`}
                                style={
                                  value && matchedSubj
                                    ? {
                                        backgroundColor: `${matchedSubj.color}18`,
                                        borderColor: `${matchedSubj.color}40`,
                                        color: matchedSubj.color,
                                      }
                                    : undefined
                                }
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Options & Save Bar */}
        <form onSubmit={handleSubmit} className="pt-2 border-t border-neutral-200 dark:border-neutral-800 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Replace Old School Schedule Switch */}
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={replaceOldSchoolSchedules}
                  onChange={(e) => setReplaceOldSchoolSchedules(e.target.checked)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Ghi đè thời khóa biểu trường cũ (xóa các tiết cũ để tránh trùng)</span>
              </label>

              {/* Auto Course Linking */}
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={autoMapCourses}
                  onChange={(e) => setAutoMapCourses(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Tự động liên kết môn với Khóa học LifeOS</span>
              </label>
            </div>

            {/* Room / Location */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500">Phòng / Lớp:</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: 12A1"
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 text-xs w-28 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-neutral-400">
              💡 Mẹo: Nhấn <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border font-mono">Enter</kbd> để nhảy xuống tiết dưới, <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border font-mono">Tab</kbd> để sang thứ tiếp theo.
            </div>

            <div className="flex items-center gap-2">
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
                disabled={isSubmitting || totalSlotsCount === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isSubmitting
                  ? 'Đang lưu thời khóa biểu...'
                  : `Lưu Thời Khóa Biểu (${totalSlotsCount} tiết)`}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
