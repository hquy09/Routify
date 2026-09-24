import React, { useState, useEffect } from 'react';
import {
  Smartphone, ShieldAlert, Award, Clock, Plus, Settings2,
  Trash2, AlertTriangle, CheckCircle2, TrendingUp, Sparkles,
  Layers, Flame, Edit3, X, Check, FolderPlus, Power, PowerOff, Shield
} from 'lucide-react';
import { api } from '../services/api';
import { ScreenTimeOverview, DailyDisciplineSummary, ScreenTimeLimit, CategoryTypeConfig, DEFAULT_CATEGORY_TYPES, HeaderSummary } from '../types';
import {
  getStoredCategoryTypes,
  fetchCategoryTypes,
  getCategoryTypeConfig,
} from '../utils/categoryTypes';
import { isDigitalWellbeingEnabled, setDigitalWellbeingEnabled } from '../utils/featureFlags';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

export const ScreenTimePage: React.FC = () => {
  const [overview, setOverview] = useState<ScreenTimeOverview | null>(null);
  const [headerSummary, setHeaderSummary] = useState<HeaderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isConfirmToggleModalOpen, setIsConfirmToggleModalOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [categoryTypes, setCategoryTypes] = useState<CategoryTypeConfig[]>(() => getStoredCategoryTypes());
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Form states for adding log
  const [selectedCategory, setSelectedCategory] = useState('SOCIAL');
  const [minutesSpent, setMinutesSpent] = useState('30');
  const [appName, setAppName] = useState('');
  const [notes, setNotes] = useState('');

  // Category Edit / Create form state
  const [editingCategory, setEditingCategory] = useState<ScreenTimeLimit | null>(null);
  const [catLabel, setCatLabel] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catType, setCatType] = useState<string>('DISTRACTION');
  const [catLimit, setCatLimit] = useState('60');
  const [catDesc, setCatDesc] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, data, types, hs] = await Promise.all([
        api.screentime.getStatus(),
        api.screentime.getOverview(),
        fetchCategoryTypes(),
        api.dashboard.getHeaderSummary().catch(() => null),
      ]);
      const isStatusOn = statusRes?.enabled ?? true;
      setIsEnabled(isStatusOn);
      setDigitalWellbeingEnabled(isStatusOn);
      setOverview(data);
      setCategoryTypes(types);
      if (hs) {
        setHeaderSummary(hs);
      }
      if (data?.limits?.length > 0 && !selectedCategory) {
        setSelectedCategory(data.limits[0].category);
      }
    } catch (err) {
      console.error('Failed to load screen time data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = () => {
    if (isEnabled) {
      setIsConfirmToggleModalOpen(true);
    } else {
      executeToggle(true);
    }
  };

  const executeToggle = async (targetState: boolean) => {
    setIsToggling(true);
    try {
      const res = await api.screentime.toggle(targetState);
      setIsEnabled(res.enabled);
      setDigitalWellbeingEnabled(res.enabled);
      setIsConfirmToggleModalOpen(false);

      if (!targetState) {
        localStorage.removeItem('lifeos_category_types');
        setCategoryTypes(DEFAULT_CATEGORY_TYPES);
        window.dispatchEvent(new CustomEvent('lifeos_category_types_updated', { detail: DEFAULT_CATEGORY_TYPES }));
      }

      await loadData();
    } catch (err: any) {
      console.error('Failed to toggle screen time:', err);
      alert(`Lỗi khi thay đổi trạng thái: ${err.message || err}`);
    } finally {
      setIsToggling(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleTypesUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCategoryTypes(e.detail);
      }
    };
    const handleDigitalUpdated = (e: any) => {
      if (typeof e.detail?.enabled === 'boolean') {
        setIsEnabled(e.detail.enabled);
      }
    };
    window.addEventListener('lifeos_category_types_updated', handleTypesUpdated);
    window.addEventListener('lifeos_digital_wellbeing_updated', handleDigitalUpdated);
    return () => {
      window.removeEventListener('lifeos_category_types_updated', handleTypesUpdated);
      window.removeEventListener('lifeos_digital_wellbeing_updated', handleDigitalUpdated);
    };
  }, []);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(minutesSpent, 10);
    if (isNaN(mins) || mins <= 0) return;

    try {
      await api.screentime.createLog({
        category: selectedCategory,
        minutes_spent: mins,
        app_name: appName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setIsLogModalOpen(false);
      setAppName('');
      setNotes('');
      setMinutesSpent('30');
      loadData();
      window.dispatchEvent(new CustomEvent('lifeos_screentime_updated'));
    } catch (err) {
      console.error('Failed to create screen time log:', err);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;
    try {
      await api.screentime.deleteLog(id);
      loadData();
      window.dispatchEvent(new CustomEvent('lifeos_screentime_updated'));
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  // Open modal for editing a category
  const handleOpenEditCategory = (cat: ScreenTimeLimit) => {
    setEditingCategory(cat);
    setCatCode(cat.category);
    setCatLabel(cat.label || cat.category);
    setCatType(cat.category_type || 'DISTRACTION');
    setCatLimit(String(cat.daily_limit_minutes));
    setCatDesc(cat.description || '');
    setIsCategoryModalOpen(true);
  };

  // Open modal for adding a new category
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCatCode('');
    setCatLabel('');
    setCatType('DISTRACTION');
    setCatLimit('60');
    setCatDesc('');
    setIsCategoryModalOpen(true);
  };

  // Save (Create or Update) Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitMins = parseInt(catLimit, 10);
    if (isNaN(limitMins) || limitMins < 0) return;

    try {
      if (editingCategory) {
        await api.screentime.updateLimit(editingCategory.id, {
          label: catLabel.trim() || editingCategory.category,
          category_type: catType,
          daily_limit_minutes: limitMins,
          description: catDesc.trim() || null,
        });
      } else {
        const code = catCode.trim()
          ? catCode.trim().toUpperCase().replace(/\s+/g, '_')
          : catLabel.trim().toUpperCase().replace(/\s+/g, '_');
        await api.screentime.createCategory({
          category: code,
          label: catLabel.trim() || code,
          category_type: catType,
          daily_limit_minutes: limitMins,
          description: catDesc.trim() || undefined,
        });
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      alert(`Lỗi khi lưu danh mục: ${err.message || err}`);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này? Các giới hạn liên quan sẽ bị gỡ bỏ.')) return;
    try {
      await api.screentime.deleteCategory(id);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      alert(`Lỗi xóa danh mục: ${err.message || err}`);
    }
  };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) {
      return `${h}h ${m > 0 ? `${m}p` : ''}`;
    }
    return `${m} phút`;
  };

  if (loading && !overview) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Đang tải dữ liệu Quản lý thời gian sức khoẻ kỹ thuật số...
      </div>
    );
  }

  const today = overview?.today;
  const rating = today?.rating ?? 10.0;

  const getRatingColor = (r: number) => {
    if (r >= 9.0) return 'text-emerald-500 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40';
    if (r >= 7.5) return 'text-neutral-900 dark:text-neutral-100 border-neutral-400 bg-neutral-100 dark:bg-neutral-800';
    if (r >= 5.0) return 'text-amber-500 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-950/40';
    return 'text-rose-500 dark:text-rose-400 border-rose-500/30 bg-rose-50 dark:bg-rose-950/40';
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
            <span>Cân bằng kỹ thuật số</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý và chỉnh sửa danh mục, kiểm soát thời gian sử dụng thiết bị và rèn luyện tính tự giác.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* ON / OFF Switch */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Trạng thái:
            </span>
            <button
              type="button"
              onClick={handleToggleClick}
              disabled={isToggling}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:ring-offset-2 ${
                isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title={isEnabled ? 'Bấm để tắt tính năng (Lưu ý: sẽ reset toàn bộ dữ liệu sức khoẻ)' : 'Bấm để bật lại tính năng'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <Badge
              variant={isEnabled ? 'success' : 'secondary'}
              className="text-[10px] py-0.5 px-2 font-bold uppercase tracking-wider"
            >
              {isEnabled ? 'Đang bật (ON)' : 'Đang tắt (OFF)'}
            </Badge>
          </div>

          {isEnabled && (
            <>
              <Button variant="outline" onClick={handleOpenNewCategory}>
                <FolderPlus className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                <span>Chỉnh sửa / Thêm danh mục</span>
              </Button>
              <Button variant="primary" onClick={() => setIsLogModalOpen(true)}>
                <Plus className="w-4 h-4" />
                <span>Ghi nhận thời gian</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {!isEnabled ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 rounded-3xl p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto my-6 space-y-5 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-inner">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Quản lý Sức khoẻ Kỹ thuật số hiện đang TẮT
              </h3>
              <Badge variant="secondary" className="border border-dashed border-slate-400 dark:border-slate-600 text-slate-500 font-mono text-[10px]">
                TẠM DỪNG
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
              Tính năng theo dõi thời gian sử dụng màn hình và chấm điểm kỷ luật đã được tắt.
            </p>
          </div>

          <div className="p-3.5 bg-slate-100/90 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-600 dark:text-slate-300 text-left space-y-1.5 w-full max-w-md">
            <span className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              Chỉ báo trạng thái trực quan:
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Chỉ số <strong>Kỷ luật / Nhất quán trên thanh Topbar</strong> và thẻ <strong>Cân bằng số trong Weekly Report</strong> đang hiển thị <span className="underline decoration-dashed font-semibold">màu xám với viền nét đứt</span> thể hiện tính năng đang tạm dừng.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => executeToggle(true)}
            disabled={isToggling}
            className="gap-2 px-6 shadow-sm"
          >
            <Power className="w-4 h-4 text-emerald-300" />
            <span>{isToggling ? 'Đang kích hoạt...' : 'Bật lại Quản lý Sức khoẻ Kỹ thuật số'}</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Hero: Multi-day Statistical Consistency Index (Đồng bộ 100% với Topbar) */}
          {headerSummary?.consistency && (() => {
            const cons = headerSummary.consistency;
            const metrics = cons.metrics;
            return (
              <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-white via-indigo-50/20 to-sky-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/30 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          Chỉ số Nhất quán & Thực thi (14 ngày trượt)
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40">
                          Đồng bộ Topbar
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Thống kê đa biến: Đo lường tiến độ hoàn thành nhiệm vụ, phương sai thói quen và bảo lưu điểm hoãn bất khả kháng.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5 self-start sm:self-auto shrink-0">
                    <span className="text-3xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
                      {cons.score.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/ 10.0</span>
                    <Badge variant="secondary" className="text-xs font-bold ml-1.5">
                      {cons.tier_label}
                    </Badge>
                  </div>
                </div>

                {metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-750">
                      <span className="text-[10px] text-slate-400 block font-medium">Điểm Trung bình (μ)</span>
                      <strong className="text-sm font-mono text-slate-900 dark:text-slate-100">{metrics.mean}/10</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-750">
                      <span className="text-[10px] text-slate-400 block font-medium">Độ ổn định thói quen</span>
                      <strong className="text-sm font-mono text-emerald-600 dark:text-emerald-400">{metrics.stability_pct}% (σ={metrics.std_dev})</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-750">
                      <span className="text-[10px] text-slate-400 block font-medium">Bảo lưu Bất khả kháng</span>
                      <strong className="text-sm font-mono text-blue-600 dark:text-blue-400">{metrics.force_majeure_count} ca (85% điểm)</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-750">
                      <span className="text-[10px] text-slate-400 block font-medium">Trì hoãn chủ quan</span>
                      <strong className="text-sm font-mono text-amber-600 dark:text-amber-400">{metrics.unexcused_delay_count} ca</strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 1. Rating & Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rating Card */}
        <div className={`border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xs ${getRatingColor(rating)}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Rating Kỷ luật hôm nay
              </span>
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight">
                {rating.toFixed(1)}
              </span>
              <span className="text-sm font-semibold opacity-75">
                / 10.0
              </span>
            </div>

            <div className="mt-2">
              <Badge variant={rating >= 7.5 ? 'success' : rating >= 5.0 ? 'warning' : 'destructive'} className="font-semibold text-xs">
                {today?.rating_label_vi || 'Kỷ luật tuyệt đối'}
              </Badge>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-current/20 text-[11px] opacity-90 leading-tight">
            Khởi điểm 10.0. Trừ điểm khi vượt định mức xao nhãng; cộng điểm thưởng khi tập trung học tập.
          </div>
        </div>

        {/* Productive Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Học tập & Làm việc (Tập trung)
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="mt-3 flex items-baseline gap-2 text-slate-900 dark:text-slate-100">
              <span className="text-3xl font-extrabold">
                {formatMins(today?.study_work_minutes || 0)}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Thời gian tập trung sâu hôm nay
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            {today && today.study_work_minutes >= 120 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhận thưởng kỷ luật (+0.5 rating)
              </span>
            ) : (
              <span>Cần tối thiểu 2 giờ học tập để nhận điểm thưởng</span>
            )}
          </div>
        </div>

        {/* Distraction Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Xao nhãng & Giải trí
              </span>
              <Clock className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            </div>

            <div className="mt-3 flex items-baseline gap-2 text-slate-900 dark:text-slate-100">
              <span className="text-3xl font-extrabold">
                {formatMins(today?.entertainment_social_minutes || 0)}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tổng thời lượng mạng xã hội, game, phim
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {today && today.violations_count > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {today.violations_count} danh mục vượt định mức!
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Các danh mục trong tầm kiểm soát
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Category Limits & Gauges (With Inline Edit Button) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <Layers className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <span>Tiến độ theo Danh mục ({overview?.limits.length || 0} danh mục)</span>
          </div>

          <Button variant="outline" size="sm" onClick={handleOpenNewCategory}>
            <Settings2 className="w-3.5 h-3.5" />
            <span>Quản lý danh mục</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {today?.categories.map((cat) => {
            const isViolated = cat.status === 'VIOLATED';
            const isWarning = cat.status === 'WARNING';
            const pct = Math.min(100, cat.percentage);
            const limObj = overview?.limits.find(l => l.category === cat.category);

            return (
              <div
                key={cat.category}
                className={`p-4 rounded-xl border transition-all ${
                  isViolated
                    ? 'border-rose-300 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-300 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20'
                    : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {cat.category_label}
                    </span>
                    {(() => {
                      const typeCfg = getCategoryTypeConfig(cat.category_type, categoryTypes);
                      return (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border"
                          style={{
                            backgroundColor: `${typeCfg.color || '#64748b'}18`,
                            color: typeCfg.color || '#64748b',
                            borderColor: `${typeCfg.color || '#64748b'}40`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: typeCfg.color || '#64748b' }}
                          />
                          {typeCfg.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={isViolated ? 'destructive' : isWarning ? 'warning' : 'secondary'}
                      className="text-[10px]"
                    >
                      {isViolated
                        ? `Vượt +${cat.exceeded_minutes}p`
                        : isWarning
                        ? 'Sắp chạm ngưỡng'
                        : 'An toàn'}
                    </Badge>
                    {limObj && (
                      <button
                        onClick={() => handleOpenEditCategory(limObj)}
                        className="text-slate-400 hover:text-neutral-900 dark:hover:text-neutral-100 p-1 transition"
                        title="Chỉnh sửa danh mục này"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-mono">
                  <span>Đã dùng: {formatMins(cat.minutes_spent)}</span>
                  <span>Định mức: {cat.daily_limit_minutes > 0 ? formatMins(cat.daily_limit_minutes) : 'Không giới hạn'}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isViolated
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : cat.category_type === 'PRODUCTIVE'
                        ? 'bg-emerald-500'
                        : 'bg-neutral-900 dark:bg-neutral-100'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 7-Day Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Khuynh hướng kỷ luật 7 ngày gần nhất</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Rating trung bình 7 ngày: <strong className="text-neutral-900 dark:text-neutral-100">{overview?.average_rating_7d.toFixed(1)}/10.0</strong>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {overview?.weekly_trend.map((day) => {
            const isToday = day.date === today?.date;
            return (
              <div
                key={day.date}
                className={`p-2.5 rounded-lg border text-center flex flex-col justify-between items-center transition ${
                  isToday
                    ? 'border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-800'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20'
                }`}
              >
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {day.day_name_vi}
                </span>

                <div className="my-2">
                  <span className={`text-sm font-bold ${
                    day.rating >= 9.0
                      ? 'text-emerald-500'
                      : day.rating >= 7.5
                      ? 'text-neutral-900 dark:text-neutral-100'
                      : day.rating >= 5.0
                      ? 'text-amber-500'
                      : 'text-rose-500'
                  }`}>
                    {day.rating.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">rating</span>
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 w-full">
                  <div className="truncate text-emerald-600 dark:text-emerald-400 font-medium" title={`Tập trung: ${formatMins(day.study_work_minutes)}`}>
                    H: {Math.round(day.study_work_minutes / 60 * 10) / 10}h
                  </div>
                  <div className="truncate text-neutral-600 dark:text-neutral-300 font-medium" title={`Giải trí: ${formatMins(day.entertainment_social_minutes)}`}>
                    G: {Math.round(day.entertainment_social_minutes / 60 * 10) / 10}h
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Today's Activity Logs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <span>Nhật ký thời gian hôm nay ({today?.logs.length || 0})</span>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsLogModalOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm bản ghi</span>
          </Button>
        </div>

        {today?.logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Chưa có ghi nhận thời gian màn hình nào hôm nay. Nhấn "+ Ghi nhận thời gian" để thêm.
          </div>
        ) : (
          <div className="space-y-2">
            {today?.logs.map((log) => {
              const matchedLimit = overview?.limits.find(l => l.category === log.category);
              const label = matchedLimit?.label || log.category;

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {label}
                    </Badge>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.app_name || 'Ứng dụng / Hoạt động'}
                      </span>
                      {log.notes && (
                        <span className="text-slate-400 dark:text-slate-500 block text-[11px]">
                          {log.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {formatMins(log.minutes_spent)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-slate-400 hover:text-rose-500"
                      title="Xóa bản ghi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* Modal: Quick Log Screen Time */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
              <span>Ghi nhận thời gian sử dụng</span>
            </h3>

            <form onSubmit={handleCreateLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Danh mục
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                >
                  {overview?.limits.map((l) => {
                    const typeCfg = getCategoryTypeConfig(l.category_type, categoryTypes);
                    return (
                      <option key={l.category} value={l.category}>
                        {l.label || l.category} ({typeCfg.label})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Thời lượng sử dụng (Phút)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={minutesSpent}
                  onChange={(e) => setMinutesSpent(e.target.value)}
                  placeholder="Ví dụ: 45"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tên ứng dụng / Website (Tùy chọn)
                </label>
                <Input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Ví dụ: YouTube, VS Code, Facebook"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Ghi chú tự phản tư (Tùy chọn)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mục đích dùng hoặc cảm nhận sau khi dùng..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsLogModalOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary">
                  Lưu bản ghi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage & Edit Categories */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                <span>{editingCategory ? 'Chỉnh sửa Danh mục' : 'Quản lý & Thêm Danh mục'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Form */}
            <form onSubmit={handleSaveCategory} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {editingCategory ? `Đang sửa: ${editingCategory.label || editingCategory.category}` : 'Thêm Danh mục Mới'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tên hiển thị (Label) *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="VD: Mạng xã hội, Chơi Game"
                    value={catLabel}
                    onChange={(e) => setCatLabel(e.target.value)}
                  />
                </div>

                {!editingCategory && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Mã danh mục (Code/Slug)
                    </label>
                    <Input
                      type="text"
                      placeholder="VD: GAMING, TIKTOK"
                      value={catCode}
                      onChange={(e) => setCatCode(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Phân loại (Type) *
                  </label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100"
                  >
                    {categoryTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} ({t.effect === 'BONUS' ? 'Thưởng kỷ luật' : t.effect === 'PENALTY' ? 'Trừ điểm nếu vượt' : 'Trung tính'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Định mức hàng ngày (Phút) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    required
                    value={catLimit}
                    onChange={(e) => setCatLimit(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Mô tả danh mục (Tùy chọn)
                </label>
                <Input
                  type="text"
                  placeholder="Ghi chú ứng dụng hoặc quy định..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingCategory && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(null);
                      setCatCode('');
                      setCatLabel('');
                      setCatLimit('60');
                      setCatDesc('');
                    }}
                  >
                    Hủy sửa
                  </Button>
                )}
                <Button type="submit" variant="primary" size="sm">
                  {editingCategory ? 'Lưu thay đổi' : '+ Tạo danh mục'}
                </Button>
              </div>
            </form>

            {/* List of existing categories */}
            <div className="space-y-2 pt-2">
              <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 block">
                Danh mục hiện có ({overview?.limits.length || 0}):
              </span>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {overview?.limits.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {l.label || l.category}
                        </span>
                        {(() => {
                          const typeCfg = getCategoryTypeConfig(l.category_type, categoryTypes);
                          return (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border"
                              style={{
                                backgroundColor: `${typeCfg.color || '#64748b'}18`,
                                color: typeCfg.color || '#64748b',
                                borderColor: `${typeCfg.color || '#64748b'}40`,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: typeCfg.color || '#64748b' }}
                              />
                              {typeCfg.label}
                            </span>
                          );
                        })()}
                      </div>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Định mức: {l.daily_limit_minutes} phút {l.description ? `• ${l.description}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditCategory(l)}
                        title="Chỉnh sửa danh mục"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-neutral-900 dark:text-neutral-100" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(l.id)}
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận Tắt & Reset Dữ liệu */}
      {isConfirmToggleModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-300 dark:border-rose-900 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Xác nhận Tắt & Reset Dữ liệu</span>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-700 dark:text-rose-300 space-y-2">
              <p className="font-semibold text-rose-800 dark:text-rose-200">
                Cảnh báo: Toàn bộ data CỦA PHẦN QUẢN LÝ SỨC KHOẺ KỸ THUẬT SỐ sẽ bị XÓA SẠCH!
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-600 dark:text-rose-400">
                <li>Xóa toàn bộ nhật ký ghi nhận thời gian sử dụng hôm nay và quá khứ.</li>
                <li>Xóa lịch sử vi phạm và khuynh hướng đánh giá 7 ngày.</li>
                <li>Đặt lại danh mục và phân loại về thiết lập ban đầu.</li>
              </ul>
              <p className="text-[11px] pt-1 text-slate-600 dark:text-slate-400 border-t border-rose-200/60 dark:border-rose-900/60">
                Lưu ý: Các dữ liệu khác như <strong>Nhiệm vụ, Khóa học, Lịch trình, Mục tiêu... hoàn toàn KHÔNG bị ảnh hưởng</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmToggleModalOpen(false)}
                disabled={isToggling}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                onClick={() => executeToggle(false)}
                disabled={isToggling}
                className="gap-1.5"
              >
                <PowerOff className="w-4 h-4" />
                <span>{isToggling ? 'Đang đặt lại...' : 'Xác nhận Tắt & Reset'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
