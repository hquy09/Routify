import React, { useState } from 'react';
import {
  X, HelpCircle, Flag, Flame, CheckCircle2, Clock,
  BookOpen, Layers, Smartphone, ArrowRightLeft, Calendar as CalendarIcon,
  Tag, Compass, ShieldAlert, Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { PRIORITY_CONFIG, DIFFICULTY_CONFIG, PriorityLevel } from '../../types';

interface SystemLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemLegendModal: React.FC<SystemLegendModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'PRIORITY' | 'DIFFICULTY' | 'STATUS' | 'SCHEDULE' | 'CALENDAR'>('PRIORITY');

  if (!isOpen) return null;

  const categories = [
    { id: 'SCHOOL', label: 'Trường học (School)', color: '#3b82f6', desc: 'Giờ học chính khóa trên lớp, thời khóa biểu nhà trường' },
    { id: 'STUDY', label: 'Học tập / Ôn thi (Study)', color: '#8b5cf6', desc: 'Tự học, học thêm, làm bài tập về nhà, luyện chuyên đề' },
    { id: 'WORK', label: 'Làm việc (Work)', color: '#f59e0b', desc: 'Dự án cá nhân, công việc, kiếm tiền, nhiệm vụ tổ chức' },
    { id: 'EXERCISE', label: 'Thể thao / Gym (Exercise)', color: '#10b981', desc: 'Chạy bộ, tập gym, rèn luyện thể lực, nâng cao sức bền' },
    { id: 'SLEEP', label: 'Giấc ngủ (Sleep)', color: '#64748b', desc: 'Khung giờ ngủ cố định, tái tạo năng lượng cho não bộ' },
    { id: 'PERSONAL', label: 'Cá nhân (Personal)', color: '#ec4899', desc: 'Ăn uống, vệ sinh cá nhân, nghỉ ngơi, thời gian riêng tư' },
    { id: 'OTHER', label: 'Khác (Other)', color: '#6366f1', desc: 'Các hoạt động cố định khác trong ngày' },
    { id: 'CUSTOM', label: 'Tùy chỉnh (Custom)', color: '#a855f7', desc: 'Danh mục tự tạo và quản lý trong Cài đặt / Kỷ luật' },
  ];

  const statuses = [
    { code: 'TODO', label: 'Chưa hoàn thành', icon: '⭕', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', desc: 'Nhiệm vụ mới tạo, đang chờ bắt đầu thực hiện' },
    { code: 'IN_PROGRESS', label: 'Đang thực hiện', icon: '⏳', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/60', desc: 'Nhiệm vụ đang diễn ra hoặc đang trong phiên tập trung' },
    { code: 'PARTIAL', label: 'Hoàn thành một phần', icon: '🌓', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60', desc: 'Đã hoàn thành một số subtasks hoặc nội dung chính' },
    { code: 'COMPLETED', label: 'Đã hoàn thành', icon: '✅', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60', desc: 'Hoàn tất trọn vẹn, được cộng điểm độ khó vào thống kê EXP' },
    { code: 'DELAYED', label: 'Chậm trễ', icon: '⚠️', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/60', desc: 'Đã quá hạn chót nhưng chưa xong, cần ưu tiên hoặc chuyển giao' },
    { code: 'TRANSFERRED', label: 'Đã chuyển giao', icon: '🔄', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/60', desc: 'Được dời sang ngày khác, hệ thống bảo toàn lịch sử & tạo task mới' },
    { code: 'CANCELLED', label: 'Đã hủy', icon: '❌', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/40', desc: 'Nhiệm vụ không còn cần thiết hoặc bị hủy bỏ' },
  ];

  const calendarSymbols = [
    {
      title: 'Kim chỉ giờ thực tế (Live Time Needle)',
      icon: <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />,
      desc: 'Đường kẻ ngang màu đỏ/hồng di chuyển tự động trên trục 24h để bạn luôn biết chính xác đang ở mốc thời gian nào trong ngày.'
    },
    {
      title: 'Khóa học & Bài học đính kèm (📚 Course Attachment)',
      icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
      desc: 'Gắn trực tiếp bài học thuộc Hệ thống Khóa học vào Task. Bấm vào giúp tra cứu tiến độ học tập 2 chiều.'
    },
    {
      title: 'Tiến độ Subtasks (📋 3/5)',
      icon: <Layers className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />,
      desc: 'Hiển thị số lượng đầu việc nhỏ đã hoàn thành trên tổng số subtasks của nhiệm vụ.'
    },
    {
      title: 'Chuyển giao bảo toàn lịch sử (🔄 Task Transfer)',
      icon: <ArrowRightLeft className="w-4 h-4 text-purple-500" />,
      desc: 'Khi một task bị hoãn, tính năng chuyển giao sẽ đánh dấu task cũ là TRANSFERRED và tạo task mới ở ngày tương lai kèm ghi chú lý do.'
    },
    {
      title: 'Thang điểm Quản lý thời gian sức khoẻ kỹ thuật số (⭐ 0.0 -> 10.0 Rating)',
      icon: <Smartphone className="w-4 h-4 text-amber-500" />,
      desc: 'Đánh giá mức độ kỷ luật giảm thời gian dùng thiết bị gây xao nhãng. Càng tuân thủ giới hạn, điểm rating càng tiến gần 10.0.'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Bảng Chú giải Ký hiệu & Quy chuẩn hệ thống
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                System Legend & Guide — Hướng dẫn ý nghĩa các nhãn, màu sắc và thang đo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs">
          {[
            { id: 'PRIORITY', label: 'Ưu tiên (Priority)' },
            { id: 'DIFFICULTY', label: 'Độ khó (Difficulty 🔥)' },
            { id: 'STATUS', label: 'Trạng thái (Status)' },
            { id: 'SCHEDULE', label: 'Lịch cố định' },
            { id: 'CALENDAR', label: 'Ký hiệu trên Lịch' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1 space-y-3 text-xs">
          {/* TAB 1: PRIORITY */}
          {activeTab === 'PRIORITY' && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Mức độ ưu tiên giúp bạn lọc và nhận biết nhiệm vụ cần giải quyết trước. Trên Calendar và Task list, nhiệm vụ sẽ có <strong>viền màu dọc</strong> tương ứng:
              </p>
              <div className="space-y-2">
                {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as PriorityLevel[]).map((key) => {
                  const cfg = PRIORITY_CONFIG[key];
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border flex items-start gap-3 bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 border-l-4 ${
                        key === 'URGENT'
                          ? 'border-l-rose-500'
                          : key === 'HIGH'
                          ? 'border-l-amber-500'
                          : key === 'MEDIUM'
                          ? 'border-l-blue-500'
                          : 'border-l-slate-400'
                      }`}
                    >
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold border text-[11px] shrink-0 ${cfg.badgeBg} ${cfg.textColor} ${cfg.borderColor}`}>
                        <Flag className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {key === 'URGENT' ? 'Khẩn cấp (Tối cao)' : key === 'HIGH' ? 'Ưu tiên cao' : key === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          {cfg.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DIFFICULTY */}
          {activeTab === 'DIFFICULTY' && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Độ khó (1 đến 5 ngọn lửa 🔥) đại diện cho khối lượng nhận thức & độ phức tạp. Khi hoàn thành task, bạn nhận được <strong>số điểm EXP tương ứng</strong> tích lũy vào Dashboard:
              </p>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const cfg = DIFFICULTY_CONFIG[lvl];
                  return (
                    <div
                      key={lvl}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border text-xs ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>{cfg.shortLabel}</span>
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                            {cfg.label}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {cfg.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          +{cfg.points} EXP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STATUS */}
          {activeTab === 'STATUS' && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Mỗi nhiệm vụ có vòng đời rõ ràng để quản lý tiến độ và theo dõi tỷ lệ hoàn thành theo tuần/tháng:
              </p>
              <div className="space-y-2">
                {statuses.map((st) => (
                  <div
                    key={st.code}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center gap-3"
                  >
                    <span className="text-base shrink-0">{st.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${st.color} text-xs`}>
                          {st.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">({st.code})</span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {st.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SCHEDULE */}
          {activeTab === 'SCHEDULE' && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Lịch cố định (Fixed Schedules) lặp lại hàng tuần trên Calendar. Khi bạn tạo Task trùng giờ với lịch cố định, hệ thống sẽ tự động cảnh báo xung đột (Conflict Warning):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-start gap-2.5"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {c.label}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {c.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: CALENDAR */}
          {activeTab === 'CALENDAR' && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Các ký hiệu đặc biệt hỗ trợ điều phối thời gian và theo dõi kỷ luật cá nhân trên Calendar:
              </p>
              <div className="space-y-2.5">
                {calendarSymbols.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {item.title}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Mẹo: Bạn có thể mở lại bảng này bất kỳ lúc nào bằng nút <strong>?</strong> ở góc dưới bên trái.
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Đã hiểu
          </Button>
        </div>
      </div>
    </div>
  );
};
