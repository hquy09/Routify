import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Calendar as CalendarIcon, Clock, Pin, Palette, LayoutGrid,
  AlignLeft, AlignCenter, AlignRight, Sparkles, RotateCw, RotateCcw,
  Square, Circle, Check
} from 'lucide-react';
import { CountdownItem, CountdownCategory, CountdownCoverConfig } from '../../types';
import { Button } from '../ui/button';
import { toLocalDateString, formatDatetimeForBackend, parseBackendDatetimeToLocalInput } from '../../utils/dateUtils';
import { isLightColor, getReadableColorOnLight } from '../../utils/colorUtils';

interface CountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CountdownItem>) => Promise<void>;
  countdownToEdit?: CountdownItem | null;
}

const CATEGORY_OPTIONS: { value: CountdownCategory; label: string; defaultIcon: string }[] = [
  { value: 'EXAM', label: '🎓 Ngày thi', defaultIcon: '🎓' },
  { value: 'GOAL', label: '🎯 Mục tiêu', defaultIcon: '🎯' },
  { value: 'EVENT', label: '📅 Sự kiện', defaultIcon: '📅' },
  { value: 'OTHER', label: '⚡ Khác', defaultIcon: '⭐' },
];

const EMOJI_SUGGESTIONS = ['🎓', '🎯', '📅', '🏆', '⭐', '📖', '💻', '✈️', '💼', '🚀', '🔥', '⏰'];

const COLOR_PRESETS = [
  { value: '#000000', label: 'Đen Onyx' },
  { value: '#2563eb', label: 'Xanh Royal' },
  { value: '#059669', label: 'Xanh Lục Bảo' },
  { value: '#e11d48', label: 'Đỏ Crimson' },
  { value: '#d97706', label: 'Vàng Amber' },
  { value: '#7c3aed', label: 'Tím Violet' },
  { value: '#0891b2', label: 'Xanh Lam Ngọc' },
  { value: '#ea580c', label: 'Cam Rực Rỡ' },
  { value: '#4f46e5', label: 'Tím Chàm' },
];

const GRADIENT_PRESETS = [
  { name: 'Hoàng Hôn', c1: '#f43f5e', c2: '#f59e0b' },
  { name: 'Cyber Neon', c1: '#6366f1', c2: '#a855f7' },
  { name: 'Lục Bảo', c1: '#059669', c2: '#10b981' },
  { name: 'Đại Dương', c1: '#06b6d4', c2: '#3b82f6' },
  { name: 'Bóng Đêm', c1: '#1e1b4b', c2: '#4338ca' },
  { name: 'Hồng Đỏ', c1: '#e11d48', c2: '#be123c' },
];

const COVER_STYLES: { value: 'DEFAULT' | 'FONTY' | 'SWISS' | 'GRID' | 'MINIMAL'; label: string; desc: string; icon: string }[] = [
  { value: 'DEFAULT', label: 'Cơ bản', desc: 'Thẻ thanh lịch chuẩn', icon: '🏷️' },
  { value: 'FONTY', label: 'Fonty Typo', desc: 'Đổ 2 màu Gradient & Typo nghệ thuật', icon: '🎨' },
  { value: 'SWISS', label: 'Swiss Style', desc: 'Vòng cung Thụy Sĩ thuận/ngược kim', icon: '⏱️' },
  { value: 'GRID', label: 'Grid Ma trận', desc: 'Lưới ô vuông/tròn tô kín hoặc viền', icon: '▦' },
  { value: 'MINIMAL', label: 'Tối giản', desc: 'Cực gọn, tập trung trọng tâm', icon: '➖' },
];

