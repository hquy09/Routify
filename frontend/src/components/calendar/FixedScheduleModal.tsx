import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Calendar as CalendarIcon, Clock, MapPin, Tag, Palette,
  Sparkles, Trash2, BookOpen, AlertCircle, Check, Plus,
  ChevronDown, ChevronRight, Settings2, Lightbulb, AlertTriangle
} from 'lucide-react';
import { FixedSchedule, Course, CourseNode } from '../../types';
import { Button } from '../ui/button';
import { api } from '../../services/api';

interface ExtraTimeSlot {
  id: string;
  days: number[];
  startTime: string;
  endTime: string;
}

interface FixedScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FixedSchedule>) => Promise<void>;
  onSaveBatch?: (schedules: Partial<FixedSchedule>[]) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  scheduleToEdit?: FixedSchedule | null;
  initialDayOfWeek?: number;
  existingSchedules?: FixedSchedule[];
  onOpenSchoolPreset?: () => void;
}

const COLOR_PRESETS = [
  { value: '#2563eb', label: 'Xanh Royal' },
  { value: '#6366f1', label: 'Tím Indigo' },
  { value: '#7c3aed', label: 'Tím Thạch Anh' },
  { value: '#059669', label: 'Xanh Ngọc' },
  { value: '#0891b2', label: 'Xanh Cyan' },
  { value: '#d97706', label: 'Cam Hổ Phách' },
  { value: '#ea580c', label: 'Cam Rực Rỡ' },
  { value: '#e11d48', label: 'Đỏ Ruby' },
  { value: '#475569', label: 'Xám Slate' },
  { value: '#0f172a', label: 'Đen Onyx' },
];

const EMOJI_SUGGESTIONS = ['🏫', '📚', '💼', '🏃', '😴', '🎯', '💻', '🎵', '🎨', '☕', '🏊', '⚡', '📌'];

const DAYS = [
  { id: 0, label: 'Thứ Hai', short: 'T2' },
  { id: 1, label: 'Thứ Ba', short: 'T3' },
  { id: 2, label: 'Thứ Tư', short: 'T4' },
  { id: 3, label: 'Thứ Năm', short: 'T5' },
  { id: 4, label: 'Thứ Sáu', short: 'T6' },
  { id: 5, label: 'Thứ Bảy', short: 'T7' },
  { id: 6, label: 'Chủ Nhật', short: 'CN' },
];

const CATEGORIES = [
  { id: 'SCHOOL', label: '🏫 Trường học', shortLabel: 'TRƯỜNG HỌC', color: '#2563eb', defaultIcon: '🏫' },
  { id: 'STUDY', label: '📚 Tự học / Ôn tập', shortLabel: 'TỰ HỌC / ÔN TẬP', color: '#7c3aed', defaultIcon: '📚' },
  { id: 'WORK', label: '💼 Làm việc', shortLabel: 'LÀM VIỆC', color: '#d97706', defaultIcon: '💼' },
  { id: 'EXERCISE', label: '🏃 Thể thao / Rèn luyện', shortLabel: 'THỂ THAO / RÈN LUYỆN', color: '#059669', defaultIcon: '🏃' },
  { id: 'SLEEP', label: '😴 Giấc ngủ', shortLabel: 'GIẤC NGỦ', color: '#475569', defaultIcon: '😴' },
  { id: 'PERSONAL', label: '⭐ Cá nhân', shortLabel: 'CÁ NHÂN', color: '#e11d48', defaultIcon: '⭐' },
  { id: 'OTHER', label: '📌 Khác', shortLabel: 'KHÁC', color: '#6366f1', defaultIcon: '📌' },
  { id: 'CUSTOM', label: '✏️ Tùy chỉnh danh mục...', shortLabel: 'TÙY CHỈNH', color: '#a855f7', defaultIcon: '⚡' },
];

const TITLE_SUGGESTIONS = ['Học Toán', 'Tiếng Anh', 'Tập Gym', 'Làm việc', 'Chạy bộ', 'Ngủ trưa'];

