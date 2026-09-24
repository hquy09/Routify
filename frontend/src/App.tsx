import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';
import { CoursesPage } from './pages/CoursesPage';
import { DashboardPage } from './pages/DashboardPage';
import { ArchivePage } from './pages/ArchivePage';
import { SettingsPage } from './pages/SettingsPage';
import { ScreenTimePage } from './pages/ScreenTimePage';
import { MentalHealthPage } from './pages/MentalHealthPage';
import { CommandPalette } from './components/command/CommandPalette';
import { TaskModal } from './components/tasks/TaskModal';
import { SystemLegendModal } from './components/common/SystemLegendModal';
import { Goal, HeaderSummary } from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('lifeos_theme') !== 'light';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('lifeos_sidebar_collapsed') === 'true';
  });
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState<string | undefined>(undefined);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [headerSummary, setHeaderSummary] = useState<HeaderSummary | null>(null);

  // Apply dark mode class to root document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lifeos_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lifeos_theme', 'light');
    }
  }, [isDark]);

  // Load initial global stats (goals, streak, discipline rating, upcoming event)
  const loadGlobalStats = async () => {
    try {
      const [g, s, hs] = await Promise.all([
        api.goals.list(),
        api.dashboard.getStats(),
        api.dashboard.getHeaderSummary().catch(() => null),
      ]);
      setGoals(g);
      if (hs) {
        setHeaderSummary(hs);
        setStreakCount(hs.current_streak);
      } else {
        setStreakCount(s.current_streak);
      }
    } catch (err) {
      console.error('Failed to load global data:', err);
    }
  };

  useEffect(() => {
    loadGlobalStats();
    const handleRefresh = () => {
      loadGlobalStats();
    };
    window.addEventListener('lifeos_task_updated', handleRefresh);
    window.addEventListener('lifeos_screentime_updated', handleRefresh);
    window.addEventListener('lifeos_schedule_updated', handleRefresh);

    // Refresh every 60s for time-based upcoming status
    const interval = setInterval(loadGlobalStats, 60000);

    return () => {
      window.removeEventListener('lifeos_task_updated', handleRefresh);
      window.removeEventListener('lifeos_screentime_updated', handleRefresh);
      window.removeEventListener('lifeos_schedule_updated', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  const handleSaveQuickTask = async (taskData: any) => {
    try {
      await api.tasks.create(taskData);
      loadGlobalStats();
      window.dispatchEvent(new CustomEvent('lifeos_task_updated'));
    } catch (err) {
      console.error('Failed to save quick task:', err);
      throw err;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground antialiased font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-neutral-100 dark:selection:text-black">
      {/* 1. Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenQuickAdd={() => {
          setQuickTaskTitle(undefined);
          setIsQuickTaskModalOpen(true);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => {
          setIsSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('lifeos_sidebar_collapsed', String(next));
            return next;
          });
        }}
        onOpenLegend={() => setIsLegendOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenSearch={() => setIsCommandOpen(true)}
          streakCount={streakCount}
          discipline={headerSummary?.discipline}
          consistency={headerSummary?.consistency}
          upcomingItem={headerSummary?.upcoming}
          tension={headerSummary?.tension}
          telegram={headerSummary?.telegram}
          dbLastSaved={headerSummary?.db_last_saved}
          onNavigateTab={(tab) => setCurrentTab(tab as NavTab)}
        />

        {/* Dynamic Page Views */}
        <main
          className={`flex-1 w-full transition-all duration-300 ${
            currentTab === 'calendar'
              ? 'p-2 sm:p-3 max-w-full flex flex-col min-h-0 h-full overflow-hidden'
              : currentTab === 'dashboard'
              ? 'p-4 md:p-6 max-w-full overflow-y-auto'
              : currentTab === 'tasks'
              ? 'p-3 sm:p-5 max-w-full overflow-y-auto'
              : 'p-4 md:p-6 max-w-7xl mx-auto overflow-y-auto'
          }`}
        >
          {currentTab === 'calendar' && <CalendarPage />}
          {currentTab === 'tasks' && <TasksPage />}
          {currentTab === 'courses' && <CoursesPage onNavigateTab={(tab) => setCurrentTab(tab as NavTab)} />}
          {currentTab === 'wellbeing' && <MentalHealthPage onNavigateTab={(tab) => setCurrentTab(tab as NavTab)} />}
          {currentTab === 'dashboard' && <DashboardPage />}
          {currentTab === 'screentime' && <ScreenTimePage />}
          {currentTab === 'archive' && <ArchivePage />}
          {currentTab === 'settings' && (
            <SettingsPage
              isDark={isDark}
              onToggleTheme={() => setIsDark(!isDark)}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenCreateTask={(title) => {
          setQuickTaskTitle(title);
          setIsQuickTaskModalOpen(true);
        }}
        onOpenCreateSchedule={() => {
          setCurrentTab('calendar');
        }}
      />

      {/* Quick Task Creation Modal */}
      <TaskModal
        isOpen={isQuickTaskModalOpen}
        onClose={() => {
          setIsQuickTaskModalOpen(false);
          setQuickTaskTitle(undefined);
        }}
        onSave={handleSaveQuickTask}
        goals={goals}
        initialDate={undefined}
        initialTitle={quickTaskTitle}
      />

      {/* System Legend & Help Modal */}
      <SystemLegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />

      {/* Floating Help / Legend Button at Bottom Left of Viewport */}
      <button
        onClick={() => setIsLegendOpen(true)}
        className="fixed bottom-3.5 left-3.5 z-40 w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center font-bold text-sm border-2 border-slate-700 dark:border-slate-300 cursor-pointer group"
        title="Bảng Chú giải Ký hiệu & Quy chuẩn (?)"
      >
        <span className="group-hover:scale-125 transition-transform font-black text-sm">?</span>
      </button>
    </div>
  );
}

export default App;
