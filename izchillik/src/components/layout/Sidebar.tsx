import React from 'react';
import {
  Award,
  BarChart3,
  Calendar,
  CheckSquare,
  Flame,
  LayoutGrid,
  Settings,
  Target,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { PageId } from '../../types';
import { formatUzbekFullDate } from '../../utils/date';

const NAV_ITEMS: Array<{ id: PageId; label: string; num: number; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Bosh sahifa', num: 1, icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'missions', label: 'Vazifalar', num: 2, icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'challenges', label: 'Marralar', num: 3, icon: <Target className="w-4 h-4" /> },
  { id: 'calendar', label: 'Kalendar', num: 4, icon: <Calendar className="w-4 h-4" /> },
  { id: 'analytics', label: 'Tahlil', num: 5, icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'achievements', label: 'Yutuqlar', num: 6, icon: <Award className="w-4 h-4" /> },
  { id: 'settings', label: 'Sozlamalar', num: 7, icon: <Settings className="w-4 h-4" /> },
];

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, todayKey, levelInfo, currentStreak } = useApp();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-surface-alt border-r border-border z-30">
      <div className="px-4 py-4 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/40 text-accent flex items-center justify-center font-mono font-bold text-sm">
          IZ
        </div>
        <div>
          <div className="text-sm font-bold tracking-wider text-text-primary">IZCHILLIK</div>
          <div className="text-[11px] text-text-muted uppercase tracking-widest">Tizim</div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border text-xs text-text-muted">
        {formatUzbekFullDate(todayKey)}
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto" aria-label="Asosiy menyu">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`w-full min-h-[44px] px-3 rounded-xl flex items-center justify-between text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent'
              }`}
            >
              <span className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </span>
              <span className="text-xs font-mono opacity-60">{item.num}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary font-mono">
            {levelInfo.level}-daraja
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            {currentStreak}k
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-bg overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
          <span>Jami {levelInfo.totalXp} XP</span>
          <span>
            {levelInfo.xpIntoLevel}/{levelInfo.xpNeededForLevel}
          </span>
        </div>
      </div>
    </aside>
  );
};