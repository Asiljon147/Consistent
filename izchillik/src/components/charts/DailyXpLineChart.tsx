import React, { useState } from 'react';
import { formatUzbekShortDate } from '../../utils/date';

interface DailyXpPoint {
  date: string;
  xp: number;
}

interface DailyXpLineChartProps {
  data: DailyXpPoint[];
}

export const DailyXpLineChart: React.FC<DailyXpLineChartProps> = ({ data }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-text-muted">
        Ma'lumot yetarli emas.
      </div>
    );
  }

  const width = 520;
  const height = 160;
  const padX = 16;
  const padY = 16;
  const maxXp = Math.max(25, ...data.map((d) => d.xp));

  const coords = data.map((pt, idx) => {
    const x =
      data.length === 1
        ? width / 2
        : padX + (idx / (data.length - 1)) * (width - padX * 2);
    const y = height - padY - (pt.xp / maxXp) * (height - padY * 2);
    return { x, y, ...pt };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPath = `M ${coords[0].x},${height - padY} L ${coords
    .map((c) => `${c.x},${c.y}`)
    .join(' L ')} L ${coords[coords.length - 1].x},${height - padY} Z`;

  const activePoint = selectedIdx !== null ? coords[selectedIdx] : coords[coords.length - 1];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-text-muted">
          {activePoint ? formatUzbekShortDate(activePoint.date) : ''}
        </span>
        <span className="text-emerald-400 font-semibold">
          {activePoint ? `${activePoint.xp} XP` : ''}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-44 overflow-visible touch-pan-y"
        role="img"
        aria-label="Kunlik XP grafigi"
      >
        <defs>
          <linearGradient id="xpAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          stroke="currentColor"
          className="text-border"
          strokeWidth="1"
        />

        <path d={areaPath} fill="url(#xpAreaGrad)" />
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />

        {coords.map((c, idx) => {
          const isActive = selectedIdx === idx;
          return (
            <g key={c.date}>
              <circle
                cx={c.x}
                cy={c.y}
                r={isActive ? 6 : data.length <= 35 ? 3.5 : 2}
                fill="#10b981"
                className="transition-all"
              />
              <circle
                cx={c.x}
                cy={c.y}
                r={14}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => setSelectedIdx(idx)}
                onMouseEnter={() => setSelectedIdx(idx)}
              />
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
        <span>{formatUzbekShortDate(data[0].date)}</span>
        <span>{formatUzbekShortDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
};