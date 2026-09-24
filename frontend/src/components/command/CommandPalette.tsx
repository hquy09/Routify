import React, { useState, useEffect, useRef } from 'react';
import {
  Search, X, CheckSquare, BookOpen, Target,
  Calendar, BarChart3, Plus, ArrowRight, CornerDownLeft, Smartphone,
  Archive, Settings as SettingsIcon, HeartPulse
} from 'lucide-react';
import { api } from '../../services/api';
import { NavTab } from '../layout/Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenCreateTask: (prefilledTitle?: string) => void;
  onOpenCreateSchedule: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCreateTask,
  onOpenCreateSchedule,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.search(query.trim());
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onOpenCreateTask(); // Or open palette
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 pt-20">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-neutral-900 dark:text-neutral-100 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm hoặc gõ lệnh (VD: 'Ôn tích phân', 'Toán')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim() && (!results || results.tasks?.length === 0)) {
                // Quick create task from input text!
                onOpenCreateTask(query.trim());
                onClose();
              }
            }}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono">
              ESC
            </kbd>
          )}
        </div>

        {/* Content Body */}
        <div className="max-h-96 overflow-y-auto p-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
          {/* Quick Add from typed query */}
          {query.trim() && (
            <div className="p-2">
              <button
                onClick={() => {
                  onOpenCreateTask(query.trim());
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition text-left"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                  <span>
                    Tạo nhanh nhiệm vụ: <strong>"{query.trim()}"</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-neutral-900 dark:text-neutral-100 font-semibold">
                  <span>Nhấn Enter</span>
                  <CornerDownLeft className="w-3 h-3" />
                </div>
              </button>
            </div>
          )}

          {/* Quick Nav Actions */}
          {!query.trim() && (
            <div className="p-2 space-y-1">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase px-2 pb-1">
                Lối tắt điều hướng
              </div>
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <BarChart3 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Mở Tổng quan</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('calendar');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Calendar className="w-4 h-4 text-neutral-900 dark:text-neutral-100 shrink-0" />
                <span>Mở Lịch biểu</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('tasks');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Mở Nhiệm vụ</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('courses');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Mở Khóa học</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('wellbeing');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Mở Sức khỏe tinh thần</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('screentime');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Smartphone className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Mở Cân bằng kỹ thuật số</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('archive');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Archive className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Mở Kho lưu trữ</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('settings');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <SettingsIcon className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Mở Cài đặt</span>
              </button>
            </div>
          )}

          {/* Results: Tasks */}
          {results && results.tasks && results.tasks.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase px-2 pb-1 flex items-center justify-between">
                <span>Nhiệm vụ ({results.tasks.length})</span>
                <CheckSquare className="w-3 h-3 text-slate-400" />
              </div>
              {results.tasks.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => {
                    onNavigate('tasks');
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition text-slate-800 dark:text-slate-200"
                >
                  <span className="font-medium truncate">{t.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Results: Courses / Lessons */}
          {results && results.course_nodes && results.course_nodes.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase px-2 pb-1 flex items-center justify-between">
                <span>Khóa học & Bài học ({results.course_nodes.length})</span>
                <BookOpen className="w-3 h-3 text-slate-400" />
              </div>
              {results.course_nodes.map((node: any) => (
                <div
                  key={node.id}
                  onClick={() => {
                    onNavigate('courses');
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition text-slate-800 dark:text-slate-200"
                >
                  <span className="font-medium truncate">{node.title}</span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    {node.progress}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
