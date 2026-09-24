import React, { useState, useMemo } from 'react';
import {
  X, Calendar as CalendarIcon, Clock, MapPin, Plus, Edit2,
  Trash2, Power, School, Search, Filter, Sparkles, AlertCircle,
  LayoutGrid, LayoutList, ChevronDown, ChevronRight, Layers,
  Sun, Sunset, Moon, CheckCircle2, PauseCircle, ChevronLeft
} from 'lucide-react';
import { FixedSchedule } from '../../types';
import { Button } from '../ui/button';

interface ManageFixedSchedulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: FixedSchedule[];
  onOpenCreate: (dayOfWeek?: number) => void;
  onOpenEdit: (schedule: FixedSchedule) => void;
  onToggleActive: (schedule: FixedSchedule) => Promise<void>;
  onDelete: (id: number, title: string) => Promise<void>;
  onOpenSchoolPreset: () => void;
}

type ViewMode = 'TABS' | 'GRID' | 'LIST';

interface DayConfig {
  dayIndex: number;
  name: string;
  short: string;
  en: string;
  color: string;
}

const DAYS_CONFIG: DayConfig[] = [
  { dayIndex: 0, name: 'Thứ Hai', short: 'T2', en: 'Monday', color: '#3b82f6' },
  { dayIndex: 1, name: 'Thứ Ba', short: 'T3', en: 'Tuesday', color: '#6366f1' },
  { dayIndex: 2, name: 'Thứ Tư', short: 'T4', en: 'Wednesday', color: '#8b5cf6' },
  { dayIndex: 3, name: 'Thứ Năm', short: 'T5', en: 'Thursday', color: '#d97706' },
  { dayIndex: 4, name: 'Thứ Sáu', short: 'T6', en: 'Friday', color: '#10b981' },
  { dayIndex: 5, name: 'Thứ Bảy', short: 'T7', en: 'Saturday', color: '#06b6d4' },
  { dayIndex: 6, name: 'Chủ Nhật', short: 'CN', en: 'Sunday', color: '#f43f5e' },
];

const CATEGORIES_DEF = [
  { id: 'ALL', label: 'Tất cả', icon: '📋' },
  { id: 'SCHOOL', label: 'Trường học', icon: '🏫' },
  { id: 'STUDY', label: 'Học thêm / Tự học', icon: '📚' },
  { id: 'WORK', label: 'Làm việc', icon: '💼' },
  { id: 'EXERCISE', label: 'Thể thao / Gym', icon: '🏃' },
  { id: 'SLEEP', label: 'Giấc ngủ', icon: '😴' },
  { id: 'PERSONAL', label: 'Cá nhân', icon: '⭐' },
  { id: 'OTHER', label: 'Khác', icon: '📌' },
];

type SessionType = 'MORNING' | 'AFTERNOON' | 'EVENING';

const getSession = (timeStr: string): SessionType => {
  const h = parseInt(timeStr.split(':')[0], 10);
  if (isNaN(h)) return 'MORNING';
  if (h < 12) return 'MORNING';
  if (h < 18) return 'AFTERNOON';
  return 'EVENING';
};

