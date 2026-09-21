import React, { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Flame, Clock, Flag, AlertCircle, BookOpen, GraduationCap,
  Link2, Calendar, FileText, CheckSquare, Sparkles, Pin, Target, Layers
} from 'lucide-react';
import {
  Task, Goal, Project, TaskStatus, DIFFICULTY_LABELS, Course, CourseNode, FixedSchedule
} from '../../types';
import { api } from '../../services/api';
import { ConflictWarningModal } from './ConflictWarningModal';
import { Button } from '../ui/button';
import { SmartSchedulePicker } from './SmartSchedulePicker';
import {
  formatDatetimeForBackend,
  parseBackendDatetimeToLocalInput,
  toLocalInputString,
  toLocalDateString,
} from '../../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  taskToEdit?: Task | null;
  goals?: Goal[];
  courses?: Course[];
  fixedSchedules?: FixedSchedule[];
  initialDate?: string; // Pre-filled due date (e.g. clicked on calendar day)
  initialTitle?: string;
  initialCourseNodeId?: number;
  initialFixedScheduleId?: number;
}

const DOW_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  goals = [],
  courses: propsCourses,
  fixedSchedules: propsFixedSchedules,
  initialDate,
  initialTitle,
  initialCourseNodeId,
  initialFixedScheduleId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalId, setGoalId] = useState<number | undefined>(undefined);
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [courses, setCourses] = useState<Course[]>(propsCourses || []);
  const [allCourseNodes, setAllCourseNodes] = useState<CourseNode[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>(undefined);
  const [courseNodeId, setCourseNodeId] = useState<number | undefined>(initialCourseNodeId);
  const [fixedSchedulesList, setFixedSchedulesList] = useState<FixedSchedule[]>(propsFixedSchedules || []);
  const [scheduledWithFixedId, setScheduledWithFixedId] = useState<number | undefined>(initialFixedScheduleId);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [dueDatetime, setDueDatetime] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [difficulty, setDifficulty] = useState<number>(2);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Conflict state
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  // Load courses, nodes, and schedules when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingCourses(true);
      const promises: Promise<any>[] = [
        api.courses.list(),
        api.courses.getAllNodes(),
      ];

      if (!propsFixedSchedules || propsFixedSchedules.length === 0) {
        promises.push(api.schedules.list(true));
      }

      Promise.all(promises)
        .then(([cList, nList, sList]) => {
          setCourses(cList);
          setAllCourseNodes(nList);
          if (sList) {
            setFixedSchedulesList(sList);
          } else if (propsFixedSchedules) {
            setFixedSchedulesList(propsFixedSchedules);
          }

          const targetNodeId = taskToEdit?.course_node_id || initialCourseNodeId;
          if (targetNodeId) {
            const found = nList.find((n: CourseNode) => n.id === targetNodeId);
            if (found) {
              setSelectedCourseId(found.course_id);
              setCourseNodeId(found.id);
            }
          }
        })
        .catch((err) => {
          console.warn('Failed to load courses or schedules in TaskModal:', err);
        })
        .finally(() => {
          setIsLoadingCourses(false);
        });
    }
  }, [isOpen, taskToEdit?.course_node_id, initialCourseNodeId, propsFixedSchedules]);

  // Reset or populate on open/edit
  useEffect(() => {
    if (!isOpen) return;

    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setGoalId(taskToEdit.goal_id ?? undefined);
      setProjectId(taskToEdit.project_id ?? undefined);
      setCourseNodeId(taskToEdit.course_node_id ?? undefined);
      setScheduledWithFixedId(taskToEdit.scheduled_with_fixed_id ?? undefined);
      setDueDatetime(parseBackendDatetimeToLocalInput(taskToEdit.due_datetime));
      setStartDatetime(parseBackendDatetimeToLocalInput(taskToEdit.start_datetime));
      setDifficulty(taskToEdit.difficulty ?? 2);
      setPriority(taskToEdit.priority || 'MEDIUM');
      setStatus(taskToEdit.status || 'TODO');
      setSubtasks([]);
    } else {
      setTitle(initialTitle || '');
      setDescription('');
      setGoalId(undefined);
      setProjectId(undefined);
      setSelectedCourseId(undefined);
      setCourseNodeId(initialCourseNodeId);
      setScheduledWithFixedId(initialFixedScheduleId);

      if (initialDate) {
        setDueDatetime(`${initialDate}T21:00`);
      } else {
        const now = new Date();
        now.setHours(21, 0, 0, 0);
        setDueDatetime(toLocalInputString(now));
      }
      setStartDatetime('');
      setDifficulty(2);
      setPriority('MEDIUM');
      setStatus('TODO');
      setSubtasks([]);
    }
  }, [
    isOpen,
    taskToEdit?.id,
    initialDate,
    initialTitle,
    initialCourseNodeId,
    initialFixedScheduleId,
  ]);

  if (!isOpen) return null;

  const safeGoals = goals || [];
  const currentGoal = safeGoals.find((g) => g.id === Number(goalId));
  const availableProjects = currentGoal?.projects || [];
  const availableLessons = allCourseNodes.filter((n) => n.course_id === Number(selectedCourseId));

  const handleAddSubtask = () => {
    if (newSubtaskInput.trim()) {
      setSubtasks([...subtasks, newSubtaskInput.trim()]);
      setNewSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // Helper to apply time from selected fixed schedule
  const handleApplyFixedScheduleTime = (schedId: number) => {
    const sched = fixedSchedulesList.find((s) => s.id === schedId);
    if (!sched) return;
    const baseDate = startDatetime
      ? startDatetime.slice(0, 10)
      : dueDatetime
      ? dueDatetime.slice(0, 10)
      : initialDate || toLocalDateString();
    setStartDatetime(`${baseDate}T${sched.start_time.slice(0, 5)}`);
    setDueDatetime(`${baseDate}T${sched.end_time.slice(0, 5)}`);
  };

  const proceedSave = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      onClose();
    } catch (err: any) {
      console.error('Failed to save task:', err);
      alert('Lỗi khi lưu nhiệm vụ: ' + (err?.message || 'Vui lòng kiểm tra lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const safeStart = formatDatetimeForBackend(startDatetime);
    const safeDue = formatDatetimeForBackend(dueDatetime);

    const data: any = {
      title: title.trim(),
      description: description.trim() || null,
      goal_id: goalId ? Number(goalId) : null,
      project_id: projectId ? Number(projectId) : null,
      course_node_id: courseNodeId ? Number(courseNodeId) : null,
      scheduled_with_fixed_id: scheduledWithFixedId ? Number(scheduledWithFixedId) : null,
      start_datetime: safeStart || null,
      due_datetime: safeDue || null,
      difficulty,
      priority,
      status,
      subtask_titles: subtasks.length > 0 ? subtasks : undefined,
    };

    if (safeStart && safeDue) {
      try {
        const res = await api.tasks.checkConflict(safeStart, safeDue);
        if (res.has_conflict) {
          setConflicts(res.conflicts);
          setPendingSaveData(data);
          setShowConflictModal(true);
          return;
        }
      } catch (err) {
        console.warn('Failed to check conflict:', err);
      }
    }

    await proceedSave(data);
  };

  const selectedFixedSchedule = fixedSchedulesList.find((s) => s.id === Number(scheduledWithFixedId));

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl my-4 sm:my-6 max-h-[94vh] flex flex-col overflow-hidden">
          {/* Subtle Sparkling Glow Gradient Top Border */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400 animate-pulse" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {taskToEdit ? 'Chỉnh sửa Nhiệm vụ' : 'Tạo Nhiệm vụ mới'}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    <Sparkles className="w-2.5 h-2.5" />
                    Không gian rộng
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Quản lý đầy đủ thông tin, thời gian biểu và liên kết học tập / lịch trình
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Form Body: 2-Column Grid, No Collapse! */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* ================= LEFT COLUMN: CỐT LÕI & LỊCH TRÌNH ================= */}
              <div className="lg:col-span-6 space-y-4">
                {/* Section Tag */}
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200/70 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>1. Thông tin & Thời gian biểu</span>
                </div>

                {/* Task Title */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">
                    Tiêu đề nhiệm vụ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Ôn 50 câu tích phân, Soạn slide thuyết trình..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs sm:text-sm shadow-2xs"
                    autoFocus
                  />
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs flex items-center gap-1">
                      <Flag className="w-3.5 h-3.5 text-rose-500" />
                      <span>Mức ưu tiên</span>
                    </label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="LOW">Thấp (Low)</option>
                      <option value="MEDIUM">Trung bình (Medium)</option>
                      <option value="HIGH">Cao (High)</option>
                      <option value="URGENT">Khẩn cấp (Urgent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Trạng thái</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="TODO">Chưa hoàn thành</option>
                      <option value="IN_PROGRESS">Đang thực hiện</option>
                      <option value="PARTIAL">Hoàn thành 1 phần</option>
                      <option value="COMPLETED">Đã hoàn thành</option>
                      <option value="DELAYED">Chậm trễ</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>
                </div>

                {/* Difficulty (1-5) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Độ khó thử thách</span>
                    </label>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      +{difficulty} điểm thưởng
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const isSelected = difficulty === level;
                      const info = DIFFICULTY_LABELS[level];
                      return (
                        <button
                          type="button"
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                            isSelected
                              ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title={`${level} - ${info.label}`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Smart Schedule Picker (Always Visible & Spacious) */}
                <div className="pt-2">
                  <SmartSchedulePicker
                    startDatetime={startDatetime}
                    dueDatetime={dueDatetime}
                    onStartChange={(val) => setStartDatetime(val)}
                    onDueChange={(val) => setDueDatetime(val)}
                  />
                </div>
              </div>

              {/* ================= RIGHT COLUMN: LIÊN KẾT, GHI CHÚ & VIỆC CON ================= */}
              <div className="lg:col-span-6 space-y-4">
                {/* Section Tag */}
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200/70 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>2. Liên kết & Chi tiết</span>
                </div>

                {/* 1. ĐÍNH KÈM LỊCH CỐ ĐỊNH (TKB) */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/70 dark:border-indigo-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-900 dark:text-slate-100 font-semibold text-xs flex items-center gap-1.5">
                      <Pin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Đính kèm vào Lịch cố định (Thời khóa biểu)</span>
                    </label>
                    {selectedFixedSchedule && (
                      <button
                        type="button"
                        onClick={() => handleApplyFixedScheduleTime(selectedFixedSchedule.id)}
                        className="text-[11px] px-2 py-0.5 rounded font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-900/60 hover:bg-indigo-200 dark:hover:bg-indigo-800 border border-indigo-300 dark:border-indigo-700 transition flex items-center gap-1 shadow-2xs"
                        title="Tự động điền khung giờ của lịch cố định này vào Task"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                        <span>Áp dụng giờ ({selectedFixedSchedule.start_time} - {selectedFixedSchedule.end_time})</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={scheduledWithFixedId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      setScheduledWithFixedId(val);
                      if (val) {
                        handleApplyFixedScheduleTime(val);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Không đính kèm lịch cố định --</option>
                    {fixedSchedulesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon || '📌'} {s.title} ({DOW_SHORT[s.day_of_week] || ''} {s.start_time} - {s.end_time})
                      </option>
                    ))}
                  </select>
                  {selectedFixedSchedule && (
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      Task sẽ tự động xuất hiện bên trong khối lịch này trên Calendar và nhắc nhở đúng giờ.
                    </p>
                  )}
                </div>

                {/* 2. KHÓA HỌC & BÀI HỌC */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Khóa học</span>
                    </label>
                    <select
                      value={selectedCourseId || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        setSelectedCourseId(val);
                        setCourseNodeId(undefined);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Không chọn --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          📚 {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Bài học / Tiết</span>
                    </label>
                    <select
                      value={courseNodeId || ''}
                      disabled={!selectedCourseId || availableLessons.length === 0}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        setCourseNodeId(val);
                        if (val && !title.trim()) {
                          const found = availableLessons.find((l) => l.id === val);
                          if (found) {
                            setTitle(`Học: ${found.title}`);
                            if (found.difficulty && !taskToEdit) {
                              setDifficulty(found.difficulty);
                            }
                          }
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">
                        {!selectedCourseId
                          ? '-- Chọn khóa trước --'
                          : isLoadingCourses
                          ? 'Đang tải...'
                          : availableLessons.length === 0
                          ? '-- Chưa có bài --'
                          : '-- Chọn bài học cụ thể --'}
                      </option>
                      {availableLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.type === 'LESSON' ? '📖 ' : l.type === 'CHAPTER' ? '📁 ' : '📝 '}
                          {l.title} {l.duration ? `(${l.duration}p)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. MỤC TIÊU & DỰ ÁN */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-amber-500" />
                      <span>Mục tiêu (Goal)</span>
                    </label>
                    <select
                      value={goalId || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        setGoalId(val);
                        setProjectId(undefined);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Không chọn mục tiêu --</option>
                      {safeGoals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Dự án (Project)</span>
                    </label>
                    <select
                      value={projectId || ''}
                      disabled={!goalId || availableProjects.length === 0}
                      onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">-- Không chọn dự án --</option>
                      {availableProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. MÔ TẢ & GHI CHÚ */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mô tả & Ghi chú</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ghi chú chi tiết, tài liệu tham khảo hoặc hướng dẫn làm bài..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* 5. VIỆC CON (SUBTASKS) */}
                {!taskToEdit && (
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Danh sách việc con (Subtasks - Tùy chọn)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập việc con..."
                        value={newSubtaskInput}
                        onChange={(e) => setNewSubtaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask();
                          }
                        }}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-xs transition"
                      >
                        Thêm
                      </button>
                    </div>

                    {subtasks.length > 0 && (
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {subtasks.map((st, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs"
                          >
                            <span className="truncate flex-1">{st}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubtask(i)}
                              className="text-slate-400 hover:text-rose-500 transition ml-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tip: Gán Task vào Lịch cố định để tự động hiển thị trong thời khóa biểu.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="relative overflow-hidden group shadow-md shadow-indigo-500/20"
                >
                  <span className="relative z-10 flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>{isSubmitting ? 'Đang lưu...' : taskToEdit ? 'Lưu thay đổi' : 'Tạo Nhiệm vụ'}</span>
                  </span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Conflict Warning Modal */}
      <ConflictWarningModal
        isOpen={showConflictModal}
        conflicts={conflicts}
        onKeepAnyway={async () => {
          setShowConflictModal(false);
          if (pendingSaveData) await proceedSave(pendingSaveData);
        }}
        onMoveTask={() => {
          setShowConflictModal(false);
        }}
        onCancel={() => {
          setShowConflictModal(false);
          setPendingSaveData(null);
        }}
      />
    </>
  );
};
