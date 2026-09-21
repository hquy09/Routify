import React, { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend
} from 'recharts';
import { BarChartItem } from '../../types';

interface DailyBarChartProps {
  items: BarChartItem[];
  period: string;
  onChangePeriod: (p: string) => void;
}

export const DailyBarChart: React.FC<DailyBarChartProps> = ({
  items,
  period,
  onChangePeriod,
}) => {
  const periods = [
    { id: 'DAY', label: 'Theo Ngày (Day)' },
    { id: 'WEEK', label: 'Theo Tuần (Week)' },
    { id: 'MONTH', label: 'Theo Tháng (Month)' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Hiệu suất hoàn thành công việc</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Số lượng task và điểm độ khó đã đạt được</p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => onChangePeriod(p.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                period === p.id
                  ? 'bg-white dark:bg-neutral-100 text-slate-900 dark:text-neutral-900 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b830" vertical={false} />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#0f172a',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Bar dataKey="completed" name="Đã hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="difficulty_points" name="Điểm độ khó" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="delayed" name="Chậm trễ" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
