import React, { useMemo } from 'react';
import {
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  Flame,
  Plus,
  Target,
  Trophy,
} from 'lucide-react';
import { WeeklyBarChart } from '../components/charts/WeeklyBarChart';
import { useApp } from '../state/AppContext';
import {
  addDays,
  formatUzbekFullDate,
  formatUzbekShortDate,
  getGreetingByHour,
} from '../utils/date';
import {
  calculateChallengeProgress,
  getScheduledMissionsForDate,
  makeCompletionKey,
} from '../utils/gameLogic';

interface OverviewPageProps {
  onOpenCreateMission: () => void;
  onOpenCreateChallenge: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onOpenCreateMission,
  onOpenCreateChallenge,
}) => {
  const {
    settings,
    todayKey,
    levelInfo,
    currentStreak,
    longestStreak,
    missions,
    completions,
    categories,
    challenges,
    toggleMissionCompletion,
    setActivePage,
    setSelectedChallengeId,
  } = useApp();

  const greeting = getGreetingByHour(new Date().getHours(), settings.displayName);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const todaysMissions = useMemo(
    () => getScheduledMissionsForDate(missions, todayKey),
    [missions, todayKey]
  );

  const completionKeySet = useMemo(() => new Set(completions.map((c) => c.id)), [completions]);

  const todayDoneCount = todaysMissions.filter((m) =>
    completionKeySet.has(makeCompletionKey(m.id, todayKey))
  ).length;
  const todayPercent =
    todaysMissions.length > 0 ? Math.round((todayDoneCount / todaysMissions.length) * 100) : 0;

  const activeMissionCount = missions.filter((m) => m.status === 'active').length;

  const last7DaysData = useMemo(() => {
    const arr = [];
    for (let i = -6; i <= 0; i++) {
      const date = addDays(todayKey, i);
      const scheduled = getScheduledMissionsForDate(missions, date).length;
      const completed = completions.filter((c) => c.date === date).length;
      arr.push({ date, completed, scheduled });
    }
    return arr;
  }, [completions, missions, todayKey]);

  const activeChallenges = useMemo(
    () => challenges.filter((c) => c.status === 'active'),
    [challenges]
  );

  const upcomingDeadlines = useMemo(() => {
    return missions
      .filter((m) => m.status === 'active' && m.deadline && m.deadline >= todayKey)
      .sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))
      .slice(0, 5);
  }, [missions, todayKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs text-text-muted">{formatUzbekFullDate(todayKey)}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mt-0.5">{greeting}</h1>
          <p className="text-sm text-text-muted mt-1">
            Izchillik oddiy harakatni barqaror mahoratga aylantiradi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateMission}
            className="min-h-[44px] px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Vazifa qo'shish
          </button>
          <button
            type="button"
            onClick={onOpenCreateChallenge}
            className="min-h-[44px] px-4 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-primary text-sm font-medium inline-flex items-center gap-2 transition-colors"
          >
            <Target className="w-4 h-4 text-accent" />
            Marra yaratish
          </button>
          <button
            type="button"
            onClick={() => setActivePage('analytics')}
            className="min-h-[44px] px-4 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-secondary text-sm font-medium inline-flex items-center gap-2 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Tahlil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-2.5">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Joriy daraja</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-text-primary">
              {levelInfo.level}-daraja
            </span>
            <span className="text-xs font-mono text-text-muted">{levelInfo.totalXp} XP</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-bg overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] font-mono text-text-muted">
            Keyingi darajagacha {levelInfo.xpRemaining} XP qoldi
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-2.5">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Joriy seriya</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text-primary">
            {currentStreak} kun
          </div>
          <p className="text-xs text-text-muted">
            Eng uzun seriya:{' '}
            <span className="font-mono text-text-primary font-semibold">{longestStreak} kun</span>
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-2.5">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Jami bajarilgan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text-primary">
            {completions.length}
          </div>
          <p className="text-xs text-text-muted">{activeMissionCount} ta faol vazifa</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-2.5">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Bugungi bajarilish</span>
            <span className="text-xs font-mono text-accent">{todayPercent}%</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-text-primary">
            {todayDoneCount}/{todaysMissions.length}
          </div>
          <div className="w-full h-1.5 rounded-full bg-bg overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${todayPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <section className="lg:col-span-2 rounded-2xl bg-surface border border-border overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Bugungi vazifalar</h2>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                {todaysMissions.length} tadan {todayDoneCount} tasi bajarildi ({todayPercent}%)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('missions')}
              className="text-xs font-semibold text-accent hover:underline min-h-[36px] px-2"
            >
              Boshqarish →
            </button>
          </div>

          {todaysMissions.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-text-muted">Bugun uchun rejalashtirilgan vazifa yo'q.</p>
              <button
                type="button"
                onClick={onOpenCreateMission}
                className="min-h-[44px] px-4 rounded-xl bg-accent/15 text-accent text-sm font-semibold hover:bg-accent/25 transition-colors"
              >
                + Birinchi vazifani qo'shish
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {todaysMissions.map((m) => {
                const done = completionKeySet.has(makeCompletionKey(m.id, todayKey));
                const cat = categoryMap.get(m.categoryId);
                return (
                  <div
                    key={m.id}
                    className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-hover/50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => void toggleMissionCompletion(m.id, todayKey)}
                      className="flex items-center gap-3.5 flex-1 min-w-0 text-left min-h-[44px]"
                    >
                      <span
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          done
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-text-muted/50 hover:border-accent'
                        }`}
                      >
                        {done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-medium truncate ${
                            done ? 'line-through text-text-muted' : 'text-text-primary'
                          }`}
                        >
                          {m.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5 flex-wrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat?.color ?? '#3b82f6' }}
                            />
                            {cat?.name ?? 'Kategoriya'}
                          </span>
                          {m.targetQuantity !== null && (
                            <span className="font-mono">
                              · {m.targetQuantity} {m.targetUnit || 'birlik'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <span className="px-2.5 py-1 rounded-lg bg-bg border border-border text-xs font-mono text-text-secondary shrink-0">
                      {m.xp} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="space-y-4 sm:space-y-6">
          <section className="p-4 sm:p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-text-primary">Oxirgi 7 kun</h2>
              <span className="text-[11px] text-text-muted">Bajarilgan / Reja</span>
            </div>
            <WeeklyBarChart data={last7DaysData} />
          </section>

          <section className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Faol marralar</h2>
              <button
                type="button"
                onClick={() => setActivePage('challenges')}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Barchasi
              </button>
            </div>

            {activeChallenges.length === 0 ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-text-muted">Faol marralar yo'q.</p>
                <button
                  type="button"
                  onClick={onOpenCreateChallenge}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Yangi marra boshlash
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeChallenges.slice(0, 3).map((ch) => {
                  const summary = calculateChallengeProgress(ch, completions, todayKey);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setSelectedChallengeId(ch.id);
                        setActivePage('challenges');
                      }}
                      className="w-full text-left p-3 rounded-xl bg-bg border border-border hover:border-accent/40 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {ch.name}
                        </span>
                        <span className="text-xs font-mono text-accent">
                          {summary.completionPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${summary.completionPercent}%`,
                            backgroundColor: ch.color,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-text-muted">
                        <span>
                          {summary.successfulDays}/{summary.totalActiveDays} kun
                        </span>
                        <span>{summary.daysRemaining} kun qoldi</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Yaqin muddatlar</h2>
              <CalendarClock className="w-4 h-4 text-text-muted" />
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-text-muted py-2">Yaqinlashayotgan muddatlar yo'q.</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-bg border border-border"
                  >
                    <span className="text-text-primary font-medium truncate pr-2">{m.title}</span>
                    <span className="font-mono text-amber-400 shrink-0">
                      {m.deadline ? formatUzbekShortDate(m.deadline) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};