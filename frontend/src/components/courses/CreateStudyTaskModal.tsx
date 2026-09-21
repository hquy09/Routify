import React, { useState } from 'react';
import { X, BookOpen, Plus, Flame, Clock } from 'lucide-react';
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
}

export const CreateStudyTaskModal: React.FC<CreateStudyTaskModalProps> = ({
  node,
  isOpen,
  onClose,
  goals,
  onConfirm,
}) => {
  const [title, setTitle] = useState('');
  const [dueDatetime, setDueDatetime] = useState('');
  const [difficulty, setDifficulty] = useState<number>(2);
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [goalId, setGoalId] = useState<number | undefined>(undefined);
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen && node) {
      setTitle(`Học ${node.title}`);
      const d = new Date();
      d.setHours(21, 0, 0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      setDueDatetime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00`);
      setDifficulty(node.difficulty || 2);
      setPriority('MEDIUM');
      setGoalId(undefined);
      setProjectId(undefined);
    }
  }, [isOpen, node]);

  if (!isOpen || !node) return null;

  const currentGoal = (goals || []).find((g) => g.id === Number(goalId));
  const availableProjects = currentGoal?.projects || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
            <BookOpen className="w-5 h-5" />
            <span>Tạo Task học tập từ bài học</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
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
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Độ khó (1 - 5)</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={1}>1 - Dễ (Easy)</option>
                <option value={2}>2 - Bình thường (Normal)</option>
                <option value={3}>3 - Trung bình (Medium)</option>
                <option value={4}>4 - Khó (Hard)</option>
                <option value={5}>5 - Cực khó (Extreme)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Mục tiêu (Goal)</label>
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
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Dự án (Project)</label>
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
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo Study Task'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
