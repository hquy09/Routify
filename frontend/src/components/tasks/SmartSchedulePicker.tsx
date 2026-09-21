import React, { useMemo } from 'react';
import {
  Calendar as CalendarIcon, Clock, AlertCircle,
  Sun, Sunset, Moon, Sunrise, Coffee, X
} from 'lucide-react';
import {
  toLocalDateString,
  toLocalTimeString,
  toLocalInputString,
  parseBackendDatetimeToLocalInput,
  formatDatetimeForBackend,
} from '../../utils/dateUtils';

// Re-export for backward compatibility
export {
  toLocalDateString,
  toLocalTimeString,
  toLocalInputString,
  parseBackendDatetimeToLocalInput as isoToLocalInput,
  formatDatetimeForBackend as localInputToISO,
};

interface SmartSchedulePickerProps {
  startDatetime: string; // "YYYY-MM-DDTHH:mm" or ""
  dueDatetime: string;   // "YYYY-MM-DDTHH:mm" or ""
  onStartChange: (val: string) => void;
  onDueChange: (val: string) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const SmartSchedulePicker: React.FC<SmartSchedulePickerProps> = ({
  startDatetime,
  dueDatetime,
  onStartChange,
  onDueChange,
}) => {
  // Extract currently selected date (priority: dueDatetime -> startDatetime -> today)
  const currentDateStr = useMemo(() => {
    if (dueDatetime && dueDatetime.length >= 10) return dueDatetime.slice(0, 10);
    if (startDatetime && startDatetime.length >= 10) return startDatetime.slice(0, 10);
    return toLocalDateString();
  }, [dueDatetime, startDatetime]);

  // Extract start time HH:mm
  const startTimeStr = useMemo(() => {
    if (startDatetime && startDatetime.length >= 16) {
      return startDatetime.slice(11, 16);
    }
    return '';
  }, [startDatetime]);

  // Extract due time HH:mm
  const dueTimeStr = useMemo(() => {
    if (dueDatetime && dueDatetime.length >= 16) {
      return dueDatetime.slice(11, 16);
    }
    return '';
  }, [dueDatetime]);

  // Quick date calculations (all in local time)
  const todayStr = toLocalDateString();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateString(tomorrow);

  const saturday = new Date();
  const dayOfWeek = saturday.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  saturday.setDate(saturday.getDate() + daysUntilSaturday);
  const saturdayStr = toLocalDateString(saturday);

  const nextMonday = new Date();
  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  const nextMondayStr = toLocalDateString(nextMonday);

  const isToday = currentDateStr === todayStr;
  const isTomorrow = currentDateStr === tomorrowStr;
  const isWeekend = currentDateStr === saturdayStr;
  const isNextWeek = currentDateStr === nextMondayStr;

  /**
   * Apply a new date while preserving existing times exactly.
   * If no due time was set, default it to 21:00.
   */
  const applyDate = (dateStr: string) => {
    if (startTimeStr) {
      onStartChange(`${dateStr}T${startTimeStr}`);
    }
    const targetDueTime = dueTimeStr || '21:00';
    onDueChange(`${dateStr}T${targetDueTime}`);
  };

  /**
   * Date input handler: updates the date portion of both start and due times
   * without altering hours and minutes.
   */
  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    applyDate(newDate);
  };

  /**
   * Start time handler: ONLY updates start time!
   * NEVER overrides or shifts due time automatically!
   */
  const handleStartTimeChange = (timeStr: string) => {
    if (!timeStr) {
      onStartChange('');
      return;
    }
    const baseDate = currentDateStr || todayStr;
    onStartChange(`${baseDate}T${timeStr}`);
  };

  /**
   * Clear start time completely
   */
  const handleClearStartTime = () => {
    onStartChange('');
  };

  /**
   * Due time handler: ONLY updates due time!
   * NEVER overrides or shifts start time automatically!
   */
  const handleDueTimeChange = (timeStr: string) => {
    if (!timeStr) {
      onDueChange('');
      return;
    }
    const baseDate = currentDateStr || todayStr;
    onDueChange(`${baseDate}T${timeStr}`);
  };

  /**
   * Quick Time Presets (sets both start and due times cleanly for current date)
   */
  const applyTimePreset = (startH: number, startM: number, dueH: number, dueM: number) => {
    const baseDate = currentDateStr || todayStr;
    onStartChange(`${baseDate}T${pad(startH)}:${pad(startM)}`);
    onDueChange(`${baseDate}T${pad(dueH)}:${pad(dueM)}`);
  };

  /**
   * All-day preset: no start time, due time is 00:00 (or clear hours)
   */
  const applyAllDay = () => {
    const baseDate = currentDateStr || todayStr;
    onStartChange('');
    onDueChange(`${baseDate}T00:00`);
  };

