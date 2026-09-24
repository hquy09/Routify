import React, { useState, useEffect } from 'react';
import {
  X, Award, CheckCircle2, AlertTriangle, Calendar, Save, Archive,
  Printer, Copy, Sparkles, TrendingUp, Shield, Clock, HeartPulse,
  Smartphone, Check, FileText, ChevronRight, Zap, Target, BookOpen
} from 'lucide-react';
import { WeeklyReview } from '../../types';
import { api } from '../../services/api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { isMentalHealthEnabled, isDigitalWellbeingEnabled } from '../../utils/featureFlags';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  weekNumber: number;
  onReviewSaved: () => void;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  year,
  weekNumber,
  onReviewSaved,
}) => {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatNeedsImprovement, setWhatNeedsImprovement] = useState('');
  const [delayedReflection, setDelayedReflection] = useState('');
  const [nextWeekChanges, setNextWeekChanges] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [autoDraftToast, setAutoDraftToast] = useState(false);
  const [isMentalHealthOn, setIsMentalHealthOn] = useState<boolean>(() => isMentalHealthEnabled());
  const [isDigitalWellbeingOn, setIsDigitalWellbeingOn] = useState<boolean>(() => isDigitalWellbeingEnabled());

  useEffect(() => {
    if (isOpen) {
      setIsMentalHealthOn(isMentalHealthEnabled());
      setIsDigitalWellbeingOn(isDigitalWellbeingEnabled());
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.dashboard.getWeeklyReview(year, weekNumber)
        .then((data) => {
          if (data) {
            setReview(data);
            setWhatWentWell(data.what_went_well || '');
            setWhatNeedsImprovement(data.what_needs_improvement || '');
            setDelayedReflection(data.delayed_tasks_reflection || '');
            setNextWeekChanges(data.next_week_changes || '');
          }
        })
        .catch((err) => {
          console.error('Failed to load weekly report:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, year, weekNumber]);

  if (!isOpen) return null;

  const handleApplyAutoDraft = () => {
    if (!review) return;
    setWhatWentWell(review.draft_what_went_well || whatWentWell);
    setWhatNeedsImprovement(review.draft_what_needs_improvement || whatNeedsImprovement);
    setDelayedReflection(review.draft_delayed_reflection || delayedReflection);
    setNextWeekChanges(review.draft_next_week_changes || nextWeekChanges);
    setAutoDraftToast(true);
    setTimeout(() => setAutoDraftToast(false), 3000);
  };

  const handleCopyMarkdown = async () => {
    if (!review) return;
    const dateRange = review.start_date && review.end_date
      ? `${review.start_date} – ${review.end_date}`
      : `Tuần ${weekNumber}/${year}`;

    const md = `# 📊 BÁO CÁO HIỆU SUẤT TUẦN ${weekNumber}/${year}
**Khoảng thời gian:** ${dateRange}
**Đánh giá tổng thể:** Hạng ${review.performance_grade || 'A'} (${review.overall_score || 90}/100)
**Tóm tắt:** ${review.executive_summary || ''}

---
### 🎯 1. Chỉ số cốt lõi
- **Nhiệm vụ:** ${review.completed_tasks}/${review.total_tasks} hoàn thành (${review.completion_rate}%) • ${review.difficulty_points} điểm nỗ lực
- **Nhất quán:** ${review.consistency_score}/10 (Độ ổn định: ${review.stability_pct}%)
- **Bất khả kháng:** ${review.force_majeure_count} ca bảo lưu (85% điểm) • ${review.unexcused_delay_count} ca trì hoãn chủ quan
- **Thời lượng số:** ${review.study_work_screentime_hours}h học/việc • ${review.entertainment_screentime_hours}h xao nhãng
- **Áp lực & Tinh thần:** ${review.avg_daily_focus_hours}h/ngày (${review.burnout_risk_level})

---
### 📝 2. Phản tư & Định hướng
1. **Điều làm tốt:**
${whatWentWell || review.draft_what_went_well || '(Chưa điền)'}

2. **Cần cải thiện:**
${whatNeedsImprovement || review.draft_what_needs_improvement || '(Chưa điền)'}

3. **Phân tích hoãn việc:**
${delayedReflection || review.draft_delayed_reflection || '(Chưa điền)'}

4. **Kế hoạch tuần tới:**
${nextWeekChanges || review.draft_next_week_changes || '(Chưa điền)'}

*Xuất tự động từ hệ thống Routify*`;

    try {
      await navigator.clipboard.writeText(md);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch {
      alert('Không thể sao chép văn bản vào clipboard.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await api.dashboard.saveWeeklyReview({
        year,
        week_number: weekNumber,
        what_went_well: whatWentWell,
        what_needs_improvement: whatNeedsImprovement,
        delayed_tasks_reflection: delayedReflection,
        next_week_changes: nextWeekChanges,
      });
      onReviewSaved();
      onClose();
    } catch (err: any) {
      alert(`Lỗi khi lưu phản tư: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeArchive = async () => {
    if (!confirm('Bạn có chắc muốn đóng băng báo cáo tuần này vào Archive? Dữ liệu sẽ được chốt số liệu lịch sử.')) return;
    setFinalizing(true);
    try {
      await api.archive.finalize(year, weekNumber);
      await handleSave();
    } catch (err: any) {
      alert(`Lỗi khi lưu trữ: ${err.message || err}`);
    } finally {
      setFinalizing(false);
    }
  };

  const getGradeBadge = (grade: string = 'A') => {
    if (grade === 'A+') {
      return 'bg-gradient-to-r from-amber-400 to-rose-500 text-white shadow-sm ring-2 ring-amber-300';
    }
    if (grade === 'A') {
      return 'bg-emerald-600 text-white shadow-xs';
    }
    if (grade === 'B') {
      return 'bg-blue-600 text-white shadow-xs';
    }
    if (grade === 'C') {
      return 'bg-amber-600 text-white';
    }
    return 'bg-rose-600 text-white';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl my-6 max-h-[92vh] flex flex-col justify-between overflow-y-auto space-y-6 print:border-none print:shadow-none print:max-w-none print:my-0">
        
        {/* ======================================================== */}
        {/* 1. EXECUTIVE REPORT HEADER                              */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Bản Báo Cáo Hiệu Suất Tuần {weekNumber}
                </h2>
                <Badge variant="outline" className="text-[11px] font-mono font-semibold">
                  Năm {year}
                </Badge>
                {review?.is_finalized ? (
                  <Badge variant="success" className="text-[10px] font-bold uppercase tracking-wider">
                    Đã lưu phản tư
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    Xem trực tiếp
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {review?.start_date && review?.end_date
                  ? `Chu kỳ tuần: ${review.start_date} – ${review.end_date}`
                  : `Đánh giá toàn diện năng suất, tính kỷ luật và sức khỏe tinh thần.`}
              </p>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="text-xs gap-1.5"
              title="Sao chép toàn bộ báo cáo dưới dạng Markdown"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedToast ? '✓ Đã sao chép!' : 'Sao chép Markdown'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 hidden sm:flex"
              title="In báo cáo hoặc lưu thành PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In báo cáo</span>
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading Spinner State */}
        {isLoading && !review ? (
          <div className="py-16 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Đang tổng hợp dữ liệu báo cáo tuần...</p>
          </div>
        ) : review ? (
          <div className="space-y-6">

            {/* ======================================================== */}
            {/* 2. EXECUTIVE GRADE & PERFORMANCE SYNTHESIS BANNER        */}
            {/* ======================================================== */}
            <div className="p-5 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white dark:from-indigo-950/30 dark:via-slate-900/90 dark:to-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                {/* Large Grade Medallion */}
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${getGradeBadge(review.performance_grade)}`}>
                  <span className="text-2xl leading-none">{review.performance_grade || 'A'}</span>
                  <span className="text-[9px] tracking-wider uppercase opacity-90">Hạng</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                      {review.overall_score || 90.0}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ 100 điểm hiệu suất</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    {review.executive_summary}
                  </p>
                </div>
              </div>

              {/* Best Day Highlight Chip */}
              {review.best_day && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs shrink-0 self-start md:self-auto space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    🏆 Ngày vàng năng suất
                  </span>
                  <strong className="text-sm font-bold">{review.best_day}</strong>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* 3. FOUR CORE TELEMETRY SCORECARDS                       */}
            {/* ======================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Task Execution */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Thực thi Nhiệm vụ</span>
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono font-bold">
                      +{review.difficulty_points} pts
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
                      {review.completion_rate}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {review.completed_tasks} / {review.total_tasks} task hoàn thành
                  </p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, review.completion_rate || 0)}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Consistency Index & Force Majeure */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Chỉ số Nhất quán</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      {review.stability_pct}% ổn định
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                      {review.consistency_score?.toFixed(1) || '10.0'}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">/ 10.0</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {(review.force_majeure_count ?? 0) > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        🛡️ {review.force_majeure_count} ca bất khả kháng
                      </span>
                    ) : (
                      <span>Không có vi phạm trì hoãn</span>
                    )}
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  {review.unexcused_delay_count ?? 0} ca trễ hạn chủ quan
                </div>
              </div>

              {/* Card 3: Cognitive Load & Wellbeing */}
              <div className={`p-4 rounded-2xl flex flex-col justify-between shadow-xs transition-all ${
                isMentalHealthOn
                  ? 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  : 'border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500'
              }`}>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <HeartPulse className={`w-3.5 h-3.5 ${isMentalHealthOn ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className={isMentalHealthOn ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
                        Áp Lực & Tinh Thần
                      </span>
                    </span>
                    {isMentalHealthOn ? (
                      <span className="text-[10px] font-bold">
                        {review.burnout_risk_level === 'BURNOUT_RISK' ? '🚨 Quá tải' : review.burnout_risk_level === 'MODERATE' ? '⚡ Căng thẳng' : '✅ Tối ưu'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-medium">
                        Đang tắt
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className={`text-2xl font-black font-mono tracking-tight ${
                      isMentalHealthOn ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'
                    }`}>
                      {isMentalHealthOn ? `${review.avg_daily_focus_hours?.toFixed(1) || '0.0'}h` : '---'}
                    </span>
                    {isMentalHealthOn && <span className="text-xs text-slate-500 font-semibold">/ ngày</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    {isMentalHealthOn ? 'Thời gian học & làm việc trung bình hàng ngày' : 'Tính năng quản lý sức khỏe tinh thần đã được tắt'}
                  </p>
                </div>
                <div className={`pt-2 mt-2 border-t text-[10px] text-slate-400 ${
                  isMentalHealthOn ? 'border-slate-100 dark:border-slate-800' : 'border-dashed border-slate-200 dark:border-slate-800'
                }`}>
                  {isMentalHealthOn ? 'Giữ nhịp sinh học và ngủ đủ giấc' : 'Có thể bật lại trong Cài đặt hoặc trang Sức khỏe'}
                </div>
              </div>

              {/* Card 4: Digital Balance Screentime */}
              <div className={`p-4 rounded-2xl flex flex-col justify-between shadow-xs transition-all ${
                isDigitalWellbeingOn
                  ? 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  : 'border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500'
              }`}>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Smartphone className={`w-3.5 h-3.5 ${isDigitalWellbeingOn ? 'text-sky-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className={isDigitalWellbeingOn ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
                        Cân Bằng Số
                      </span>
                    </span>
                    {isDigitalWellbeingOn ? (
                      <span className="text-[10px] font-mono text-slate-500">
                        {review.total_screentime_hours}h tổng
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-medium">
                        Đang tắt
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className={`text-2xl font-black font-mono tracking-tight ${
                      isDigitalWellbeingOn ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
                    }`}>
                      {isDigitalWellbeingOn ? `${review.study_work_screentime_hours?.toFixed(1) || '0.0'}h` : '---'}
                    </span>
                    {isDigitalWellbeingOn && <span className="text-xs text-slate-500 font-semibold">học & việc</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    {isDigitalWellbeingOn
                      ? `Giải trí: ${review.entertainment_screentime_hours}h (${review.screentime_violations_count} lần vượt)`
                      : 'Tính năng quản lý cân bằng số đã được tắt'}
                  </p>
                </div>
                <div className={`pt-2 mt-2 border-t text-[10px] text-slate-400 ${
                  isDigitalWellbeingOn ? 'border-slate-100 dark:border-slate-800' : 'border-dashed border-slate-200 dark:border-slate-800'
                }`}>
                  {isDigitalWellbeingOn
                    ? review.screentime_violations_count === 0 ? '✓ Tuyệt đối tuân thủ hạn mức' : 'Cần giảm thời gian mạng xã hội'
                    : 'Có thể bật lại trong Cài đặt'}
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 4. 7-DAY DAILY RHYTHM PULSE TABLE                       */}
            {/* ======================================================== */}
            {review.daily_breakdown && review.daily_breakdown.length > 0 && (
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Nhịp Độ Năng Suất 7 Ngày Trong Tuần</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Thứ 2 – Chủ Nhật</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {review.daily_breakdown.map((day) => (
                    <div
                      key={day.date}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col justify-between space-y-2 ${
                        day.is_best_day
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-1 ring-amber-400/40'
                          : day.status_tone === 'EXCELLENT'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                          : day.status_tone === 'WARNING'
                          ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <span>{day.day_name_vi}</span>
                          {day.is_best_day && <span title="Ngày xuất sắc nhất">🏆</span>}
                          {day.is_worst_day && <span title="Ngày trũng nhất">⚠️</span>}
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                          {day.date.split('-').slice(1).reverse().join('/')}
                        </span>
                      </div>

                      <div className="my-1">
                        <span className="text-lg font-black font-mono block text-slate-900 dark:text-slate-100">
                          {day.completed_tasks}
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase font-medium">task xong</span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] space-y-0.5 font-mono">
                        <div className="flex justify-between text-slate-500">
                          <span>Tải:</span>
                          <strong>{day.screentime_hours}h</strong>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Điểm:</span>
                          <strong className="text-indigo-600 dark:text-indigo-400">+{day.difficulty_points}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 5. DELAYED TASK AUDIT & FORCE MAJEURE                   */}
            {/* ======================================================== */}
            {review.delayed_audits && review.delayed_audits.length > 0 && (
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Kiểm Toán Nhiệm Vụ Bị Hoãn ({review.delayed_audits.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Phân tách hoãn Bất khả kháng vs Trì hoãn chủ quan
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {review.delayed_audits.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Lý do: {item.reason} {item.due_date ? `• Hạn: ${item.due_date}` : ''}
                        </span>
                      </div>

                      <Badge
                        variant={item.is_force_majeure ? 'outline' : 'secondary'}
                        className={`text-[10px] shrink-0 font-bold ${
                          item.is_force_majeure
                            ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {item.is_force_majeure ? '🛡️ Bất khả kháng (Bảo lưu 85%)' : 'Trì hoãn chủ quan'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 6. STRATEGIC REFLECTION & ACTION PLAN                   */}
            {/* ======================================================== */}
            <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>Phản Tư & Chiến Lược Cải Tiến Tuần Tới</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ghi lại những bài học kinh nghiệm để liên tục tối ưu hóa năng suất và tinh thần.
                  </p>
                </div>

                {/* Auto-Draft Assistant Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyAutoDraft}
                  className="text-xs gap-1.5 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{autoDraftToast ? '✓ Đã điền tự động!' : '🪄 Tự động phân tích & điền gợi ý'}</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. What went well */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <span className="text-emerald-500">●</span>
                    <span>1. Điều gì đã làm tốt trong tuần này? (Wins)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={whatWentWell}
                    onChange={(e) => setWhatWentWell(e.target.value)}
                    placeholder="VD: Duy trì hoàn thành các bài tập lập trình đúng hạn, giữ được chuỗi kỷ luật..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs resize-none shadow-2xs"
                  />
                </div>

                {/* 2. What needs improvement */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <span className="text-amber-500">●</span>
                    <span>2. Điều gì chưa tốt hoặc gặp trở ngại? (Bottlenecks)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={whatNeedsImprovement}
                    onChange={(e) => setWhatNeedsImprovement(e.target.value)}
                    placeholder="VD: Mất tập trung vào tối thứ Tư, dùng điện thoại quá định mức quy định..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs resize-none shadow-2xs"
                  />
                </div>

                {/* 3. Delayed task reflection */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <span className="text-rose-500">●</span>
                    <span>3. Nguyên nhân các task bị hoãn? (Root Causes)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={delayedReflection}
                    onChange={(e) => setDelayedReflection(e.target.value)}
                    placeholder="VD: Đặt thời gian cho task đồ án quá ngắn so với thực tế, có sự cố mất mạng..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs resize-none shadow-2xs"
                  />
                </div>

                {/* 4. Next week changes */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <span className="text-indigo-500">●</span>
                    <span>4. Chiến lược hành động tuần tới? (Commitments)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={nextWeekChanges}
                    onChange={(e) => setNextWeekChanges(e.target.value)}
                    placeholder="VD: Khóa app giải trí sau 22h, chia nhỏ bài toán thành các subtask 20 phút..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs resize-none shadow-2xs"
                  />
                </div>
              </div>
            </div>

          </div>
        ) : null}

        {/* ======================================================== */}
        {/* 7. FOOTER ACTION CONTROLS                               */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 gap-3 print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={handleFinalizeArchive}
            disabled={finalizing || isLoading}
            className="text-xs gap-1.5"
            title="Đóng băng dữ liệu báo cáo tuần này vào Archive"
          >
            <Archive className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span>{finalizing ? 'Đang đóng băng...' : 'Đóng băng vào Archive'}</span>
          </Button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Đóng
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting || isLoading}
              className="text-xs gap-1.5 px-5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Báo Cáo Phản Tư'}</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
