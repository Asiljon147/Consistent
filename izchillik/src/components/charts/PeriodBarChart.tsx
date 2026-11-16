import React, { useState } from 'react';
import { formatUzbekShortDate } from '../../utils/date';

interface PeriodBucket {
  labelDate: string;
  completed: number;
  scheduled: number;
}

interface PeriodBarChartProps {
  buckets: PeriodBucket[];
}

export const PeriodBarChart: React.FC<PeriodBarChartProps> = ({ buckets }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const maxVal = Math.max(1, ...buckets.map((b) => Math.max(b.completed, b.scheduled)));

  if (buckets.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-text-muted">
        Ma'lumot yo'q.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-mono min-h-[20px]">
        {activeIdx !== null && buckets[activeIdx] ? (
          <>
            <span className="text-text-secondary">
              {formatUzbekShortDate(buckets[activeIdx].labelDate)} haftasi
            </span>
            <span className="text-accent font-semibold">
              {buckets[activeIdx].completed} / {buckets[activeIdx].scheduled}
            </span>
          </>
        ) : (
          <span className="text-text-muted">Ustunga bosing yoki ustiga olib boring</span>
        )}
      </div>

      <div
        className="grid gap-3 items-end h-40 pt-2"
        style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
      >
        {buckets.map((b, idx) => {
          const schedH = Math.round((b.scheduled / maxVal) * 100);
          const compH = Math.round((b.completed / maxVal) * 100);
          const selected = activeIdx === idx;

          return (
            <button
              key={b.labelDate}
              type="button"
              onClick={() => setActiveIdx(selected ? null : idx)}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              className="flex flex-col items-center gap-1.5 h-full justify-end focus:outline-none"
            >
              <div className="relative w-full max-w-[36px] flex-1 flex items-end justify-center bg-bg/60 rounded-t-lg overflow-hidden">
                {b.scheduled > 0 && (
                  <div
                    className="absolute bottom-0 inset-x-0 bg-border/60 rounded-t-md"
                    style={{ height: `${Math.max(8, schedH)}%` }}
                  />
                )}
                {b.completed > 0 && (
                  <div
                    className={`relative w-full rounded-t-md transition-all ${
                      selected ? 'bg-blue-400' : 'bg-accent'
                    }`}
                    style={{ height: `${Math.max(10, compH)}%` }}
                  />
                )}
              </div>
              <span className="text-[10px] font-mono text-text-muted truncate max-w-full">
                {formatUzbekShortDate(b.labelDate)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};