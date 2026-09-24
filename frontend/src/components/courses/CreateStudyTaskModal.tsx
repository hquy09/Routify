import React, { useState } from 'react';
import { X, BookOpen, Plus, Flame, Clock, Calendar, Sparkles } from 'lucide-react';
import { CourseNode, Goal } from '../../types';
import { Button } from '../ui/button';
import { formatDatetimeForBackend } from '../../utils/dateUtils';

interface CreateStudyTaskModalProps {
  node: CourseNode | null;
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  onConfirm: (data: {
    lesson_id: number;
    title?: string;
    due_datetime?: string;
    difficulty?: number;
    priority?: string;
    goal_id?: number;
    project_id?: number;
  }) => Promise<void>;
  onCreateEvent?: (data: {
    title: string;
    course_id: number;
    course_node_id?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    category?: string;
    location?: string;
    description?: string;
    create_attached_task?: boolean;
    task_priority?: string;
    task_difficulty?: number;
  }) => Promise<void>;
}

export const CreateStudyTaskModal: React.FC<CreateStudyTaskModalProps> = ({
  node,
  isOpen,
  onClose,
  goals,
  onConfirm,
  onCreateEvent,
}) => {
  const [mode, setMode] = useState<'TASK' | 'EVENT'>('TASK');
  const [title, setTitle] = useState('');
  const [dueDatetime, setDueDatetime] = useState('');
  const [difficulty, setDifficulty] = useState<number>(2);
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [goalId, setGoalId] = useState<number | undefined>(undefined);
  const [projectId, setProjectId] = useState<number | undefined>(undefined);

  // Event states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDayOfWeek, setEventDayOfWeek] = useState<number>(0);
  const [eventStartTime, setEventStartTime] = useState('19:30');
  const [eventEndTime, setEventEndTime] = useState('21:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventCreateAttachedTask, setEventCreateAttachedTask] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen && node) {
      setMode('TASK');
      setTitle(`Học ${node.title}`);
      const d = new Date();
      d.setHours(21, 0, 0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      setDueDatetime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00`);
      setDifficulty(node.difficulty || 2);
      setPriority('MEDIUM');
      setGoalId(undefined);
      setProjectId(undefined);

      // Event defaults
      setEventTitle(`Lịch học: ${node.title}`);
      const jsDow = new Date().getDay();
      setEventDayOfWeek(jsDow === 0 ? 6 : jsDow - 1);
      setEventStartTime('19:30');
      setEventEndTime('21:00');
      setEventLocation('');
      setEventCreateAttachedTask(true);
    }
  }, [isOpen, node]);

  if (!isOpen || !node) return null;

  const currentGoal = (goals || []).find((g) => g.id === Number(goalId));
  const availableProjects = currentGoal?.projects || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'EVENT') {
        if (!onCreateEvent) {
          alert('Chức năng tạo sự kiện chưa được hỗ trợ tại đây.');
          return;
        }
        if (eventStartTime >= eventEndTime) {
          alert('Giờ bắt đầu phải trước giờ kết thúc!');
          return;
        }
        await onCreateEvent({
          title: eventTitle.trim(),
          course_id: node.course_id,
          course_node_id: node.id,
          day_of_week: Number(eventDayOfWeek),
          start_time: eventStartTime,
          end_time: eventEndTime,
          category: 'STUDY',
          location: eventLocation.trim() || undefined,
          create_attached_task: eventCreateAttachedTask,
          task_priority: priority,
          task_difficulty: difficulty,
        });
        onClose();
      } else {
        await onConfirm({
          lesson_id: node.id,
          title: title.trim(),
          due_datetime: formatDatetimeForBackend(dueDatetime),
          difficulty,
          priority,
          goal_id: goalId ? Number(goalId) : undefined,
          project_id: projectId ? Number(projectId) : undefined,
        });
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
            <BookOpen className="w-5 h-5" />
            <span>Lên lịch bài học</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Task vs Event */}
        <div className="flex items-center gap-1 p-1 mt-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMode('TASK')}
            className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'TASK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Nhiệm vụ</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('EVENT')}
            className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'EVENT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-200" />
            <span>Sự kiện / Lịch học</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3 text-xs">
          {mode === 'TASK' ? (
            <>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tiêu đề nhiệm vụ</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Hạn chót</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDatetime}
                    onChange={(e) => setDueDatetime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Độ khó</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={1}>1 - Dễ</option>
                    <option value={2}>2 - Bình thường</option>
                    <option value={3}>3 - Khó</option>
                    <option value={4}>4 - Rất khó</option>
                    <option value={5}>5 - Cực khó</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Mục tiêu</label>
                  <select
                    value={goalId || ''}
                    onChange={(e) => {
                      setGoalId(e.target.value ? Number(e.target.value) : undefined);
                      setProjectId(undefined);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Không chọn --</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Dự án</label>
                  <select
                    value={projectId || ''}
                    disabled={!goalId || availableProjects.length === 0}
                    onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    <option value="">-- Không chọn --</option>
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tên buổi học / Sự kiện</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Thứ trong tuần lặp lại</label>
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
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Địa điểm / Phòng học (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="VD: Phòng B201, Zoom..."
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    Tự động tạo kèm nhiệm vụ ôn bài
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Đính kèm nhiệm vụ vào khung giờ lịch này
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={eventCreateAttachedTask}
                  onChange={(e) => setEventCreateAttachedTask(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </>
          )}

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
              className={mode === 'EVENT' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
            >
              <Plus className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Đang tạo...'
                  : mode === 'EVENT'
                  ? 'Tạo Sự kiện Lịch học'
                  : 'Tạo Nhiệm vụ học tập'}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
