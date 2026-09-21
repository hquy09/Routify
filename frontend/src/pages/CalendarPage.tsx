import React, { useState, useEffect, useRef } from 'react';
import { WeeklyTimeline } from '../components/calendar/WeeklyTimeline';
import { MonthlyCalendar } from '../components/calendar/MonthlyCalendar';
import { DailyTimeline } from '../components/calendar/DailyTimeline';
import { FixedScheduleModal } from '../components/calendar/FixedScheduleModal';
import { SchoolTimetablePresetModal } from '../components/calendar/SchoolTimetablePresetModal';
import { ManageFixedSchedulesModal } from '../components/calendar/ManageFixedSchedulesModal';
import { CalendarGreetingQuote } from '../components/calendar/CalendarGreetingQuote';
import { CalendarCountdownBanner } from '../components/countdown/CalendarCountdownBanner';
import { CountdownModal } from '../components/countdown/CountdownModal';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskTransferModal } from '../components/tasks/TaskTransferModal';
import { UndoToast } from '../components/ui/UndoToast';
import {
  CalendarWeeklyResponse, CalendarMonthlyResponse, CalendarDayView, Task, Goal, CountdownItem, FixedSchedule
} from '../types';
import { api } from '../services/api';
import { toLocalDateString, formatDatetimeForBackend } from '../utils/dateUtils';
import { School, Settings2, Send, Maximize2, Minimize2 } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'WEEKLY' | 'MONTHLY' | 'DAILY'>('WEEKLY');
  const [isFullScreenWeekly, setIsFullScreenWeekly] = useState(false);
  const [weeklyData, setWeeklyData] = useState<CalendarWeeklyResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<CalendarMonthlyResponse | null>(null);
  const [dailyData, setDailyData] = useState<CalendarDayView | null>(null);
  const [currentDateRef, setCurrentDateRef] = useState<Date>(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<string>(() => toLocalDateString());
  const [goals, setGoals] = useState<Goal[]>([]);

  // Modals & Countdowns
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(false);
  const [countdownToEdit, setCountdownToEdit] = useState<CountdownItem | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToTransfer, setTaskToTransfer] = useState<Task | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [prefilledDayDate, setPrefilledDayDate] = useState<string | undefined>(undefined);
  const [prefilledFixedScheduleId, setPrefilledFixedScheduleId] = useState<number | undefined>(undefined);

  // Fixed Schedules management
  const [allFixedSchedules, setAllFixedSchedules] = useState<FixedSchedule[]>([]);
  const [scheduleToEdit, setScheduleToEdit] = useState<FixedSchedule | null>(null);
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

  const loadCountdowns = async () => {
    try {
      const list = await api.countdowns.list();
      setCountdowns(list);
    } catch (err) {
      console.error('Failed to load countdowns:', err);
    }
  };

  const handleSaveCountdown = async (data: Partial<CountdownItem>) => {
    try {
      if (countdownToEdit) {
        await api.countdowns.update(countdownToEdit.id, data);
      } else {
        await api.countdowns.create(data);
      }
      loadCountdowns();
    } catch (err) {
      console.error('Failed to save countdown:', err);
      throw err;
    }
  };

  const handleUpdateCountdown = async (id: number, data: Partial<CountdownItem>) => {
    try {
      await api.countdowns.update(id, data);
      loadCountdowns();
    } catch (err) {
      console.error('Failed to update countdown:', err);
    }
  };

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
    loadCountdowns();
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

  const handleOpenCreateFixedSchedule = () => {
    setScheduleToEdit(null);
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

  const handleSaveBatchFixedSchedules = async (schedules: Partial<FixedSchedule>[]) => {
    try {
      await Promise.all(schedules.map((s) => api.schedules.create(s)));
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
    <div className="space-y-4">
      {/* 1. Greeting & Hourly Philosophy Quote Box */}
      <CalendarGreetingQuote />

      {/* 2. Countdown Banner (Hero Expanded or Collapsed Top Bar) */}
      <CalendarCountdownBanner
        countdowns={countdowns}
        onOpenCreate={() => {
          setCountdownToEdit(null);
          setIsCountdownModalOpen(true);
        }}
        onOpenEdit={(item) => {
          setCountdownToEdit(item);
          setIsCountdownModalOpen(true);
        }}
        onUpdateItem={handleUpdateCountdown}
      />

      {/* Top View Selector bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Calendar</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tổng hợp thời gian biểu: Lịch cố định, Nhiệm vụ và Ghi chú
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset TKB Trường học */}
          <button
            onClick={() => setIsSchoolPresetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900/60 transition shadow-2xs"
            title="Tạo nhanh Thời khóa biểu đi học trên trường (T2-T6 5 tiết, T7 4 tiết, tùy chỉnh linh hoạt)"
          >
            <School className="w-3.5 h-3.5" />
            <span>🏫 TKB Trường học</span>
          </button>

          {/* Quản lý Lịch cố định */}
          <button
            onClick={() => setIsManageSchedulesOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shadow-2xs"
            title="Quản lý, chỉnh sửa, bật/tắt toàn bộ lịch cố định trong tuần"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>⚙️ Quản lý Lịch ({allFixedSchedules.length})</span>
          </button>

          {/* Telegram Quick Sync/Briefing Button */}
          <button
            onClick={async () => {
              try {
                const res = await api.telegram.sendDailyBriefing();
                alert('🚀 ' + res.message);
              } catch (err: any) {
                alert('Lưu ý: ' + (err?.message || 'Vui lòng cấu hình Bot Token trong Cài đặt (Settings) trước'));
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900/60 transition shadow-2xs"
            title="Gửi báo cáo tóm tắt lịch trình và nhiệm vụ hôm nay vào ứng dụng Telegram của bạn"
          >
            <Send className="w-3.5 h-3.5 text-blue-500" />
            <span>Báo Telegram</span>
          </button>

          {/* View mode toggle - official shadcn TabsList */}
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/60 p-1 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 select-none">
            <button
              onClick={() => setViewMode('WEEKLY')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all ${
                viewMode === 'WEEKLY'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Lịch Tuần (Weekly)
            </button>
            <button
              onClick={() => setViewMode('DAILY')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all ${
                viewMode === 'DAILY'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Lịch Ngày (Day)
            </button>
            <button
              onClick={() => setViewMode('MONTHLY')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all ${
                viewMode === 'MONTHLY'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Lịch Tháng (Monthly)
            </button>
          </div>

          {/* Full Screen Weekly Calendar Button */}
          {viewMode === 'WEEKLY' && (
            <button
              onClick={() => setIsFullScreenWeekly(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition shadow-2xs cursor-pointer"
              title="Phóng to Lịch tuần toàn màn hình (Tự động ẩn thanh bên và các khối khác để lịch chiếm 100% diện tích)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Toàn màn hình</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Calendar View Content */}
      {viewMode === 'WEEKLY' ? (
        <WeeklyTimeline
          data={weeklyData}
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
          onAddTaskForDay={(dateStr) => handleAddTaskWithHour(dateStr)}
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
      ) : (
        <MonthlyCalendar
          data={monthlyData}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectDay={(dateStr) => {
            setSelectedDayDate(dateStr);
            setViewMode('DAILY');
          }}
        />
      )}

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
        }}
        onSave={handleSaveFixedSchedule}
        onSaveBatch={handleSaveBatchFixedSchedules}
        onDelete={async (id) => {
          handleDeleteScheduleWithUndo(id, scheduleToEdit?.title || 'Lịch cố định');
          setIsScheduleModalOpen(false);
          setScheduleToEdit(null);
        }}
        scheduleToEdit={scheduleToEdit}
        onOpenSchoolPreset={() => {
          setIsScheduleModalOpen(false);
          setScheduleToEdit(null);
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
        onOpenCreate={() => {
          setIsManageSchedulesOpen(false);
          handleOpenCreateFixedSchedule();
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

      <CountdownModal
        isOpen={isCountdownModalOpen}
        onClose={() => {
          setIsCountdownModalOpen(false);
          setCountdownToEdit(null);
        }}
        onSave={handleSaveCountdown}
        countdownToEdit={countdownToEdit}
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
              onAddTaskForDay={(dateStr) => handleAddTaskWithHour(dateStr)}
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