  /**
   * Add duration helper (+30m, +1h, etc.)
   */
  const addDuration = (minutes: number) => {
    const baseDate = currentDateStr || todayStr;

    if (startTimeStr) {
      const [sh, sm] = startTimeStr.split(':').map(Number);
      const totalStartMins = sh * 60 + sm;
      const totalDueMins = totalStartMins + minutes;
      const dh = Math.floor(totalDueMins / 60) % 24;
      const dm = totalDueMins % 60;
      onDueChange(`${baseDate}T${pad(dh)}:${pad(dm)}`);
    } else if (dueTimeStr) {
      const [dh, dm] = dueTimeStr.split(':').map(Number);
      const totalDueMins = dh * 60 + dm + minutes;
      const nextH = Math.floor(totalDueMins / 60) % 24;
      const nextM = totalDueMins % 60;
      onDueChange(`${baseDate}T${pad(nextH)}:${pad(nextM)}`);
    } else {
      // Default: start now, due = now + duration
      const now = new Date();
      const sH = now.getHours();
      const sM = Math.floor(now.getMinutes() / 15) * 15;
      const totalDue = sH * 60 + sM + minutes;
      const dH = Math.floor(totalDue / 60) % 24;
      const dM = totalDue % 60;
      onStartChange(`${baseDate}T${pad(sH)}:${pad(sM)}`);
      onDueChange(`${baseDate}T${pad(dH)}:${pad(dM)}`);
    }
  };

  /**
   * Conflict detection: only flags if start and due are both set,
   * same day, and start time is greater than due time.
   */
  const hasTimeConflict = useMemo(() => {
    if (!startDatetime || !dueDatetime) return false;
    return startDatetime > dueDatetime;
  }, [startDatetime, dueDatetime]);

  const fixConflict = () => {
    if (!startDatetime) return;
    const baseDate = startDatetime.slice(0, 10);
    const [sh, sm] = startTimeStr.split(':').map(Number);
    const totalDueMins = sh * 60 + sm + 60; // +1 hour
    const dh = Math.floor(totalDueMins / 60) % 24;
    const dm = totalDueMins % 60;
    onDueChange(`${baseDate}T${pad(dh)}:${pad(dm)}`);
  };

  // Format Vietnamese preview
  const previewInfo = useMemo(() => {
    if (!dueDatetime && !startDatetime) return null;

    try {
      const targetVal = startDatetime || dueDatetime;
      const [y, m, d] = targetVal.slice(0, 10).split('-').map(Number);
      const dateTarget = new Date(y, m - 1, d);
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayOfWeekName = dayNames[dateTarget.getDay()];
      const dayFormatted = `${pad(d)}/${pad(m)}/${y}`;

      const isAllDay = dueTimeStr === '00:00' && !startTimeStr;
      if (isAllDay) {
        return {
          title: `📌 ${dayOfWeekName}, ${dayFormatted}`,
          sub: 'Nhiệm vụ cả ngày (Không cố định giờ)',
        };
      }

      if (startTimeStr && dueTimeStr) {
        const [sh, sm] = startTimeStr.split(':').map(Number);
        const [dh, dm] = dueTimeStr.split(':').map(Number);
        const diffMins = (dh * 60 + dm) - (sh * 60 + sm);
        const durationText =
          diffMins > 0
            ? diffMins >= 60
              ? `${Math.floor(diffMins / 60)} tiếng ${diffMins % 60 > 0 ? (diffMins % 60) + 'p' : ''}`
              : `${diffMins} phút`
            : '';

        return {
          title: `🗓️ ${dayOfWeekName}, ${dayFormatted}`,
          sub: `⏰ ${startTimeStr} ➔ ${dueTimeStr} ${durationText ? `(${durationText})` : ''}`,
        };
      }

      if (dueTimeStr) {
        return {
          title: `🗓️ ${dayOfWeekName}, ${dayFormatted}`,
          sub: `⏰ Hạn chót lúc ${dueTimeStr}`,
        };
      }

      return {
        title: `🗓️ ${dayOfWeekName}, ${dayFormatted}`,
        sub: 'Chưa đặt giờ cụ thể',
      };
    } catch {
      return null;
    }
  }, [startDatetime, dueDatetime, startTimeStr, dueTimeStr]);

