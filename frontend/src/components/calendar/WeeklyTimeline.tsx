import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  CheckCircle2, AlertCircle, Clock, Plus, Flame, BookOpen,
  MapPin, StickyNote, Trash2, ExternalLink, Flag, Edit2, CheckSquare
} from 'lucide-react';
import {
  CalendarWeeklyResponse, CalendarDayView, Task,
  ScheduleOccurrenceView, CalendarNote,
  PRIORITY_CONFIG, DIFFICULTY_CONFIG, PriorityLevel
} from '../../types';
import { getDeadlineInfo } from '../../utils/taskDeadlines';
import { Button } from '../ui/button';
import { toLocalDateString } from '../../utils/dateUtils';

interface WeeklyTimelineProps {
  data: CalendarWeeklyResponse | null;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onSelectDay: (dateStr: string) => void;
  onTaskClick: (task: Task) => void;
  onToggleTask: (task: Task) => void;
  onAddTaskForDay: (dateStr: string) => void;
  onQuickAddTask?: (dateStr: string, title: string) => Promise<void>;
  onDeleteTask?: (task: Task) => void;
  onEditSchedule?: (scheduleId: number) => void;
  onDeleteSchedule?: (scheduleId: number, title: string) => void;
  onAddSchedule: () => void;
  onAddTaskToSchedule?: (scheduleId: number, dateStr: string, startTime: string, endTime: string) => void;
  onAddNote: (dateStr: string, content: string) => Promise<void>;
  onDeleteNote: (noteId: number) => Promise<void>;
}

