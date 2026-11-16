import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { BottomSheetModal } from '../components/ui/BottomSheetModal';
import { useApp } from '../state/AppContext';
import {
  UZ_WEEKDAYS_SHORT_MON_FIRST,
  buildMonthGrid,
  formatUzbekFullDate,
  formatUzbekMonthYear,
} from '../utils/date';
import { getScheduledMissionsForDate, makeCompletionKey } from '../utils/gameLogic';

export const CalendarPage: React.FC = () => {
  const {
    missions,
    completions,
    challenges,
    categories,
    todayKey,
    toggleMissionCompletion,
  } = useApp();

  const initialDate = new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth0, setViewMonth0] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth0), [viewYear, viewMonth0]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const completionKeySet = useMemo(() => new Set(completions.map((c) => c.id)), [completions]);

  const challengeBoundaryDates = useMemo(() => {
    const set = new Set<string>();
    for (const ch of challenges) {
      set.add(ch.startDate);
      set.add(ch.endDate);
    }
    return set;
  }, [challenges]);

  const prevMonth = () => {
    if (viewMonth0 === 0) {
      setViewYear((y) => y - 1);
      setViewMonth0(11);
    } else {
      setViewMonth0((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth0 === 11) {
      setViewYear((y) => y + 1);
      setViewMonth0(0);
    } else {
      setViewMonth0((m) => m + 1);
    }
  };

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth0(now.getMonth());
    setSelectedDate(todayKey);
  };

  const selectedMissions = useMemo(
    () => getScheduledMissionsForDate(missions, selectedDate),
    [missions, selectedDate]
  );

  const renderDayMissionsList = () => (
    <div className="space-y-3">
      <div className="text-xs text-text-muted">
        {selectedMissions.length} ta rejalashtirilgan vazifa
      </div>
      {selectedMissions.length === 0 ? (
        <p className="text-sm text-text-muted py-6 text-center">
          Ushbu kunda rejalashtirilgan vazifalar yo'q.
        </p>
      ) : (
        <div className="space-y-2">
          {selectedMissions.map((m) => {
            const done = completionKeySet.has(makeCompletionKey(m.id, selectedDate));
            const cat = categoryMap.get(m.categoryId);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => void toggleMissionCompletion(m.id, selectedDate)}
                className="w-full min-h-[52px] p-3 rounded-xl bg-bg border border-border hover:border-accent/40 flex items-center justify-between gap-3 text-left transition-colors"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-text-muted/50'
                    }`}
                  >
                    {done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-medium truncate ${
                        done ? 'line-through text-text-muted' : 'text-text-primary'
                      }`}
                    >
                      {m.title}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat?.color ?? '#3b82f6' }}
                      />
                      {cat?.name ?? 'Kategoriya'}
                    </span>
                  </span>
                </span>
                <span className="text-xs font-mono text-text-secondary shrink-0">{m.xp} XP</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Kalendar</h1>
          <p className="text-sm text-text-muted mt-0.5">
            O'tgan va bugungi kunlarni ko'rish hamda vazifalarni belgilash.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Oldingi oy"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-surface border border-border hover:bg-surface-hover flex items-center justify-center text-text-primary"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-[150px] text-center text-sm font-semibold text-text-primary">
            {formatUzbekMonthYear(viewYear, viewMonth0)}
          </div>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Keyingi oy"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-surface border border-border hover:bg-surface-hover flex items-center justify-center text-text-primary"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="min-h-[44px] px-3.5 rounded-xl bg-surface border border-border hover:bg-surface-hover text-xs font-semibold text-text-primary"
          >
            Bugun
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 p-3 sm:p-5 rounded-2xl bg-surface border border-border space-y-3">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-text-muted">
            {UZ_WEEKDAYS_SHORT_MON_FIRST.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell) => {
              const scheduled = getScheduledMissionsForDate(missions, cell.dateKey);
              const doneCount = scheduled.filter((m) =>
                completionKeySet.has(makeCompletionKey(m.id, cell.dateKey))
              ).length;
              const isSelected = selectedDate === cell.dateKey;
              const isToday = cell.dateKey === todayKey;
              const isPast = cell.dateKey < todayKey;
              const hasFlag = challengeBoundaryDates.has(cell.dateKey);

              let dotColor = '';
              if (scheduled.length > 0) {
                if (doneCount >= scheduled.length) {
                  dotColor = 'bg-emerald-400';
                } else if (doneCount > 0) {
                  dotColor = 'bg-blue-400';
                } else if (isPast) {
                  dotColor = 'bg-red-400';
                }
              }

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => {
                    setSelectedDate(cell.dateKey);
                    if (window.innerWidth < 1024) {
                      setMobileSheetOpen(true);
                    }
                  }}
                  className={`min-h-[54px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between text-left transition-colors ${
                    isSelected
                      ? 'bg-accent/15 border-accent'
                      : isToday
                      ? 'bg-bg border-accent/50'
                      : 'bg-bg border-border hover:border-text-muted/40'
                  } ${!cell.inCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isToday ? 'text-accent' : 'text-text-primary'
                      }`}
                    >
                      {cell.dayOfMonth}
                    </span>
                    {hasFlag && <Flag className="w-3 h-3 text-amber-400" />}
                  </div>

                  <div className="flex items-center justify-between w-full mt-1">
                    <span className={`w-2 h-2 rounded-full ${dotColor || 'bg-transparent'}`} />
                    {scheduled.length > 0 && (
                      <span className="text-[10px] font-mono text-text-muted">
                        {doneCount}/{scheduled.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Barchasi bajarilgan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Qisman bajarilgan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" /> O'tkazib yuborilgan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flag className="w-3 h-3 text-amber-400" /> Marra boshlanish/tugashi
            </span>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-4 p-5 rounded-2xl bg-surface border border-border space-y-4 h-fit">
          <div>
            <div className="text-xs text-text-muted">Tanlangan sana</div>
            <h2 className="text-base font-bold text-text-primary mt-0.5">
              {formatUzbekFullDate(selectedDate)}
            </h2>
          </div>
          {renderDayMissionsList()}
        </div>
      </div>

      <BottomSheetModal
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        title={formatUzbekFullDate(selectedDate)}
        subtitle="Vazifalarni belgilash uchun ustiga bosing"
      >
        {renderDayMissionsList()}
      </BottomSheetModal>
    </div>
  );
};