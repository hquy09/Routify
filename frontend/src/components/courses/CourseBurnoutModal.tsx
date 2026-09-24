import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Zap, Moon, Clock, Calendar, AlertTriangle, CheckCircle2,
  Sparkles, Sliders, RefreshCw, ChevronRight, Flame, HeartPulse,
  Smile, ShieldAlert, Award, Coffee, BatteryCharging, Info
} from 'lucide-react';
import { Course, BurnoutAnalysisOut, BurnoutCustomConfig, BurnoutDayDetail } from '../../types';
import { api } from '../../services/api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface CourseBurnoutModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseBurnoutModal: React.FC<CourseBurnoutModalProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'customize'>('overview');
  const [analysis, setAnalysis] = useState<BurnoutAnalysisOut | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState<string | null>(null);

  // Customization States
  const [maxFocusHours, setMaxFocusHours] = useState<number>(6.0);
  const [minFreeHours, setMinFreeHours] = useState<number>(2.0);
  const [sleepTargetHours, setSleepTargetHours] = useState<number>(7.5);
  const [workloadThreshold, setWorkloadThreshold] = useState<number>(80);
  const [energyLevel, setEnergyLevel] = useState<BurnoutCustomConfig['energy_level']>('NORMAL');
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  const loadAnalysis = async (customCfg?: BurnoutCustomConfig) => {
    if (!course) return;
    setIsLoading(true);
    try {
      const data = await api.courses.getBurnoutAnalysis(course.id, customCfg);
      setAnalysis(data);
      if (!customCfg) {
        setMaxFocusHours(data.config.max_daily_focus_hours);
        setMinFreeHours(data.config.min_free_hours);
        setSleepTargetHours(data.config.sleep_target_hours);
        setWorkloadThreshold(data.config.workload_threshold);
        setEnergyLevel(data.config.energy_level);
        setIsCalibrated(data.config.is_calibrated);
      }
    } catch (err) {
      console.error('Failed to load burnout analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && course) {
      loadAnalysis();
    }
  }, [isOpen, course?.id]);

  // Dynamic tension calculations for the slider
  const tensionDetails = useMemo(() => {
    if (maxFocusHours <= 4.0) {
      return {
        level: 'LOW',
        label: 'Thư thái, như đi dạo',
        color: '#10b981', // emerald
        textColor: 'text-emerald-600 dark:text-emerald-400',
        bgGradient: 'from-emerald-500 to-teal-600',
        barBg: 'bg-emerald-500',
        icon: '😌',
        isHighTension: false,
      };
    } else if (maxFocusHours <= 6.5) {
      return {
        level: 'BALANCED',
        label: 'Tập trung tối ưu, nhịp độ vàng',
        color: '#0284c7', // sky
        textColor: 'text-sky-600 dark:text-sky-400',
        bgGradient: 'from-sky-500 to-indigo-600',
        barBg: 'bg-sky-500',
        icon: '🎯',
        isHighTension: false,
      };
    } else if (maxFocusHours <= 8.0) {
      return {
        level: 'STRAIN',
        label: 'Căng thẳng tích tụ! Cần chú ý nghỉ ngơi',
        color: '#f59e0b', // amber
        textColor: 'text-amber-600 dark:text-amber-400',
        bgGradient: 'from-amber-500 to-orange-600',
        barBg: 'bg-amber-500',
        icon: '⚡',
        isHighTension: true,
      };
    } else {
      return {
        level: 'EXTREME',
        label: 'ĐỘ CĂNG CỰC ĐẠI - NGUY CƠ BÙNG NỔ BURNOUT!',
        color: '#ef4444', // red
        textColor: 'text-rose-600 dark:text-rose-400 font-black',
        bgGradient: 'from-rose-500 via-red-600 to-purple-700',
        barBg: 'bg-rose-600',
        icon: '🔥',
        isHighTension: true,
      };
    }
  }, [maxFocusHours]);

  // Handle live custom config change
  const handleApplyCustomConfig = () => {
    const customCfg: BurnoutCustomConfig = {
      max_daily_focus_hours: maxFocusHours,
      min_free_hours: minFreeHours,
      sleep_target_hours: sleepTargetHours,
      sleep_bedtime: '23:00',
      sleep_wake_time: '07:00',
      workload_threshold: workloadThreshold,
      energy_level: energyLevel,
      is_calibrated: isCalibrated,
    };
    loadAnalysis(customCfg);
  };

  const handleCalibrate = async () => {
    if (!course) return;
    setIsCalibrating(true);
    setCalibrationSuccess(null);
    try {
      const calibratedCfg = await api.courses.calibrateBurnout(course.id);
      setMaxFocusHours(calibratedCfg.max_daily_focus_hours);
      setMinFreeHours(calibratedCfg.min_free_hours);
      setEnergyLevel(calibratedCfg.energy_level);
      setIsCalibrated(true);
      await loadAnalysis(calibratedCfg);
      setCalibrationSuccess('✓ Đã hiệu chỉnh thành công dựa trên lịch sử hoàn thành task 14 ngày qua!');
      setTimeout(() => setCalibrationSuccess(null), 5000);
    } catch (err) {
      console.error('Calibration failed:', err);
    } finally {
      setIsCalibrating(false);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Phân tích Lộ trình & Nguy cơ Burnout
                </h3>
                {isCalibrated ? (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300 text-[10px] font-semibold">
                    ✨ Đã hiệu chỉnh thực tế
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-slate-500">
                    Baseline khoa học
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Khóa học: <strong className="text-slate-800 dark:text-slate-200">{course.title}</strong>
                {course.countdown_title && (
                  <span> • Đính kèm: <strong>{course.countdown_title}</strong> (còn {course.countdown_days_left} ngày)</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Biểu đồ 7 ngày & Hiệu quả học</span>
            </button>
            <button
              onClick={() => setActiveTab('customize')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'customize'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tùy biến cá nhân & Độ Căng</span>
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCalibrate}
            disabled={isCalibrating}
            className="text-xs font-medium border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300"
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1 ${isCalibrating ? 'animate-spin' : 'text-purple-600'}`} />
            <span>{isCalibrating ? 'Đang phân tích...' : '🪄 Hiệu chỉnh theo lịch sử'}</span>
          </Button>
        </div>

        {calibrationSuccess && (
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{calibrationSuccess}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
              <p>Đang tính toán ma trận giấc ngủ, thời gian trống và hiệu quả học tập...</p>
            </div>
          ) : analysis ? (
            activeTab === 'overview' ? (
              /* TAB 1: 7-DAY OVERVIEW & EFFICIENCY */
              <div className="space-y-4">
                {/* Summary Alert Banner */}
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 shadow-xs ${
                    analysis.weekly_burnout_risk_level === 'BURNOUT_RISK'
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
                      : analysis.weekly_burnout_risk_level === 'MODERATE'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {analysis.weekly_burnout_risk_level === 'BURNOUT_RISK' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    ) : analysis.weekly_burnout_risk_level === 'MODERATE' ? (
                      <Zap className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{analysis.smart_recommendation}</h4>
                    <p className="opacity-90">{analysis.rebalance_summary}</p>
                  </div>
                </div>

                {/* 4 Stats Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Khối lượng còn lại</span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                      {Math.round(analysis.total_remaining_minutes / 60 * 10) / 10}h
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">({analysis.total_remaining_lessons} bài chưa xong)</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Tốc độ cần đạt</span>
                    <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {Math.round(analysis.average_daily_study_minutes)}p
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">mỗi ngày liên tục</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Giấc ngủ mục tiêu</span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                      {analysis.config.sleep_target_hours}h
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">chuẩn phục hồi trí nhớ</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Sức chịu tải tối đa</span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                      {analysis.config.max_daily_focus_hours}h
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">mức năng lượng: {analysis.config.energy_level}</span>
                  </div>
                </div>

                {/* 7-Day Grid Cards */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Chi tiết Tải lượng & Chỉ số Hiệu quả 7 ngày trong tuần:</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Đã trừ thời gian ngủ và 1.75h sinh hoạt</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2.5">
                    {analysis.days.map((day) => {
                      const isHighRisk = day.status === 'BURNOUT_RISK';
                      const isModerate = day.status === 'MODERATE';
                      return (
                        <div
                          key={day.day_key}
                          className={`p-3 rounded-2xl border transition-all text-xs flex flex-col justify-between space-y-2 relative overflow-hidden ${
                            isHighRisk
                              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-xs'
                              : isModerate
                              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50'
                              : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                          }`}
                        >
                          {/* Day Header */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{day.day_name}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                                day.efficiency_score >= 85
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : day.efficiency_score >= 65
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                              title="Chỉ số hiệu quả tiếp thu kiến thức dự kiến"
                            >
                              ⚡ {day.efficiency_score}%
                            </span>
                          </div>

                          {/* Time Metrics */}
                          <div className="space-y-1.5 text-[11px]">
                            {/* Sleep */}
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Moon className="w-3 h-3 text-indigo-400" />
                                <span>Ngủ:</span>
                              </span>
                              <span className={`font-mono font-semibold ${day.is_sleep_deprived ? 'text-rose-600 font-bold' : ''}`}>
                                {day.sleep_hours}h
                              </span>
                            </div>

                            {/* Fixed Schedules */}
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-purple-400" />
                                <span>Lịch cố định:</span>
                              </span>
                              <span className="font-mono font-semibold">{day.fixed_hours}h</span>
                            </div>

                            {/* Target Study */}
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span>Học mục tiêu:</span>
                              </span>
                              <span className="font-mono font-semibold">{day.target_study_minutes}p</span>
                            </div>

                            {/* Usable Free Buffer */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                              <span className="font-medium text-slate-500">Thời gian rảnh:</span>
                              <span
                                className={`font-mono font-bold ${
                                  day.free_hours < 1.5
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : day.free_hours < 3.0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {day.free_hours}h
                              </span>
                            </div>
                          </div>

                          {/* Rebalanced Suggestion */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                              <span>Khuyên học:</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                {day.recommended_study_minutes}p
                              </span>
                            </div>
                          </div>

                          {/* Status Pill */}
                          <div className="pt-1">
                            <span
                              className={`block text-center text-[9px] font-bold py-0.5 rounded-md uppercase tracking-wider ${
                                isHighRisk
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : isModerate
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                              }`}
                            >
                              {isHighRisk ? 'Nguy cơ Burnout' : isModerate ? 'Vừa sức' : 'Tối ưu'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: CUSTOMIZE & INTERACTIVE TENSION SLIDER */
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* INTERACTIVE TENSION SLIDER SECTION */}
                <div
                  className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                    tensionDetails.isHighTension
                      ? 'border-rose-300 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/60 via-amber-50/40 to-red-50/50 dark:from-rose-950/20 dark:to-red-950/30 shadow-md shadow-rose-500/5'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none animate-bounce">{tensionDetails.icon}</span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>Mức chịu tải học tập & làm việc tối đa</span>
                        </h4>
                        <p className={`text-xs font-semibold ${tensionDetails.textColor} transition-colors duration-200`}>
                          {tensionDetails.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono tracking-tight" style={{ color: tensionDetails.color }}>
                        {maxFocusHours.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1 font-medium">giờ/ngày</span>
                    </div>
                  </div>

                  {/* Heat Spectrum Dynamic Slider */}
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
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                      <span>3.0h (Thư giãn)</span>
                      <span>5.0h (Chuẩn)</span>
                      <span>7.0h (Cao điểm)</span>
                      <span className="text-rose-500 font-bold">10.0h (Quá tải)</span>
                    </div>
                  </div>

                  {/* Tension Vibration Indicator if High Tension */}
                  {tensionDetails.isHighTension && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-800/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 animate-pulse">
                      <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Cảnh báo: Kéo mức học lên trên 7.5 giờ mỗi ngày dễ khiến não bộ kiệt sức và làm sụt giảm khả năng ghi nhớ dài hạn. Hãy dành thời gian nghỉ ngơi hợp lý.</span>
                    </div>
                  )}
                </div>

                {/* Energy Level Selector */}
                <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BatteryCharging className="w-4 h-4 text-emerald-600" />
                    <span>Mức năng lượng & Thể lực hiện tại của bạn:</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          energyLevel === lvl.id
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm ring-1'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="text-lg select-none mb-1">{lvl.icon}</div>
                        <div className="font-bold text-xs">{lvl.label}</div>
                        <div className="text-[10px] opacity-75">{lvl.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary Parameters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Min Free Time Buffer */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-amber-500" />
                        <span>Thời gian rảnh tối thiểu</span>
                      </span>
                      <span className="font-mono font-bold text-indigo-600">{minFreeHours.toFixed(1)} giờ</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="4.0"
                      step="0.5"
                      value={minFreeHours}
                      onChange={(e) => setMinFreeHours(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full cursor-pointer appearance-none bg-slate-200 dark:bg-slate-700 accent-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400">Khoảng thở cần thiết trong ngày để giảm stress.</p>
                  </div>

                  {/* Sleep Target Hours */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Mục tiêu giấc ngủ</span>
                      </span>
                      <span className="font-mono font-bold text-indigo-600">{sleepTargetHours.toFixed(1)} giờ</span>
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
                    <p className="text-[10px] text-slate-400">Tiêu chuẩn khoa học cho não bộ: 7.5 - 8.0 giờ.</p>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleApplyCustomConfig();
                      setActiveTab('overview');
                    }}
                    className="shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>Áp dụng Tùy biến & Cập nhật Biểu đồ</span>
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Không thể tải dữ liệu phân tích. Vui lòng thử lại.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