const SESSIONS_CONFIG: { type: SessionType; label: string; icon: string; timeRange: string; colorClass: string }[] = [
  { type: 'MORNING', label: 'Buổi Sáng', icon: '🌅', timeRange: 'Trước 12:00', colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  { type: 'AFTERNOON', label: 'Buổi Chiều', icon: '☀️', timeRange: '12:00 - 18:00', colorClass: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800' },
  { type: 'EVENING', label: 'Buổi Tối & Đêm', icon: '🌙', timeRange: 'Sau 18:00', colorClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
];

const getDurationText = (start: string, end: string): string => {
  try {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    if (diff <= 0) return '';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0 && m > 0) return `${h}h${m}p`;
    if (h > 0) return `${h}h`;
    return `${m}p`;
  } catch {
    return '';
  }
};

export const ManageFixedSchedulesModal: React.FC<ManageFixedSchedulesModalProps> = ({
  isOpen,
  onClose,
  schedules,
  onOpenCreate,
  onOpenEdit,
  onToggleActive,
  onDelete,
  onOpenSchoolPreset,
}) => {
  // Determine current day of week (0=Mon..6=Sun)
  const todayDayOfWeek = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('TABS');
  const [selectedDayTab, setSelectedDayTab] = useState<number | 'ALL'>(todayDayOfWeek);
  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategoryFilter === 'ALL' || s.category === selectedCategoryFilter;

      return matchSearch && matchCategory;
    });
  }, [schedules, searchQuery, selectedCategoryFilter]);

  // Group by day of week (0 to 6)
  const groupedByDay = useMemo(() => {
    const groups: { [key: number]: FixedSchedule[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    filteredSchedules.forEach((s) => {
      if (groups[s.day_of_week] !== undefined) {
        groups[s.day_of_week].push(s);
      }
    });

    // Sort each group chronologically by start_time
    Object.keys(groups).forEach((key) => {
      const k = Number(key);
      groups[k].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return groups;
  }, [filteredSchedules]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: schedules.length };
    schedules.forEach((s) => {
      const cat = s.category || 'OTHER';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [schedules]);

  const activeCount = useMemo(() => schedules.filter((s) => s.is_active).length, [schedules]);
  const inactiveCount = schedules.length - activeCount;

  // Toggle all for a specific day
  const handleToggleAllForDay = async (dayIdx: number) => {
    const dayItems = groupedByDay[dayIdx] || [];
    if (dayItems.length === 0) return;
    const anyActive = dayItems.some((s) => s.is_active);
    const targetStatus = !anyActive;

    // Toggle items sequentially or concurrently
    for (const item of dayItems) {
      if (item.is_active !== targetStatus) {
        await onToggleActive(item);
      }
    }
  };

  const handleToggleCollapse = (dayIdx: number) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [dayIdx]: !prev[dayIdx],
    }));
  };

  const handleCollapseAll = () => {
    const allCollapsed: Record<number, boolean> = {};
    DAYS_CONFIG.forEach((d) => {
      allCollapsed[d.dayIndex] = true;
    });
    setCollapsedDays(allCollapsed);
  };

  const handleExpandAll = () => {
    setCollapsedDays({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full p-4 sm:p-6 shadow-2xl my-4 max-h-[94vh] overflow-y-auto flex flex-col scrollbar-thin transition-all ${
          viewMode === 'GRID' ? 'max-w-7xl' : 'max-w-4xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 dark:border-neutral-800 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 shrink-0">
              📅
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base sm:text-lg">
                  Quản Lý Lịch Cố Định Hàng Tuần
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {activeCount}/{schedules.length} đang bật
                </span>
                {inactiveCount > 0 && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    {inactiveCount} tạm dừng
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Thời khóa biểu trường học, ca làm việc, học thêm và các hoạt động lặp lại theo thứ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Action: TKB Trường học */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSchoolPreset();
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-semibold text-xs transition"
              title="Đồng bộ tự động thời khóa biểu trường hoặc nạp bảng ma trận TKB"
            >
              <School className="w-3.5 h-3.5" />
              <span>Tạo nhanh TKB trường</span>
            </button>

            {/* Quick Action: Thêm mới */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenCreate(typeof selectedDayTab === 'number' ? selectedDayTab : undefined);
              }}
              className="gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Lịch cố định</span>
            </Button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search + View Modes */}
        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm kiếm môn học, phòng học, địa điểm, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <div className="inline-flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/80 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              <button
                type="button"
                onClick={() => setViewMode('TABS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                  viewMode === 'TABS'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Xem tập trung theo từng Thứ trong tuần"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Theo Thứ</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                  viewMode === 'GRID'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Xem ma trận Lưới 7 Cột (Thứ 2 đến Chủ Nhật song song)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lưới Tuần (7 Cột)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                  viewMode === 'LIST'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Xem danh sách tất cả các thứ dạng hàng phân lớp thu gọn"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Phân Lớp Hàng</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-neutral-100 dark:border-neutral-800/80 text-xs">
          <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Danh mục:
          </span>
          {CATEGORIES_DEF.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            if (cat.id !== 'ALL' && count === 0) return null; // Hide empty categories
            const isSelected = selectedCategoryFilter === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition shrink-0 flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-blue-700 text-blue-100' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Day Navigation Tabs (Active in 'TABS' view mode) */}
        {viewMode === 'TABS' && (
          <div className="pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedDayTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                selectedDayTab === 'ALL'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                  : 'bg-neutral-50 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Tất cả các thứ</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                selectedDayTab === 'ALL' ? 'bg-neutral-700 dark:bg-neutral-200 text-white dark:text-neutral-900' : 'bg-neutral-200 dark:bg-neutral-700'
              }`}>
                {filteredSchedules.length}
              </span>
            </button>

            {DAYS_CONFIG.map((d) => {
              const daySchedules = groupedByDay[d.dayIndex] || [];
              const count = daySchedules.length;
              const isSelected = selectedDayTab === d.dayIndex;
              const isToday = d.dayIndex === todayDayOfWeek;

              return (
                <button
                  key={d.dayIndex}
                  type="button"
                  onClick={() => setSelectedDayTab(d.dayIndex)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 border relative ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : isToday
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 hover:bg-blue-100'
                      : 'bg-neutral-50 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  <span>{d.name}</span>
                  {isToday && <span className="text-[9px] font-semibold opacity-90">(Hôm nay)</span>}
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isSelected
                        ? 'bg-blue-700 text-white'
                        : isToday
                        ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Global Expand/Collapse in LIST mode */}
        {viewMode === 'LIST' && (
          <div className="pt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Toàn bộ 7 ngày trong tuần dạng phân lớp hàng:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Mở rộng tất cả
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline font-semibold"
              >
                Gập gọn tất cả
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 scrollbar-thin">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-2xl">
                📅
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                  {searchQuery || selectedCategoryFilter !== 'ALL'
                    ? 'Không tìm thấy lịch cố định phù hợp'
                    : 'Chưa có lịch cố định nào'}
                </h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  {searchQuery || selectedCategoryFilter !== 'ALL'
                    ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục "Tất cả".'
                    : 'Thêm thời khóa biểu học tập, công việc hoặc giấc ngủ để tự động hiển thị và phát hiện trùng giờ.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSchoolPreset();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                >
                  🏫 Tạo nhanh TKB trường học
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreate(typeof selectedDayTab === 'number' ? selectedDayTab : undefined);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  + Tạo Lịch cố định
                </button>
              </div>
            </div>
          ) : viewMode === 'GRID' ? (
            /* VIEW 1: 7-COLUMN WEEKLY MATRIX TIMETABLE */
            <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-7 gap-3 min-w-[960px]">
                {DAYS_CONFIG.map((d) => {
                  const daySchedules = groupedByDay[d.dayIndex] || [];
                  const isToday = d.dayIndex === todayDayOfWeek;

                  return (
                    <div
                      key={d.dayIndex}
                      className={`flex flex-col rounded-xl border bg-neutral-50/50 dark:bg-neutral-900/50 overflow-hidden ${
                        isToday
                          ? 'border-blue-500/60 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {/* Column Day Header */}
                      <div
                        className={`p-2.5 border-b flex items-center justify-between ${
                          isToday
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-100'
                            : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 font-extrabold text-xs">
                            <span>{d.short}</span>
                            <span className="font-medium text-[10px] text-neutral-500 dark:text-neutral-400">
                              ({d.name})
                            </span>
                          </div>
                          {isToday && (
                            <span className="inline-block text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              • Hôm nay
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                            {daySchedules.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenCreate(d.dayIndex);
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            title={`Thêm lịch vào ${d.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Column Schedule Cards List */}
                      <div className="p-2 space-y-2 flex-1 min-h-[140px] max-h-[620px] overflow-y-auto scrollbar-thin">
                        {daySchedules.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-3 text-[11px] text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                            <span>Không có lịch</span>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenCreate(d.dayIndex);
                              }}
                              className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                            >
                              + Thêm ngay
                            </button>
                          </div>
                        ) : (
                          daySchedules.map((item) => {
                            const itemColor = item.color || '#3b82f6';
                            const duration = getDurationText(item.start_time, item.end_time);

                            return (
                              <div
                                key={item.id}
                                className={`group p-2 rounded-lg border transition-all relative flex flex-col justify-between ${
                                  item.is_active
                                    ? 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 shadow-2xs'
                                    : 'bg-neutral-100/70 dark:bg-neutral-900/70 border-neutral-200 dark:border-neutral-800 opacity-60'
                                }`}
                                style={{
                                  borderLeftColor: itemColor,
                                  borderLeftWidth: '3.5px',
                                }}
                              >
                                <div>
                                  {/* Time badge */}
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span
                                      className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded"
                                      style={{
                                        backgroundColor: `${itemColor}18`,
                                        color: itemColor,
                                      }}
                                    >
                                      {item.start_time} - {item.end_time}
                                    </span>
                                    {duration && (
                                      <span className="text-[9px] text-neutral-400 font-mono">
                                        {duration}
                                      </span>
                                    )}
                                  </div>

                                  {/* Title & Icon */}
                                  <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-start gap-1 leading-snug">
                                    <span className="shrink-0 text-sm leading-none mt-0.5">
                                      {item.icon || '📌'}
                                    </span>
                                    <span className="line-clamp-2">{item.title}</span>
                                  </div>

                                  {/* Location */}
                                  {item.location && (
                                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate">{item.location}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Hover actions bar */}
                                <div className="mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                                  <span className="text-[9px] font-semibold">
                                    {!item.is_active && (
                                      <span className="text-amber-600 dark:text-amber-400">
                                        Tạm dừng
                                      </span>
                                    )}
                                  </span>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Power toggle */}
                                    <button
                                      type="button"
                                      onClick={() => onToggleActive(item)}
                                      className={`p-1 rounded transition ${
                                        item.is_active
                                          ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                          : 'text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                                      }`}
                                      title={item.is_active ? 'Tạm dừng lịch này' : 'Bật lại lịch này'}
                                    >
                                      <Power className="w-3 h-3" />
                                    </button>

                                    {/* Edit */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onClose();
                                        onOpenEdit(item);
                                      }}
                                      className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                      title="Chỉnh sửa"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>

                                    {/* Delete */}
                                    <button
                                      type="button"
                                      onClick={() => onDelete(item.id, item.title)}
                                      className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                      title="Xóa"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === 'TABS' ? (
            /* VIEW 2: FOCUSED DAY TABS VIEW */
            (() => {
              const daysToRender =
                selectedDayTab === 'ALL'
                  ? [0, 1, 2, 3, 4, 5, 6]
                  : [Number(selectedDayTab)];

              return (
                <div className="space-y-6">
                  {daysToRender.map((dayIdx) => {
                    const dayConfig = DAYS_CONFIG[dayIdx];
                    const daySchedules = groupedByDay[dayIdx] || [];
                    const isToday = dayIdx === todayDayOfWeek;

                    if (daySchedules.length === 0 && selectedDayTab === 'ALL') {
                      return null; // Skip empty days in 'ALL' tabs view
                    }

                    // Partition by sessions (Sáng, Chiều, Tối)
                    const sessionGroups: Record<SessionType, FixedSchedule[]> = {
                      MORNING: [],
                      AFTERNOON: [],
                      EVENING: [],
                    };

                    daySchedules.forEach((item) => {
                      const session = getSession(item.start_time);
                      sessionGroups[session].push(item);
                    });

                    return (
                      <div
                        key={dayIdx}
                        className="bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs space-y-3.5"
                      >
                        {/* Day Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dayConfig.color }} />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                                  {dayConfig.name} ({dayConfig.en})
                                </h4>
                                {isToday && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    Hôm nay
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-500 font-mono">
                                {daySchedules.length} hoạt động • {daySchedules.filter((s) => s.is_active).length} đang bật
                              </p>
                            </div>
                          </div>

                          {/* Quick Day Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {daySchedules.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleToggleAllForDay(dayIdx)}
                                className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 transition"
                                title="Bật hoặc tạm dừng toàn bộ lịch trong ngày này"
                              >
                                Bật/Tắt ngày này
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenCreate(dayIdx);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thêm vào {dayConfig.name}</span>
                            </button>
                          </div>
                        </div>

                        {/* Schedules partitioned by session */}
                        {daySchedules.length === 0 ? (
                          <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg">
                            <p>Không có lịch cố định nào vào {dayConfig.name}</p>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenCreate(dayIdx);
                              }}
                              className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              + Thêm lịch cho {dayConfig.name}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {SESSIONS_CONFIG.map((session) => {
                              const items = sessionGroups[session.type];
                              if (items.length === 0) return null;

                              return (
                                <div key={session.type} className="space-y-2">
                                  {/* Session divider */}
                                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${session.colorClass}`}>
                                      <span>{session.icon}</span>
                                      <span>{session.label}</span>
                                    </span>
                                    <span className="text-[10px] text-neutral-400 font-mono">
                                      ({session.timeRange} • {items.length} lịch)
                                    </span>
                                    <div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                                  </div>

                                  {/* Schedule Cards */}
                                  <div className="grid grid-cols-1 gap-2">
                                    {items.map((item) => (
                                      <ScheduleRowCard
                                        key={item.id}
                                        item={item}
                                        onClose={onClose}
                                        onOpenEdit={onOpenEdit}
                                        onToggleActive={onToggleActive}
                                        onDelete={onDelete}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            /* VIEW 3: COLLAPSIBLE ACCORDION ROWS LIST VIEW */
            <div className="space-y-3">
              {DAYS_CONFIG.map((d) => {
                const daySchedules = groupedByDay[d.dayIndex] || [];
                const isCollapsed = Boolean(collapsedDays[d.dayIndex]);
                const isToday = d.dayIndex === todayDayOfWeek;

                if (daySchedules.length === 0 && searchQuery) return null;

                return (
                  <div
                    key={d.dayIndex}
                    className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-850 shadow-2xs"
                  >
                    {/* Collapsible Header */}
                    <div
                      onClick={() => handleToggleCollapse(d.dayIndex)}
                      className={`p-3 flex items-center justify-between cursor-pointer select-none transition ${
                        isToday
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
                          {d.name} ({d.en})
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Hôm nay
                          </span>
                        )}
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {daySchedules.length} hoạt động
                        </span>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCreate(d.dayIndex);
                          }}
                          className="px-2 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Thêm lịch</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {!isCollapsed && (
                      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2 bg-neutral-50/40 dark:bg-neutral-900/40">
                        {daySchedules.length === 0 ? (
                          <div className="text-xs text-neutral-400 italic py-2 pl-3">
                            Chưa có lịch cố định vào {d.name}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {daySchedules.map((item) => (
                              <ScheduleRowCard
                                key={item.id}
                                item={item}
                                onClose={onClose}
                                onOpenEdit={onOpenEdit}
                                onToggleActive={onToggleActive}
                                onDelete={onDelete}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span>💡 Mẹo: Bấm vào nút Bật/Tắt để tạm dừng lịch mà không cần xóa.</span>
          </div>

          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Standard Schedule Row Card
interface ScheduleRowCardProps {
  item: FixedSchedule;
  onClose: () => void;
  onOpenEdit: (schedule: FixedSchedule) => void;
  onToggleActive: (schedule: FixedSchedule) => Promise<void>;
  onDelete: (id: number, title: string) => Promise<void>;
}

const ScheduleRowCard: React.FC<ScheduleRowCardProps> = ({
  item,
  onClose,
  onOpenEdit,
  onToggleActive,
  onDelete,
}) => {
  const itemColor = item.color || '#3b82f6';
  const duration = getDurationText(item.start_time, item.end_time);

  return (
    <div
      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
        item.is_active
          ? 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 hover:shadow-xs'
          : 'bg-neutral-100/70 dark:bg-neutral-900/70 border-neutral-200 dark:border-neutral-800 opacity-60'
      }`}
      style={{
        borderLeftColor: itemColor,
        borderLeftWidth: '4px',
      }}
    >
      {/* Left Details */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{
            backgroundColor: `${itemColor}15`,
            color: itemColor,
          }}
        >
          {item.icon || '📌'}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
              {item.title}
            </span>

            {/* Time Pill */}
            <span
              className="font-mono text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1"
              style={{
                backgroundColor: `${itemColor}18`,
                color: itemColor,
              }}
            >
              <Clock className="w-3 h-3 inline-block" />
              <span>{item.start_time} - {item.end_time}</span>
              {duration && <span className="opacity-80">({duration})</span>}
            </span>

            {/* Category tag */}
            {item.category && item.category !== 'OTHER' && (
              <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                {item.category}
              </span>
            )}

            {/* Inactive tag */}
            {!item.is_active && (
              <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                Tạm dừng
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap">
            {item.location && (
              <span className="flex items-center gap-1 truncate max-w-[220px]">
                <MapPin className="w-3 h-3 shrink-0 text-neutral-400" />
                <span className="truncate">{item.location}</span>
              </span>
            )}

            {item.description && (
              <span className="truncate max-w-[280px] italic">
                "{item.description}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Active toggle button */}
        <button
          type="button"
          onClick={() => onToggleActive(item)}
          className={`p-2 rounded-lg border transition ${
            item.is_active
              ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
              : 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200'
          }`}
          title={item.is_active ? 'Bấm để tạm dừng lịch này' : 'Bấm để kích hoạt lại'}
        >
          <Power className="w-4 h-4" />
        </button>

        {/* Edit button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenEdit(item);
          }}
          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition"
          title="Chỉnh sửa lịch này"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete(item.id, item.title)}
          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-400 hover:text-rose-600 transition"
          title="Xóa lịch cố định này"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
