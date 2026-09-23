import React, { useState, useEffect } from 'react';
import {
  X, Calendar as CalendarIcon, Clock, MapPin, Tag, Palette,
  Sparkles, Trash2, Power, BookOpen, School, AlertCircle, Check
} from 'lucide-react';
import { FixedSchedule, Course, CourseNode } from '../../types';
import { Button } from '../ui/button';
import { api } from '../../services/api';

interface FixedScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FixedSchedule>) => Promise<void>;
  onSaveBatch?: (schedules: Partial<FixedSchedule>[]) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  scheduleToEdit?: FixedSchedule | null;
  initialDayOfWeek?: number;
  onOpenSchoolPreset?: () => void;
}

const COLOR_PRESETS = [
  { value: '#2563eb', label: 'Xanh Royal' },
  { value: '#6366f1', label: 'Tím Indigo' },
  { value: '#7c3aed', label: 'Tím Thạch Anh' },
  { value: '#059669', label: 'Xanh Ngọc' },
  { value: '#0891b2', label: 'Xanh Cyan' },
  { value: '#d97706', label: 'Vàng Hổ Phách' },
  { value: '#ea580c', label: 'Cam Rực Rỡ' },
  { value: '#e11d48', label: 'Đỏ Ruby' },
  { value: '#475569', label: 'Xám Slate' },
  { value: '#0f172a', label: 'Đen Onyx' },
];

const EMOJI_SUGGESTIONS = ['🏫', '📚', '💼', '🏃', '😴', '🎯', '💻', '🎵', '🎨', '☕', '🏊', '⚡', '📌'];

const DAYS = [
  { id: 0, label: 'Thứ 2 (T2)', short: 'T2' },
  { id: 1, label: 'Thứ 3 (T3)', short: 'T3' },
  { id: 2, label: 'Thứ 4 (T4)', short: 'T4' },
  { id: 3, label: 'Thứ 5 (T5)', short: 'T5' },
  { id: 4, label: 'Thứ 6 (T6)', short: 'T6' },
  { id: 5, label: 'Thứ 7 (T7)', short: 'T7' },
  { id: 6, label: 'Chủ nhật (CN)', short: 'CN' },
];

const CATEGORIES = [
  { id: 'SCHOOL', label: '🏫 School (Trường học)', color: '#2563eb', defaultIcon: '🏫' },
  { id: 'STUDY', label: '📚 Study (Học thêm/Tự học)', color: '#7c3aed', defaultIcon: '📚' },
  { id: 'WORK', label: '💼 Work (Làm việc)', color: '#d97706', defaultIcon: '💼' },
  { id: 'EXERCISE', label: '🏃 Exercise (Thể thao/Gym)', color: '#059669', defaultIcon: '🏃' },
  { id: 'SLEEP', label: '😴 Sleep (Giấc ngủ)', color: '#475569', defaultIcon: '😴' },
  { id: 'PERSONAL', label: '👤 Personal (Cá nhân)', color: '#e11d48', defaultIcon: '⭐' },
  { id: 'OTHER', label: '📌 Other (Khác)', color: '#6366f1', defaultIcon: '📌' },
  { id: 'CUSTOM', label: '✏️ Tùy chỉnh danh mục...', color: '#a855f7', defaultIcon: '⚡' },
];