const addMinutesToTime = (start: string, minutes: number): string => {
  const [h, m] = start.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return start;
  const total = h * 60 + m + minutes;
  const newH = Math.floor((total % (24 * 60)) / 60);
  const newM = (total % (24 * 60)) % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

const getDurationInfo = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMinutes <= 0) {
    return { isValid: false, text: 'Giờ kết thúc phải sau giờ bắt đầu' };
  }
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  let text = '';
  if (hours > 0 && mins > 0) text = `${hours} giờ ${mins} phút`;
  else if (hours > 0) text = `${hours} giờ`;
  else text = `${mins} phút`;
  return { isValid: true, text, diffMinutes };
};

const suggestCategoryFromTitle = (text: string): string | null => {
  const lower = text.toLowerCase();
  if (/gym|thể dục|thể thao|chạy|bơi|yoga|workout|đá bóng|cầu lông|bóng rổ|fitness/i.test(lower)) {
    return 'EXERCISE';
  }
  if (/ngủ|sleep|nghỉ trưa|nghỉ ngơi/i.test(lower)) {
    return 'SLEEP';
  }
  if (/làm việc|họp|meeting|ca làm|work|dự án|khách hàng|báo cáo|deadline|công việc/i.test(lower)) {
    return 'WORK';
  }
  if (/toán|văn|tiếng anh|ngoại ngữ|vật lý|hóa học|sinh học|lịch sử|địa lý|tin học|gdcd|công nghệ|chào cờ|sinh hoạt lớp|tiết \d|lớp \d|thpt/i.test(lower)) {
    return 'SCHOOL';
  }
  if (/tự học|ôn thi|luyện đề|học thêm|đọc sách|nghiên cứu|bài tập/i.test(lower)) {
    return 'STUDY';
  }
  if (/gia đình|mua sắm|dọn dẹp|cắt tóc|nấu ăn|du lịch|bạn bè/i.test(lower)) {
    return 'PERSONAL';
  }
  return null;
};

