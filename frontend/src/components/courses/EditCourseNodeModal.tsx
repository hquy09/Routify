import React, { useState, useEffect } from 'react';
import {
  X, BookOpen, Clock, Calendar, CheckCircle2, Sparkles,
  Link, FileText, Video, Tag, AlertCircle, Plus, Trash2,
  CalendarCheck, Target, ChevronRight, Check, Lightbulb, Bookmark
} from 'lucide-react';
import { CourseNode, Goal, FixedSchedule } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { formatDatetimeForBackend } from '../../utils/dateUtils';

interface EditCourseNodeModalProps {
  node: CourseNode | null;
  isOpen: boolean;
  onClose: () => void;
  goals?: Goal[];
  fixedSchedules?: FixedSchedule[];
  onSaveNode: (nodeId: number, nodeData: Partial<CourseNode>) => Promise<void>;
  onCreateTask: (data: {
    lesson_id: number;
    title?: string;
    due_datetime?: string;
    difficulty?: number;
    priority?: string;
    goal_id?: number;
    project_id?: number;
    fixed_schedule_id?: number;
    subtask_titles?: string[];
    notes?: string;
  }) => Promise<void>;
  onCreateEvent?: (data: {
    title: string;
    course_id: number;
    course_node_id?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    category?: string;
    color?: string;
    location?: string;
    description?: string;
    create_attached_task?: boolean;
    task_priority?: string;
    task_difficulty?: number;
  }) => Promise<void>;
}

