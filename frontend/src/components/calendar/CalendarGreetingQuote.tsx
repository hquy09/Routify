import React, { useState, useEffect } from 'react';
import {
  Sparkles, Quote, RefreshCw, Edit2, Check, X,
  Clock, Sun, Moon, Sunrise, Sunset, Copy, CheckCheck
} from 'lucide-react';
import { api } from '../../services/api';

interface HourlyQuote {
  hour_key: string;
  current_hour: number;
  quote: string;
  author: string;
  school: string;
  original_quote?: string;
}

export const CalendarGreetingQuote: React.FC = () => {
  // 1. User Name State
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('lifeos_user_name') || 'Hữu Quý';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  // 2. Quote State
  const [quoteData, setQuoteData] = useState<HourlyQuote | null>(() => {
    try {
      const saved = localStorage.getItem('lifeos_hourly_quote');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [copied, setCopied] = useState(false);

  // 3. Load User Name from Backend Settings if available
  useEffect(() => {
    api.settings.getAll().then((settings) => {
      if (settings?.user_name && settings.user_name.trim()) {
        setUserName(settings.user_name);
        localStorage.setItem('lifeos_user_name', settings.user_name);
      }
    }).catch(() => {
      // ignore offline fallback
    });
  }, []);

  // 4. Load Hourly Quote
  const loadQuote = async (forceRefresh = false) => {
    setIsLoadingQuote(true);
    try {
      const res = await api.quotes.getHourly(forceRefresh);
      setQuoteData(res);
      localStorage.setItem('lifeos_hourly_quote', JSON.stringify(res));
    } catch (err) {
      console.warn('Could not fetch hourly quote, using fallback:', err);
      if (!quoteData) {
        setQuoteData({
          hour_key: 'fallback',
          current_hour: new Date().getHours(),
          quote: 'Hạnh phúc của cuộc đời phụ thuộc vào chất lượng của những suy nghĩ trong tâm trí bạn.',
          author: 'Marcus Aurelius',
          school: 'Chủ nghĩa Khắc kỷ (Stoicism)',
          original_quote: 'The happiness of your life depends upon the quality of your thoughts.'
        });
      }
    } finally {
      setIsLoadingQuote(false);
    }
  };

  useEffect(() => {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDate();
    // Refresh if hour or day has changed
    if (!quoteData || quoteData.current_hour !== currentHour) {
      loadQuote(false);
    }

    // Interval check every 60 seconds to auto-update when entering a new hour
    const timer = setInterval(() => {
      const h = new Date().getHours();
      if (quoteData && quoteData.current_hour !== h) {
        loadQuote(false);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [quoteData?.current_hour]);

  // Handle Save Name
  const handleSaveName = async () => {
    const trimmed = nameInput.trim() || 'Hữu Quý';
    setUserName(trimmed);
    localStorage.setItem('lifeos_user_name', trimmed);
    setIsEditingName(false);
    try {
      await api.settings.set('user_name', trimmed);
    } catch (err) {
      console.warn('Failed to sync user_name setting:', err);
    }
  };

  // Handle Copy Quote
  const handleCopyQuote = () => {
    if (!quoteData) return;
    const text = `"${quoteData.quote}" — ${quoteData.author} (${quoteData.school})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Greeting by hour
  const hour = new Date().getHours();
  const getGreetingIcon = () => {
    if (hour >= 5 && hour < 12) return <Sunrise className="w-4 h-4 text-amber-400" />;
    if (hour >= 12 && hour < 18) return <Sun className="w-4 h-4 text-amber-300" />;
    if (hour >= 18 && hour < 22) return <Sunset className="w-4 h-4 text-orange-400" />;
    return <Moon className="w-4 h-4 text-slate-300" />;
  };

  const getGreetingPeriod = () => {
    if (hour >= 5 && hour < 12) return 'Buổi sáng tốt lành';
    if (hour >= 12 && hour < 18) return 'Buổi chiều hiệu quả';
    if (hour >= 18 && hour < 22) return 'Buổi tối an yên';
    return 'Đêm muộn tập trung';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-900 dark:bg-black text-white border border-neutral-800 shadow-md p-4 sm:p-5">
      {/* Subtle Ambient Background Elements */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-12 bottom-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />
      <Quote className="absolute right-4 top-4 w-20 h-20 text-white/[0.03] pointer-events-none select-none" />

      {/* Top Row: Greeting & Name */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-xs">
            {getGreetingIcon()}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-semibold text-slate-300">
              Xin chào,
            </span>

            {isEditingName ? (
              <div className="flex items-center gap-1.5 bg-slate-800/90 rounded-lg px-2 py-0.5 border border-neutral-500">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                  className="bg-transparent text-white font-bold text-sm sm:text-base outline-none w-28 sm:w-40"
                  placeholder="Nhập tên..."
                />
                <button
                  onClick={handleSaveName}
                  className="text-emerald-400 hover:text-emerald-300 transition"
                  title="Lưu tên"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="text-slate-400 hover:text-slate-200 transition"
                  title="Hủy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setNameInput(userName);
                  setIsEditingName(true);
                }}
                className="group flex items-center gap-1.5 cursor-pointer"
                title="Bấm để chỉnh sửa tên"
              >
                <span className="text-sm sm:text-base font-extrabold text-white group-hover:text-neutral-300 transition-colors">
                  {userName}
                </span>
                <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-50 group-hover:opacity-100 group-hover:text-neutral-300 transition" />
              </div>
            )}
          </div>
        </div>

        {/* Right side: Period badge & Live clock hint */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-medium text-[11px] backdrop-blur-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{getGreetingPeriod()}</span>
          </span>
          <span className="text-slate-400 text-[11px] font-mono hidden sm:inline">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Bottom Row: Hourly Philosophy Quote */}
      <div className="pt-3 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <Quote className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed italic">
                "{quoteData?.quote || 'Đang tải triết lý mỗi giờ...'}"
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                <span className="font-bold text-amber-300">
                  — {quoteData?.author || 'Khuyết danh'}
                </span>
                {quoteData?.school && (
                  <span className="text-slate-400 text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10">
                    {quoteData.school}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Refresh & Copy */}
          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            <button
              onClick={handleCopyQuote}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Sao chép câu triết lý"
            >
              {copied ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => loadQuote(true)}
              disabled={isLoadingQuote}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
              title="Đổi câu triết lý khác"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuote ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Đổi câu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
