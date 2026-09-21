import {
  Calendar as CalendarIcon,
  CheckSquare,
  BookOpen,
  BarChart3,
  Archive,
  Settings as SettingsIcon,
  Star,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Smartphone,
  HelpCircle,
  HeartPulse
} from 'lucide-react';
import { Button } from '../ui/button';

export type NavTab = 'dashboard' | 'calendar' | 'tasks' | 'courses' | 'wellbeing' | 'screentime' | 'archive' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenLegend?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  isCollapsed = false,
  onToggleCollapse,
  onOpenLegend,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    { id: 'calendar', label: 'Lịch biểu', icon: <CalendarIcon className="w-4 h-4 shrink-0" /> },
    { id: 'tasks', label: 'Nhiệm vụ/ Mục tiêu', icon: <CheckSquare className="w-4 h-4 shrink-0" /> },
    { id: 'courses', label: 'Khoá học', icon: <BookOpen className="w-4 h-4 shrink-0" /> },
    { id: 'wellbeing', label: 'Quản lý sức khoẻ tinh thần', icon: <HeartPulse className="w-4 h-4 shrink-0 text-rose-500" /> },
    { id: 'screentime', label: 'Quản lý thời gian sức khoẻ kỹ thuật số', icon: <Smartphone className="w-4 h-4 shrink-0" /> },
    { id: 'archive', label: 'Kho lưu trữ', icon: <Archive className="w-4 h-4 shrink-0" /> },
    { id: 'settings', label: 'Cài đặt', icon: <SettingsIcon className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-60'
      } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between select-none h-screen sticky top-0 transition-all duration-300 ease-in-out shrink-0 z-30 shadow-sm`}
    >
      <div>
        {/* Brand Header */}
        <div
          className={`p-3.5 flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } border-b border-slate-200 dark:border-slate-800`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              onClick={onToggleCollapse}
              className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition shadow-xs relative"
              title={isCollapsed ? 'Routify (Beta) • Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              <Star className="w-4 h-4 text-black stroke-black fill-white" strokeWidth={2.5} />
              {isCollapsed && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 ring-1 ring-white dark:ring-slate-900" />
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  Routify
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 select-none shrink-0 shadow-2xs">
                  Beta
                </span>
              </div>
            )}
          </div>

          {onToggleCollapse && !isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              title="Thu gọn sidebar (Collapse)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Quick Add Button */}
        <div className="p-2.5">
          {isCollapsed ? (
            <Button
              variant="primary"
              size="icon"
              onClick={onOpenQuickAdd}
              title="Tạo Task mới"
              className="w-10 h-10 mx-auto"
            >
              <Plus className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onOpenQuickAdd}
              className="w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Task mới</span>
            </Button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="px-2 space-y-1 mt-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
                } rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/60'
                }`}
              >
                {item.icon}
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info & Expand toggle when collapsed */}
      <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Mở rộng sidebar (Expand)"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            {onOpenLegend && (
              <button
                onClick={onOpenLegend}
                className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                title="Bảng chú giải ký hiệu (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
              title="Localhost DB Active"
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="bg-neutral-50 border border-neutral-200 dark:bg-neutral-850 dark:border-neutral-800 rounded-lg p-2.5 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Localhost DB
              </span>
              <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[10px]">v1.0</span>
            </div>

            {onOpenLegend && (
              <button
                onClick={onOpenLegend}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition cursor-pointer"
                title="Xem bảng chú giải ký hiệu và quy chuẩn"
              >
                <HelpCircle className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                <span>Chú giải ký hiệu (?)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
