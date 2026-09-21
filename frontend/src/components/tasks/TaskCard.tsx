import React from 'react';
import {
  CheckCircle2, Circle, Clock, Flame, BookOpen,
  CornerDownRight, MoreVertical, ArrowRightLeft,
  Trash2, Edit, Paperclip, ChevronDown, ChevronRight, Flag, AlertCircle
} from 'lucide-react';
import {
  Task, TASK_STATUS_LABELS, TASK_STATUS_COLORS,
  DIFFICULTY_LABELS, PRIORITY_CONFIG, PriorityLevel
} from '../../types';
import { getDeadlineInfo } from '../../utils/taskDeadlines';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onTransfer: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onToggleSubtask: (subtaskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onTransfer,
  onEdit,
  onDelete,
  onToggleSubtask,
}) => {
  const [showSubtasks, setShowSubtasks] = React.useState(false);
  const isCompleted = task.status === 'COMPLETED';
  const statusColor = TASK_STATUS_COLORS[task.status] || TASK_STATUS_COLORS.TODO;
  const diffInfo = DIFFICULTY_LABELS[task.difficulty] || DIFFICULTY_LABELS[2];

  // Format due date
  const formatDueDate = (dStr?: string) => {
    if (!dStr) return null;
    const d = new Date(dStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const priorityCfg = PRIORITY_CONFIG[(task.priority as PriorityLevel)] || PRIORITY_CONFIG.MEDIUM;
  const priorityBorder = isCompleted
    ? 'border-l-slate-300 dark:border-l-slate-700'
    : task.priority === 'URGENT'
    ? 'border-l-rose-500'
    : task.priority === 'HIGH'
    ? 'border-l-amber-500'
    : task.priority === 'MEDIUM'
    ? 'border-l-blue-400 dark:border-l-blue-500'
    : 'border-l-slate-300 dark:border-l-slate-600';

  return (
    <div
      className={`rounded-xl border border-l-4 ${priorityBorder} p-4 transition-all duration-200 ${
        isCompleted
          ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-80'
          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      }`}
    >
      {/* Transferred From Notice */}
      {task.transferred_from_title && (
        <div className="mb-2.5 flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-900/50">
          <CornerDownRight className="w-3 h-3" />
          <span>
            Được chuyển giao từ: <strong>{task.transferred_from_title}</strong>
            {task.transferred_from_date && ` — ${formatDueDate(task.transferred_from_date)}`}
          </span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Checkbox button */}
          <button
            onClick={() => onToggleStatus(task)}
            className="mt-0.5 text-slate-400 hover:text-emerald-500 transition"
            title={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
            ) : (
              <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
            )}
          </button>

          {/* Title & Description */}
          <div className="flex-1">
            <h4
              className={`text-sm font-semibold leading-snug ${
                isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>

        {/* Actions Dropdown / Menu */}
        <div className="flex items-center gap-1">
          {task.status !== 'TRANSFERRED' && task.status !== 'CANCELLED' && (
            <button
              onClick={() => onTransfer(task)}
              title="Chuyển giao task sang ngày mới (giữ lịch sử)"
              className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            title="Chỉnh sửa task"
            className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="Xóa task"
            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Badges / Metadata */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {/* Status Tag */}
        <span
          className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
        >
          {TASK_STATUS_LABELS[task.status] || task.status}
        </span>

        {/* Priority Badge */}
        <span
          title={`Mức ưu tiên: ${priorityCfg.label}`}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${priorityCfg.badgeBg} ${priorityCfg.textColor} ${priorityCfg.borderColor}`}
        >
          <Flag className="w-3 h-3" />
          <span>{priorityCfg.label}</span>
        </span>

        {/* Due Date */}
        {task.due_datetime && (
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatDueDate(task.due_datetime)}</span>
          </span>
        )}

        {/* Deadline Status Badge (Còn X tiếng / Đã quá hạn X tiếng / Đã hoàn thành) */}
        {task.due_datetime && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] ${
              getDeadlineInfo(task.due_datetime, task.status).badgeClass
            }`}
            title={`Hạn chót: ${formatDueDate(task.due_datetime)} - ${
              getDeadlineInfo(task.due_datetime, task.status).text
            }`}
          >
            {getDeadlineInfo(task.due_datetime, task.status).isOverdue ? (
              <AlertCircle className="w-3 h-3 shrink-0" />
            ) : (
              <Clock className="w-3 h-3 shrink-0" />
            )}
            <span>{getDeadlineInfo(task.due_datetime, task.status).text}</span>
          </span>
        )}

        {/* Goal / Project Badge */}
        {(task.goal_title || task.project_title) && (
          <span className="flex items-center gap-1 text-[11px] text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-900/40">
            <span>🎯</span>
            <span>
              {task.goal_title}
              {task.project_title ? ` / ${task.project_title}` : ''}
            </span>
          </span>
        )}

        {/* Course Badge */}
        {task.course_title && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/40">
            <BookOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{task.course_title}</span>
          </span>
        )}

        {/* Difficulty Badge */}
        <span
          className={`flex items-center gap-1 text-[11px] font-medium ${diffInfo.color} bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50`}
        >
          <Flame className="w-3 h-3 fill-current" />
          <span>Độ khó {task.difficulty} ({diffInfo.label})</span>
        </span>

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Paperclip className="w-3 h-3 text-slate-400" />
            <span>{task.attachments.length} files</span>
          </span>
        )}
      </div>

      {/* Subtasks Progress Bar */}
      {task.subtasks_count > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none mb-1.5"
          >
            <span className="flex items-center gap-1 font-medium">
              {showSubtasks ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>
                {task.subtasks_completed_count} / {task.subtasks_count} subtasks
              </span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              {task.subtask_progress}%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                task.subtask_progress === 100 ? 'bg-emerald-500' : 'bg-neutral-900 dark:bg-neutral-100'
              }`}
              style={{ width: `${task.subtask_progress}%` }}
            />
          </div>

          {/* Subtask items toggle */}
          {showSubtasks && (
            <div className="mt-2.5 space-y-1.5 pl-2">
              {task.subtasks.map((st) => (
                <label
                  key={st.id}
                  className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={st.is_completed}
                    onChange={() => onToggleSubtask(st.id)}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className={st.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                    {st.title}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
