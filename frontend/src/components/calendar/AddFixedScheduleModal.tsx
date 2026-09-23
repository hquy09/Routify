import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, Tag, BookOpen } from 'lucide-react';
import { FixedSchedule, Course, CourseNode } from '../../types';
import { Button } from '../ui/button';
import { api } from '../../services/api';

interface AddFixedScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FixedSchedule>) => Promise<void>;
}

export const AddFixedScheduleModal: React.FC<AddFixedScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [startTime, setStartTime] = useState('15:00');
  const [endTime, setEndTime] = useState('17:00');
  const [category, setCategory] = useState<any>('STUDY');
  const [color, setColor] = useState('#6366f1');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Course linkage state
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseNodes, setCourseNodes] = useState<CourseNode[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  const [selectedCourseNodeId, setSelectedCourseNodeId] = useState<number | undefined>(undefined);

  // Load courses & nodes when modal opens
  useEffect(() => {
    if (!isOpen) {
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setSelectedCourseId(undefined);
      setSelectedCourseNodeId(undefined);
    } else {
      Promise.all([api.courses.list(), api.courses.getAllNodes()])
        .then(([cList, nList]) => {
          setCourses(cList || []);
          setCourseNodes(nList || []);
        })
        .catch((err) => console.warn('Failed to load courses in AddFixedScheduleModal:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const finalCategory = isCustomCategory ? (customCategoryName.trim() || 'CUSTOM') : category;
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        category: finalCategory,
        color,
        location: location.trim() || undefined,
        repeat_rule: 'WEEKLY',
        is_active: true,
        course_id: selectedCourseId || undefined,
        course_node_id: selectedCourseNodeId || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = [
    { id: 0, label: 'Thứ 2 (Monday)' },
    { id: 1, label: 'Thứ 3 (Tuesday)' },
    { id: 2, label: 'Thứ 4 (Wednesday)' },
    { id: 3, label: 'Thứ 5 (Thursday)' },
    { id: 4, label: 'Thứ 6 (Friday)' },
    { id: 5, label: 'Thứ 7 (Saturday)' },
    { id: 6, label: 'Chủ nhật (Sunday)' },
  ];

  const categories = [
    { id: 'SCHOOL', label: '🏫 School (Trường học)', color: '#3b82f6' },
    { id: 'STUDY', label: '📚 Study (Học thêm/Tự học)', color: '#8b5cf6' },
    { id: 'WORK', label: '💼 Work (Làm việc)', color: '#f59e0b' },
    { id: 'EXERCISE', label: '🏃 Exercise (Thể thao/Gym)', color: '#10b981' },
    { id: 'SLEEP', label: '😴 Sleep (Giấc ngủ)', color: '#64748b' },
    { id: 'PERSONAL', label: '👤 Personal (Cá nhân)', color: '#ec4899' },
    { id: 'OTHER', label: '📌 Other (Khác)', color: '#6366f1' },
    { id: 'CUSTOM', label: '✏️ Tùy chỉnh danh mục...', color: '#a855f7' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold text-base">
            <CalendarIcon className="w-5 h-5" />
            <span>Thêm Lịch cố định (Fixed Schedule)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Tên hoạt động <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Học Toán Thầy Đức"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Thứ trong tuần</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Lặp lại</label>
              <input
                type="text"
                disabled
                value="Hàng tuần (Every week)"
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg px-2.5 py-2 text-slate-500 dark:text-slate-400 select-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Giờ bắt đầu</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Giờ kết thúc</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Danh mục (Category)</label>
            <select
              value={isCustomCategory ? 'CUSTOM' : category}
              onChange={(e) => {
                const cat = e.target.value;
                if (cat === 'CUSTOM') {
                  setIsCustomCategory(true);
                  setColor('#a855f7');
                } else {
                  setIsCustomCategory(false);
                  setCategory(cat);
                  const match = categories.find((c) => c.id === cat);
                  if (match) setColor(match.color);
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {isCustomCategory && (
            <div className="space-y-1 p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700">
              <label className="block text-neutral-800 dark:text-neutral-200 font-semibold text-[11px]">
                Nhập tên danh mục tùy chỉnh:
              </label>
              <input
                type="text"
                required
                placeholder="VD: Gia sư Tiếng Anh, Thực hành..."
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 text-xs"
              />
            </div>
          )}

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
                  disabled={!selectedCourseId || courseNodes.filter((n) => n.course_id === selectedCourseId).length === 0}
                  onChange={(e) => setSelectedCourseNodeId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-slate-100 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedCourseId
                      ? '-- Chọn khóa trước --'
                      : courseNodes.filter((n) => n.course_id === selectedCourseId).length === 0
                      ? '-- Chưa có bài học --'
                      : '-- Chọn bài học (tùy chọn) --'}
                  </option>
                  {courseNodes.filter((n) => n.course_id === selectedCourseId).map((l) => (
                    <option key={l.id} value={l.id}>
                      📖 {l.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Địa điểm / Nền tảng (Tùy chọn)</label>
            <input
              type="text"
              placeholder="VD: Phòng học 12A1, Zoom..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo Lịch cố định'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
