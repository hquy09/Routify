import React, { useState, useMemo } from 'react';
import {
  X, Calendar as CalendarIcon, Clock, MapPin, Plus, Edit2,
  Trash2, Power, School, Search, Filter, Sparkles, AlertCircle
} from 'lucide-react';
import { FixedSchedule } from '../../types';
import { Button } from '../ui/button';

interface ManageFixedSchedulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: FixedSchedule[];
  onOpenCreate: () => void;
  onOpenEdit: (schedule: FixedSchedule) => void;
  onToggleActive: (schedule: FixedSchedule) => Promise<void>;
  onDelete: (id: number, title: string) => Promise<void>;
  onOpenSchoolPreset: () => void;
}

const DAYS_NAMES = [
  'Thứ Hai (Monday)',
  'Thứ Ba (Tuesday)',
  'Thứ Tư (Wednesday)',
  'Thứ Năm (Thursday)',
  'Thứ Sáu (Friday)',
  'Thứ Bảy (Saturday)',
  'Chủ Nhật (Sunday)',
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

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
      if (groups[s.day_of_week]) {
        groups[s.day_of_week].push(s);
      }
    });

    // Sort each group by start_time
    Object.keys(groups).forEach((key) => {
      const k = Number(key);
      groups[k].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return groups;
  }, [filteredSchedules]);

  const activeCount = schedules.filter((s) => s.is_active).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl my-6 max-h-[92vh] overflow-y-auto flex flex-col scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="text-xl p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800">
              📅
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base">
                  Quản Lý Lịch Cố Định Hàng Tuần
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {activeCount}/{schedules.length} đang bật
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Toàn bộ thời gian biểu học tập, công việc, hoạt động định kỳ lặp lại hàng tuần
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

        {/* Toolbar & Shortcuts */}
        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên môn, địa điểm, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSchoolPreset();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 font-semibold text-xs transition"
            >
              <School className="w-3.5 h-3.5" />
              <span>Tạo nhanh TKB trường</span>
            </button>

            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onOpenCreate();
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm mới</span>
            </Button>
          </div>
        </div>

        {/* Schedule List grouped by day */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 scrollbar-thin">
          {schedules.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-2xl">
                📅
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                  Chưa có lịch cố định nào
                </h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Hãy thêm lịch học trên trường, lịch học thêm, ca làm việc hoặc giấc ngủ để hệ thống tự động cảnh báo trùng giờ và tính toán giờ rảnh.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSchoolPreset();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                >
                  🏫 Tạo nhanh TKB trường học
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreate();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 font-semibold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  + Thêm thủ công
                </button>
              </div>
            </div>
          ) : (
            [0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
              const daySchedules = groupedByDay[dayIdx] || [];
              if (daySchedules.length === 0 && searchQuery) return null;

              return (
                <div key={dayIdx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300 pb-1 border-b border-neutral-100 dark:border-neutral-800/80">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>{DAYS_NAMES[dayIdx]}</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {daySchedules.length} hoạt động
                    </span>
                  </div>

                  {daySchedules.length === 0 ? (
                    <div className="text-[11px] text-neutral-400 italic py-1 pl-4">
                      Không có lịch cố định vào ngày này
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5">
                      {daySchedules.map((item) => {
                        const itemColor = item.color || '#6366f1';

                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              item.is_active
                                ? 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-800 hover:shadow-xs'
                                : 'bg-neutral-100/60 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 opacity-60'
                            }`}
                            style={{
                              borderLeftColor: itemColor,
                              borderLeftWidth: '4px',
                            }}
                          >
                            {/* Left details */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg shrink-0">{item.icon || '📌'}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                                    {item.title}
                                  </span>
                                  <span
                                    className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${itemColor}20`,
                                      color: itemColor,
                                    }}
                                  >
                                    {item.start_time} - {item.end_time}
                                  </span>
                                  {!item.is_active && (
                                    <span className="text-[9px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1 py-0.2 rounded">
                                      Tạm dừng
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
                                  {item.location && (
                                    <span className="flex items-center gap-0.5 truncate max-w-[180px]">
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      <span>{item.location}</span>
                                    </span>
                                  )}
                                  {item.description && (
                                    <span className="truncate max-w-[200px] italic">
                                      "{item.description}"
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right action controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Active toggle button */}
                              <button
                                type="button"
                                onClick={() => onToggleActive(item)}
                                className={`p-1.5 rounded-lg border transition ${
                                  item.is_active
                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                                    : 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700'
                                }`}
                                title={item.is_active ? 'Bấm để tạm dừng lịch này' : 'Bấm để kích hoạt lại'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit button */}
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenEdit(item);
                                }}
                                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition"
                                title="Chỉnh sửa lịch này"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => onDelete(item.id, item.title)}
                                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-400 hover:text-rose-600 transition"
                                title="Xóa lịch cố định này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
