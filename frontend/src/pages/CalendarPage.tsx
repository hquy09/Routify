import React, { useState, useEffect, useRef } from 'react';
import { WeeklyTimeline } from '../components/calendar/WeeklyTimeline';
import { MonthlyCalendar } from '../components/calendar/MonthlyCalendar';
import { DailyTimeline } from '../components/calendar/DailyTimeline';
import { FixedScheduleModal } from '../components/calendar/FixedScheduleModal';
import { SchoolTimetablePresetModal } from '../components/calendar/SchoolTimetablePresetModal';
import { ManageFixedSchedulesModal } from '../components/calendar/ManageFixedSchedulesModal';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskTransferModal } from '../components/tasks/TaskTransferModal';
import { UndoToast } from '../components/ui/UndoToast';
import {
  CalendarWeeklyResponse, CalendarMonthlyResponse, CalendarDayView, Task, Goal, FixedSchedule
} from '../types';
import { api } from '../services/api';
import { toLocalDateString, formatDatetimeForBackend } from '../utils/dateUtils';
import { School, Settings2, Maximize2, Minimize2, ChevronLeft, ChevronRight, Plus, CalendarDays, Calendar, Clock, Compass } from 'lucide-react';
import { Button } from '../components/ui/button';

export const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'WEEKLY' | 'MONTHLY' | 'DAILY'>('WEEKLY');
  const [isFullScreenWeekly, setIsFullScreenWeekly] = useState(false);
  const [weeklyData, setWeeklyData] = useState<CalendarWeeklyResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<CalendarMonthlyResponse | null>(null);
  const [dailyData, setDailyData] = useState<CalendarDayView | null>(null);
  const [currentDateRef, setCurrentDateRef] = useState<Date>(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<string>(() => toLocalDateString());

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  };
  const [goals, setGoals] = useState<Goal[]>([]);

  // Task & Schedule Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToTransfer, setTaskToTransfer] = useState<Task | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [prefilledDayDate, setPrefilledDayDate] = useState<string | undefined>(undefined);
  const [prefilledFixedScheduleId, setPrefilledFixedScheduleId] = useState<number | undefined>(undefined);

  // Fixed Schedules management
  const [allFixedSchedules, setAllFixedSchedules] = useState<FixedSchedule[]>([]);
  const [scheduleToEdit, setScheduleToEdit] = useState<FixedSchedule | null>(null);
  const [scheduleDefaultDay, setScheduleDefaultDay] = useState<number | undefined>(undefined);
  const [isManageSchedulesOpen, setIsManageSchedulesOpen] = useState(false);
  const [isSchoolPresetOpen, setIsSchoolPresetOpen] = useState(false);

  // Undo Toast state
  const [undoToast, setUndoToast] = useState<{
    isOpen: boolean;
    message: string;
    onUndo: () => void;
    onDismiss: () => void;
  }>({
    isOpen: false,
    message: '',
    onUndo: () => {},
    onDismiss: () => {},
  });
  const pendingDeleteTimerRef = useRef<any>(null);

  const loadWeekly = async (refDate: Date) => {
    try {
      const isoDate = toLocalDateString(refDate);
      const data = await api.calendar.getWeekly(isoDate);
      setWeeklyData(data);
    } catch (err) {
      console.error('Failed to load weekly calendar:', err);
    }
  };

  const loadMonthly = async (refDate: Date) => {
    try {
      const year = refDate.getFullYear();
      const month = refDate.getMonth() + 1;
      const data = await api.calendar.getMonthly(year, month);
      setMonthlyData(data);
    } catch (err) {
      console.error('Failed to load monthly calendar:', err);
    }
  };

  const loadGoals = async () => {
    try {
      const res = await api.goals.list();
      setGoals(res);
    } catch (err) {
      console.error('Failed to load goals:', err);
    }
  };

  const loadFixedSchedules = async () => {
    try {
      const list = await api.schedules.list();
      setAllFixedSchedules(list);
    } catch (err) {
      console.error('Failed to load fixed schedules:', err);
    }
  };

  useEffect(() => {
    loadGoals();
    loadFixedSchedules();
  }, []);

  // Listen for ESC key to exit full screen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreenWeekly) {
        setIsFullScreenWeekly(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenWeekly]);

  const loadDaily = async (dateStr: string) => {
    if (weeklyData) {
      const found = weeklyData.days.find((d) => d.date === dateStr);
      if (found) setDailyData(found);
    }
    try {
      const data = await api.calendar.getDaily(dateStr);
      setDailyData(data);
    } catch (err) {
      console.error('Failed to load daily calendar:', err);
    }
  };

  useEffect(() => {
    if (viewMode === 'WEEKLY') {
      loadWeekly(currentDateRef);
    } else if (viewMode === 'MONTHLY') {
      loadMonthly(currentDateRef);
    } else if (viewMode === 'DAILY') {
      loadDaily(selectedDayDate);
    }
  }, [viewMode, currentDateRef, selectedDayDate]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const d = new Date(currentDateRef);
    d.setDate(d.getDate() - 7);
    setCurrentDateRef(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDateRef);
    d.setDate(d.getDate() + 7);
    setCurrentDateRef(d);
  };

  const handleToday = () => {
    setCurrentDateRef(new Date());
  };

  const handlePrevMonth = () => {
    const d = new Date(currentDateRef);
    d.setMonth(d.getMonth() - 1);
    setCurrentDateRef(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDateRef);
    d.setMonth(d.getMonth() + 1);
    setCurrentDateRef(d);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDayDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const nextStr = toLocalDateString(d);
    setSelectedDayDate(nextStr);
    loadDaily(nextStr);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDayDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const nextStr = toLocalDateString(d);
    setSelectedDayDate(nextStr);
    loadDaily(nextStr);
  };

  const handleTodayDay = () => {
    const todayStr = toLocalDateString();
    setSelectedDayDate(todayStr);
    loadDaily(todayStr);
  };

  const reloadCurrentView = () => {
    loadWeekly(currentDateRef);
    if (viewMode === 'MONTHLY') loadMonthly(currentDateRef);
    if (viewMode === 'DAILY') loadDaily(selectedDayDate);
    loadFixedSchedules();
    window.dispatchEvent(new CustomEvent('lifeos_task_updated'));
    window.dispatchEvent(new CustomEvent('lifeos_schedule_updated'));
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await api.tasks.update(task.id, { status: newStatus });
      reloadCurrentView();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current);
      }
    };
  }, []);

  const handleQuickAddTask = async (dateStr: string, title: string) => {
    try {
      await api.tasks.create({
        title,
        due_datetime: `${dateStr}T21:00:00`,
        status: 'TODO',
        priority: 'MEDIUM',
        difficulty: 2,
      });
      reloadCurrentView();
    } catch (err) {
      console.error('Failed to quick add task:', err);
    }
  };

  const handleAddTaskWithHour = (dateStr: string, hour?: number) => {
    setTaskToEdit(null);
    if (hour !== undefined) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const startTime = `${dateStr}T${pad(hour)}:00`;
      const dueTime = `${dateStr}T${pad(Math.min(23, hour + 1))}:00`;
      setTaskToEdit({
        id: 0,
        title: '',
        status: 'TODO',
        priority: 'MEDIUM',
        difficulty: 2,
        start_datetime: startTime,
        due_datetime: dueTime,
        subtasks_count: 0,
        subtasks_completed_count: 0,
        created_at: '',
        updated_at: '',
      } as any);
      setPrefilledDayDate(undefined);
    } else {
      setPrefilledDayDate(dateStr);
    }
    setPrefilledFixedScheduleId(undefined);
    setIsTaskModalOpen(true);
  };

  const handleAddTaskToSchedule = (scheduleId: number, dateStr: string, startTime: string, endTime: string) => {
    setPrefilledDayDate(dateStr);
    setPrefilledFixedScheduleId(scheduleId);
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTaskWithUndo = (task: Task) => {
    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      undoToast.onDismiss();
    }

    // Optimistic removal from UI
    setDailyData((prev) => prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== task.id) } : null);
    setWeeklyData((prev) => prev ? {
      ...prev,
      days: prev.days.map((d) => ({
        ...d,
        tasks: d.tasks.filter((t) => t.id !== task.id),
      }))
    } : null);

    const commitDelete = async () => {
      try {
        await api.tasks.delete(task.id);
      } catch (err) {
        console.error('Failed to delete task on server:', err);
        reloadCurrentView();
      }
    };

    const handleUndo = () => {
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current);
        pendingDeleteTimerRef.current = null;
      }
      setUndoToast((prev) => ({ ...prev, isOpen: false }));
      reloadCurrentView();
    };

    const handleDismiss = () => {
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current);
        pendingDeleteTimerRef.current = null;
      }
      commitDelete();
      setUndoToast((prev) => ({ ...prev, isOpen: false }));
    };

    pendingDeleteTimerRef.current = setTimeout(() => {
      commitDelete();
      setUndoToast((prev) => ({ ...prev, isOpen: false }));
      pendingDeleteTimerRef.current = null;
    }, 6000);

    setUndoToast({
      isOpen: true,
      message: `Đã xóa nhiệm vụ "${task.title}"`,
      onUndo: handleUndo,
      onDismiss: handleDismiss,
    });
  };

  const handleDeleteScheduleWithUndo = (scheduleId: number, title: string) => {
    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      undoToast.onDismiss();
    }

    // Optimistic removal from UI
    setDailyData((prev) => prev ? {
      ...prev,
      fixed_schedules: prev.fixed_schedules.filter((s) => s.fixed_schedule_id !== scheduleId)
    } : null);
    setWeeklyData((prev) => prev ? {
      ...prev,
      days: prev.days.map((d) => ({
        ...d,
        fixed_schedules: d.fixed_schedules.filter((s) => s.fixed_schedule_id !== scheduleId),
      }))
    } : null);

    const commitDelete = async () => {
      try {
        await api.schedules.delete(scheduleId);
        loadFixedSchedules();
      } catch (err) {
        console.error('Failed to delete schedule on server:', err);
        reloadCurrentView();
      }
    };

    const handleUndo = () => {
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current);
        pendingDeleteTimerRef.current = null;
      }
      setUndoToast((prev) => ({ ...prev, isOpen: false }));
      reloadCurrentView();
      loadFixedSchedules();
    };

    const handleDismiss = () => {
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current);
        pendingDeleteTimerRef.current = null;
      }
      commitDelete();
      setUndoToast((prev) => ({ ...prev, isOpen: false }));
    };

    pendingDeleteTimerRef.current = setTimeout(() => {
      commitDelete();
      setUndoToast((prev) => ({ ...prev, isOpen: false }));
      pendingDeleteTimerRef.current = null;
    }, 6000);

    setUndoToast({
      isOpen: true,
      message: `Đã xóa lịch cố định "${title}"`,
      onUndo: handleUndo,
      onDismiss: handleDismiss,
    });
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      if (taskToEdit && taskToEdit.id !== 0) {
        await api.tasks.update(taskToEdit.id, taskData);
      } else {
        await api.tasks.create(taskData);
      }
      reloadCurrentView();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleConfirmTransfer = async (
    taskId: number,
    newDueDate: string,
    keepSubtasks: boolean,
    notes?: string
  ) => {
    try {
      await api.tasks.transfer(taskId, {
        new_due_datetime: formatDatetimeForBackend(newDueDate) || newDueDate,
        keep_subtasks: keepSubtasks,
        notes,
      });
      reloadCurrentView();
    } catch (err) {
      console.error('Failed to transfer task:', err);
    }
  };

  const handleOpenCreateFixedSchedule = (dayOfWeek?: number) => {
    setScheduleToEdit(null);
    setScheduleDefaultDay(dayOfWeek);
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditFixedSchedule = async (scheduleId: number) => {
    let target = allFixedSchedules.find((s) => s.id === scheduleId);
    if (!target) {
      try {
        const list = await api.schedules.list();
        setAllFixedSchedules(list);
        target = list.find((s) => s.id === scheduleId);
      } catch (err) {
        console.error('Failed to find schedule:', err);
      }
    }
    if (target) {
      setScheduleToEdit(target);
      setIsScheduleModalOpen(true);
    }
  };

  const handleSaveFixedSchedule = async (scheduleData: Partial<FixedSchedule>) => {
    try {
      if (scheduleToEdit) {
        await api.schedules.update(scheduleToEdit.id, scheduleData);
      } else {
        await api.schedules.create(scheduleData);
      }
      await loadFixedSchedules();
      reloadCurrentView();
    } catch (err) {
      console.error('Failed to save fixed schedule:', err);
      throw err;
    }
  };

  const handleSaveBatchFixedSchedules = async (schedules: Partial<FixedSchedule>[], replaceCategory?: string) => {
    try {
      await api.schedules.createBatch({ schedules, replace_category: replaceCategory });
      await loadFixedSchedules();
      reloadCurrentView();
    } catch (err) {
      console.error('Failed to save batch fixed schedules:', err);
      throw err;
    }
  };

  const handleToggleActiveFixedSchedule = async (schedule: FixedSchedule) => {
    try {
      await api.schedules.update(schedule.id, { is_active: !schedule.is_active });
      await loadFixedSchedules();
      reloadCurrentView();
    } catch (err) {
      console.error('Failed to toggle active fixed schedule:', err);
    }
  };

  const handleAddNote = async (dateStr: string, content: string) => {
    try {
      await api.calendar.addNote({ note_date: dateStr, content });
      reloadCurrentView();
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await api.calendar.deleteNote(noteId);
      reloadCurrentView();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 h-full gap-2 relative">
      {/* SLIM VERTICAL FUNCTIONS TOOLBAR (DẠNG DỌC, CHỈ HIỆN ICON TỐI GIẢN) */}
      <aside
        className="w-11 shrink-0 flex flex-col items-center py-2.5 px-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs justify-between select-none z-20"
        aria-label="Thanh công cụ Calendar"
      >
        {/* Top Group: View Modes & Navigation & Actions */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {/* 1. View Mode Toggles: Tuần | Ngày | Tháng */}
          <div className="flex flex-col items-center gap-1 w-full pb-1.5 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('WEEKLY')}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'WEEKLY'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Xem theo Tuần"
            >
              <CalendarDays className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode('DAILY')}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'DAILY'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Xem theo Ngày"
            >
              <Clock className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode('MONTHLY')}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'MONTHLY'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Xem theo Tháng"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Navigation: Prev | Today | Next */}
          <div className="flex flex-col items-center gap-1 w-full py-1.5 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'WEEKLY') handlePrevWeek();
                else if (viewMode === 'DAILY') handlePrevDay();
                else handlePrevMonth();
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={
                viewMode === 'WEEKLY'
                  ? 'Tuần trước'
                  : viewMode === 'DAILY'
                  ? 'Ngày hôm trước'
                  : 'Tháng trước'
              }
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (viewMode === 'DAILY') handleTodayDay();
                else handleToday();
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title={
                viewMode === 'WEEKLY'
                  ? 'Về Tuần hiện tại'
                  : viewMode === 'DAILY'
                  ? 'Về Hôm nay'
                  : 'Về Tháng hiện tại'
              }
            >
              <Compass className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (viewMode === 'WEEKLY') handleNextWeek();
                else if (viewMode === 'DAILY') handleNextDay();
                else handleNextMonth();
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={
                viewMode === 'WEEKLY'
                  ? 'Tuần sau'
                  : viewMode === 'DAILY'
                  ? 'Ngày tiếp theo'
                  : 'Tháng sau'
              }
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. Schedule Actions: Thêm Lịch | Quản lý Lịch | TKB Trường */}
          <div className="flex flex-col items-center gap-1 w-full pt-1">
            <button
              type="button"
              onClick={() => handleOpenCreateFixedSchedule()}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition shadow-2xs"
              title="Tạo Lịch cố định mới"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsManageSchedulesOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title={`Quản lý toàn bộ Lịch cố định (${allFixedSchedules.length})`}
            >
              <Settings2 className="w-4 h-4" />
              {allFixedSchedules.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSchoolPresetOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
              title="Thời khóa biểu trường học"
            >
              <School className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Group: Full Screen */}
        <div className="flex flex-col items-center gap-1 w-full pt-2 border-t border-slate-200 dark:border-slate-800">
          {viewMode === 'WEEKLY' && (
            <button
              type="button"
              onClick={() => setIsFullScreenWeekly(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Hiển thị toàn màn hình"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Calendar View Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {viewMode === 'WEEKLY' ? (
          <WeeklyTimeline
            data={weeklyData}
            hideHeader={true}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onToday={handleToday}
            onSelectDay={(dateStr) => {
              setSelectedDayDate(dateStr);
              setViewMode('DAILY');
            }}
            onTaskClick={(t) => {
              setTaskToEdit(t);
              setIsTaskModalOpen(true);
            }}
            onToggleTask={handleToggleTask}
            onAddTaskForDay={(dateStr, hour) => handleAddTaskWithHour(dateStr, hour)}
            onQuickAddTask={handleQuickAddTask}
            onDeleteTask={handleDeleteTaskWithUndo}
            onEditSchedule={handleOpenEditFixedSchedule}
            onDeleteSchedule={handleDeleteScheduleWithUndo}
            onAddSchedule={handleOpenCreateFixedSchedule}
            onAddTaskToSchedule={handleAddTaskToSchedule}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
          />
        ) : viewMode === 'DAILY' ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <DailyTimeline
              data={dailyData}
              dateStr={selectedDayDate}
              onBackToWeek={() => setViewMode('WEEKLY')}
              onPrevDay={handlePrevDay}
              onNextDay={handleNextDay}
              onToday={handleTodayDay}
              onTaskClick={(t) => {
                setTaskToEdit(t);
                setIsTaskModalOpen(true);
              }}
              onToggleTask={handleToggleTask}
              onAddTask={(dateStr, hour) => handleAddTaskWithHour(dateStr, hour)}
              onQuickAddTask={handleQuickAddTask}
              onDeleteTask={handleDeleteTaskWithUndo}
              onEditSchedule={handleOpenEditFixedSchedule}
              onDeleteSchedule={handleDeleteScheduleWithUndo}
              onAddSchedule={handleOpenCreateFixedSchedule}
              onAddTaskToSchedule={handleAddTaskToSchedule}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <MonthlyCalendar
              data={monthlyData}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectDay={(dateStr) => {
                setSelectedDayDate(dateStr);
                setViewMode('DAILY');
              }}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
          setPrefilledDayDate(undefined);
          setPrefilledFixedScheduleId(undefined);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        goals={goals}
        initialDate={prefilledDayDate}
        fixedSchedules={allFixedSchedules}
        initialFixedScheduleId={prefilledFixedScheduleId}
      />

      <TaskTransferModal
        isOpen={!!taskToTransfer}
        task={taskToTransfer}
        onClose={() => setTaskToTransfer(null)}
        onConfirm={handleConfirmTransfer}
      />

      <FixedScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleToEdit(null);
          setScheduleDefaultDay(undefined);
        }}
        onSave={handleSaveFixedSchedule}
        onSaveBatch={handleSaveBatchFixedSchedules}
        onDelete={async (id) => {
          handleDeleteScheduleWithUndo(id, scheduleToEdit?.title || 'Lịch cố định');
          setIsScheduleModalOpen(false);
          setScheduleToEdit(null);
          setScheduleDefaultDay(undefined);
        }}
        scheduleToEdit={scheduleToEdit}
        initialDayOfWeek={scheduleDefaultDay}
        existingSchedules={allFixedSchedules}
        onOpenSchoolPreset={() => {
          setIsScheduleModalOpen(false);
          setScheduleToEdit(null);
          setScheduleDefaultDay(undefined);
          setIsSchoolPresetOpen(true);
        }}
      />

      <SchoolTimetablePresetModal
        isOpen={isSchoolPresetOpen}
        onClose={() => setIsSchoolPresetOpen(false)}
        onSaveBatch={handleSaveBatchFixedSchedules}
      />

      <ManageFixedSchedulesModal
        isOpen={isManageSchedulesOpen}
        onClose={() => setIsManageSchedulesOpen(false)}
        schedules={allFixedSchedules}
        onOpenCreate={(dayOfWeek?: number) => {
          setIsManageSchedulesOpen(false);
          handleOpenCreateFixedSchedule(dayOfWeek);
        }}
        onOpenEdit={(schedule) => {
          setIsManageSchedulesOpen(false);
          setScheduleToEdit(schedule);
          setIsScheduleModalOpen(true);
        }}
        onToggleActive={handleToggleActiveFixedSchedule}
        onDelete={async (id, title) => {
          handleDeleteScheduleWithUndo(id, title);
        }}
        onOpenSchoolPreset={() => {
          setIsManageSchedulesOpen(false);
          setIsSchoolPresetOpen(true);
        }}
      />

      {/* Undo Toast Banner */}
      <UndoToast
        isOpen={undoToast.isOpen}
        message={undoToast.message}
        onUndo={undoToast.onUndo}
        onDismiss={undoToast.onDismiss}
      />

      {/* FULL SCREEN WEEKLY CALENDAR OVERLAY */}
      {isFullScreenWeekly && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-neutral-950 p-4 sm:p-6 flex flex-col overflow-y-auto animate-in fade-in duration-150">
          {/* Floating Topbar */}
          <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-200 dark:border-neutral-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📅</span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Lịch Tuần Toàn Màn Hình</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-slate-300">
                    Tuần {weeklyData?.week_number}, Năm {weeklyData?.year}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Đã ẩn các thành phần phụ. Không gian mở rộng 100% để tập trung lập kế hoạch tối đa.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevWeek}
                  title="Tuần trước"
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="h-8 text-xs font-semibold px-2.5"
                >
                  Tuần hiện tại
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextWeek}
                  title="Tuần sau"
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <button
                onClick={() => setIsFullScreenWeekly(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition shadow-sm cursor-pointer"
                title="Thu nhỏ về chế độ thông thường (hoặc nhấn phím ESC)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thu nhỏ (Phím ESC)</span>
              </button>
            </div>
          </div>

          {/* Full Screen Calendar Content */}
          <div className="flex-1 min-h-0">
            <WeeklyTimeline
              data={weeklyData}
              hideHeader={true}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onToday={handleToday}
              onSelectDay={(dateStr) => {
                setSelectedDayDate(dateStr);
                setIsFullScreenWeekly(false);
                setViewMode('DAILY');
              }}
              onTaskClick={(t) => {
                setTaskToEdit(t);
                setIsTaskModalOpen(true);
              }}
              onToggleTask={handleToggleTask}
              onAddTaskForDay={(dateStr, hour) => handleAddTaskWithHour(dateStr, hour)}
              onQuickAddTask={handleQuickAddTask}
              onDeleteTask={handleDeleteTaskWithUndo}
              onEditSchedule={handleOpenEditFixedSchedule}
              onDeleteSchedule={handleDeleteScheduleWithUndo}
              onAddSchedule={handleOpenCreateFixedSchedule}
              onAddTaskToSchedule={handleAddTaskToSchedule}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>
        </div>
      )}
    </div>
  );
};
