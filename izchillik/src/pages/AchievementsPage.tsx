import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Lock } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { formatUzbekDateTimeShort } from '../utils/date';

type FilterTab = 'all' | 'unlocked' | 'locked';

export const AchievementsPage: React.FC = () => {
  const { achievementProgress } = useApp();
  const [filter, setFilter] = useState<FilterTab>('all');

  const unlockedCount = useMemo(
    () => achievementProgress.filter((a) => a.unlocked !== null).length,
    [achievementProgress]
  );

  const filtered = useMemo(() => {
    if (filter === 'unlocked') return achievementProgress.filter((a) => a.unlocked !== null);
    if (filter === 'locked') return achievementProgress.filter((a) => a.unlocked === null);
    return achievementProgress;
  }, [achievementProgress, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Yutuqlar</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Bosqichlar real bajarilishlar, seriyalar, XP va marralar asosida avtomatik ochiladi.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-mono font-semibold self-start sm:self-auto">
          {unlockedCount} / {achievementProgress.length} ochilgan
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {(
          [
            { id: 'all', label: 'Barchasi' },
            { id: 'unlocked', label: 'Ochilgan' },
            { id: 'locked', label: 'Qulflangan' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold border transition-colors ${
              filter === tab.id
                ? 'bg-accent border-accent text-white'
                : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 rounded-2xl bg-surface border border-border text-center text-sm text-text-muted">
          Ushbu filtr bo'yicha yutuqlar topilmadi.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ definition, current, percent, unlocked }) => {
            const isUnlocked = unlocked !== null;
            return (
              <div
                key={definition.id}
                className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-colors ${
                  isUnlocked
                    ? 'bg-surface border-amber-500/40'
                    : 'bg-surface border-border opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-bg text-text-muted border border-border'
                      }`}
                    >
                      {isUnlocked ? (
                        <Award className="w-5 h-5" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{definition.title}</h3>
                      <span className="text-[11px] font-mono text-text-muted">
                        {definition.target} {definition.unitLabel}
                      </span>
                    </div>
                  </div>
                  {isUnlocked && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {definition.description}
                </p>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                    <span>
                      {current} / {definition.target}
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-bg overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isUnlocked ? 'bg-amber-400' : 'bg-accent'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {unlocked && (
                  <p className="text-[11px] text-amber-400 font-mono">
                    Ochilgan: {formatUzbekDateTimeShort(unlocked.unlockedAt)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};