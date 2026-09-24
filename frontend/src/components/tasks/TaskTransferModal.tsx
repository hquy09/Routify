import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { Task } from '../../types';
import { Button } from '../ui/button';

interface TaskTransferModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (taskId: number, newDueDate: string, keepSubtasks: boolean, notes?: string) => Promise<void>;
}

export const TaskTransferModal: React.FC<TaskTransferModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [newDueDate, setNewDueDate] = useState('');
  const [keepSubtasks, setKeepSubtasks] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen && task) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const pad = (n: number) => String(n).padStart(2, '0');
      const defaultDateStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T21:00`;
      setNewDueDate(defaultDateStr);
      setKeepSubtasks(true);
      setNotes('');
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDueDate) return;
    setIsSubmitting(true);
    try {
      await onConfirm(task.id, newDueDate, keepSubtasks, notes || undefined);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-purple-700 dark:text-purple-400 font-semibold text-base">
            <ArrowRightLeft className="w-5 h-5" />
            <span>Chuyển tiếp nhiệm vụ</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit explanation banner */}
        <div className="my-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-300 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-purple-700 dark:text-purple-400">
            <AlertTriangle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Bảo toàn lịch sử thống kê</span>
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-300/80 leading-relaxed">
            Nhiệm vụ cũ <strong>"{task.title}"</strong> sẽ được ghi nhận trạng thái <strong>Đã chuyển tiếp</strong>.
            Hệ thống sẽ tạo một nhiệm vụ mới cho ngày bạn chọn để đảm bảo dữ liệu kỷ luật chính xác.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Thời hạn mới</label>
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Ghi chú chuyển tiếp (Tùy chọn)</label>
            <input
              type="text"
              placeholder="VD: Bận việc gia đình, chuyển sang ngày mai"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={keepSubtasks}
              onChange={(e) => setKeepSubtasks(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-purple-600 focus:ring-0"
            />
            <span>Sao chép danh sách việc con sang nhiệm vụ mới</span>
          </label>

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
              <ArrowRightLeft className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận chuyển'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