export const FixedScheduleModal: React.FC<FixedScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveBatch,
  onDelete,
  scheduleToEdit,
  initialDayOfWeek,
  existingSchedules: propExistingSchedules,
  onOpenSchoolPreset,
}) => {
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  const [description, setDescription] = useState('');
  const [singleDayOfWeek, setSingleDayOfWeek] = useState<number>(0);
  const [selectedDays, setSelectedDays] = useState<number[]>([0]);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('11:15');
  const [category, setCategory] = useState<string>('SCHOOL');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('🏫');
  const [location, setLocation] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Category State
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Custom Emoji Mode
  const [isCustomEmojiOpen, setIsCustomEmojiOpen] = useState(false);
  const [customEmojiInput, setCustomEmojiInput] = useState('');

  // Course linkage state
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseNodes, setCourseNodes] = useState<CourseNode[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  const [selectedCourseNodeId, setSelectedCourseNodeId] = useState<number | undefined>(undefined);

  // Accordion state
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Multi-Slot creation state
  const [extraSlots, setExtraSlots] = useState<ExtraTimeSlot[]>([]);

  // Existing schedules for conflict detection
  const [internalSchedules, setInternalSchedules] = useState<FixedSchedule[]>([]);

  // Dismissible student banner state
  const [showStudentBanner, setShowStudentBanner] = useState<boolean>(() => {
    return localStorage.getItem('lifeos_hide_student_banner') !== 'true';
  });

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

    // If existing schedules not passed in props, load them for conflict checking
    if (!propExistingSchedules || propExistingSchedules.length === 0) {
      api.schedules.list()
        .then((list) => setInternalSchedules(list || []))
        .catch((err) => console.warn('Failed to load schedules for conflict check:', err));
    }

    if (scheduleToEdit) {
      setTitle(scheduleToEdit.title || '');
      setTitleError(false);
      setDescription(scheduleToEdit.description || '');
      setSingleDayOfWeek(scheduleToEdit.day_of_week);
      setSelectedDays([scheduleToEdit.day_of_week]);
      setStartTime(scheduleToEdit.start_time || '07:00');
      setEndTime(scheduleToEdit.end_time || '11:15');
      setColor(scheduleToEdit.color || '#2563eb');
      setIcon(scheduleToEdit.icon || '📌');
      setLocation(scheduleToEdit.location || '');
      setIsActive(scheduleToEdit.is_active ?? true);
      setStartDate(scheduleToEdit.start_date || '');
      setEndDate(scheduleToEdit.end_date || '');
      setSelectedCourseId(scheduleToEdit.course_id || undefined);
      setSelectedCourseNodeId(scheduleToEdit.course_node_id || undefined);
      setExtraSlots([]);

      const foundCat = CATEGORIES.find((c) => c.id === scheduleToEdit.category);
      if (foundCat) {
        setIsCustomCategory(false);
        setCategory(scheduleToEdit.category);
      } else {
        setIsCustomCategory(true);
        setCustomCategoryName(scheduleToEdit.category);
      }

      // Automatically open advanced options if any advanced fields are populated
      if (
        scheduleToEdit.course_id ||
        scheduleToEdit.location ||
        scheduleToEdit.description ||
        scheduleToEdit.start_date ||
        scheduleToEdit.end_date
      ) {
        setIsAdvancedOpen(true);
      }
    } else {
      const defaultDay = initialDayOfWeek !== undefined ? initialDayOfWeek : 0;
      setTitle('');
      setTitleError(false);
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
      setStartDate('');
      setEndDate('');
      setSelectedCourseId(undefined);
      setSelectedCourseNodeId(undefined);
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setExtraSlots([]);
      setIsAdvancedOpen(false);
    }
  }, [isOpen, scheduleToEdit, propExistingSchedules, initialDayOfWeek]);

  const allAvailableSchedules = propExistingSchedules?.length
    ? propExistingSchedules
    : internalSchedules;

  // Day toggle
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

  const applyDayPreset = (preset: 'ALL' | 'WEEKDAYS' | 'MON_WED_FRI' | 'TUE_THU_SAT' | 'WEEKEND') => {
    if (preset === 'ALL') {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (preset === 'WEEKDAYS') {
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
        setIcon(match.defaultIcon);
      }
    }
  };

  // Title change with smart category detection
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (titleError && val.trim()) {
      setTitleError(false);
    }
    // Only auto-detect category if user hasn't explicitly picked CUSTOM
    if (!isCustomCategory) {
      const detected = suggestCategoryFromTitle(val);
      if (detected && detected !== category) {
        setCategory(detected);
        const match = CATEGORIES.find((c) => c.id === detected);
        if (match) {
          setColor(match.color);
          setIcon(match.defaultIcon);
        }
      }
    }
  };

  // Quick title click
  const handleApplyTitleSuggestion = (suggestedTitle: string) => {
    setTitle(suggestedTitle);
    setTitleError(false);
    const detected = suggestCategoryFromTitle(suggestedTitle);
    if (detected) {
      setCategory(detected);
      const match = CATEGORIES.find((c) => c.id === detected);
      if (match) {
        setColor(match.color);
        setIcon(match.defaultIcon);
      }
    }
  };

  // Quick duration chip handler
  const handleApplyQuickDuration = (minutes: number) => {
    const newEnd = addMinutesToTime(startTime, minutes);
    setEndTime(newEnd);
  };

  // Dismiss student banner
  const handleDismissBanner = () => {
    setShowStudentBanner(false);
    localStorage.setItem('lifeos_hide_student_banner', 'true');
  };

  // Custom emoji apply
  const handleApplyCustomEmoji = () => {
    if (customEmojiInput.trim()) {
      setIcon(customEmojiInput.trim());
      setCustomEmojiInput('');
      setIsCustomEmojiOpen(false);
    }
  };

  // Multi-slot management
  const handleAddExtraSlot = () => {
    setExtraSlots((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        days: [0],
        startTime: '13:00',
        endTime: '17:15',
      },
    ]);
  };

  const handleRemoveExtraSlot = (id: string) => {
    setExtraSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateExtraSlot = (
    id: string,
    field: 'startTime' | 'endTime' | 'days',
    value: any
  ) => {
    setExtraSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Duration calculation
  const durationInfo = getDurationInfo(startTime, endTime);

  // Form submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      setTitleError(true);
      scrollBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      titleInputRef.current?.focus();
      return;
    }

    if (!durationInfo?.isValid) {
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
          start_date: startDate || null,
          end_date: endDate || null,
          course_id: selectedCourseId || null,
          course_node_id: selectedCourseNodeId || null,
        });
      } else {
        // Prepare batch of all slots and days
        const schedulesToCreate: Partial<FixedSchedule>[] = [];

        // Primary slot
        selectedDays.forEach((day) => {
          schedulesToCreate.push({
            title: title.trim(),
            description: description.trim() || null,
            day_of_week: Number(day),
            start_time: startTime,
            end_time: endTime,
            category: finalCategory,
            color,
            icon: icon || '📌',
            location: location.trim() || null,
            repeat_rule: 'WEEKLY',
            is_active: isActive,
            start_date: startDate || null,
            end_date: endDate || null,
            course_id: selectedCourseId || null,
            course_node_id: selectedCourseNodeId || null,
          });
        });

        // Extra slots (if any)
        extraSlots.forEach((slot) => {
          slot.days.forEach((day) => {
            schedulesToCreate.push({
              title: title.trim(),
              description: description.trim() || null,
              day_of_week: Number(day),
              start_time: slot.startTime,
              end_time: slot.endTime,
              category: finalCategory,
              color,
              icon: icon || '📌',
              location: location.trim() || null,
              repeat_rule: 'WEEKLY',
              is_active: isActive,
              start_date: startDate || null,
              end_date: endDate || null,
              course_id: selectedCourseId || null,
              course_node_id: selectedCourseNodeId || null,
            });
          });
        });

        if (schedulesToCreate.length > 1 && onSaveBatch) {
          await onSaveBatch(schedulesToCreate);
        } else {
          await onSave(schedulesToCreate[0]);
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

  // Conflict detection
  const detectedConflicts = useMemo(() => {
    if (!isOpen || !startTime || !endTime || startTime >= endTime) return [];
    const checkDays = isEditMode ? [singleDayOfWeek] : selectedDays;
    const conflicts: { schedule: FixedSchedule; dayName: string }[] = [];

    for (const s of allAvailableSchedules) {
      if (!s.is_active) continue;
      if (isEditMode && scheduleToEdit && s.id === scheduleToEdit.id) continue;
      if (!checkDays.includes(s.day_of_week)) continue;

      // Overlap condition: startTime < s.end_time && endTime > s.start_time
      if (startTime < s.end_time && endTime > s.start_time) {
        const dMatch = DAYS.find((d) => d.id === s.day_of_week);
        conflicts.push({
          schedule: s,
          dayName: dMatch ? dMatch.label : `Thứ ${s.day_of_week + 2}`,
        });
      }
    }
    return conflicts;
  }, [isOpen, allAvailableSchedules, isEditMode, scheduleToEdit, singleDayOfWeek, selectedDays, startTime, endTime]);

  // Category display label
  const categoryDisplayName = useMemo(() => {
    if (isCustomCategory && customCategoryName.trim()) {
      return customCategoryName.trim().toUpperCase();
    }
    const found = CATEGORIES.find((c) => c.id === category);
    return found ? found.shortLabel : category.toUpperCase();
  }, [isCustomCategory, customCategoryName, category]);

  // Selected days summary string
  const selectedDaysSummary = useMemo(() => {
    const list = isEditMode ? [singleDayOfWeek] : selectedDays;
    if (list.length === 7) return 'Hằng ngày (7 ngày)';
    if (list.length === 5 && [0, 1, 2, 3, 4].every((d) => list.includes(d))) {
      return 'Thứ 2 – Thứ 6';
    }
    if (list.length === 2 && [5, 6].every((d) => list.includes(d))) {
      return 'Cuối tuần (T7, CN)';
    }
    return (
      list
        .slice()
        .sort((a, b) => a - b)
        .map((d) => DAYS.find((x) => x.id === d)?.short)
        .filter(Boolean)
        .join(' · ') || 'Chưa chọn ngày'
    );
  }, [isEditMode, singleDayOfWeek, selectedDays]);

  const filteredLessons = courseNodes.filter((n) => n.course_id === selectedCourseId);
  const isCustomColor = !COLOR_PRESETS.some((c) => c.value.toLowerCase() === color.toLowerCase());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-4xl w-full shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Subtle Accent Glow Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-400 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-850/60 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="text-xl p-1.5 rounded-xl border shadow-xs"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
              }}
            >
              {icon || '📌'}
            </span>
            <div>
              <h3 className="font-extrabold text-neutral-900 dark:text-neutral-100 text-base leading-tight">
                {isEditMode ? 'Chỉnh sửa Lịch cố định' : 'Thêm Lịch cố định mới'}
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Lịch định kỳ xuất hiện đều đặn mỗi tuần trên Thời khóa biểu LifeOS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dismissible Student Timetable Banner */}
        {!isEditMode && onOpenSchoolPreset && showStudentBanner && (
          <div className="mx-5 mt-3 p-3 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏫</span>
              <div>
                <div className="font-bold text-xs text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <span>Bạn đang là học sinh / sinh viên?</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Tạo nhanh cả tuần T2-T6 (5 tiết) & T7 (4 tiết) tự động tính giờ giải lao
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenSchoolPreset();
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/40"
              >
                Mở Trình tạo TKB
              </Button>
              <button
                type="button"
                onClick={handleDismissBanner}
                title="Đóng thông báo này"
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div ref={scrollBodyRef} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ================= CỘT TRÁI: THÔNG TIN CHÍNH ================= */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Thông tin chính</span>
              </div>

              {/* Title Input with Validation */}
              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs">
                  Tên hoạt động / Môn học <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  placeholder="VD: GDTC - TD1, Tin học, Tập Gym, Ca làm tối..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={`w-full bg-neutral-50 dark:bg-neutral-850 border rounded-xl px-3.5 py-2.5 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none font-medium text-xs sm:text-sm shadow-2xs transition ${
                    titleError
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  autoFocus
                />
                {titleError && (
                  <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Vui lòng nhập tên hoạt động hoặc môn học</span>
                  </p>
                )}

                {/* Quick Title Suggestion Chips */}
                {!title && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                      <Lightbulb className="w-3 h-3 text-amber-500" /> Gợi ý:
                    </span>
                    {TITLE_SUGGESTIONS.map((sug) => (
                      <button
                        type="button"
                        key={sug}
                        onClick={() => handleApplyTitleSuggestion(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 transition"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Danh mục hoạt động</span>
                </label>
                <select
                  value={isCustomCategory ? 'CUSTOM' : category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                      className="w-full bg-neutral-50 dark:bg-neutral-850 border border-purple-300 dark:border-purple-700 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Days of week selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                    {isEditMode ? 'Thứ trong tuần' : 'Lặp lại vào các thứ trong tuần'}
                  </label>
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    Đã chọn: <span className="font-bold">{selectedDaysSummary}</span>
                  </span>
                </div>

                {/* Day Presets Buttons */}
                {!isEditMode && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <button
                      type="button"
                      onClick={() => applyDayPreset('ALL')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition"
                    >
                      Hằng ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDayPreset('WEEKDAYS')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition"
                    >
                      Thứ 2 – Thứ 6
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDayPreset('MON_WED_FRI')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition"
                    >
                      Thứ 2, 4, 6
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDayPreset('TUE_THU_SAT')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition"
                    >
                      Thứ 3, 5, 7
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDayPreset('WEEKEND')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition"
                    >
                      Cuối tuần
                    </button>
                  </div>
                )}

                {/* 7 Days Button Row */}
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
                        className={`py-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span>{d.short}</span>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Range with Auto Duration Calculation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Khung giờ (24 giờ)</span>
                  </span>
                  {durationInfo && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        durationInfo.isValid
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {durationInfo.isValid ? `Thời lượng: ${durationInfo.text}` : durationInfo.text}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Giờ bắt đầu
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-100 font-mono font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Giờ kết thúc
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-100 font-mono font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Quick Duration Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-neutral-400">Thời lượng nhanh:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickDuration(45)}
                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition"
                  >
                    +45 phút
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickDuration(90)}
                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition"
                  >
                    +90 phút
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickDuration(120)}
                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition"
                  >
                    +2 giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickDuration(180)}
                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition"
                  >
                    +3 giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyQuickDuration(255)}
                    className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition font-medium"
                  >
                    +4h15 (1 Buổi học)
                  </button>
                </div>
              </div>

              {/* Extra Time Slots Section (Multi-slot schedule) */}
              {!isEditMode && (
                <div className="pt-1">
                  {extraSlots.length > 0 && (
                    <div className="space-y-3 mb-2.5">
                      {extraSlots.map((slot, idx) => (
                        <div
                          key={slot.id}
                          className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-850/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                              Khung giờ bổ sung #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraSlot(slot.id)}
                              className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                            >
                              Xóa khung này
                            </button>
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {DAYS.map((d) => {
                              const isSel = slot.days.includes(d.id);
                              return (
                                <button
                                  type="button"
                                  key={d.id}
                                  onClick={() => {
                                    const next = isSel
                                      ? slot.days.filter((x) => x !== d.id)
                                      : [...slot.days, d.id].sort();
                                    handleUpdateExtraSlot(slot.id, 'days', next.length ? next : [d.id]);
                                  }}
                                  className={`py-1 rounded text-[11px] font-bold border transition ${
                                    isSel
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                                  }`}
                                >
                                  {d.short}
                                </button>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => handleUpdateExtraSlot(slot.id, 'startTime', e.target.value)}
                              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 text-xs text-neutral-900 dark:text-neutral-100 font-mono"
                            />
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => handleUpdateExtraSlot(slot.id, 'endTime', e.target.value)}
                              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 text-xs text-neutral-900 dark:text-neutral-100 font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddExtraSlot}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm khung giờ khác cho các ngày khác</span>
                  </button>
                </div>
              )}

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/60">
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                    {isActive ? 'Đang kích hoạt lịch này' : 'Tạm dừng lịch này'}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {isActive ? 'Xuất hiện đều đặn trên Calendar' : 'Tạm ẩn khỏi Calendar'}
                  </div>
                </div>

                {/* Semantic Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActive ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Collapsible Accordion: Tùy chọn nâng cao */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/40 dark:bg-neutral-850/30">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    <Settings2 className="w-4 h-4 text-neutral-500" />
                    <span>Tùy chọn nâng cao (Khóa học, địa điểm, ghi chú, thời hạn)</span>
                  </div>
                  {isAdvancedOpen ? (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  )}
                </button>

                {isAdvancedOpen && (
                  <div className="p-4 pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-3.5 animate-in slide-in-from-top-2 duration-150">
                    {/* Course & Lesson Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Gán với Khóa học / Môn học</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                            Khóa học
                          </label>
                          <select
                            value={selectedCourseId || ''}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : undefined;
                              setSelectedCourseId(val);
                              setSelectedCourseNodeId(undefined);
                            }}
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                          <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                            Bài học / Tiết học
                          </label>
                          <select
                            value={selectedCourseNodeId || ''}
                            disabled={!selectedCourseId || filteredLessons.length === 0}
                            onChange={(e) => setSelectedCourseNodeId(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-xs text-neutral-900 dark:text-neutral-100 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

                    {/* Location */}
                    <div>
                      <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Địa điểm</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Phòng B302, Tòa A, Sân vận động, Ở nhà..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 text-xs">
                        Ghi chú chi tiết (Giáo viên, môn học, tài liệu...)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="VD: Mang theo sách bài tập tập 2, làm bài trước khi đến lớp..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Effective Date Range */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                          Thời hạn áp dụng
                        </label>
                        <span className="text-[10px] text-neutral-400">
                          (Để trống nếu áp dụng vô thời hạn)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-500 mb-0.5">Áp dụng từ ngày</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-500 mb-0.5">Đến ngày</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================= CỘT PHẢI: GIAO DIỆN & XEM TRƯỚC ================= */}
            <div className="lg:col-span-5 space-y-4">
              <div className="lg:sticky lg:top-0 space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  <span>Giao diện</span>
                </div>

                {/* Color Swatches */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                      Màu sắc hiển thị
                    </label>
                    <span className="text-[11px] font-mono text-neutral-500 font-medium">{color}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        type="button"
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                          color.toLowerCase() === c.value.toLowerCase()
                            ? 'scale-110 ring-2 ring-offset-2 ring-neutral-900 dark:ring-white shadow-xs'
                            : 'hover:scale-105 opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      >
                        {color.toLowerCase() === c.value.toLowerCase() && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </button>
                    ))}

                    {/* Circular Custom Color Button */}
                    <label
                      className={`w-7 h-7 rounded-full cursor-pointer transition-all flex items-center justify-center relative border border-dashed border-neutral-400 dark:border-neutral-600 hover:border-neutral-500 bg-gradient-to-tr from-pink-500 via-amber-400 to-blue-500 p-[2px] ${
                        isCustomColor
                          ? 'scale-110 ring-2 ring-offset-2 ring-neutral-900 dark:ring-white shadow-xs'
                          : 'hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                      title="Màu tùy chỉnh"
                    >
                      <div className="w-full h-full rounded-full bg-white dark:bg-neutral-850 flex items-center justify-center">
                        <Plus className="w-3 h-3 text-neutral-700 dark:text-neutral-300 stroke-[3]" />
                      </div>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Emoji Icons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                      Biểu tượng
                    </label>
                    <span className="text-sm">{icon}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {EMOJI_SUGGESTIONS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setIcon(emoji)}
                        className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center transition ${
                          icon === emoji
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-2xs scale-110 ring-1 ring-blue-500'
                            : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}

                    {/* Circular + button to choose/input other emoji */}
                    <button
                      type="button"
                      onClick={() => setIsCustomEmojiOpen(!isCustomEmojiOpen)}
                      title="Chọn emoji khác..."
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
                        isCustomEmojiOpen
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {isCustomEmojiOpen && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 animate-in fade-in">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Dán hoặc gõ emoji..."
                        value={customEmojiInput}
                        onChange={(e) => setCustomEmojiInput(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100 text-center"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleApplyCustomEmoji}
                        disabled={!customEmojiInput.trim()}
                        className="text-xs h-7 px-2.5"
                      >
                        Áp dụng
                      </Button>
                    </div>
                  )}
                </div>

                {/* Schedule Conflict Warning Alert */}
                {detectedConflicts.length > 0 && (
                  <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs space-y-1 animate-in fade-in">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Cảnh báo trùng lịch cố định</span>
                    </div>
                    <div className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                      Khung giờ này đang trùng với{' '}
                      <span className="font-semibold underline">
                        "{detectedConflicts[0].schedule.title}"
                      </span>{' '}
                      vào {detectedConflicts[0].dayName} ({detectedConflicts[0].schedule.start_time} - {detectedConflicts[0].schedule.end_time}).
                    </div>
                  </div>
                )}

                {/* LIVE CARD PREVIEW */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Xem trước thẻ trên Lịch</span>
                    </span>
                    <span className="text-[10px] text-neutral-400">Hiển thị thực tế</span>
                  </div>

                  <div
                    className={`rounded-xl p-3.5 border shadow-sm transition-all duration-300 ${
                      !isActive
                        ? 'opacity-65 grayscale-[30%] bg-neutral-100/90 dark:bg-neutral-850'
                        : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? `${color}14` : undefined,
                      borderColor: `${color}40`,
                      borderLeftWidth: '4px',
                      borderLeftColor: color,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
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

                    {/* Days info in Preview Card */}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mt-1.5">
                      <CalendarIcon className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>{selectedDaysSummary}</span>
                      {durationInfo?.isValid && (
                        <span className="text-[10px] text-neutral-400 font-normal">
                          ({durationInfo.text})
                        </span>
                      )}
                    </div>

                    {location.trim() && (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-300 mt-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{location.trim()}</span>
                      </div>
                    )}

                    {description.trim() && (
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1 italic">
                        {description.trim()}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between gap-2 text-[10px]">
                      <span
                        className="px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                        }}
                      >
                        {categoryDisplayName}
                      </span>
                      {isActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          • Lặp lại hàng tuần
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          ⏸ Đang tạm tắt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 bg-neutral-50/95 dark:bg-neutral-850/95 backdrop-blur-md px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          {isEditMode && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold text-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa lịch này</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {titleError && (
              <span className="text-xs text-rose-500 font-semibold flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Vui lòng nhập tên hoạt động</span>
              </span>
            )}

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
              disabled={isSubmitting}
              className="relative overflow-hidden group shadow-md shadow-blue-500/20 font-bold"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {isSubmitting
                    ? 'Đang lưu...'
                    : isEditMode
                    ? 'Cập nhật lịch'
                    : selectedDays.length > 1 || extraSlots.length > 0
                    ? `Tạo cho ${selectedDays.length + extraSlots.reduce((acc, s) => acc + s.days.length, 0)} buổi`
                    : 'Tạo Lịch cố định'}
                </span>
              </span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