  return (
    <div className="space-y-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 select-none">
      <div className="flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-neutral-100">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
          <span>Tùy chỉnh chọn lịch</span>
        </span>
        <span className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400">
          Múi giờ địa phương (Không lệch giờ)
        </span>
      </div>

      {/* 1. Quick Date Selection Bar */}
      <div>
        <div className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
          Chọn ngày nhanh
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => applyDate(todayStr)}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition text-center ${
              isToday
                ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 font-semibold shadow-xs'
                : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => applyDate(tomorrowStr)}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition text-center ${
              isTomorrow
                ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 font-semibold shadow-xs'
                : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
            }`}
          >
            Ngày mai
          </button>
          <button
            type="button"
            onClick={() => applyDate(saturdayStr)}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition text-center ${
              isWeekend
                ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 font-semibold shadow-xs'
                : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
            }`}
          >
            Cuối tuần
          </button>
          <button
            type="button"
            onClick={() => applyDate(nextMondayStr)}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition text-center ${
              isNextWeek
                ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 font-semibold shadow-xs'
                : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
            }`}
          >
            Tuần sau
          </button>
        </div>
      </div>

      {/* 2. Quick Time Slots */}
      <div>
        <div className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
          Khung giờ thông dụng
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => applyTimePreset(9, 0, 10, 30)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition text-center flex flex-col items-center gap-0.5"
          >
            <Sunrise className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
            <span className="font-semibold text-[10px]">Sáng</span>
            <span className="text-[9px] text-neutral-500">09:00</span>
          </button>

          <button
            type="button"
            onClick={() => applyTimePreset(14, 0, 15, 30)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition text-center flex flex-col items-center gap-0.5"
          >
            <Sun className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
            <span className="font-semibold text-[10px]">Chiều</span>
            <span className="text-[9px] text-neutral-500">14:00</span>
          </button>

          <button
            type="button"
            onClick={() => applyTimePreset(20, 0, 21, 30)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition text-center flex flex-col items-center gap-0.5"
          >
            <Sunset className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
            <span className="font-semibold text-[10px]">Tối</span>
            <span className="text-[9px] text-neutral-500">20:00</span>
          </button>

          <button
            type="button"
            onClick={() => applyTimePreset(21, 30, 22, 30)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition text-center flex flex-col items-center gap-0.5"
          >
            <Moon className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
            <span className="font-semibold text-[10px]">Đêm</span>
            <span className="text-[9px] text-neutral-500">21:30</span>
          </button>

          <button
            type="button"
            onClick={applyAllDay}
            className={`p-1.5 rounded-lg border transition text-center flex flex-col items-center gap-0.5 ${
              dueTimeStr === '00:00' && !startTimeStr
                ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 font-semibold'
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span className="font-semibold text-[10px]">Cả ngày</span>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400">Không giờ</span>
          </button>
        </div>
      </div>

      {/* 3. Detailed Precise Date & Time Inputs (Completely Independent - No Auto Overwriting) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Date Input */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Ngày thực hiện
          </label>
          <input
            type="date"
            value={currentDateStr}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          />
        </div>

        {/* Start Time Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              Giờ bắt đầu <span className="text-[10px] font-normal text-neutral-500">(Tùy chọn)</span>
            </label>
            {startTimeStr && (
              <button
                type="button"
                onClick={handleClearStartTime}
                className="text-[10px] text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-0.5 transition"
                title="Bỏ giờ bắt đầu"
              >
                <X className="w-3 h-3" />
                <span>Bỏ giờ</span>
              </button>
            )}
          </div>
          <input
            type="time"
            value={startTimeStr}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          />
        </div>

        {/* Due Time Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              Hạn chót (Kết thúc)
            </label>
            {dueTimeStr && (
              <button
                type="button"
                onClick={() => onDueChange('')}
                className="text-[10px] text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-0.5 transition"
                title="Xóa hạn chót"
              >
                <X className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            )}
          </div>
          <input
            type="time"
            value={dueTimeStr}
            onChange={(e) => handleDueTimeChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          />
        </div>
      </div>

      {/* 4. Quick Duration Presets */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
          Cộng nhanh thời lượng:
        </span>
        {[
          { label: '+30 phút', mins: 30 },
          { label: '+45 phút', mins: 45 },
          { label: '+1 giờ', mins: 60 },
          { label: '+2 giờ', mins: 120 },
          { label: '+3 giờ', mins: 180 },
        ].map((item) => (
          <button
            key={item.mins}
            type="button"
            onClick={() => addDuration(item.mins)}
            className="px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-850 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 5. Conflict alert if start > due (Non-blocking warning with auto-fix button) */}
      {hasTimeConflict && (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>
              Giờ bắt đầu (<strong>{startTimeStr}</strong>) đang sau giờ kết thúc (<strong>{dueTimeStr}</strong>)!
            </span>
          </div>
          <button
            type="button"
            onClick={fixConflict}
            className="underline font-bold text-[11px] hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer shrink-0 ml-2"
          >
            Đổi giờ kết thúc (+1h)
          </button>
        </div>
      )}

      {/* 6. Live Preview */}
      {previewInfo && (
        <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-neutral-900 dark:text-neutral-100">
              {previewInfo.title}
            </div>
            <div className="text-neutral-600 dark:text-neutral-400 text-[11px] mt-0.5">
              {previewInfo.sub}
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Thời gian hợp lệ" />
        </div>
      )}
    </div>
  );
};
