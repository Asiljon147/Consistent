import React, { useState } from 'react';
import { formatUzbekShortDate } from '../../utils/date';

interface BarPoint {
  date: string;
  completed: number;
  scheduled: number;
}

interface WeeklyBarChartProps {
  data: BarPoint[];
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.completed, d.scheduled)));

  return (
    <div className="space-y-3">
      {activeIdx !== null && data[activeIdx] && (
        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-bg border border-border flex items-center justify-between">
          <span className="text-text-secondary">
            {formatUzbekShortDate(data[activeIdx].date)}
          </span>
          <span className="text-accent font-semibold">
            {data[activeIdx].completed} / {data[activeIdx].scheduled} bajarildi
          </span>
        </div>
      )}

      <div className="grid grid-cols-7 gap-2 items-end h-36 pt-2">
        {data.map((item, idx) => {
          const scheduledPct = Math.round((item.scheduled / maxVal) * 100);
          const completedPct = Math.round((item.completed / maxVal) * 100);
          const isSelected = activeIdx === idx;

          return (
            <button
              key={item.date}
              type="button"
              onClick={() => setActiveIdx(isSelected ? null : idx)}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              className="flex flex-col items-center gap-1.5 h-full justify-end group focus:outline-none"
            >
              <div className="relative w-full max-w-[28px] flex-1 flex items-end justify-center bg-bg/60 rounded-t-lg overflow-hidden">
                {item.scheduled > 0 && (
                  <div
                    className="absolute bottom-0 inset-x-0 bg-border/60 rounded-t-md transition-all"
                    style={{ height: `${Math.max(8, scheduledPct)}%` }}
                  />
                )}
                {item.completed > 0 && (
                  <div
                    className={`relative w-full rounded-t-md transition-all ${
                      isSelected ? 'bg-blue-400' : 'bg-accent'
                    }`}
                    style={{ height: `${Math.max(10, completedPct)}%` }}
                  />
                )}
              </div>
              <span className="text-[10px] font-mono text-text-muted truncate max-w-full">
                {formatUzbekShortDate(item.date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};