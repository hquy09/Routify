import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Circle, Flame, Trophy, TrendingUp } from 'lucide-react';
import { DashboardStats } from '../../types';

interface StatCardsProps {
  stats: DashboardStats | null;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Tasks Completed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">Đã hoàn thành</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.tasks_completed}</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">tasks</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Tỷ lệ tuần này: <strong className="text-neutral-900 dark:text-neutral-100">{stats.completion_rate_this_week}%</strong>
        </div>
      </div>

      {/* 2. Difficulty Points */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">Điểm độ khó</span>
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">+{stats.total_difficulty_points}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">points</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Tích lũy từ các task hoàn thành
        </div>
      </div>

      {/* 3. Streaks */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">Chuỗi ngày liên tiếp</span>
          <Trophy className="w-4 h-4 text-orange-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.current_streak}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">ngày</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Kỷ lục cao nhất: <strong className="text-slate-700 dark:text-slate-300">{stats.best_streak} ngày</strong>
        </div>
      </div>

      {/* 4. Delayed & Partial */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">Chậm trễ & Một phần</span>
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <div>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{stats.tasks_delayed}</span>
            <span className="text-[10px] text-slate-500 ml-1">trễ</span>
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.tasks_partial}</span>
            <span className="text-[10px] text-slate-500 ml-1">một phần</span>
          </div>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Đang chờ: <strong className="text-slate-700 dark:text-slate-300">{stats.tasks_incomplete} task</strong>
        </div>
      </div>
    </div>
  );
};