export const WeeklyTimeline: React.FC<WeeklyTimelineProps> = ({
  data,
  onPrevWeek,
  onNextWeek,
  onToday,
  onSelectDay,
  onTaskClick,
  onToggleTask,
  onAddTaskForDay,
  onQuickAddTask,
  onDeleteTask,
  onEditSchedule,
  onDeleteSchedule,
  onAddSchedule,
  onAddTaskToSchedule,
  onAddNote,
  onDeleteNote,
}) => {
  const [activeNoteDay, setActiveNoteDay] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [quickTaskDay, setQuickTaskDay] = useState<string | null>(null);
  const [quickTaskText, setQuickTaskText] = useState('');

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-500 animate-pulse">
        Đang tải lịch tuần...
      </div>
    );
  }

  const handleSaveNote = async (dateStr: string) => {
    if (noteInput.trim()) {
      await onAddNote(dateStr, noteInput.trim());
      setNoteInput('');
      setActiveNoteDay(null);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Week Header & Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Tuần {data.week_number} / {data.year}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({formatDateLabel(data.start_date)} - {formatDateLabel(data.end_date)})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevWeek}
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
          >
            Tuần hiện tại
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextWeek}
            title="Tuần sau"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onAddSchedule}
            className="ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Lịch cố định</span>
          </Button>
        </div>
      </div>

      {/* 7-Day Grid Columns */}
      <div className="flex-1 overflow-x-auto pb-2">
        <div className="grid grid-cols-7 gap-3 min-w-[950px]">
          {data.days.map((day) => {
            const todayStr = toLocalDateString();
            const isPast = day.date < todayStr;
            const isToday = day.is_today;

            return (
              <div
                key={day.date}
                className={`flex flex-col rounded-xl border p-2.5 min-w-[130px] transition-all shadow-xs ${
                  isToday
                    ? 'bg-white dark:bg-slate-900 border-neutral-900 dark:border-neutral-100 ring-2 ring-neutral-900/10 dark:ring-white/10 shadow-md'
                    : isPast
                    ? 'bg-slate-50/70 dark:bg-slate-900/35 border-slate-200 dark:border-slate-800/60 opacity-80 hover:opacity-100'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Day Header - Clickable for Day View */}
                <div
                  onClick={() => onSelectDay(day.date)}
                  className="pb-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 -m-1 rounded-lg transition"
                  title="Nhấn để xem Lịch Ngày chi tiết (Day View)"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs font-bold transition group-hover:text-neutral-900 dark:group-hover:text-neutral-100 ${
                          isToday
                            ? 'text-neutral-900 dark:text-neutral-100 font-extrabold'
                            : isPast
                            ? 'text-slate-400 dark:text-slate-400 font-medium'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {day.day_name.slice(0, 3)} {formatDateLabel(day.date)}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>

                    {isToday && (
                      <span className="text-[9px] bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Hôm nay
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[9px] bg-slate-200/80 text-slate-600 dark:bg-slate-800/90 dark:text-slate-400 font-medium px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700/50">
                        Đã xong
                      </span>
                    )}
                  </div>

                {/* Day Summary Counters */}
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span title="Completed" className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      ✅ {day.stats.completed}
                    </span>
                    <span title="Partial" className="text-amber-700 dark:text-amber-400 font-semibold">
                      🟡 {day.stats.partial}
                    </span>
                    <span title="Delayed" className="text-rose-700 dark:text-rose-400 font-semibold">
                      🔴 {day.stats.delayed}
                    </span>
                    <span title="Todo" className="text-slate-600 dark:text-slate-300 font-medium">
                      ⚪ {day.stats.todo}
                    </span>
                  </div>
                  <span
                    title="Thời gian rảnh ước tính"
                    className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono font-medium"
                  >
                    Rảnh: {day.free_time_hours}h
                  </span>
                </div>
              </div>

              {/* Day Content: Layers (Notes, Fixed Schedules, Tasks) */}
              <div className="flex-1 py-2 space-y-2 overflow-y-auto max-h-[680px]">
                {/* 1. LAYER: Notes */}
                {day.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300/90 flex items-start justify-between group shadow-2xs"
                  >
                    <span className="leading-tight">{note.content}</span>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-amber-600 hover:text-rose-600 dark:text-amber-500 dark:hover:text-rose-400 transition ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* 2. LAYER: Fixed Schedules (Visually Distinct: Tinted block, category, no checkbox) */}
                {day.fixed_schedules.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-1">
                      Lịch cố định ({day.fixed_schedules.length})
                    </div>
                    {day.fixed_schedules.map((occ, idx) => {
                      const attachedTasks = day.tasks.filter(
                        (t) => t.scheduled_with_fixed_id === occ.fixed_schedule_id
                      );
                      return (
                        <div
                          key={idx}
                          onClick={() => onEditSchedule && onEditSchedule(occ.fixed_schedule_id)}
                          className="rounded-lg p-2 border transition relative overflow-hidden group shadow-xs cursor-pointer hover:shadow-md"
                          style={{
                            backgroundColor: `${occ.color}15`,
                            borderColor: `${occ.color}40`,
                          }}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ backgroundColor: occ.color }}
                          />
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-100">
                            <span className="truncate pr-1 flex items-center gap-1">
                              <span className="shrink-0">{occ.icon || '📌'}</span>
                              <span className="truncate">{occ.title}</span>
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className="font-mono text-[10px] px-1 py-0.5 rounded font-semibold"
                                style={{
                                  color: occ.color,
                                  backgroundColor: `${occ.color}25`,
                                }}
                              >
                                {occ.start_time} - {occ.end_time}
                              </span>
                              {onAddTaskToSchedule && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddTaskToSchedule(occ.fixed_schedule_id, day.date, occ.start_time, occ.end_time);
                                  }}
                                  className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition p-0.5 rounded opacity-0 group-hover:opacity-100"
                                  title="Thêm nhiệm vụ vào lịch này"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}
                              {onEditSchedule && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditSchedule(occ.fixed_schedule_id);
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition p-0.5 rounded opacity-0 group-hover:opacity-100"
                                  title="Chỉnh sửa lịch cố định"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                              {onDeleteSchedule && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSchedule(occ.fixed_schedule_id, occ.title);
                                  }}
                                  className="text-slate-400 hover:text-rose-500 transition p-0.5 rounded opacity-0 group-hover:opacity-100"
                                  title="Xóa lịch cố định này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          {occ.course_title && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold text-[9px] truncate max-w-full">
                                <span>📚 {occ.course_title}</span>
                                {occ.course_node_title && (
                                  <span className="opacity-75 font-normal truncate"> • {occ.course_node_title}</span>
                                )}
                              </span>
                            </div>
                          )}
                          {occ.location && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{occ.location}</span>
                            </div>
                          )}
                          {occ.description && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 italic">
                              {occ.description}
                            </div>
                          )}
                          <div className="mt-1 text-[9px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span className="uppercase tracking-wider font-medium">{occ.category}</span>
                            {occ.is_overridden && (
                              <span className="text-amber-500 font-semibold">[Đổi giờ]</span>
                            )}
                          </div>
                          {/* Attached Tasks list inside Fixed Schedule */}
                          {attachedTasks.length > 0 && (
                            <div className="mt-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                                <span className="flex items-center gap-1">
                                  <CheckSquare className="w-2.5 h-2.5 text-emerald-500" />
                                  <span>Nhiệm vụ ({attachedTasks.filter((t) => t.status === 'COMPLETED').length}/{attachedTasks.length})</span>
                                </span>
                              </div>
                              <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                                {attachedTasks.map((t) => (
                                  <div
                                    key={t.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onTaskClick(t);
                                    }}
                                    className="flex items-center gap-1 p-1 rounded bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 text-[10px] hover:border-emerald-400 transition cursor-pointer"
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleTask(t);
                                      }}
                                      className={`w-3 h-3 rounded flex items-center justify-center border transition shrink-0 ${
                                        t.status === 'COMPLETED'
                                          ? 'bg-emerald-500 border-emerald-500 text-white'
                                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                                      }`}
                                    >
                                      {t.status === 'COMPLETED' && <CheckCircle2 className="w-2 h-2" />}
                                    </button>
                                    <span
                                      className={`truncate flex-1 font-medium ${
                                        t.status === 'COMPLETED'
                                          ? 'line-through text-slate-400 dark:text-slate-500'
                                          : 'text-slate-800 dark:text-slate-200'
                                      }`}
                                    >
                                      {t.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. LAYER: Tasks */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase px-1 flex items-center justify-between">
                    <span>Nhiệm vụ ({day.tasks.length})</span>
                    <button
                      onClick={() => onAddTaskForDay(day.date)}
                      className="text-neutral-900 dark:text-neutral-100 hover:opacity-75 font-bold text-xs"
                      title="Thêm task cho ngày này"
                    >
                      +
                    </button>
                  </div>

                  {day.tasks.length === 0 ? (
                    <div className="text-center py-4 text-[11px] text-slate-400 dark:text-slate-600">
                      Trống
                    </div>
                  ) : (
                    day.tasks.map((t) => {
                      const isDone = t.status === 'COMPLETED';
                      const pCfg = PRIORITY_CONFIG[(t.priority as PriorityLevel)] || PRIORITY_CONFIG.MEDIUM;
                      const dCfg = DIFFICULTY_CONFIG[t.difficulty] || DIFFICULTY_CONFIG[2];

                      // Dynamic left border based on priority
                      const priorityBorder = isDone
                        ? 'border-l-slate-300 dark:border-l-slate-700'
                        : t.priority === 'URGENT'
                        ? 'border-l-rose-500'
                        : t.priority === 'HIGH'
                        ? 'border-l-amber-500'
                        : t.priority === 'MEDIUM'
                        ? 'border-l-blue-400 dark:border-l-blue-500'
                        : 'border-l-slate-300 dark:border-l-slate-600';

                      return (
                        <div
                          key={t.id}
                          className={`rounded-lg p-2 border border-l-[3.5px] ${priorityBorder} text-xs transition-all cursor-pointer shadow-2xs group ${
                            isDone
                              ? 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-500'
                              : 'bg-white border-slate-200 hover:border-neutral-900 text-slate-900 dark:bg-slate-800/80 dark:border-slate-700 dark:hover:border-neutral-100 dark:text-slate-200'
                          }`}
                          onClick={() => onTaskClick(t)}
                        >
                          <div className="flex items-start gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTask(t);
                              }}
                              className="mt-0.5 text-slate-400 hover:text-emerald-500 shrink-0"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-500 hover:border-emerald-500" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium truncate text-xs ${
                                  isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {t.title}
                              </p>
                              <div className="flex items-center gap-1 mt-1.5 text-[10px] flex-wrap">
                                {/* Priority badge */}
                                <span
                                  title={`Mức ưu tiên: ${pCfg.label} - ${pCfg.description}`}
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-bold border text-[9px] ${pCfg.badgeBg} ${pCfg.textColor} ${pCfg.borderColor}`}
                                >
                                  <Flag className="w-2.5 h-2.5" />
                                  <span>{pCfg.shortLabel}</span>
                                </span>

                                {/* Difficulty badge */}
                                <span
                                  title={`Độ khó: ${dCfg.label} (+${dCfg.points} điểm) - ${dCfg.description}`}
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-bold border text-[9px] ${dCfg.bg} ${dCfg.color} ${dCfg.border}`}
                                >
                                  <Flame className="w-2.5 h-2.5 fill-current" />
                                  <span>{dCfg.shortLabel}</span>
                                </span>

                                {t.subtasks_count > 0 && (
                                  <span
                                    title={`Tiến độ subtasks: ${t.subtasks_completed_count}/${t.subtasks_count}`}
                                    className="font-mono text-[9px] text-slate-500 dark:text-slate-400 font-semibold px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800"
                                  >
                                    {t.subtasks_completed_count}/{t.subtasks_count}
                                  </span>
                                )}

                                {t.course_title && (
                                  <span
                                    className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 px-1 py-0.2 rounded text-[9px] truncate max-w-[85px] font-medium"
                                    title={`Khóa học: ${t.course_title}`}
                                  >
                                    📚 {t.course_title}
                                  </span>
                                )}

                                {t.scheduled_with_fixed_title && (
                                  <span
                                    className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 px-1 py-0.2 rounded text-[9px] truncate max-w-[90px] font-medium"
                                    title={`Lịch cố định: ${t.scheduled_with_fixed_title}`}
                                  >
                                    📌 {t.scheduled_with_fixed_title}
                                  </span>
                                )}

                                {t.due_datetime && (
                                  <span
                                    title={`Hạn chót: ${new Date(t.due_datetime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${getDeadlineInfo(t.due_datetime, t.status).text}`}
                                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-bold border text-[9px] ${
                                      getDeadlineInfo(t.due_datetime, t.status).badgeClass
                                    }`}
                                  >
                                    <Clock className="w-2.5 h-2.5 shrink-0" />
                                    <span>{getDeadlineInfo(t.due_datetime, t.status).shortText}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {onDeleteTask && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTask(t);
                                }}
                                className="text-slate-400 hover:text-rose-500 transition p-0.5 rounded opacity-0 group-hover:opacity-100 shrink-0 self-start"
                                title="Xóa nhiệm vụ này"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Inline quick add task */}
                  {quickTaskDay === day.date ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!quickTaskText.trim()) return;
                        if (onQuickAddTask) {
                          await onQuickAddTask(day.date, quickTaskText.trim());
                        }
                        setQuickTaskText('');
                        setQuickTaskDay(null);
                      }}
                      className="pt-1 flex items-center gap-1"
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="Tên việc..."
                        value={quickTaskText}
                        onChange={(e) => setQuickTaskText(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                      />
                      <button
                        type="button"
                        onClick={() => { setQuickTaskDay(null); setQuickTaskText(''); }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 px-0.5"
                      >
                        Hủy
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => { setQuickTaskDay(day.date); setQuickTaskText(''); }}
                      className="w-full py-1 text-center text-[10px] text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded transition font-medium border border-dashed border-slate-200 dark:border-slate-800/60"
                    >
                      + Thêm việc
                    </button>
                  )}
                </div>

                {/* Add Note Input toggle */}
                {activeNoteDay === day.date ? (
                  <div className="pt-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ghi chú trong ngày..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNote(day.date);
                        else if (e.key === 'Escape') setActiveNoteDay(null);
                      }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 shadow-2xs"
                    />
                    <div className="flex justify-end gap-1 mt-1.5 text-[10px]">
                      <button
                        onClick={() => setActiveNoteDay(null)}
                        className="px-2 py-0.5 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleSaveNote(day.date)}
                        className="px-2.5 py-0.5 bg-slate-900 dark:bg-slate-100 rounded-md text-white dark:text-slate-900 font-semibold shadow-xs hover:bg-slate-800 dark:hover:bg-slate-200"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveNoteDay(day.date)}
                    className="w-full text-left text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1 px-1 transition flex items-center gap-1"
                  >
                    <StickyNote className="w-3 h-3 text-amber-500" />
                    <span>+ Ghi chú</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
