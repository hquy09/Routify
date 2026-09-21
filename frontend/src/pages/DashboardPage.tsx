import React, { useState, useEffect } from 'react';
import {
  BarChart3, Award, Target, Flame, TrendingUp,
  CheckCircle2, AlertCircle, ArrowUpRight, Maximize2, Minimize2
} from 'lucide-react';
import { StatCards } from '../components/dashboard/StatCards';
import { DailyBarChart } from '../components/dashboard/DailyBarChart';
import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { WeeklyReviewModal } from '../components/dashboard/WeeklyReviewModal';
import { CountdownSection } from '../components/countdown/CountdownSection';
import { CountdownModal } from '../components/countdown/CountdownModal';
import { DashboardStats, HeatmapDay, BarChartItem, CountdownItem } from '../types';
import { api } from '../services/api';
import { Button } from '../components/ui/button';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [heatmapDays, setHeatmapDays] = useState<HeatmapDay[]>([]);
  const [chartItems, setChartItems] = useState<BarChartItem[]>([]);
  const [period, setPeriod] = useState('DAY');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Countdowns State
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(false);
  const [countdownToEdit, setCountdownToEdit] = useState<CountdownItem | null>(null);

  // Listen for ESC key to exit full screen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const now = new Date();
  const currentYear = now.getFullYear();
  // ISO week calculation
  const getISOWeek = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  };
  const currentWeekNumber = getISOWeek(now);

  const loadData = async () => {
    try {
      const [s, h, c, cds] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getHeatmap(182), // 26 weeks
        api.dashboard.getBarChart(period),
        api.countdowns.list(),
      ]);
      setStats(s);
      setHeatmapDays(h);
      setChartItems(c.items);
      setCountdowns(cds);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleSaveCountdown = async (data: Partial<CountdownItem>) => {
    try {
      if (countdownToEdit) {
        await api.countdowns.update(countdownToEdit.id, data);
      } else {
        await api.countdowns.create(data);
      }
      const cds = await api.countdowns.list();
      setCountdowns(cds);
    } catch (err) {
      console.error('Failed to save countdown:', err);
      throw err;
    }
  };

  const handleDeleteCountdown = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện đếm ngược này?')) return;
    try {
      await api.countdowns.delete(id);
      const cds = await api.countdowns.list();
      setCountdowns(cds);
    } catch (err) {
      console.error('Failed to delete countdown:', err);
    }
  };

  const handleTogglePinCountdown = async (item: CountdownItem) => {
    try {
      await api.countdowns.update(item.id, { is_pinned: !item.is_pinned });
      const cds = await api.countdowns.list();
      setCountdowns(cds);
    } catch (err) {
      console.error('Failed to pin/unpin countdown:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const renderDashboardContent = () => (
    <>
      {/* Top Stats Cards */}
      <StatCards stats={stats} />

      {/* Completion Rates Bar */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Today */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Hôm nay (Today)</span>
              <span className="font-bold text-slate-900 dark:text-slate-200">{stats.completion_rate_today}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-neutral-900 dark:bg-neutral-100 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.completion_rate_today}%` }}
              />
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Tuần này (This Week)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.completion_rate_this_week}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.completion_rate_this_week}%` }}
              />
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Tháng này (This Month)</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">{stats.completion_rate_this_month}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.completion_rate_this_month}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Countdown Section (Ngày thi, Mục tiêu, Sự kiện) */}
      <CountdownSection
        countdowns={countdowns}
        onOpenCreate={() => {
          setCountdownToEdit(null);
          setIsCountdownModalOpen(true);
        }}
        onOpenEdit={(item) => {
          setCountdownToEdit(item);
          setIsCountdownModalOpen(true);
        }}
        onDelete={handleDeleteCountdown}
        onTogglePin={handleTogglePinCountdown}
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyBarChart
          items={chartItems}
          period={period}
          onChangePeriod={(p) => setPeriod(p)}
        />
        <ActivityHeatmap days={heatmapDays} />
      </div>

      {/* Goal & Project Analytics Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Goals Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tiến độ theo Mục tiêu lớn (Goals)</h4>
              </div>
            </div>

            {stats.goals.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-xs py-4 text-center">Chưa có dữ liệu mục tiêu</p>
            ) : (
              <div className="space-y-3">
                {stats.goals.map((g) => (
                  <div key={g.goal_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{g.title}</span>
                      <span className="text-neutral-900 dark:text-neutral-100 font-bold font-mono">{g.completion_rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-neutral-900 dark:bg-neutral-100 h-full rounded-full transition-all"
                        style={{ width: `${g.completion_rate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{g.category || 'Mục tiêu chung'}</span>
                      <span>
                        {g.completed_tasks} / {g.total_tasks} hoàn thành
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tiến độ theo Dự án (Projects)</h4>
              </div>
            </div>

            {stats.projects.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-xs py-4 text-center">Chưa có dữ liệu dự án</p>
            ) : (
              <div className="space-y-3">
                {stats.projects.map((p) => (
                  <div key={p.project_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: p.color || '#3b82f6' }}
                        />
                        <span>{p.title}</span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{p.completion_rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${p.completion_rate}%`,
                          backgroundColor: p.color || '#10b981',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{p.goal_title || 'Dự án độc lập'}</span>
                      <span>
                        {p.completed_tasks} / {p.total_tasks} hoàn thành
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Hiệu suất cá nhân (Dashboard)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trung tâm phân tích năng suất, tiến độ mục tiêu, streak và đánh giá tuần
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setIsReviewModalOpen(true)}
            className="text-xs"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Đánh giá tuần (Weekly Review)</span>
          </Button>

          {/* Full Screen / Full View Button */}
          <button
            onClick={() => setIsFullScreen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition shadow-2xs cursor-pointer"
            title="Phóng to Dashboard toàn màn hình (Full View - ẩn thanh bên và thanh trên để tập trung 100% diện tích cho biểu đồ và chỉ số)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Toàn màn hình</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {renderDashboardContent()}

      {/* Weekly Review Modal */}
      <WeeklyReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        year={currentYear}
        weekNumber={currentWeekNumber}
        onReviewSaved={loadData}
      />

      {/* Countdown Create / Edit Modal */}
      <CountdownModal
        isOpen={isCountdownModalOpen}
        onClose={() => {
          setIsCountdownModalOpen(false);
          setCountdownToEdit(null);
        }}
        onSave={handleSaveCountdown}
        countdownToEdit={countdownToEdit}
      />

      {/* FULL SCREEN DASHBOARD OVERLAY */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-neutral-950 p-4 sm:p-6 flex flex-col overflow-y-auto animate-in fade-in duration-150">
          {/* Floating Topbar */}
          <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-neutral-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📊</span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Dashboard Toàn Màn Hình</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Full View 100%
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Đã ẩn thanh bên và thanh trên. Mở rộng không gian hiển thị tối đa để theo dõi toàn diện tiến độ và phân tích hiệu suất.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReviewModalOpen(true)}
                className="text-xs"
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span>Đánh giá tuần</span>
              </Button>

              <button
                onClick={() => setIsFullScreen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition shadow-sm cursor-pointer"
                title="Thu nhỏ về chế độ thông thường (hoặc nhấn phím ESC)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thu nhỏ (Phím ESC)</span>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-5 pb-8">
            {renderDashboardContent()}
          </div>
        </div>
      )}
    </div>
  );
};
