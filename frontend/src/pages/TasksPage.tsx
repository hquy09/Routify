import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowUpDown } from 'lucide-react';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';
import { TaskTransferModal } from '../components/tasks/TaskTransferModal';
import { Task, Goal } from '../types';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { formatDatetimeForBackend } from '../utils/dateUtils';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'DELAYED' | 'COMPLETED'>('ALL');
  const [selectedGoalId, setSelectedGoalId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DUE' | 'CREATED' | 'DIFFICULTY' | 'PRIORITY'>('DUE');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToTransfer, setTaskToTransfer] = useState<Task | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.tasks.list({
        search: search.trim() || undefined,
        date_filter: dateFilter !== 'ALL' ? dateFilter : undefined,
        goal_id: selectedGoalId,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        difficulty: selectedDifficulty,
        priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
      });
      setTasks(res);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [search, dateFilter, selectedGoalId, selectedStatus, selectedDifficulty, selectedPriority]);

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      await api.tasks.update(task.id, { status: newStatus });
      loadTasks();
      window.dispatchEvent(new CustomEvent('lifeos_task_updated'));
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  const handleToggleSubtask = async (subtaskId: number) => {
    try {
      await api.tasks.toggleSubtask(subtaskId);
      loadTasks();
      window.dispatchEvent(new CustomEvent('lifeos_task_updated'));
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa task này?')) {
      try {
        await api.tasks.delete(taskId);
        loadTasks();
        window.dispatchEvent(new CustomEvent('lifeos_task_updated'));
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      if (taskToEdit) {
        await api.tasks.update(taskToEdit.id, taskData);
      } else {
        await api.tasks.create(taskData);
      }
      loadTasks();
      window.dispatchEvent(new CustomEvent('lifeos_task_updated'));
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
      loadTasks();
      window.dispatchEvent(new CustomEvent('lifeos_task_updated'));
    } catch (err) {
      console.error('Failed to transfer task:', err);
    }
  };


  // Sorting
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'DUE') {
      if (!a.due_datetime) return 1;
      if (!b.due_datetime) return -1;
      return new Date(a.due_datetime).getTime() - new Date(b.due_datetime).getTime();
    }
    if (sortBy === 'CREATED') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'DIFFICULTY') {
      return b.difficulty - a.difficulty;
    }
    if (sortBy === 'PRIORITY') {
      const pMap: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    }
    return 0;
  });

  const filterPills = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'TODAY', label: 'Hôm nay' },
    { id: 'UPCOMING', label: 'Sắp tới' },
    { id: 'DELAYED', label: 'Chậm trễ' },
    { id: 'COMPLETED', label: 'Đã hoàn thành' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Nhiệm vụ (Tasks)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quản lý công việc cá nhân, subtasks, phân cấp và chuyển giao bảo toàn lịch sử
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Task mới</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3 shadow-xs">
        {/* Search input and Quick Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="🔎 Tìm kiếm task theo tiêu đề, ghi chú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {filterPills.map((pill) => (
              <Button
                key={pill.id}
                variant={dateFilter === pill.id ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setDateFilter(pill.id as any)}
              >
                {pill.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Detailed Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {/* Goal Filter */}
          <select
            value={selectedGoalId || ''}
            onChange={(e) => setSelectedGoalId(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          >
            <option value="">🎯 Tất cả Mục tiêu</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="TODO">Chưa hoàn thành</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="PARTIAL">Hoàn thành một phần</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="DELAYED">Chậm trễ</option>
            <option value="TRANSFERRED">Đã chuyển giao</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty || ''}
            onChange={(e) => setSelectedDifficulty(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          >
            <option value="">🔥 Tất cả độ khó</option>
            <option value={1}>1 - Easy</option>
            <option value={2}>2 - Normal</option>
            <option value={3}>3 - Medium</option>
            <option value={4}>4 - Hard</option>
            <option value={5}>5 - Extreme</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          >
            <option value="ALL">Mức ưu tiên</option>
            <option value="LOW">Thấp (Low)</option>
            <option value="MEDIUM">Trung bình (Medium)</option>
            <option value="HIGH">Cao (High)</option>
            <option value="URGENT">Khẩn cấp (Urgent)</option>
          </select>

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            >
              <option value="DUE">Sắp xếp: Hạn chót</option>
              <option value="CREATED">Sắp xếp: Mới tạo</option>
              <option value="DIFFICULTY">Sắp xếp: Độ khó</option>
              <option value="PRIORITY">Sắp xếp: Ưu tiên</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-xs animate-pulse">
          Đang tải danh sách nhiệm vụ...
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">Không tìm thấy task nào phù hợp</p>
          <p className="text-slate-500 text-xs mt-1">
            Hãy thử đổi bộ lọc hoặc bấm "Tạo Task mới" ở góc trên
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggleStatus={handleToggleStatus}
              onTransfer={(task) => setTaskToTransfer(task)}
              onEdit={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onDelete={handleDeleteTask}
              onToggleSubtask={handleToggleSubtask}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        goals={goals}
      />

      <TaskTransferModal
        isOpen={!!taskToTransfer}
        task={taskToTransfer}
        onClose={() => setTaskToTransfer(null)}
        onConfirm={handleConfirmTransfer}
      />
    </div>
  );
};
