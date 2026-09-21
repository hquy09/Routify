import React, { useState } from 'react';
import { HeatmapDay } from '../../types';

interface ActivityHeatmapProps {
  days: HeatmapDay[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ days }) => {
  const [mode, setMode] = useState<'COUNT' | 'DIFFICULTY'>('COUNT');

  // Level styles for count & difficulty
  const getLevel = (day: HeatmapDay) => {
    if (mode === 'COUNT') {
      return day.level;
    } else {
      const pts = day.difficulty_points;
      if (pts === 0) return 0;
      if (pts <= 3) return 1;
      if (pts <= 7) return 2;
      if (pts <= 12) return 3;
      return 4;
    }
  };

  const levelColors: Record<number, string> = {
    0: 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/30',
    1: 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800/40',
    2: 'bg-emerald-300 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-600/60',
    3: 'bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-400/80',
    4: 'bg-emerald-600 dark:bg-emerald-400 border border-emerald-700 dark:border-emerald-300 shadow-2xs',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Bản đồ nhiệt hoạt động (Activity Heatmap)</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tần suất làm việc trong 6 tháng qua (GitHub contribution style)
          </p>
        </div>

        {/* Toggle mode */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setMode('COUNT')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              mode === 'COUNT' ? 'bg-white dark:bg-neutral-100 text-slate-900 dark:text-neutral-900 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Số lượng Task
          </button>
          <button
            onClick={() => setMode('DIFFICULTY')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              mode === 'DIFFICULTY' ? 'bg-white dark:bg-neutral-100 text-slate-900 dark:text-neutral-900 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Điểm độ khó (Difficulty)
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1.5 min-w-[700px]">
          {/* Render in column chunks of 7 days (weeks) */}
          {Array.from({ length: Math.ceil(days.length / 7) }).map((_, colIdx) => {
            const weekSlice = days.slice(colIdx * 7, colIdx * 7 + 7);
            return (
              <div key={colIdx} className="flex flex-col gap-1.5">
                {weekSlice.map((d) => {
                  const lvl = getLevel(d);
                  const colorClass = levelColors[lvl];
                  return (
                    <div
                      key={d.date}
                      className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 cursor-pointer ${colorClass}`}
                      title={`${d.date}: ${d.count} tasks (${d.difficulty_points} difficulty points)`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800">
        <span>Ít hoạt động</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={`w-3 h-3 rounded-sm ${levelColors[l]}`} />
          ))}
          <span>More</span>
        </div>
        <span>Năng suất cao</span>
      </div>
    </div>
  );
};
