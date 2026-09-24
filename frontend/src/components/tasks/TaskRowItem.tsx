import React, { useState } from 'react';
import {
  CheckCircle2, Circle, Clock, Flame, BookOpen,
  CornerDownRight, ArrowRightLeft, Trash2, Edit2,
  ChevronDown, ChevronRight, Flag, CheckSquare
} from 'lucide-react';
import {
  Task, TASK_STATUS_COLORS, DIFFICULTY_LABELS,
  PRIORITY_CONFIG, PriorityLevel
} from '../../types';
import { getDeadlineInfo } from '../../utils/taskDeadlines';

interface TaskRowItemProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onTransfer: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onToggleSubtask: (subtaskId: number) => void;
  showCourseTag?: boolean;
}

export const TaskRowItem: React.FC<TaskRowItemProps> = ({
  task,
  onToggleStatus,
  onTransfer,
  onEdit,
  onDelete,
  onToggleSubtask,
  showCourseTag = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isCompleted = task.status === 'COMPLETED';
  const pCfg = PRIORITY_CONFIG[(task.priority as PriorityLevel)] || PRIORITY_CONFIG.MEDIUM;
  const dCfg = DIFFICULTY_LABELS[task.difficulty] || DIFFICULTY_LABELS[2];
  const deadline = getDeadlineInfo(task.due_datetime, task.status);

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
      className={`rounded-xl border border-l-4 ${priorityBorder} transition-all duration-150 ${
        isCompleted
          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-80'
          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
      }`}
    >
      {/* Main Single Row */}
      <div className="p-2.5 sm:px-3.5 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Left: Checkbox + Title + Expand Button */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
          {/* Checkbox button */}
          <button
            type="button"
            onClick={() => onToggleStatus(task)}
            className="text-slate-400 hover:text-emerald-500 transition shrink-0"
            title={isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
            ) : (
              <Circle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
            )}
          </button>

          {/* Subtask expand toggle button if has subtasks */}
          {task.subtasks && task.subtasks.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              title="Xem danh sách subtasks"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-1" />
          )}

          {/* Title & Notes */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                onClick={() => onEdit(task)}
                className={`text-xs sm:text-sm font-semibold truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition ${
                  isCompleted
                    ? 'line-through text-slate-400 dark:text-slate-500 font-normal'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
                title={task.title}
              >
                {task.title}
              </span>

              {task.transferred_from_title && (
                <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-0.5 shrink-0" title={`Chuyển giao từ: ${task.transferred_from_title}`}>
                  <CornerDownRight className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Chuyển giao</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Badges + Quick Actions */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0 justify-end ml-auto text-[10px]">
          {/* Course Tag */}
          {showCourseTag && task.course_title && (
            <span
              className="px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 truncate max-w-[130px]"
              title={`Khóa học: ${task.course_title}`}
            >
              📚 {task.course_title}
            </span>
          )}

          {/* Fixed Schedule Tag */}
          {task.scheduled_with_fixed_title && (
            <span
              className="px-1.5 py-0.5 rounded font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 truncate max-w-[120px]"
              title={`Lịch cố định: ${task.scheduled_with_fixed_title}`}
            >
              📌 {task.scheduled_with_fixed_title}
            </span>
          )}

          {/* Priority */}
          <span
            className={`px-1.5 py-0.5 rounded font-bold border flex items-center gap-0.5 ${pCfg.badgeBg} ${pCfg.textColor} ${pCfg.borderColor}`}
            title={`Mức ưu tiên: ${pCfg.label}`}
          >
            <Flag className="w-2.5 h-2.5" />
            <span>{pCfg.shortLabel}</span>
          </span>

          {/* Difficulty */}
          <span
            className="px-1.5 py-0.5 rounded font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-0.5"
            title={`Độ khó: ${dCfg.label}`}
          >
            <Flame className="w-2.5 h-2.5 fill-current text-amber-500" />
            <span>★{task.difficulty}</span>
          </span>

          {/* Deadline */}
          {task.due_datetime && (
            <span
              className={`px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 ${deadline.badgeClass}`}
              title={`Hạn chót: ${deadline.text}`}
            >
              <Clock className="w-2.5 h-2.5 shrink-0" />
              <span>{deadline.shortText}</span>
            </span>
          )}

          {/* Subtasks Progress */}
          {task.subtasks_count > 0 && (
            <span
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200"
              title={`Tiến độ việc con: ${task.subtasks_completed_count}/${task.subtasks_count}`}
            >
              {task.subtasks_completed_count}/{task.subtasks_count} việc
            </span>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-1 border-l border-slate-200 dark:border-slate-800 pl-1.5">
            <button
              type="button"
              onClick={() => onTransfer(task)}
              className="p-1 text-slate-400 hover:text-purple-600 transition rounded"
              title="Chuyển tiếp nhiệm vụ sang ngày khác"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1 text-slate-400 hover:text-blue-600 transition rounded"
              title="Chỉnh sửa nhiệm vụ"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1 text-slate-400 hover:text-rose-500 transition rounded"
              title="Xóa nhiệm vụ"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Subtasks mini-view */}
      {isExpanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Danh sách bước làm:</span>
            <span>{Math.round(task.subtask_progress || 0)}% hoàn thành</span>
          </div>
          <div className="space-y-1">
            {task.subtasks.map((st) => (
              <div
                key={st.id}
                onClick={() => onToggleSubtask(st.id)}
                className="flex items-center gap-2 p-1 px-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer text-xs"
              >
                <button
                  type="button"
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition shrink-0 ${
                    st.is_completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {st.is_completed && <CheckSquare className="w-2.5 h-2.5" />}
                </button>
                <span
                  className={`flex-1 text-xs truncate ${
                    st.is_completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
