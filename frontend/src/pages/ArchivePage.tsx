import React, { useState, useEffect } from 'react';
import { Archive, Calendar, CheckCircle2, AlertTriangle, ChevronRight, ChevronDown, Award } from 'lucide-react';
import { ArchiveRecord } from '../types';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export const ArchivePage: React.FC = () => {
  const [archiveTree, setArchiveTree] = useState<Record<number, Record<string, ArchiveRecord[]>>>({});
  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const loadArchives = async () => {
    setIsLoading(true);
    try {
      const data = await api.archive.list();
      setArchiveTree(data);

      // Auto select first record if available
      const years = Object.keys(data);
      if (years.length > 0) {
        const firstYear = Number(years[0]);
        const months = Object.keys(data[firstYear]);
        if (months.length > 0) {
          const firstMonth = months[0];
          const records = data[firstYear][firstMonth];
          if (records.length > 0) {
            setSelectedRecord(records[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load archive tree:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArchives();
  }, []);

  const handleFinalizeCurrentWeek = async () => {
    const now = new Date();
    const year = now.getFullYear();
    // ISO week
    const date = new Date(now.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);

    setIsFinalizing(true);
    try {
      const res = await api.archive.finalize(year, weekNumber);
      setSelectedRecord(res);
      await loadArchives();
      alert(`Đã hoàn tất đóng băng và lưu trữ snapshot cho Tuần ${weekNumber} / ${year}!`);
    } catch (err) {
      console.error('Failed to finalize week:', err);
    } finally {
      setIsFinalizing(false);
    }
  };

  const years = Object.keys(archiveTree).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Kho Lưu Trữ (Archive)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lịch sử tuần đã hoàn tất, đóng băng snapshot hiệu suất mà không làm mất dữ liệu gốc
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleFinalizeCurrentWeek}
          disabled={isFinalizing}
        >
          <Archive className="w-4 h-4" />
          <span>{isFinalizing ? 'Đang đóng băng...' : 'Đóng băng tuần hiện tại'}</span>
        </Button>
      </div>

      {/* Main Grid: Left Tree / Right Snapshot Detail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Archive Directory Tree */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            <Archive className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <span>Cây lưu trữ (Year → Month → Week)</span>
          </div>

          {years.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              Chưa có bản lưu trữ nào. Hãy bấm "Đóng băng tuần hiện tại" để tạo bản lưu trữ đầu tiên.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {years.map((y) => (
                <div key={y} className="space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                    <span>📁 {y}</span>
                  </div>
                  <div className="pl-3 space-y-1">
                    {Object.keys(archiveTree[y]).map((m) => (
                      <div key={m} className="space-y-1">
                        <div className="text-slate-500 dark:text-slate-400 font-semibold px-2 py-0.5">
                          <span>📂 {m}</span>
                        </div>
                        <div className="pl-3 space-y-1">
                          {archiveTree[y][m].map((rec) => {
                            const isSelected = selectedRecord?.id === rec.id;
                            return (
                              <button
                                key={rec.id}
                                onClick={() => setSelectedRecord(rec)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <span>Tuần {rec.week_number}</span>
                                <span className={`text-[10px] ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}`}>
                                  {rec.completion_rate}%
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Snapshot Viewer */}
        <div className="md:col-span-2 space-y-4">
          {selectedRecord ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Snapshot Tuần {selectedRecord.week_number} / {selectedRecord.year}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Đã đóng băng lúc: {new Date(selectedRecord.finalized_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <Badge variant="success" className="px-3 py-1 font-bold text-xs">
                  Hoàn thành {selectedRecord.completion_rate}%
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Tổng tasks</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">{selectedRecord.total_tasks}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Đã hoàn thành</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{selectedRecord.completed_tasks}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Chậm trễ</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-lg">{selectedRecord.delayed_tasks}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Điểm độ khó</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">+{selectedRecord.difficulty_points}</span>
                </div>
              </div>

              {/* Reflection details from Weekly Review if available */}
              {selectedRecord.review ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Award className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                    <span>Ghi chú phản tư tuần (Weekly Review)</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {selectedRecord.review.what_went_well && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                           1. Điều gì làm tốt:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300">{selectedRecord.review.what_went_well}</p>
                      </div>
                    )}

                    {selectedRecord.review.what_needs_improvement && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                        <span className="font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                          2. Điều gì chưa tốt:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300">{selectedRecord.review.what_needs_improvement}</p>
                      </div>
                    )}

                    {selectedRecord.review.delayed_tasks_reflection && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                        <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                          3. Nguyên nhân task bị delay:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300">{selectedRecord.review.delayed_tasks_reflection}</p>
                      </div>
                    )}

                    {selectedRecord.review.next_week_changes && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                          4. Cải thiện cho tuần sau:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300">{selectedRecord.review.next_week_changes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  Chưa có ghi chép phản tư riêng cho tuần này.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-xs shadow-xs">
              Chọn một tuần từ cây thư mục bên trái để xem snapshot.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