export const FixedScheduleModal: React.FC<FixedScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveBatch,
  onDelete,
  scheduleToEdit,
  initialDayOfWeek,
  onOpenSchoolPreset,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [singleDayOfWeek, setSingleDayOfWeek] = useState<number>(0);
  const [selectedDays, setSelectedDays] = useState<number[]>([0]); // For multi-day create
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('11:15');
  const [category, setCategory] = useState<string>('SCHOOL');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('🏫');
  const [location, setLocation] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Course linkage state
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseNodes, setCourseNodes] = useState<CourseNode[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  const [selectedCourseNodeId, setSelectedCourseNodeId] = useState<number | undefined>(undefined);

  const isEditMode = Boolean(scheduleToEdit);

  useEffect(() => {
    if (!isOpen) return;

    // Load available courses and lesson nodes
    Promise.all([api.courses.list(), api.courses.getAllNodes()])
      .then(([cList, nList]) => {
        setCourses(cList || []);
        setCourseNodes(nList || []);
      })
      .catch((err) => {
        console.warn('Failed to load courses in FixedScheduleModal:', err);
      });

    if (scheduleToEdit) {
      setTitle(scheduleToEdit.title || '');
      setDescription(scheduleToEdit.description || '');
      setSingleDayOfWeek(scheduleToEdit.day_of_week);
      setSelectedDays([scheduleToEdit.day_of_week]);
      setStartTime(scheduleToEdit.start_time || '07:00');
      setEndTime(scheduleToEdit.end_time || '11:15');
      setColor(scheduleToEdit.color || '#2563eb');
      setIcon(scheduleToEdit.icon || '📌');
      setLocation(scheduleToEdit.location || '');
      setIsActive(scheduleToEdit.is_active ?? true);
      setSelectedCourseId(scheduleToEdit.course_id || undefined);
      setSelectedCourseNodeId(scheduleToEdit.course_node_id || undefined);

      const foundCat = CATEGORIES.find((c) => c.id === scheduleToEdit.category);
      if (foundCat) {
        setIsCustomCategory(false);
        setCategory(scheduleToEdit.category);
      } else {
        setIsCustomCategory(true);
        setCustomCategoryName(scheduleToEdit.category);
      }
    } else {
      const defaultDay = initialDayOfWeek !== undefined ? initialDayOfWeek : 0;
      setTitle('');
      setDescription('');
      setSingleDayOfWeek(defaultDay);
      setSelectedDays([defaultDay]);
      setStartTime('07:00');
      setEndTime('11:15');
      setCategory('SCHOOL');
      setColor('#2563eb');
      setIcon('🏫');
      setLocation('');
      setIsActive(true);
      setSelectedCourseId(undefined);
      setSelectedCourseNodeId(undefined);
      setIsCustomCategory(false);
      setCustomCategoryName('');
    }
  }, [isOpen, scheduleToEdit]);

  if (!isOpen) return null;

  const toggleDaySelection = (dayId: number) => {
    if (isEditMode) {
      setSingleDayOfWeek(dayId);
      setSelectedDays([dayId]);
    } else {
      setSelectedDays((prev) => {
        if (prev.includes(dayId)) {
          if (prev.length === 1) return prev;
          return prev.filter((d) => d !== dayId);
        }
        return [...prev, dayId].sort();
      });
    }
  };

  const applyDayPreset = (preset: 'WEEKDAYS' | 'MON_WED_FRI' | 'TUE_THU_SAT' | 'WEEKEND') => {
    if (preset === 'WEEKDAYS') {
      setSelectedDays([0, 1, 2, 3, 4]);
    } else if (preset === 'MON_WED_FRI') {
      setSelectedDays([0, 2, 4]);
    } else if (preset === 'TUE_THU_SAT') {
      setSelectedDays([1, 3, 5]);
    } else if (preset === 'WEEKEND') {
      setSelectedDays([5, 6]);
    }
  };

  const handleCategoryChange = (catId: string) => {
    if (catId === 'CUSTOM') {
      setIsCustomCategory(true);
      setColor('#a855f7');
      setIcon('⚡');
    } else {
      setIsCustomCategory(false);
      setCategory(catId);
      const match = CATEGORIES.find((c) => c.id === catId);
      if (match) {
        setColor(match.color);
        if (!icon || EMOJI_SUGGESTIONS.includes(icon)) {
          setIcon(match.defaultIcon);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (startTime >= endTime) {
      alert('Giờ bắt đầu phải trước giờ kết thúc!');
      return;
    }

    const finalCategory = isCustomCategory ? customCategoryName.trim() || 'CUSTOM' : category;

    setIsSubmitting(true);
    try {
      if (isEditMode && scheduleToEdit) {
        await onSave({
          id: scheduleToEdit.id,
          title: title.trim(),
          description: description.trim() || null,
          day_of_week: singleDayOfWeek,
          start_time: startTime,
          end_time: endTime,
          category: finalCategory,
          color,
          icon: icon || '📌',
          location: location.trim() || null,
          repeat_rule: scheduleToEdit.repeat_rule || 'WEEKLY',
          is_active: isActive,
          course_id: selectedCourseId || null,
          course_node_id: selectedCourseNodeId || null,
        });
      } else {
        if (selectedDays.length > 1 && onSaveBatch) {
          const batchData = selectedDays.map((d) => ({
            title: title.trim(),
            description: description.trim() || null,
            day_of_week: Number(d),
            start_time: startTime,
            end_time: endTime,
            category: finalCategory,
            color,
            icon: icon || '📌',
            location: location.trim() || null,
            repeat_rule: 'WEEKLY',
            is_active: isActive,
            course_id: selectedCourseId || null,
            course_node_id: selectedCourseNodeId || null,
          }));
          await onSaveBatch(batchData);
        } else {
          await onSave({
            title: title.trim(),
            description: description.trim() || null,
            day_of_week: Number(selectedDays[0] ?? 0),
            start_time: startTime,
            end_time: endTime,
            category: finalCategory,
            color,
            icon: icon || '📌',
            location: location.trim() || null,
            repeat_rule: 'WEEKLY',
            is_active: isActive,
            course_id: selectedCourseId || null,
            course_node_id: selectedCourseNodeId || null,
          });
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to save fixed schedule:', err);
      alert('Lỗi khi lưu lịch cố định: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!scheduleToEdit || !onDelete) return;
    if (confirm(`Bạn có chắc chắn muốn xóa lịch cố định "${scheduleToEdit.title}"?`)) {
      setIsSubmitting(true);
      try {
        await onDelete(scheduleToEdit.id);
        onClose();
      } catch (err: any) {
        alert('Lỗi khi xóa: ' + (err?.message || 'Vui lòng thử lại'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const currentDisplayCategory = isCustomCategory ? customCategoryName || 'CUSTOM' : category;
  const filteredLessons = courseNodes.filter((n) => n.course_id === selectedCourseId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-4xl w-full shadow-2xl my-4 sm:my-6 max-h-[94vh] flex flex-col overflow-hidden">
        {/* Subtle Sparkling Glow Gradient Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 animate-pulse" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/50">
          <div className="flex items-center gap-2.5">
            <span className="text-xl p-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs">
              {icon || '📌'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base">
                  {isEditMode ? 'Chỉnh sửa Lịch cố định' : 'Thêm Lịch cố định mới'}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                  Không gian rộng
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Lịch định kỳ xuất hiện đều đặn mỗi tuần trên Thời khóa biểu LifeOS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcut Banner: School Timetable Preset */}
        {!isEditMode && onOpenSchoolPreset && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏫</span>
              <div>
                <div className="font-bold text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <span>Bạn đang là học sinh / sinh viên?</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Tạo nhanh cả tuần T2-T6 (5 tiết) & T7 (4 tiết) tự động tính giờ giải lao
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSchoolPreset();
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition shrink-0"
            >
              Mở Trình tạo TKB
            </button>
          </div>
        )}

        {/* Modal Form Body: 2-Column Grid */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ================= LEFT COLUMN: CỐT LÕI, DANH MỤC & THỨ ================= */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>1. Tên, Khung giờ & Các thứ</span>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs">
                  Tên hoạt động / Môn học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: GDTC - TD1, Tin học, Tập Gym, Ca làm tối..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-xs sm:text-sm shadow-2xs"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Danh mục hoạt động</span>
                </label>
                <select
                  value={isCustomCategory ? 'CUSTOM' : category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>

                {isCustomCategory && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Nhập tên danh mục tự chọn..."
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-850 border border-purple-300 dark:border-purple-700 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Days of week selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                    {isEditMode ? 'Thứ trong tuần' : 'Lặp lại vào các thứ trong tuần:'}
                  </label>
                  {!isEditMode && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                      (Đã chọn {selectedDays.length} ngày)
                    </span>
                  )}
                </div>

                {!isEditMode && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <button
                      type="button"
                      onClick={() => applyDayPreset('WEEKDAYS')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                    >
                      Thứ 2 - Thứ 6
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDayPreset('MON_WED_FRI')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                    >
                      Thứ 2, 4, 6
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDayPreset('TUE_THU_SAT')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                    >
                      Thứ 3, 5, 7
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDayPreset('WEEKEND')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                    >
                      Cuối tuần
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((d) => {
                    const isSelected = isEditMode
                      ? singleDayOfWeek === d.id
                      : selectedDays.includes(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => toggleDaySelection(d.id)}
                        className={`py-2 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span>{d.short}</span>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Giờ bắt đầu</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-100 font-mono font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Giờ kết thúc</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-100 font-mono font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Active status toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/60">
                <div className="flex items-center gap-2">
                  <Power className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-neutral-400'}`} />
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                      {isActive ? 'Đang kích hoạt lịch này' : 'Tạm dừng lịch này'}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {isActive ? 'Xuất hiện đều đặn trên Calendar' : 'Tạm ẩn khỏi Calendar'}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Linked Course & Lesson */}
              <div className="p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Gán với Khóa học / Môn học (Tùy chọn)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Khóa học:
                    </label>
                    <select
                      value={selectedCourseId || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        setSelectedCourseId(val);
                        setSelectedCourseNodeId(undefined);
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">-- Không gán khóa học --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          📚 {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Bài học / Tiết học:
                    </label>
                    <select
                      value={selectedCourseNodeId || ''}
                      disabled={!selectedCourseId || filteredLessons.length === 0}
                      onChange={(e) => setSelectedCourseNodeId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-slate-100 disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedCourseId
                          ? '-- Chọn khóa trước --'
                          : filteredLessons.length === 0
                          ? '-- Chưa có bài học --'
                          : '-- Chọn bài học (tùy chọn) --'}
                      </option>
                      {filteredLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          📖 {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN: TRANG TRÍ & LIVE PREVIEW ================= */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                <span>2. Màu sắc, Biểu tượng & Xem trước</span>
              </div>

              {/* Color Presets + Hex input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-purple-500" />
                    <span>Màu sắc hiển thị</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: color }} />
                    <span className="text-neutral-500">{color}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                        color.toLowerCase() === c.value.toLowerCase()
                          ? 'scale-125 ring-2 ring-offset-2 ring-neutral-900 dark:ring-white shadow-xs'
                          : 'hover:scale-110 opacity-90 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    >
                      {color.toLowerCase() === c.value.toLowerCase() && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                  <div className="relative inline-flex items-center ml-1">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                      title="Chọn màu tự do (Custom HEX)"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Emoji */}
              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs">
                  Biểu tượng (Icon Emoji)
                </label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {EMOJI_SUGGESTIONS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className={`text-base p-1.5 rounded-lg border transition ${
                        icon === emoji
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-2xs scale-110'
                          : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Tùy ý..."
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-14 text-center py-1 text-xs bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              {/* Location & Description */}
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Địa điểm (Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Phòng B302, Tòa A, Sân vận động, Ở nhà..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs">
                    Ghi chú chi tiết (Giáo viên, môn học, tài liệu...)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Mang theo sách bài tập tập 2, làm bài trước khi đến lớp..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* LIVE CARD PREVIEW WITH SPARKLES EFFECT */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>Xem trước thẻ trên Lịch (Live Preview)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">Hiển thị thực tế</span>
                </div>

                <div
                  className="rounded-xl p-3 border shadow-sm relative overflow-hidden transition-all duration-300"
                  style={{
                    backgroundColor: `${color}15`,
                    borderColor: `${color}50`,
                    borderLeftWidth: '4px',
                    borderLeftColor: color,
                  }}
                >
                  {/* Subtle Sparkle Particle in corner */}
                  <div className="absolute top-1.5 right-1.5 opacity-60 pointer-events-none">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                  </div>

                  <div className="flex items-start justify-between gap-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    <span className="truncate flex items-center gap-1.5">
                      <span className="text-base">{icon || '📌'}</span>
                      <span className="truncate">{title.trim() || 'Tên hoạt động / Môn học'}</span>
                    </span>
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0"
                      style={{ color, backgroundColor: `${color}25` }}
                    >
                      {startTime} - {endTime}
                    </span>
                  </div>

                  {location.trim() && (
                    <div className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
                      <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate">{location.trim()}</span>
                    </div>
                  )}

                  {description.trim() && (
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1 italic">
                      {description.trim()}
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                    <span className="uppercase tracking-wider font-semibold">{currentDisplayCategory}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">• Lặp lại hàng tuần</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
            {isEditMode && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold text-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa lịch này</span>
              </button>
            ) : <div />}

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
                disabled={isSubmitting || !title.trim()}
                className="relative overflow-hidden group shadow-md shadow-blue-500/20"
              >
                <span className="relative z-10 flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>
                    {isSubmitting
                      ? 'Đang lưu...'
                      : isEditMode
                      ? 'Cập nhật lịch'
                      : selectedDays.length > 1
                      ? `Tạo cho ${selectedDays.length} ngày`
                      : 'Tạo Lịch cố định'}
                  </span>
                </span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