export const CountdownModal: React.FC<CountdownModalProps> = ({
  isOpen,
  onClose,
  onSave,
  countdownToEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'COVER'>('INFO');

  // Basic Info States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CountdownCategory>('EXAM');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('08:00');
  const [icon, setIcon] = useState('🎓');
  const [color, setColor] = useState('#000000');
  const [notes, setNotes] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cover Customization States
  const [coverStyle, setCoverStyle] = useState<'DEFAULT' | 'FONTY' | 'SWISS' | 'GRID' | 'MINIMAL'>('DEFAULT');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const [detailMode, setDetailMode] = useState<'SIMPLE' | 'DETAILED'>('SIMPLE');
  const [gradientColor1, setGradientColor1] = useState('#4f46e5');
  const [gradientColor2, setGradientColor2] = useState('#ec4899');
  const [swissDirection, setSwissDirection] = useState<'CLOCKWISE' | 'COUNTER_CLOCKWISE'>('CLOCKWISE');
  const [gridShape, setGridShape] = useState<'SQUARE' | 'CIRCLE'>('CIRCLE');
  const [gridFill, setGridFill] = useState<'FILLED' | 'OUTLINE'>('FILLED');
  const [gridColor, setGridColor] = useState('#3b82f6');

  useEffect(() => {
    if (!isOpen) return;

    if (countdownToEdit) {
      setTitle(countdownToEdit.title || '');
      setCategory(countdownToEdit.category || 'EXAM');
      setIcon(countdownToEdit.icon || '🎓');
      setColor(countdownToEdit.color || '#000000');
      setNotes(countdownToEdit.notes || '');
      setIsPinned(Boolean(countdownToEdit.is_pinned));

      if (countdownToEdit.target_date) {
        const localInput = parseBackendDatetimeToLocalInput(countdownToEdit.target_date);
        if (localInput.length >= 10) {
          setTargetDate(localInput.slice(0, 10));
        }
        if (localInput.length >= 16) {
          setTargetTime(localInput.slice(11, 16));
        } else {
          setTargetTime('08:00');
        }
      }

      // Load cover style
      setCoverStyle((countdownToEdit.cover_style as any) || 'DEFAULT');

      // Initialize cover config defaults first
      setAlign('left');
      setDetailMode('SIMPLE');
      setGradientColor1('#4f46e5');
      setGradientColor2('#ec4899');
      setSwissDirection('CLOCKWISE');
      setGridShape('CIRCLE');
      setGridFill('FILLED');
      setGridColor(countdownToEdit.color && countdownToEdit.color.startsWith('#') ? countdownToEdit.color : '#3b82f6');

      // Load cover config if present
      if (countdownToEdit.cover_config) {
        try {
          const cfg: CountdownCoverConfig = typeof countdownToEdit.cover_config === 'string'
            ? JSON.parse(countdownToEdit.cover_config)
            : countdownToEdit.cover_config;

          if (cfg.align) setAlign(cfg.align);
          if (cfg.detail_mode) setDetailMode(cfg.detail_mode);
          if (cfg.gradient_color1) setGradientColor1(cfg.gradient_color1);
          if (cfg.gradient_color2) setGradientColor2(cfg.gradient_color2);
          if (cfg.swiss_direction) setSwissDirection(cfg.swiss_direction);
          if (cfg.grid_shape) setGridShape(cfg.grid_shape);
          if (cfg.grid_fill) setGridFill(cfg.grid_fill);
          if (cfg.grid_color) setGridColor(cfg.grid_color);
        } catch (e) {
          console.error('Failed to parse cover_config:', e);
        }
      }
    } else {
      // Default: 30 days from now, 08:00
      const future = new Date();
      future.setDate(future.getDate() + 30);
      setTitle('');
      setCategory('EXAM');
      setIcon('🎓');
      setColor('#000000');
      setTargetDate(toLocalDateString(future));
      setTargetTime('08:00');
      setNotes('');
      setIsPinned(false);

      // Default Cover Config
      setCoverStyle('DEFAULT');
      setAlign('left');
      setDetailMode('SIMPLE');
      setGradientColor1('#4f46e5');
      setGradientColor2('#ec4899');
      setSwissDirection('CLOCKWISE');
      setGridShape('CIRCLE');
      setGridFill('FILLED');
      setGridColor('#3b82f6');
    }
    setActiveTab('INFO');
  }, [isOpen, countdownToEdit?.id]);

  // Rough calculation for live preview days remaining (Must be before any early return)
  const previewDaysLeft = useMemo(() => {
    if (!targetDate) return 30;
    const diff = new Date(`${targetDate}T${targetTime || '08:00'}`).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [targetDate, targetTime]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat: CountdownCategory) => {
    setCategory(cat);
    const opt = CATEGORY_OPTIONS.find((c) => c.value === cat);
    if (opt && (!icon || EMOJI_SUGGESTIONS.includes(icon))) {
      setIcon(opt.defaultIcon);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    const timePart = targetTime.trim() || '08:00';
    const localDatetimeStr = `${targetDate}T${timePart}`;
    const safeTarget = formatDatetimeForBackend(localDatetimeStr);

    const coverConfigObj: CountdownCoverConfig = {
      align,
      detail_mode: detailMode,
      gradient_color1: gradientColor1,
      gradient_color2: gradientColor2,
      swiss_direction: swissDirection,
      grid_shape: gridShape,
      grid_fill: gridFill,
      grid_color: gridColor,
    };

    const data: Partial<CountdownItem> = {
      title: title.trim(),
      category,
      target_date: safeTarget,
      icon: icon || '🎓',
      color,
      cover_style: coverStyle,
      cover_config: JSON.stringify(coverConfigObj),
      notes: notes.trim() || null,
      is_pinned: isPinned,
    };

    setIsSubmitting(true);
    try {
      await onSave(data);
      onClose();
    } catch (err: any) {
      console.error('Failed to save countdown:', err);
      alert('Lỗi khi lưu đếm ngược: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl my-8 transition-all max-h-[92vh] overflow-y-auto scrollbar-thin flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-tight">
                  {countdownToEdit ? 'Chỉnh sửa Đếm ngược & Bìa' : 'Thêm Sự kiện / Ngày thi mới'}
                </h3>
                <p className="text-[11px] text-neutral-500">Tùy biến bìa, màu sắc đổ bóng và phong cách hiển thị</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-3 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('INFO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'INFO'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              📋 1. Thông tin cơ bản
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COVER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'COVER'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>🎨 2. Cover Studio (Thiết kế bìa & Hiển thị)</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} id="countdown-form" className="space-y-4 mt-4 text-xs">
            {/* TAB 1: BASIC INFORMATION */}
            {activeTab === 'INFO' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Title */}
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Tiêu đề sự kiện / Ngày thi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Kỳ thi THPT Quốc Gia 2027, Thi IELTS 7.5..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                  />
                </div>

                {/* Category tabs */}
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Phân loại
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleCategoryChange(opt.value)}
                        className={`py-1.5 px-2 rounded-lg font-medium text-xs border transition text-center ${
                          category === opt.value
                            ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 font-bold shadow-2xs'
                            : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Date & Time */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                      <span>Ngày diễn ra</span> <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                      <span>Giờ diễn ra</span>
                    </label>
                    <input
                      type="time"
                      value={targetTime}
                      onChange={(e) => setTargetTime(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                    />
                  </div>
                </div>

                {/* Icon / Emoji Selection */}
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Biểu tượng đại diện
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {EMOJI_SUGGESTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center text-sm transition ${
                          icon === emoji
                            ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white shadow-xs'
                            : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <input
                      type="text"
                      maxLength={4}
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      placeholder="Tự nhập"
                      className="w-16 bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs text-center text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                    />
                  </div>
                </div>

                {/* Theme Color Palette */}
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                    <span>Màu chủ đạo sự kiện</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap p-2 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setColor(p.value)}
                        className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${
                          color === p.value
                            ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white scale-110'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: p.value }}
                        title={p.label}
                      >
                        {color === p.value && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-neutral-200 dark:border-neutral-700">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0.5 bg-transparent"
                      />
                      <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 uppercase">{color}</span>
                    </div>
                  </div>
                </div>

                {/* Notes / Details */}
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Ghi chú thêm (Địa điểm thi, phòng thi, số báo danh, yêu cầu...)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Phòng thi 302, mang theo CCCD và máy tính..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white resize-none"
                  />
                </div>

                {/* Pinned toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/50">
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                        Ghim lên vị trí nổi bật
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Hiển thị khối to ở đầu trang Lịch biểu & Tổng quan
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: COVER STUDIO */}
            {activeTab === 'COVER' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 1. Cover Style Selector */}
                <div>
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                    Kiểu bìa hiển thị (Cover Style)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COVER_STYLES.map((st) => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => setCoverStyle(st.value)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          coverStyle === st.value
                            ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900 shadow-sm'
                            : 'bg-neutral-50 dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base">{st.icon}</span>
                          <span className={`w-2 h-2 rounded-full ${coverStyle === st.value ? 'bg-amber-400' : 'bg-transparent'}`} />
                        </div>
                        <div className="mt-1.5">
                          <div className="font-bold text-xs">{st.label}</div>
                          <div className={`text-[10px] mt-0.5 line-clamp-1 ${coverStyle === st.value ? 'opacity-80' : 'text-neutral-400'}`}>
                            {st.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Text Alignment & Detail Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Text Alignment */}
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                      Căn lề chữ (Alignment)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <button
                        type="button"
                        onClick={() => setAlign('left')}
                        className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition ${
                          align === 'left'
                            ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>Trái</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlign('center')}
                        className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition ${
                          align === 'center'
                            ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                        <span>Giữa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlign('right')}
                        className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition ${
                          align === 'right'
                            ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                        <span>Phải</span>
                      </button>
                    </div>
                  </div>

                  {/* Detail Mode */}
                  <div>
                    <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                      Chế độ hiển thị đếm ngược
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <button
                        type="button"
                        onClick={() => setDetailMode('SIMPLE')}
                        className={`py-1.5 rounded-md text-xs font-semibold transition text-center ${
                          detailMode === 'SIMPLE'
                            ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        Đơn giản (Ngày to)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailMode('DETAILED')}
                        className={`py-1.5 rounded-md text-xs font-semibold transition text-center ${
                          detailMode === 'DETAILED'
                            ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                        }`}
                      >
                        Chi tiết (D:H:M:S)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Style Specific Controls */}
                {/* 3A. FONTY GRADIENT CONTROLS */}
                {coverStyle === 'FONTY' && (
                  <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Tùy chỉnh màu sắc dải chuyển (Gradient)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Màu bắt đầu (Màu 1)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={gradientColor1}
                            onChange={(e) => setGradientColor1(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0.5 bg-transparent"
                          />
                          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 uppercase">
                            {gradientColor1}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Màu kết thúc (Màu 2)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={gradientColor2}
                            onChange={(e) => setGradientColor2(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0.5 bg-transparent"
                          />
                          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 uppercase">
                            {gradientColor2}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gradient presets */}
                    <div>
                      <span className="block text-[10px] text-neutral-500 mb-1 font-semibold uppercase">
                        Bảng màu gợi ý nhanh:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {GRADIENT_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => {
                              setGradientColor1(p.c1);
                              setGradientColor2(p.c2);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[10px] font-semibold transition hover:scale-102"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full shadow-2xs"
                              style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}
                            />
                            <span>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3B. SWISS CONTROLS (Direction) */}
                {coverStyle === 'SWISS' && (
                  <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/30 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Hướng chạy vòng cung tiến độ</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSwissDirection('CLOCKWISE')}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          swissDirection === 'CLOCKWISE'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>↻ Thuận kim đồng hồ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSwissDirection('COUNTER_CLOCKWISE')}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                          swissDirection === 'COUNTER_CLOCKWISE'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>↺ Ngược kim đồng hồ</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3C. GRID MATRIX CONTROLS */}
                {coverStyle === 'GRID' && (
                  <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/30 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      <LayoutGrid className="w-4 h-4 text-emerald-600" />
                      <span>Cấu hình ma trận lưới</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Shape */}
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Hình dáng ô
                        </label>
                        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                          <button
                            type="button"
                            onClick={() => setGridShape('SQUARE')}
                            className={`py-1 rounded text-xs font-semibold flex items-center justify-center gap-1 transition ${
                              gridShape === 'SQUARE'
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-500'
                            }`}
                          >
                            <Square className="w-3 h-3" />
                            <span>Vuông</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGridShape('CIRCLE')}
                            className={`py-1 rounded text-xs font-semibold flex items-center justify-center gap-1 transition ${
                              gridShape === 'CIRCLE'
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-500'
                            }`}
                          >
                            <Circle className="w-3 h-3" />
                            <span>Tròn</span>
                          </button>
                        </div>
                      </div>

                      {/* Fill Style */}
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Kiểu ô
                        </label>
                        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                          <button
                            type="button"
                            onClick={() => setGridFill('FILLED')}
                            className={`py-1 rounded text-xs font-semibold transition text-center ${
                              gridFill === 'FILLED'
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-500'
                            }`}
                          >
                            Bọc đầy
                          </button>
                          <button
                            type="button"
                            onClick={() => setGridFill('OUTLINE')}
                            className={`py-1 rounded text-xs font-semibold transition text-center ${
                              gridFill === 'OUTLINE'
                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                                : 'text-neutral-500'
                            }`}
                          >
                            Mỗi viền
                          </button>
                        </div>
                      </div>

                      {/* Grid Color */}
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Màu ô lưới
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={gridColor}
                            onChange={(e) => setGridColor(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0.5 bg-transparent"
                          />
                          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 uppercase">
                            {gridColor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3D. DEFAULT & MINIMAL THEME COLOR CONTROLS */}
                {(coverStyle === 'DEFAULT' || coverStyle === 'MINIMAL') && (
                  <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-850/60 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      <Palette className="w-4 h-4 text-amber-500" />
                      <span>Màu chủ đạo thẻ</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setColor(p.value)}
                          className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${
                            color === p.value
                              ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white scale-110 shadow-xs'
                              : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: p.value }}
                          title={p.label}
                        >
                          {color === p.value && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                        </button>
                      ))}
                      <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-neutral-200 dark:border-neutral-700">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-7 h-7 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0.5 bg-transparent"
                        />
                        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 uppercase">{color}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. LIVE PREVIEW CARD */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                      👁️ Xem trước Thẻ Bìa (Live Preview):
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Kiểu: {coverStyle} • Lề: {align} • Chế độ: {detailMode}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 shadow-sm relative overflow-hidden transition-all flex flex-col justify-between ${
                      coverStyle === 'FONTY'
                        ? 'text-white border-transparent'
                        : coverStyle === 'SWISS'
                        ? 'bg-neutral-950 dark:bg-black text-white border-neutral-800'
                        : coverStyle === 'GRID'
                        ? 'bg-neutral-900 dark:bg-neutral-950 text-white border-neutral-800'
                        : coverStyle === 'MINIMAL'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800'
                        : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800'
                    } ${
                      isPinned
                        ? 'ring-2 ring-amber-400/60 shadow-md'
                        : ''
                    } ${
                      align === 'center'
                        ? 'text-center items-center'
                        : align === 'right'
                        ? 'text-right items-end'
                        : 'text-left items-start'
                    }`}
                    style={{
                      background: coverStyle === 'FONTY'
                        ? `linear-gradient(135deg, ${gradientColor1}, ${gradientColor2})`
                        : undefined,
                      borderColor: isPinned
                        ? 'rgba(251, 191, 36, 0.65)'
                        : coverStyle !== 'FONTY' && coverStyle !== 'SWISS' && coverStyle !== 'GRID' && color && color !== '#000000' && color !== '#171717'
                        ? `${color}50`
                        : undefined,
                      boxShadow: coverStyle === 'FONTY'
                        ? `0 8px 24px -6px ${gradientColor1}50`
                        : isPinned
                        ? '0 6px 20px -4px rgba(251, 191, 36, 0.25)'
                        : coverStyle !== 'SWISS' && coverStyle !== 'GRID' && color && color !== '#000000' && color !== '#171717'
                        ? `0 4px 16px -6px ${color}30`
                        : undefined,
                    }}
                  >
                    {/* Pinned Top Golden Accent Line */}
                    {isPinned && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 z-20 pointer-events-none" />
                    )}

                    {/* Ambient Glow for Default / Minimal if custom color */}
                    {coverStyle !== 'FONTY' && coverStyle !== 'SWISS' && coverStyle !== 'GRID' && color && color !== '#000000' && color !== '#171717' && (
                      <div
                        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-25"
                        style={{ backgroundColor: color }}
                      />
                    )}

                    {/* Header Row */}
                    <div className={`w-full flex items-center gap-2 mb-2 relative z-10 ${
                      align === 'center' ? 'justify-center text-center' : align === 'right' ? 'justify-end text-right' : 'justify-start text-left'
                    }`}>
                      <span className="text-2xl shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className={`flex items-center gap-1.5 flex-wrap ${
                          align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider opacity-80 block ${
                            align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                          }`}>
                            {category === 'EXAM' ? 'Ngày thi' : category === 'GOAL' ? 'Mục tiêu' : category === 'EVENT' ? 'Sự kiện' : 'Khác'}
                          </span>
                          {isPinned && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-neutral-950 border border-amber-300 shadow-2xs font-mono">
                              <Pin className="w-2.5 h-2.5 fill-neutral-950 text-neutral-950" />
                              <span>ĐÃ GHIM</span>
                            </span>
                          )}
                        </div>
                        <h4 className={`font-extrabold text-sm truncate leading-snug ${
                          coverStyle === 'FONTY' ? 'text-white' : ''
                        } ${
                          align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                        }`}>
                          {title || 'Tên sự kiện hoặc bài thi mẫu'}
                        </h4>
                      </div>
                    </div>

                    {/* Preview Content based on coverStyle */}
                    <div className={`w-full py-2 flex flex-col relative z-10 ${
                      align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'
                    }`}>
                      {/* STYLE 1: FONTY */}
                      {coverStyle === 'FONTY' && (
                        detailMode === 'SIMPLE' ? (
                          <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                            <div className={`text-5xl font-black tracking-tight font-mono drop-shadow-md leading-none py-1 ${
                              isLightColor(gradientColor1) && isLightColor(gradientColor2) ? 'text-neutral-950' : 'text-white'
                            }`}>
                              {previewDaysLeft}
                            </div>
                            <div className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${
                              isLightColor(gradientColor1) && isLightColor(gradientColor2) ? 'text-neutral-900/80' : 'text-white/90'
                            }`}>
                              NGÀY CÒN LẠI
                            </div>
                            <div className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full backdrop-blur-xs ${
                              isLightColor(gradientColor1) && isLightColor(gradientColor2) ? 'bg-black/10 text-neutral-950' : 'bg-white/20 text-white'
                            }`}>
                              <span>⏳ Còn: 99.8%</span>
                            </div>
                          </div>
                        ) : (
                          <div className={`flex flex-col gap-1.5 ${align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                            <div className={`flex items-center gap-1.5 font-mono font-black text-base ${
                              isLightColor(gradientColor1) && isLightColor(gradientColor2) ? 'text-neutral-950' : 'text-white'
                            }`}>
                              <span className={`px-2 py-1 rounded-md ${
                                isLightColor(gradientColor1) && isLightColor(gradientColor2) ? 'bg-black/10 text-neutral-950' : 'bg-white/20 text-white'
                              }`}>{previewDaysLeft}d</span>
                              <span>:</span>
                              <span className={`px-2 py-1 rounded-md ${
                                isLightColor(gradientColor1) && isLightColor(gradientColor2) ? 'bg-black/10 text-neutral-950' : 'bg-white/20 text-white'
                              }`}>08h</span>
                              <span>:</span>
                              <span className={`px-2 py-1 rounded-md ${
                                isLightColor(gradientColor1) && isLightColor(gradientColor2) ? 'bg-black/10 text-neutral-950' : 'bg-white/20 text-white'
                              }`}>00m</span>
                              <span>:</span>
                              <span className={`px-2 py-1 rounded-md ${
                                isLightColor(gradientColor1) && isLightColor(gradientColor2) ? 'bg-black/10 text-neutral-950' : 'bg-white/20 text-white'
                              }`}>00s</span>
                            </div>
                            <div className={`text-[10px] font-medium mt-0.5 ${
                              isLightColor(gradientColor1) && isLightColor(gradientColor2) ? 'text-neutral-800' : 'text-white/80'
                            }`}>
                              Đếm ngược chi tiết chính xác D:H:M:S
                            </div>
                          </div>
                        )
                      )}

                      {/* STYLE 2: SWISS */}
                      {coverStyle === 'SWISS' && (
                        <div className={`flex items-center gap-4 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
                          {/* Swiss Gauge SVG */}
                          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                            <svg
                              className={`w-14 h-14 transform ${
                                swissDirection === 'COUNTER_CLOCKWISE' ? '-rotate-90 scale-x-[-1]' : '-rotate-90'
                              }`}
                              viewBox="0 0 60 60"
                            >
                              <circle cx="30" cy="30" r="24" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                              <circle
                                cx="30"
                                cy="30"
                                r="24"
                                stroke="#ffffff"
                                strokeWidth="4"
                                strokeDasharray={150.8}
                                strokeDashoffset={45}
                                strokeLinecap="round"
                                fill="none"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-neutral-300">
                              {swissDirection === 'CLOCKWISE' ? '↻' : '↺'}
                            </div>
                          </div>

                          {/* Swiss Text */}
                          <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                            {detailMode === 'SIMPLE' ? (
                              <>
                                <div className="text-3xl font-black font-mono leading-tight">
                                  {previewDaysLeft}<span className="text-xs font-sans font-medium text-neutral-400 ml-1">ngày</span>
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-neutral-400 mt-0.5">
                                  {swissDirection === 'CLOCKWISE' ? '↻ Thuận chiều kim' : '↺ Ngược chiều kim'}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-mono text-sm font-bold">
                                  {previewDaysLeft}d 08h 00m 00s
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-neutral-400 mt-0.5">
                                  {swissDirection === 'CLOCKWISE' ? '↻ Swiss Thuận' : '↺ Swiss Ngược'}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* STYLE 3: GRID */}
                      {coverStyle === 'GRID' && (
                        <div className={`space-y-2 w-full flex flex-col ${align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                          {detailMode === 'SIMPLE' ? (
                            <div className="font-mono text-3xl font-black leading-tight">
                              {previewDaysLeft} <span className="text-xs font-sans font-normal opacity-70">ngày còn lại</span>
                            </div>
                          ) : (
                            <div className="font-mono text-sm font-bold">
                              {previewDaysLeft}d 08h 00m 00s
                            </div>
                          )}

                          {/* Matrix Dots */}
                          <div className={`flex gap-1.5 flex-wrap ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
                            {Array.from({ length: 16 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  gridShape === 'SQUARE' ? 'rounded-xs' : 'rounded-full'
                                } ${
                                  gridFill === 'OUTLINE' ? 'border-2 bg-transparent' : ''
                                }`}
                                style={{
                                  backgroundColor: gridFill === 'FILLED' ? gridColor : 'transparent',
                                  borderColor: gridColor,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] opacity-70 block font-mono">
                            Lưới {gridShape === 'SQUARE' ? 'ô vuông' : 'chấm tròn'} • {gridFill === 'FILLED' ? 'Tô đặc' : 'Mỗi viền'}
                          </span>
                        </div>
                      )}

                      {/* STYLE 4 & 5: MINIMAL & DEFAULT */}
                      {(coverStyle === 'DEFAULT' || coverStyle === 'MINIMAL') && (
                        <div className={`w-full flex flex-col ${align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                          {detailMode === 'SIMPLE' ? (
                            <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                              <div className="text-4xl font-black font-mono leading-tight">
                                {previewDaysLeft} <span className="text-sm font-sans font-medium text-neutral-500">ngày</span>
                              </div>
                              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mt-0.5">
                                Thời gian còn lại
                              </div>

                              {/* Progress bar for DEFAULT */}
                              {coverStyle === 'DEFAULT' && (
                                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-2 max-w-[180px]">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: '65%',
                                      backgroundColor: color && color !== '#000000' && color !== '#171717' ? color : '#171717',
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`space-y-1 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>
                              <div className={`flex items-center gap-1.5 font-mono font-bold text-sm ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                {(() => {
                                  const isCustom = color && color !== '#000000' && color !== '#171717';
                                  const isLight = isLightColor(color);
                                  const badgeStyle = isCustom ? {
                                    backgroundColor: `${color}18`,
                                    borderColor: `${color}45`,
                                    color: isLight ? getReadableColorOnLight(color) : color,
                                  } : undefined;

                                  return (
                                    <>
                                      <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 px-1.5 py-0.5 rounded" style={badgeStyle}>{previewDaysLeft}d</span>
                                      <span className="text-neutral-400">:</span>
                                      <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 px-1.5 py-0.5 rounded" style={badgeStyle}>08h</span>
                                      <span className="text-neutral-400">:</span>
                                      <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 px-1.5 py-0.5 rounded" style={badgeStyle}>00m</span>
                                      <span className="text-neutral-400">:</span>
                                      <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 px-1.5 py-0.5 rounded" style={badgeStyle}>00s</span>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="text-[10px] text-neutral-400">Đếm ngược trực tiếp thời gian thực</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Date */}
                    <div className={`w-full text-[10px] opacity-70 pt-2 border-t mt-2 relative z-10 ${
                      coverStyle === 'FONTY' || coverStyle === 'SWISS' || coverStyle === 'GRID'
                        ? 'border-white/15 text-white/70'
                        : 'border-neutral-200/80 dark:border-neutral-800 text-neutral-500'
                    } ${
                      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                    }`}>
                      Thời hạn: {targetDate || '2027-06-25'} lúc {targetTime}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Buttons footer */}
        <div className="flex justify-between items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800 mt-4">
          <div className="text-[11px] text-neutral-500">
            {activeTab === 'INFO' ? 'Bước 1/2' : 'Bước 2/2'}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="countdown-form"
              variant="primary"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Đang lưu...' : countdownToEdit ? 'Cập nhật đếm ngược' : 'Tạo đếm ngược'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