export const EditCourseNodeModal: React.FC<EditCourseNodeModalProps> = ({
  node,
  isOpen,
  onClose,
  goals = [],
  fixedSchedules = [],
  onSaveNode,
  onCreateTask,
  onCreateEvent,
}) => {
  // Left Column - Node States
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CourseNode['type']>('LESSON');
  const [duration, setDuration] = useState<number>(45);
  const [difficulty, setDifficulty] = useState<number>(2);
  const [status, setStatus] = useState<CourseNode['status']>('NOT_STARTED');
  const [progress, setProgress] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  // Mode Switcher: Task vs Event
  const [scheduleMode, setScheduleMode] = useState<'TASK' | 'EVENT'>('TASK');

  // Right Column - Smart Task States
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDatetime, setTaskDueDatetime] = useState('');
  const [taskPriority, setTaskPriority] = useState<string>('MEDIUM');
  const [taskGoalId, setTaskGoalId] = useState<number | undefined>(undefined);
  const [taskProjectId, setTaskProjectId] = useState<number | undefined>(undefined);
  const [taskFixedScheduleId, setTaskFixedScheduleId] = useState<number | undefined>(undefined);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isSavingNode, setIsSavingNode] = useState(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<string | null>(null);

  // Right Column - Event (Fixed Schedule) States
  const [eventTitle, setEventTitle] = useState('');
  const [eventDayOfWeek, setEventDayOfWeek] = useState<number>(0);
  const [eventStartTime, setEventStartTime] = useState('19:30');
  const [eventEndTime, setEventEndTime] = useState('21:00');
  const [eventCategory, setEventCategory] = useState<string>('STUDY');
  const [eventColor, setEventColor] = useState<string>('#10b981');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCreateAttachedTask, setEventCreateAttachedTask] = useState<boolean>(true);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventSuccessMsg, setEventSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && node) {
      setTitle(node.title || '');
      setType(node.type || 'LESSON');
      setDuration(node.duration || 45);
      setDifficulty(node.difficulty || 2);
      setStatus(node.status || 'NOT_STARTED');
      setProgress(node.progress || 0);
      setNotes(node.notes || '');
      setVideoUrl(node.video_url || '');
      setDocumentUrl(node.document_url || '');

      // Smart Task defaults
      setTaskTitle(`Học: ${node.title}`);
      const d = new Date();
      d.setHours(20, 0, 0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      setTaskDueDatetime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T20:00`);
      setTaskPriority('MEDIUM');
      setTaskGoalId(undefined);
      setTaskProjectId(undefined);
      setTaskFixedScheduleId(undefined);
      setSubtasks([]);
      setNewSubtaskInput('');
      setTaskSuccessMsg(null);

      // Event defaults
      setEventTitle(`Lịch học: ${node.title}`);
      const jsDow = new Date().getDay();
      setEventDayOfWeek(jsDow === 0 ? 6 : jsDow - 1);
      setEventStartTime('19:30');
      setEventEndTime('21:00');
      setEventCategory('STUDY');
      setEventColor('#10b981');
      setEventLocation('');
      setEventDescription(`Buổi học môn ${node.title}`);
      setEventCreateAttachedTask(true);
      setEventSuccessMsg(null);
      setScheduleMode('TASK');
    }
  }, [isOpen, node]);

  if (!isOpen || !node) return null;

  // Smart 1-touch time slot shortcuts
  const handleSetQuickTime = (hour: number, minute: number = 0) => {
    const d = taskDueDatetime ? new Date(taskDueDatetime) : new Date();
    d.setHours(hour, minute, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    setTaskDueDatetime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}`);
  };

  const handleSetInHours = (offsetHours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    const pad = (n: number) => String(n).padStart(2, '0');
    setTaskDueDatetime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasks([...subtasks, newSubtaskInput.trim()]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSaveNodeOnly = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài học/mục.');
      return;
    }
    setIsSavingNode(true);
    try {
      await onSaveNode(node.id, {
        title: title.trim(),
        type,
        duration: type === 'LESSON' ? (Number(duration) || 0) : undefined,
        difficulty,
        status,
        progress: Number(progress) || 0,
        notes: notes.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        document_url: documentUrl.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu bài học');
    } finally {
      setIsSavingNode(false);
    }
  };

  const handleCreateSmartTask = async () => {
    if (!taskTitle.trim()) {
      alert('Vui lòng nhập tiêu đề nhiệm vụ.');
      return;
    }
    setIsCreatingTask(true);
    setTaskSuccessMsg(null);
    try {
      await onCreateTask({
        lesson_id: node.id,
        title: taskTitle.trim(),
        due_datetime: formatDatetimeForBackend(taskDueDatetime),
        difficulty,
        priority: taskPriority,
        goal_id: taskGoalId ? Number(taskGoalId) : undefined,
        project_id: taskProjectId ? Number(taskProjectId) : undefined,
        fixed_schedule_id: taskFixedScheduleId ? Number(taskFixedScheduleId) : undefined,
        subtask_titles: subtasks.filter((s) => s.trim().length > 0),
        notes: notes.trim() || undefined,
      });
      setTaskSuccessMsg('✓ Đã lên lịch Task thành công vào Calendar!');
      setTimeout(() => setTaskSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lên lịch task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      alert('Vui lòng nhập tiêu đề sự kiện / lịch học.');
      return;
    }
    if (eventStartTime >= eventEndTime) {
      alert('Giờ bắt đầu phải trước giờ kết thúc!');
      return;
    }
    if (!onCreateEvent) {
      alert('Tính năng tạo sự kiện chưa được kích hoạt ở màn hình này.');
      return;
    }
    setIsCreatingEvent(true);
    setEventSuccessMsg(null);
    try {
      await onCreateEvent({
        title: eventTitle.trim(),
        course_id: node.course_id,
        course_node_id: node.id,
        day_of_week: Number(eventDayOfWeek),
        start_time: eventStartTime,
        end_time: eventEndTime,
        category: eventCategory,
        color: eventColor,
        location: eventLocation.trim() || undefined,
        description: eventDescription.trim() || undefined,
        create_attached_task: eventCreateAttachedTask,
        task_priority: taskPriority,
        task_difficulty: difficulty,
      });
      setEventSuccessMsg('✓ Đã tạo Sự kiện / Lịch học thành công vào Calendar!');
      setTimeout(() => setEventSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo sự kiện lịch học');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const currentGoal = (goals || []).find((g) => g.id === Number(taskGoalId));
  const availableProjects = currentGoal?.projects || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Chỉnh sửa: {node.title}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tùy biến nội dung mục học và tích hợp lịch học thông minh vào Calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN: Node Information & Details */}
          <div className="space-y-4 text-xs bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thông tin bài học / Mục con</span>
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">ID: #{node.id}</Badge>
            </div>

            {/* Title */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Tiêu đề bài học / Mục *
              </label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Chương 1: Hàm số và Đồ thị"
                className="text-xs"
              />
            </div>

            {/* Type & Conditional Duration */}
            <div className="space-y-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                Phân loại mục
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="SECTION">📁 Section (Phần lớn)</option>
                  <option value="CHAPTER">📑 Chapter (Chương)</option>
                  <option value="LESSON">📖 Lesson (Bài học - có thời lượng)</option>
                  <option value="TOPIC">💡 Topic (Chủ đề lý thuyết)</option>
                  <option value="RESOURCE">📎 Resource (Tài liệu tham khảo)</option>
                </select>

                {/* Conditional Duration */}
                {type === 'LESSON' ? (
                  <div>
                    <Input
                      type="number"
                      min="0"
                      step="5"
                      placeholder="Thời lượng (phút)"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="text-xs"
                    />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                    {type === 'SECTION' || type === 'CHAPTER' ? (
                      <>
                        <Bookmark className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Thời lượng tự động tính từ bài con.</span>
                      </>
                    ) : type === 'TOPIC' ? (
                      <>
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Chủ đề không cố định thời lượng.</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>Tài liệu tham khảo (Slide / PDF).</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Status & Progress Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Tiến độ hoàn thành:
                </label>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {progress}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProgress(val);
                  if (val >= 100) setStatus('COMPLETED');
                  else if (val > 0) setStatus('IN_PROGRESS');
                  else setStatus('NOT_STARTED');
                }}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between gap-1 pt-1">
                {(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatus(st);
                      if (st === 'COMPLETED') setProgress(100);
                      else if (st === 'NOT_STARTED') setProgress(0);
                    }}
                    className={`flex-1 py-1 rounded text-[10px] font-semibold border transition cursor-pointer ${
                      status === st
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {st === 'COMPLETED' ? 'Đã xong' : st === 'IN_PROGRESS' ? 'Đang học' : 'Chưa học'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Ghi chú bài học / Tóm tắt công thức:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú kiến thức trọng tâm, công thức cần nhớ, bài tập giao về nhà..."
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Video & Doc links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <Video className="w-3 h-3 text-red-500" />
                  <span>Link Video:</span>
                </label>
                <Input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-blue-500" />
                  <span>Link Tài liệu / Slide:</span>
                </label>
                <Input
                  type="url"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://drive..."
                  className="text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Smart Study Task & Event Integration */}
          <div className={`space-y-4 text-xs p-4 rounded-xl border transition-colors ${
            scheduleMode === 'TASK'
              ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-800/40'
              : 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-200/60 dark:border-indigo-800/40'
          }`}>
            {/* Header Switcher: Task vs Event */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60 gap-2">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setScheduleMode('TASK')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    scheduleMode === 'TASK'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Nhiệm vụ (Task)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('EVENT')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    scheduleMode === 'EVENT'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Sự kiện / Lịch học (Event)</span>
                </button>
              </div>
              <Badge variant={scheduleMode === 'TASK' ? 'success' : 'outline'} className="text-[10px]">
                {scheduleMode === 'TASK' ? 'Đồng bộ Calendar' : 'Lịch định kỳ'}
              </Badge>
            </div>

            {/* TAB 1: SMART TASK */}
            {scheduleMode === 'TASK' ? (
              <div className="space-y-4">
                {taskSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{taskSuccessMsg}</span>
                  </div>
                )}

                {/* Task Title */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tiêu đề nhiệm vụ
                  </label>
                  <Input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="VD: Học Toán: Hàm số"
                    className="text-xs"
                  />
                </div>

                {/* Due Datetime & Quick Shortcuts */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Ngày & Giờ học:
                  </label>
                  <Input
                    type="datetime-local"
                    value={taskDueDatetime}
                    onChange={(e) => setTaskDueDatetime(e.target.value)}
                    className="text-xs mb-1.5"
                  />

                  {/* 1-touch Quick Slots */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-slate-400">Chọn nhanh:</span>
                    <button
                      type="button"
                      onClick={() => handleSetQuickTime(8, 0)}
                      className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    >
                      🌅 Sáng 08:00
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickTime(14, 0)}
                      className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    >
                      ☀️ Chiều 14:00
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickTime(20, 0)}
                      className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      🌙 Tối 20:00
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetInHours(2)}
                      className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    >
                      ⚡ +2h nữa
                    </button>
                  </div>
                </div>

                {/* Priority & Fixed Schedule Attachment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Mức ưu tiên
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs"
                    >
                      <option value="LOW">Thấp (LOW)</option>
                      <option value="MEDIUM">Trung bình (MEDIUM)</option>
                      <option value="HIGH">Ưu tiên cao (HIGH)</option>
                      <option value="URGENT">Khẩn cấp (URGENT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Đính kèm Lịch cố định:
                    </label>
                    <select
                      value={taskFixedScheduleId || ''}
                      onChange={(e) => setTaskFixedScheduleId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs"
                    >
                      <option value="">(Không đính kèm lịch)</option>
                      {fixedSchedules.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon || '📌'} {s.title} ({s.start_time} - {s.end_time})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Linked Goal / Project */}
                {goals.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Mục tiêu liên kết
                      </label>
                      <select
                        value={taskGoalId || ''}
                        onChange={(e) => {
                          setTaskGoalId(e.target.value ? Number(e.target.value) : undefined);
                          setTaskProjectId(undefined);
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs"
                      >
                        <option value="">(Không liên kết)</option>
                        {goals.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Dự án con
                      </label>
                      <select
                        value={taskProjectId || ''}
                        onChange={(e) => setTaskProjectId(e.target.value ? Number(e.target.value) : undefined)}
                        disabled={availableProjects.length === 0}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 text-xs disabled:opacity-50"
                      >
                        <option value="">(Không có dự án)</option>
                        {availableProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Subtasks */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Các bước thực hiện nhỏ (Subtasks):
                  </label>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {subtasks.map((st, i) => (
                      <div key={i} className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="truncate">• {st}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(i)}
                          className="text-slate-400 hover:text-rose-500 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="text"
                      value={newSubtaskInput}
                      onChange={(e) => setNewSubtaskInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      placeholder="+ Thêm bước làm bài..."
                      className="text-xs h-7"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleAddSubtask} className="h-7 text-xs">
                      Thêm
                    </Button>
                  </div>
                </div>

                {/* Button Create Task Right Here */}
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateSmartTask}
                  disabled={isCreatingTask}
                  className="w-full justify-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                  <span>{isCreatingTask ? 'Đang lên lịch...' : 'Lên lịch Task học bài này'}</span>
                </Button>
              </div>
            ) : (
              /* TAB 2: FIXED SCHEDULE / EVENT */
              <div className="space-y-4">
                {eventSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{eventSuccessMsg}</span>
                  </div>
                )}

                {/* Event Title */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tên buổi học / Sự kiện
                  </label>
                  <Input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="VD: Lịch học: Hàm số"
                    className="text-xs"
                  />
                </div>

                {/* Day of Week Selector */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Thứ trong tuần lặp lại:
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { id: 0, label: 'T2' },
                      { id: 1, label: 'T3' },
                      { id: 2, label: 'T4' },
                      { id: 3, label: 'T5' },
                      { id: 4, label: 'T6' },
                      { id: 5, label: 'T7' },
                      { id: 6, label: 'CN' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setEventDayOfWeek(d.id)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          eventDayOfWeek === d.id
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time range & Shortcuts */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Thời gian diễn ra:
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-1.5">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Bắt đầu:</label>
                      <input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Kết thúc:</label>
                      <input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  {/* Quick time slot presets */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-slate-400">Chọn nhanh:</span>
                    <button
                      type="button"
                      onClick={() => { setEventStartTime('08:00'); setEventEndTime('10:00'); }}
                      className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                    >
                      🌅 Sáng 08-10h
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEventStartTime('14:00'); setEventEndTime('16:00'); }}
                      className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                    >
                      ☀️ Chiều 14-16h
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEventStartTime('19:30'); setEventEndTime('21:00'); }}
                      className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400"
                    >
                      🌙 Tối 19:30-21h
                    </button>
                  </div>
                </div>

                {/* Location & Category */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Địa điểm / Phòng học:
                    </label>
                    <Input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="VD: Phòng B201, Zoom..."
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Phân loại:
                    </label>
                    <select
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="STUDY">📚 Study (Tự học/Học thêm)</option>
                      <option value="SCHOOL">🏫 School (Trường học)</option>
                      <option value="WORK">💼 Work (Làm việc)</option>
                    </select>
                  </div>
                </div>

                {/* Attached Task Option */}
                <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      Tự động đính kèm Task học tập
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Tạo kèm nhiệm vụ ôn bài đính kèm vào khung giờ lịch này
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventCreateAttachedTask}
                    onChange={(e) => setEventCreateAttachedTask(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Button Create Event */}
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateEvent}
                  disabled={isCreatingEvent}
                  className="w-full justify-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-600/20"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-200" />
                  <span>{isCreatingEvent ? 'Đang tạo lịch...' : 'Tạo Sự kiện Lịch học & Đồng bộ Calendar'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveNodeOnly}
              disabled={isSavingNode}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>{isSavingNode ? 'Đang lưu bài học...' : 'Lưu thay đổi bài học'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCourseNodeModal;
