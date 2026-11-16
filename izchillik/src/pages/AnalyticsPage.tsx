import React, { useMemo, useState } from 'react';
import { Flame, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { DailyXpLineChart } from '../components/charts/DailyXpLineChart';
import { PeriodBarChart } from '../components/charts/PeriodBarChart';
import { useApp } from '../state/AppContext';
import { computeAnalyticsForRange } from '../utils/gameLogic';

type RangeOption = 7 | 30 | 90 | 'all';

export const AnalyticsPage: React.FC = () => {
  const {
    missions,
    completions,
    categories,
    challenges,
    todayKey,
    totalXp,
    levelInfo,
    currentStreak,
    longestStreak,
  } = useApp();

  const [range, setRange] = useState<RangeOption>(30);

  const summary = useMemo(
    () =>
      computeAnalyticsForRange({
        missions,
        completions,
        categories,
        todayKey,
        rangeDays: range,
      }),
    [categories, completions, missions, range, todayKey]
  );

  const activeOrDoneChallenges = challenges.filter((c) => c.status !== 'archived');
  const completedChallenges = activeOrDoneChallenges.filter((c) => c.status === 'completed');
  const rangeLabel = range === 'all' ? 'butun davr' : `oxirgi ${range} kun`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tahlil</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Saqlangan vazifalar va XP tarixi asosida real ko'rsatkichlar.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              { id: 7, label: '7 kun' },
              { id: 30, label: '30 kun' },
              { id: 90, label: '90 kun' },
              { id: 'all', label: 'Hammasi' },
            ] as const
          ).map((opt) => (
            <button
              key={String(opt.id)}
              type="button"
              onClick={() => setRange(opt.id)}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold border whitespace-nowrap transition-colors ${
                range === opt.id
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-surface border border-border">
          <div className="text-xs text-text-muted">Bajarilgan</div>
          <div className="text-2xl font-bold font-mono text-text-primary mt-1">
            {summary.completedCount}
          </div>
          <div className="text-[11px] font-mono text-text-muted mt-1">
            {summary.scheduledCount} ta rejadan
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border">
          <div className="text-xs text-text-muted">Bajarilish darajasi</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {summary.completionRate}%
          </div>
          <div className="w-full h-1.5 rounded-full bg-bg mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${summary.completionRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border">
          <div className="text-xs text-text-muted">Olingan XP</div>
          <div className="text-2xl font-bold font-mono text-accent mt-1">{summary.xpEarned}</div>
          <div className="text-[11px] font-mono text-text-muted mt-1">
            Jami {totalXp} XP · {levelInfo.level}-daraja
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Joriy seriya</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-primary mt-1">
            {currentStreak}k
          </div>
          <div className="text-[11px] font-mono text-text-muted mt-1">
            Eng uzuni: {longestStreak}k
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Marralar</span>
            <Target className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-primary mt-1">
            {completedChallenges.length}/{activeOrDoneChallenges.length}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Yakunlangan / Jami</div>
        </div>
      </div>

      <section className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Tahlil xulosalari
        </div>
        <ul className="space-y-1.5 text-xs sm:text-sm text-text-secondary list-disc list-inside">
          <li>
            Siz {rangeLabel} davomida rejalashtirilgan vazifalarning{' '}
            <span className="font-mono font-semibold text-text-primary">
              {summary.completionRate}%
            </span>{' '}
            qismini ({summary.completedCount}/{summary.scheduledCount}) bajardingiz.
          </li>
          {summary.strongestCategory ? (
            <li>
              Eng kuchli yo'nalishingiz —{' '}
              <span className="font-semibold text-emerald-400">
                {summary.strongestCategory.category.name}
              </span>{' '}
              ({summary.strongestCategory.ratePercent}%, {summary.strongestCategory.xpEarned} XP).
            </li>
          ) : (
            <li>Kategoriyalar bo'yicha taqqoslash uchun kamida bitta vazifa bajaring.</li>
          )}
          {summary.weakestCategory && (
            <li>
              Ko'proq e'tibor talab qiladigan yo'nalish —{' '}
              <span className="font-semibold text-amber-400">
                {summary.weakestCategory.category.name}
              </span>{' '}
              ({summary.weakestCategory.ratePercent}%, {summary.weakestCategory.completedCount}/
              {summary.weakestCategory.scheduledCount}).
            </li>
          )}
        </ul>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <section className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Kunlik XP
            </h2>
            <span className="text-xs text-text-muted">{rangeLabel}</span>
          </div>
          <DailyXpLineChart data={summary.dailyPoints} />
        </section>

        <section className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Davr natijalari</h2>
            <span className="text-xs text-text-muted">7 kunlik kesimda</span>
          </div>
          <PeriodBarChart buckets={summary.buckets} />
        </section>
      </div>

      <section className="p-4 sm:p-5 rounded-2xl bg-surface border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-text-primary">
            Kategoriya bo'yicha izchillik
          </h2>
          {summary.strongestCategory && (
            <div className="flex flex-wrap gap-3 text-xs">
              <span>
                Eng kuchli:{' '}
                <strong className="text-emerald-400">
                  {summary.strongestCategory.category.name}
                </strong>
              </span>
              {summary.weakestCategory && (
                <span>
                  E'tibor kerak:{' '}
                  <strong className="text-amber-400">
                    {summary.weakestCategory.category.name}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>

        {summary.categoryBreakdown.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            Ushbu davrda kategoriya statistikasi mavjud emas.
          </p>
        ) : (
          <div className="space-y-3.5">
            {summary.categoryBreakdown.map((item) => (
              <div key={item.category.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-text-primary">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.category.color }}
                    />
                    {item.category.name}
                  </span>
                  <span className="font-mono text-text-muted text-xs">
                    {item.completedCount}/{item.scheduledCount} ({item.ratePercent}%) ·{' '}
                    <span className="text-text-primary">{item.xpEarned} XP</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.ratePercent}%`,
                      backgroundColor: item.category.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};