import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse, Sparkles, Sliders, RefreshCw, Calendar, Clock,
  Moon, Coffee, Flame, BatteryCharging, AlertTriangle, CheckCircle2,
  BookOpen, Brain, Zap, ArrowRight, ShieldAlert, Award, ChevronRight,
  TrendingUp, Activity, Layers, Compass, Power
} from 'lucide-react';
import {
  GlobalWellbeingAnalysis,
  WellbeingCustomConfig,
  WellbeingDayDetail,
  CourseLoadContribution,
  StudyStreamItem
} from '../types';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { isMentalHealthEnabled, setMentalHealthEnabled } from '../utils/featureFlags';

interface MentalHealthPageProps {
  onNavigateTab?: (tab: string) => void;
  onSelectCourse?: (courseId: number) => void;
}

export const MentalHealthPage: React.FC<MentalHealthPageProps> = ({
  onNavigateTab,
  onSelectCourse,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'courses' | 'tuning'>('matrix');
  const [analysis, setAnalysis] = useState<GlobalWellbeingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>('MON');

  // Customization Configuration States
  const [maxFocusHours, setMaxFocusHours] = useState<number>(6.0);
  const [minFreeHours, setMinFreeHours] = useState<number>(2.0);
  const [sleepTargetHours, setSleepTargetHours] = useState<number>(7.5);
  const [workloadThreshold, setWorkloadThreshold] = useState<number>(80);
  const [energyLevel, setEnergyLevel] = useState<WellbeingCustomConfig['energy_level']>('NORMAL');
  const [streamStrategy, setStreamStrategy] = useState<string>('BALANCED_BLOCKS');
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  // Mental Health module toggle state
  const [isMentalHealthOn, setIsMentalHealthOn] = useState<boolean>(() => isMentalHealthEnabled());

  useEffect(() => {
    const handleSync = () => {
      setIsMentalHealthOn(isMentalHealthEnabled());
    };
    window.addEventListener('lifeos_mental_health_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('lifeos_mental_health_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleToggleMentalHealth = () => {
    const next = !isMentalHealthOn;
    setIsMentalHealthOn(next);
    setMentalHealthEnabled(next);
  };

  const loadAnalysis = async (customCfg?: WellbeingCustomConfig) => {
    setIsLoading(true);
    try {
      const data = await api.wellbeing.getAnalysis(customCfg);
      setAnalysis(data);
      if (!customCfg) {
        setMaxFocusHours(data.config.max_daily_focus_hours);
        setMinFreeHours(data.config.min_free_hours);
        setSleepTargetHours(data.config.sleep_target_hours);
        setWorkloadThreshold(data.config.workload_threshold);
        setEnergyLevel(data.config.energy_level);
        setStreamStrategy(data.config.stream_strategy || 'BALANCED_BLOCKS');
        setIsCalibrated(data.config.is_calibrated);
      }
    } catch (err) {
      console.error('Failed to load global wellbeing analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  // Dynamic Tension Details based on slider
  const tensionDetails = useMemo(() => {
    if (maxFocusHours <= 4.0) {
      return {
        level: 'LOW',
        label: 'Thư thái, nhẹ nhàng',
        color: '#10b981',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        bgGradient: 'from-emerald-500 to-teal-600',
        borderColor: 'border-emerald-300 dark:border-emerald-700',
        icon: '😌',
        isHighTension: false,
        advice: 'Tâm trí thoải mái, nhịp độ học tập nhẹ nhàng, rất tốt để phục hồi năng lượng và tiếp thu kiến thức một cách tự nhiên.'
      };
    } else if (maxFocusHours <= 6.5) {
      return {
        level: 'BALANCED',
        label: 'Tập trung tối ưu, nhịp độ vàng',
        color: '#0284c7',
        textColor: 'text-sky-600 dark:text-sky-400',
        bgGradient: 'from-sky-500 to-indigo-600',
        borderColor: 'border-sky-300 dark:border-sky-700',
        icon: '🎯',
        isHighTension: false,
        advice: 'Nhịp độ học tập lý tưởng! Não bộ tập trung sâu mà không bị quá tải, năng lượng duy trì ổn định suốt cả ngày.'
      };
    } else if (maxFocusHours <= 8.0) {
      return {
        level: 'STRAIN',
        label: 'Căng thẳng tích tụ! Cần chú ý nghỉ ngơi',
        color: '#f59e0b',
        textColor: 'text-amber-600 dark:text-amber-400',
        bgGradient: 'from-amber-500 to-orange-600',
        borderColor: 'border-amber-300 dark:border-amber-700',
        icon: '⚡',
        isHighTension: true,
        advice: 'Áp lực học tập bắt đầu tăng cao. Não bộ cần tối thiểu 1.5 - 2 giờ thư giãn, vận động nhẹ hoặc nghe nhạc để tránh mệt mỏi.'
      };
    } else {
      return {
        level: 'EXTREME',
        label: 'ÁP LỰC CỰC ĐẠI - NGUY CƠ KIỆT SỨC (BURNOUT)!',
        color: '#ef4444',
        textColor: 'text-rose-600 dark:text-rose-400 font-black',
        bgGradient: 'from-rose-500 via-red-600 to-purple-700',
        borderColor: 'border-rose-400 dark:border-rose-600',
        icon: '🔥',
        isHighTension: true,
        advice: 'CẢNH BÁO KIỆT SỨC: Học quá nhiều giờ liên tục khiến não bộ quá tải, dễ dẫn đến stress và giảm khả năng ghi nhớ. Bạn nên giảm bớt bài học và ngủ đủ giấc.'
      };
    }
  }, [maxFocusHours]);

  const handleApplyConfig = async () => {
    const customCfg: WellbeingCustomConfig = {
      max_daily_focus_hours: maxFocusHours,
      min_free_hours: minFreeHours,
      sleep_target_hours: sleepTargetHours,
      sleep_bedtime: '23:00',
      sleep_wake_time: '07:00',
      workload_threshold: workloadThreshold,
      energy_level: energyLevel,
      stream_strategy: streamStrategy,
      is_calibrated: isCalibrated,
    };
    await api.wellbeing.saveSettings(customCfg);
    await loadAnalysis(customCfg);
    setToastMessage('✓ Đã cập nhật ma trận tải lượng và lưu cài đặt sức khỏe tinh thần!');
    setTimeout(() => setToastMessage(null), 4000);
    setActiveTab('matrix');
  };

  const handleCalibrate = async () => {
    setIsCalibrating(true);
    setToastMessage(null);
    try {
      const cfg = await api.wellbeing.calibrate();
      setMaxFocusHours(cfg.max_daily_focus_hours);
      setMinFreeHours(cfg.min_free_hours);
      setEnergyLevel(cfg.energy_level);
      setIsCalibrated(true);
      await loadAnalysis(cfg);
      setToastMessage('✓ Đã phân tích 14 ngày qua và tự động hiệu chỉnh mức chịu tải tối ưu!');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Failed to calibrate:', err);
    } finally {
      setIsCalibrating(false);
    }
  };

  const selectedDayDetail = useMemo(() => {
    if (!analysis) return null;
    return analysis.days.find((d) => d.day_key === selectedDayKey) || analysis.days[0];
  }, [analysis, selectedDayKey]);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Quản lý Mức độ Căng thẳng & Sức khỏe Tinh thần
              </h1>
              {!isMentalHealthOn ? (
                <Badge
                  variant="outline"
                  className="text-xs px-2.5 py-0.5 font-bold border-dashed border-slate-400 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/60"
                >
                  ⏸️ Đang tắt tính năng
                </Badge>
              ) : analysis ? (
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-0.5 font-bold ${
                    analysis.weekly_burnout_risk_level === 'BURNOUT_RISK'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300'
                      : analysis.weekly_burnout_risk_level === 'MODERATE'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                  }`}
                >
                  {analysis.weekly_burnout_risk_level === 'BURNOUT_RISK'
                    ? '🚨 Nguy cơ Quá tải'
                    : analysis.weekly_burnout_risk_level === 'MODERATE'
                    ? '⚡ Nguy cơ Cục bộ'
                    : '✅ Nhịp độ Bền vững'}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Theo dõi mức độ áp lực học tập và làm việc hàng ngày, tự động cân đối với giấc ngủ và thời gian nghỉ ngơi để bạn luôn duy trì năng lượng và tránh kiệt sức.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleMentalHealth}
              className={`transition shadow-xs font-semibold ${
                isMentalHealthOn
                  ? 'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/40 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Bật/Tắt tính năng Quản lý Sức khỏe Tinh thần"
            >
              <Power className={`w-3.5 h-3.5 mr-1.5 ${isMentalHealthOn ? 'text-rose-500' : 'text-slate-400'}`} />
              <span>{isMentalHealthOn ? 'Tính năng: Đang Bật' : 'Tính năng: Đang Tắt'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCalibrate}
              disabled={isCalibrating}
              className="border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 shadow-xs"
            >
              <Sparkles className={`w-4 h-4 mr-1.5 ${isCalibrating ? 'animate-spin' : 'text-purple-600'}`} />
              <span>{isCalibrating ? 'Đang phân tích...' : '🪄 Hiệu chỉnh theo lịch sử (14d)'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAnalysis()}
              disabled={isLoading}
              title="Làm mới ma trận"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </Button>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Notice Banner when Disabled */}
      {!isMentalHealthOn && (
        <div className="p-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-400 shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Tính năng Quản lý Sức khỏe Tinh thần hiện đang TẮT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-dashed border-slate-400 dark:border-slate-600 text-slate-500">
                  TẠM DỪNG
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chỉ số Sức khỏe & Áp lực tinh thần trên thanh Topbar và trong Báo cáo tuần (Weekly Report) đang hiển thị màu xám với viền nét đứt. Dữ liệu tính toán vẫn được bảo lưu và bạn có thể kích hoạt lại bất kỳ lúc nào.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleToggleMentalHealth}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-xs font-semibold shrink-0 cursor-pointer"
          >
            <HeartPulse className="w-3.5 h-3.5 mr-1.5" />
            <span>Bật lại tính năng</span>
          </Button>
        </div>
      )}

      {/* 2. STATS & OVERVIEW CARDS */}
      {analysis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Card 1: Độ Căng Hiện Tại */}
          <div
            onClick={() => setActiveTab('tuning')}
            className={`p-4 rounded-3xl border bg-white dark:bg-slate-900 cursor-pointer transition hover:shadow-md ${tensionDetails.borderColor}`}
          >
            <div className="flex items-center justify-between mb-1 text-slate-500 dark:text-slate-400 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Mức Độ Áp Lực Tối Đa</span>
              </span>
              <span className="text-base select-none">{tensionDetails.icon}</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono tracking-tight" style={{ color: tensionDetails.color }}>
                {maxFocusHours.toFixed(1)}h
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ ngày</span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 truncate">
              {tensionDetails.label}
            </p>
          </div>

          {/* Card 2: Tổng Giờ Cần Học Các Môn */}
          <div
            onClick={() => setActiveTab('courses')}
            className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer transition hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-1 text-slate-500 dark:text-slate-400 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Thời Gian Cần Học</span>
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                {analysis.active_courses_count} khóa đang học
              </Badge>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
                {Math.round(analysis.combined_daily_study_minutes)}p
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ ngày (~{analysis.combined_daily_study_hours}h)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Còn {analysis.total_remaining_study_hours}h ({analysis.total_remaining_lessons} bài)
            </p>
          </div>

          {/* Card 3: Giấc Ngủ Trung Bình */}
          <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-1 text-slate-500 dark:text-slate-400 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Thời Lượng Ngủ</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                Mục tiêu: {sleepTargetHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
                {sleepTargetHours.toFixed(1)}h
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ đêm</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Giúp não bộ phục hồi và củng cố trí nhớ</span>
            </p>
          </div>

          {/* Card 4: Quỹ Thời Gian Rảnh */}
          <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-1 text-slate-500 dark:text-slate-400 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-500" />
                <span>Thời Gian Thư Giãn</span>
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                Buffer: {minFreeHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
                {minFreeHours.toFixed(1)}h
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ ngày</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Dành cho ăn uống, thể thao, giải trí và nghỉ ngơi
            </p>
          </div>
        </div>
      )}

      {/* 3. RECOMMENDATION & REBALANCE BANNER */}
      {analysis && (
        <div
          className={`p-5 rounded-3xl border text-xs md:text-sm leading-relaxed flex items-start gap-3.5 shadow-xs transition ${
            analysis.weekly_burnout_risk_level === 'BURNOUT_RISK'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
              : analysis.weekly_burnout_risk_level === 'MODERATE'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {analysis.weekly_burnout_risk_level === 'BURNOUT_RISK' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
            ) : analysis.weekly_burnout_risk_level === 'MODERATE' ? (
              <Zap className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm md:text-base leading-snug">{analysis.smart_recommendation}</h4>
            <p className="opacity-90">{analysis.rebalance_summary}</p>
          </div>
        </div>
      )}

      {/* 4. MAIN TABS SWITCHER */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch trình 7 ngày & Phân bổ môn học</span>
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Áp lực từng môn học ({analysis?.total_courses_count || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('tuning')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'tuning'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Cài đặt Ngưỡng Áp lực & Giờ học</span>
          </button>
        </div>

        {/* Strategy tag */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Compass className="w-3.5 h-3.5 text-indigo-500" />
          <span>Chiến lược: <strong>{streamStrategy === 'BALANCED_BLOCKS' ? 'Khối Chuyên Sâu' : streamStrategy === 'ADAPTIVE' ? 'Tái Cân Bằng' : 'Dàn Đều'}</strong></span>
        </div>
      </div>

      {/* 5. TAB CONTENT */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-400 text-sm space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-500" />
          <p>Đang tính toán ma trận giấc ngủ, lịch cố định và phân luồng các môn học...</p>
        </div>
      ) : analysis ? (
        activeTab === 'matrix' ? (
          /* ======================================================== */
          /* TAB 1: 7-DAY MATRIX & SMART STUDY STREAMS               */
          /* ======================================================== */
          <div className="space-y-6">
            {/* 7 Days Visual Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {analysis.days.map((day) => {
                const isSelected = day.day_key === selectedDayKey;
                const isBurnout = day.status === 'BURNOUT_RISK';
                const isModerate = day.status === 'MODERATE';

                return (
                  <div
                    key={day.day_key}
                    onClick={() => setSelectedDayKey(day.day_key)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer text-left relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md bg-white dark:bg-slate-900'
                        : isBurnout
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400'
                        : isModerate
                        ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{day.day_name}</span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isBurnout
                              ? 'bg-rose-500 animate-ping'
                              : isModerate
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      {/* Efficiency Score */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
                          <span>Độ tỉnh táo & tiếp thu</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{day.efficiency_score}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              day.efficiency_score >= 80
                                ? 'bg-emerald-500'
                                : day.efficiency_score >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${day.efficiency_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Mini 24h Stacked Bar */}
                      <div className="space-y-1 mb-3">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Cơ cấu 24h:</span>
                        <div className="w-full h-2.5 rounded-full flex overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <div style={{ width: `${(day.sleep_minutes / 1440) * 100}%` }} className="bg-indigo-500" title={`Ngủ: ${day.sleep_hours}h`} />
                          <div style={{ width: `${(day.fixed_minutes / 1440) * 100}%` }} className="bg-amber-500" title={`Cố định: ${day.fixed_hours}h`} />
                          <div style={{ width: `${(day.total_study_minutes / 1440) * 100}%` }} className="bg-emerald-500" title={`Học: ${day.total_study_hours}h`} />
                          <div style={{ width: `${(day.free_minutes / 1440) * 100}%` }} className="bg-teal-400" title={`Rảnh: ${day.free_hours}h`} />
                        </div>
                      </div>

                      {/* Key stats */}
                      <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400 font-mono">
                        <div className="flex justify-between">
                          <span>Cố định:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{day.fixed_hours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Học tập:</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{day.total_study_minutes}p</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rảnh rỗi:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{day.free_hours}h</span>
                        </div>
                      </div>
                    </div>

                    {/* Streams preview tag */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Môn học: </span>
                      <strong className="text-slate-700 dark:text-slate-300">{day.streams.length} môn</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend for 24h Bar */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500" /> Ngủ</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Lịch cố định</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Tổng học các môn</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-teal-400" /> Quỹ thời gian tự do</span>
            </div>

            {/* Detailed View of Selected Day */}
            {selectedDayDetail && (
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Chi tiết Lịch trình: {selectedDayDetail.day_name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={`text-xs font-semibold ${
                          selectedDayDetail.status === 'BURNOUT_RISK'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : selectedDayDetail.status === 'MODERATE'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {selectedDayDetail.status === 'BURNOUT_RISK'
                          ? '🚨 Nguy cơ Quá tải'
                          : selectedDayDetail.status === 'MODERATE'
                          ? '⚡ Mức độ Căng thẳng vừa'
                          : '✅ Trạng thái Lý tưởng'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Độ tỉnh táo & tiếp thu: <strong className="text-indigo-600 dark:text-indigo-400">{selectedDayDetail.efficiency_score}%</strong> •
                      Thời gian cam kết: <strong className="text-slate-700 dark:text-slate-300">{selectedDayDetail.workload_ratio}% quỹ thời gian thức</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      🛌 Ngủ: {selectedDayDetail.sleep_hours}h
                    </span>
                    <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      🏢 Cố định: {selectedDayDetail.fixed_hours}h
                    </span>
                    <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      🌿 Tự do: {selectedDayDetail.free_hours}h
                    </span>
                  </div>
                </div>

                {/* Smart Allocated Study Streams for this Day */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Các Môn Học Được Sắp Xếp Trong Ngày ({selectedDayDetail.streams.length} môn)</span>
                    </h4>
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      Tổng thời lượng học: {selectedDayDetail.total_study_minutes} phút (~{selectedDayDetail.total_study_hours}h)
                    </span>
                  </div>

                  {selectedDayDetail.streams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedDayDetail.streams.map((stream, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: stream.color }}
                              />
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {stream.course_title}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-bold ${
                                stream.focus_type === 'DEEP_WORK'
                                  ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300'
                                  : stream.focus_type === 'PRACTICE'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {stream.focus_type === 'DEEP_WORK'
                                ? '🧠 Deep Work'
                                : stream.focus_type === 'PRACTICE'
                                ? '🛠️ Thực hành'
                                : '⚡ Ôn tập nhẹ'}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500 dark:text-slate-400">Khung giờ: {stream.recommended_window}</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {stream.duration_minutes} phút
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
                      Ngày nghỉ ngơi, phục hồi thể lực và trí não trọn vẹn.
                    </div>
                  )}
                </div>

                {/* Fixed Schedules of this day */}
                {selectedDayDetail.fixed_schedule_names.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Lịch cố định ngày này: </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {selectedDayDetail.fixed_schedule_names.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'courses' ? (
          /* ======================================================== */
          /* TAB 2: COURSE LOAD BREAKDOWN                            */
          /* ======================================================== */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Áp lực và Thời lượng từ các Khóa học ({analysis.courses_contribution.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tỷ trọng (%) và thời lượng cần học mỗi ngày để kịp tiến độ deadline của từng môn.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab?.('courses')}
                className="text-xs"
              >
                <span>Mở Quản lý Khóa học</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {/* Courses Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.courses_contribution.map((course) => (
                <div
                  key={course.course_id}
                  className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-lg shrink-0"
                          style={{ backgroundColor: course.color }}
                        />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {course.course_title}
                        </h4>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-2 py-0.5 font-bold ${
                          course.cognitive_weight === 'CAO'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : course.cognitive_weight === 'TRUNG BÌNH'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {course.cognitive_weight === 'CAO'
                          ? 'Tải Cao'
                          : course.cognitive_weight === 'TRUNG BÌNH'
                          ? 'Tải Vừa'
                          : 'Tải Nhẹ'}
                      </Badge>
                    </div>

                    {/* Instructor & Countdown */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{course.instructor ? `GV: ${course.instructor}` : 'Tự nghiên cứu'}</span>
                      {course.countdown_title && (
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 text-[10px]">
                          <span>{course.countdown_icon || '🎯'}</span>
                          <span>còn {course.countdown_days_left}d</span>
                        </span>
                      )}
                    </div>

                    {/* Load Percentage Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-slate-500 dark:text-slate-400">Tỷ trọng trong tổng tải học</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {course.percentage_of_total_study}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${course.percentage_of_total_study}%`,
                            backgroundColor: course.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Daily pace stats */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Cần học mỗi ngày</span>
                      <strong className="text-sm font-mono text-slate-900 dark:text-slate-100 font-bold">
                        {Math.round(course.daily_study_minutes_needed)} phút
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Còn lại</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {Math.round(course.total_remaining_minutes / 60 * 10) / 10}h ({course.total_remaining_lessons} bài)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* TAB 3: PERSONAL TUNING & TACTILE TENSION SLIDER         */
          /* ======================================================== */
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* TENSION SLIDER HERO CARD */}
            <div className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl select-none">{tensionDetails.icon}</span>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
                      Thanh trượt Điều chỉnh Giờ học & Làm việc Mỗi ngày
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kéo để cài đặt số giờ học và làm việc tối đa bạn mong muốn trong một ngày. Hệ thống sẽ tự động cảnh báo khi bạn học quá sức.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black font-mono tracking-tight" style={{ color: tensionDetails.color }}>
                    {maxFocusHours.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">giờ/ngày</span>
                </div>
              </div>

              {/* Dynamic Heat Gradient Slider */}
              <div className="space-y-2 mt-4">
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.5"
                  value={maxFocusHours}
                  onChange={(e) => setMaxFocusHours(parseFloat(e.target.value))}
                  className="w-full h-3 rounded-full cursor-pointer appearance-none bg-slate-200 dark:bg-slate-700 accent-indigo-600 transition-all"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #0284c7 35%, #f59e0b 65%, #ef4444 85%, #7c3aed 100%)`,
                  }}
                />
                <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-400 font-mono px-1">
                  <span>3.0h (Thư thái 😌)</span>
                  <span>5.0h (Tập trung 🎯)</span>
                  <span>7.0h (Căng thẳng ⚡)</span>
                  <span className="text-rose-500 font-bold">10.0h (Quá tải 🔥)</span>
                </div>
              </div>

              {/* Dynamic Advice & Vibration Alert */}
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 transition ${
                  tensionDetails.isHighTension
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 animate-pulse'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {tensionDetails.isHighTension ? (
                    <Flame className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Award className="w-4 h-4 text-indigo-500" />
                  )}
                </div>
                <div>
                  <h5 className="font-bold text-xs mb-0.5">{tensionDetails.label}</h5>
                  <p>{tensionDetails.advice}</p>
                </div>
              </div>
            </div>

            {/* ENERGY LEVEL SELECTOR */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-emerald-600" />
                <span>Mức Năng lượng & Thể lực Hiện tại:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'RECHARGED', label: 'Tràn đầy năng lượng', sub: '1.15x sức bền', icon: '⚡' },
                  { id: 'NORMAL', label: 'Bình thường', sub: '1.0x sức bền', icon: '🔋' },
                  { id: 'FATIGUED', label: 'Mệt mỏi / Áp lực', sub: '0.85x sức bền', icon: '🥱' },
                  { id: 'EXHAUSTED', label: 'Kiệt sức / Ốm', sub: '0.70x sức bền', icon: '🪫' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setEnergyLevel(lvl.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      energyLevel === lvl.id
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm ring-1'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="text-xl select-none mb-1">{lvl.icon}</div>
                    <div className="font-bold text-xs">{lvl.label}</div>
                    <div className="text-[10px] opacity-75">{lvl.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* STUDY STREAM STRATEGY SELECTOR */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-500" />
                <span>Chiến Lược Phân Bổ Môn Học:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'BALANCED_BLOCKS',
                    label: 'Khối Chuyên Sâu (Block)',
                    desc: 'Học 1-2 môn/ngày xen kẽ để tránh bị phân tâm và mệt mỏi (Khuyên dùng)',
                    badge: 'Tập trung sâu 🎯'
                  },
                  {
                    id: 'ADAPTIVE',
                    label: 'Tái Cân Bằng Thích Ứng',
                    desc: 'Giảm tải ngày bận học trường/công ty, dồn môn nặng sang cuối tuần hoặc ngày rảnh',
                    badge: 'Linh hoạt ⚡'
                  },
                  {
                    id: 'EVEN_SPREAD',
                    label: 'Dàn Đều Truyền Thống',
                    desc: 'Mỗi ngày học đều một chút của tất cả các môn đang học',
                    badge: 'Đều đặn 📅'
                  },
                ].map((strat) => (
                  <button
                    key={strat.id}
                    type="button"
                    onClick={() => setStreamStrategy(strat.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      streamStrategy === strat.id
                        ? 'bg-indigo-50/70 border-indigo-500 dark:bg-indigo-950/40 dark:border-indigo-400 text-indigo-950 dark:text-indigo-100 ring-1 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs">{strat.label}</span>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{strat.badge}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {strat.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* SECONDARY PARAMETERS (SLEEP, FREE BUFFER, WORKLOAD THRESHOLD) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sleep Target */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Mục tiêu giấc ngủ</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-600">{sleepTargetHours.toFixed(1)}h</span>
                </div>
                <input
                  type="range"
                  min="6.0"
                  max="9.5"
                  step="0.5"
                  value={sleepTargetHours}
                  onChange={(e) => setSleepTargetHours(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full cursor-pointer appearance-none bg-slate-200 dark:bg-slate-700 accent-indigo-600"
                />
                <p className="text-[10px] text-slate-400">Tiêu chuẩn vàng não bộ: 7.5h - 8.0h.</p>
              </div>

              {/* Free Buffer */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-amber-500" />
                    <span>Thời gian rảnh tối thiểu</span>
                  </span>
                  <span className="font-mono font-bold text-amber-600">{minFreeHours.toFixed(1)}h</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.5"
                  value={minFreeHours}
                  onChange={(e) => setMinFreeHours(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full cursor-pointer appearance-none bg-slate-200 dark:bg-slate-700 accent-amber-600"
                />
                <p className="text-[10px] text-slate-400">Khoảng thở để giảm stress.</p>
              </div>

              {/* Workload Threshold */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ngưỡng cảnh báo tải</span>
                  </span>
                  <span className="font-mono font-bold text-rose-600">{workloadThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={workloadThreshold}
                  onChange={(e) => setWorkloadThreshold(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full cursor-pointer appearance-none bg-slate-200 dark:bg-slate-700 accent-rose-600"
                />
                <p className="text-[10px] text-slate-400">Mức vượt sẽ kích hoạt cảnh báo đỏ.</p>
              </div>
            </div>

            {/* SAVE & APPLY BUTTON */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={handleApplyConfig}
                className="px-6 py-2.5 rounded-xl shadow-sm text-xs md:text-sm font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span>Lưu & Áp dụng Ma trận Mới</span>
              </Button>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
};
