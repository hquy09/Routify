import React from 'react';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { ConflictItem } from '../../types';

interface ConflictWarningModalProps {
  isOpen: boolean;
  conflicts: ConflictItem[];
  onKeepAnyway: () => void;
  onMoveTask: () => void;
  onCancel: () => void;
}

export const ConflictWarningModal: React.FC<ConflictWarningModalProps> = ({
  isOpen,
  conflicts,
  onKeepAnyway,
  onMoveTask,
  onCancel,
}) => {
  if (!isOpen || conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 font-semibold text-base mb-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <h4>Phát hiện trùng lịch cố định</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">Schedule Conflict Detected</p>
          </div>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">
          Khoảng thời gian này đang trùng với lịch cố định đã đặt trước:
        </p>

        <div className="space-y-2 mb-5">
          {conflicts.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</span>
                <span className="text-[10px] text-slate-700 dark:text-slate-400 ml-2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {item.start_time} - {item.end_time}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onKeepAnyway}
            className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-xs font-semibold transition shadow-xs"
          >
            Vẫn giữ nguyên (Keep anyway)
          </button>
          <button
            onClick={onMoveTask}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium transition"
          >
            Thay đổi khung giờ (Move task)
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition"
          >
            Hủy bỏ (Cancel)
          </button>
        </div>
      </div>
    </div>
  );
};
