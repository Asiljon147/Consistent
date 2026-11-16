import React, { useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Check,
  Download,
  Edit3,
  Pause,
  Play,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useApp } from '../state/AppContext';
import type { Challenge } from '../types';
import { formatUzbekFullDate, formatUzbekShortDate } from '../utils/date';
import {
  createChallengeExportPayload,
  downloadJsonFile,
  validateChallengeImportJson,
} from '../utils/exportImport';
import { calculateChallengeProgress, makeCompletionKey } from '../utils/gameLogic';

interface ChallengesPageProps {
  onOpenCreateChallenge: () => void;
  onEditChallenge: (challenge: Challenge) => void;
}

const STATUS_BADGE: Record<Challenge['status'], { label: string; className: string }> = {
  active: { label: 'FAOL', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  paused: { label: 'PAUZA', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  completed: {
    label: 'YAKUNLANDI',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  archived: { label: 'ARXIV', className: 'bg-slate-500/15 text-text-muted border-border' },
};

export const ChallengesPage: React.FC<ChallengesPageProps> = ({
  onOpenCreateChallenge,
  onEditChallenge,
}) => {
  const {
    challenges,
    missions,
    completions,
    categories,
    todayKey,
    selectedChallengeId,
    setSelectedChallengeId,
    toggleMissionCompletion,
    pauseChallenge,
    resumeChallenge,
    archiveChallenge,
    deleteChallenge,
    importChallengePayload,
    pushToast,
  } = useApp();

  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const completionKeySet = useMemo(() => new Set(completions.map((c) => c.id)), [completions]);

  const visibleChallenges = useMemo(() => {
    return challenges.filter((c) =>
      showArchived ? c.status === 'archived' : c.status !== 'archived'
    );
  }, [challenges, showArchived]);

  const activeDetail = useMemo(() => {
    if (selectedChallengeId) {
      const found = challenges.find((c) => c.id === selectedChallengeId);
      if (found) return found;
    }
    return visibleChallenges[0] ?? null;
  }, [challenges, selectedChallengeId, visibleChallenges]);

  const detailProgress = useMemo(
    () =>
      activeDetail ? calculateChallengeProgress(activeDetail, completions, todayKey) : null,
    [activeDetail, completions, todayKey]
  );

  const linkedMissions = useMemo(() => {
    if (!activeDetail) return [];
    const ids = new Set(activeDetail.linkedMissionIds);
    return missions.filter((m) => ids.has(m.id));
  }, [activeDetail, missions]);

  const handleExportChallenge = (ch: Challenge) => {
    const payload = createChallengeExportPayload(ch, missions, categories);
    downloadJsonFile(`izchillik-marra-${ch.id}.json`, payload);
    pushToast({ title: 'Marra JSON faylga eksport qilindi', variant: 'success' });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = validateChallengeImportJson(text);
      await importChallengePayload(payload);
    } catch (err: unknown) {
      pushToast({
        title: 'Import xatosi',
        description: err instanceof Error ? err.message : "Faylni o'qib bo'lmadi.",
        variant: 'error',
      });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Marralar</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Ko'p kunlik maqsadli sprintlar va kunlik izchillik xaritasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-semibold transition-colors ${
              showArchived
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {showArchived ? "Faol marralarga o'tish" : "Arxivni ko'rish"}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-3.5 rounded-xl bg-surface border border-border hover:bg-surface-hover text-xs font-semibold text-text-primary inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={(e) => void handleImportFile(e)}
            className="hidden"
          />

          <button
            type="button"
            onClick={onOpenCreateChallenge}
            className="min-h-[44px] px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Marra yaratish
          </button>
        </div>
      </div>

      {visibleChallenges.length === 0 ? (
        <div className="p-10 rounded-2xl bg-surface border border-border text-center space-y-3">
          <p className="text-sm text-text-muted">
            {showArchived ? "Arxivlangan marralar yo'q." : 'Hali birorta marra yaratilmagan.'}
          </p>
          {!showArchived && (
            <button
              type="button"
              onClick={onOpenCreateChallenge}
              className="min-h-[44px] px-4 rounded-xl bg-accent/15 text-accent text-sm font-semibold"
            >
              + Ilk marrani yaratish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div
            className={`lg:col-span-4 space-y-3 ${
              selectedChallengeId ? 'hidden lg:block' : 'block'
            }`}
          >
            {visibleChallenges.map((ch) => {
              const summary = calculateChallengeProgress(ch, completions, todayKey);
              const cat = categoryMap.get(ch.categoryId);
              const badge = STATUS_BADGE[ch.status];
              const isSelected = activeDetail?.id === ch.id;

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChallengeId(ch.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-colors space-y-2.5 ${
                    isSelected
                      ? 'bg-surface border-accent shadow-lg'
                      : 'bg-surface border-border hover:border-text-muted/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-text-primary truncate">
                        {ch.name}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {cat?.name ?? 'Kategoriya'} · {summary.totalCalendarDays} kun
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-bg overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${summary.completionPercent}%`,
                        backgroundColor: ch.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                    <span>
                      {summary.successfulDays}/{summary.totalActiveDays} kun (
                      {summary.completionPercent}%)
                    </span>
                    <span>{summary.daysRemaining} kun qoldi</span>
                  </div>
                </button>
              );
            })}
          </div>

          {activeDetail && detailProgress && (
            <div
              className={`lg:col-span-8 p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-5 ${
                selectedChallengeId ? 'block' : 'hidden lg:block'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedChallengeId(null)}
                className="lg:hidden min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-accent"
              >
                <ArrowLeft className="w-4 h-4" />
                Marralar ro'yxatiga qaytish
              </button>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: activeDetail.color }}
                    />
                    <h2 className="text-xl font-bold text-text-primary">{activeDetail.name}</h2>
                  </div>
                  <p className="text-xs text-text-muted font-mono">
                    {formatUzbekShortDate(activeDetail.startDate)} →{' '}
                    {formatUzbekShortDate(activeDetail.endDate)} (
                    {detailProgress.totalCalendarDays} kun)
                  </p>
                  {activeDetail.description && (
                    <p className="text-sm text-text-secondary pt-1">{activeDetail.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {activeDetail.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => void pauseChallenge(activeDetail.id)}
                      title="Pauza qilish"
                      className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-bg border border-border text-amber-400 hover:bg-surface-hover inline-flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Pause className="w-4 h-4" />
                      <span className="hidden sm:inline">Pauza</span>
                    </button>
                  )}
                  {activeDetail.status === 'paused' && (
                    <button
                      type="button"
                      onClick={() => void resumeChallenge(activeDetail.id)}
                      title="Davom ettirish"
                      className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-bg border border-border text-emerald-400 hover:bg-surface-hover inline-flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Play className="w-4 h-4" />
                      <span className="hidden sm:inline">Davom</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleExportChallenge(activeDetail)}
                    title="JSON eksport"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-bg border border-border text-text-secondary hover:text-text-primary flex items-center justify-center"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditChallenge(activeDetail)}
                    title="Tahrirlash"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-bg border border-border text-text-secondary hover:text-text-primary flex items-center justify-center"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {activeDetail.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => void archiveChallenge(activeDetail.id)}
                      title="Arxivlash"
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-bg border border-border text-text-secondary hover:text-amber-400 flex items-center justify-center"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(activeDetail)}
                    title="O'chirish"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-bg border border-border text-text-secondary hover:text-red-400 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-bg border border-border">
                  <div className="text-xs text-text-muted">Bajarilish</div>
                  <div className="text-xl font-bold font-mono text-text-primary mt-1">
                    {detailProgress.completionPercent}%
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-bg border border-border">
                  <div className="text-xs text-text-muted">Muvaffaqiyatli kunlar</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {detailProgress.successfulDays}/{detailProgress.totalActiveDays}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-bg border border-border">
                  <div className="text-xs text-text-muted">Eng yaxshi seriya</div>
                  <div className="text-xl font-bold font-mono text-text-primary mt-1">
                    {detailProgress.bestStreak}k
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-bg border border-border">
                  <div className="text-xs text-text-muted">Marra XP</div>
                  <div className="text-xl font-bold font-mono text-accent mt-1">
                    {detailProgress.challengeXp} XP
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">Marra kunlar xaritasi</h3>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Bajarilgan
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-red-500/70" /> O'tkazilgan
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm border-2 border-accent" /> Bugun
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-border" /> Kelgusi/Pauza
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                  {detailProgress.days.map((d) => {
                    const cls =
                      d.state === 'completed'
                        ? 'bg-emerald-500/85 border-emerald-400 text-white'
                        : d.state === 'missed'
                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : d.state === 'today'
                        ? 'bg-accent/20 border-2 border-accent text-accent font-bold'
                        : d.state === 'paused'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-bg border-border text-text-muted';

                    return (
                      <div
                        key={d.date}
                        title={`${d.dayNumber}-kun: ${formatUzbekFullDate(d.date)}`}
                        className={`h-9 rounded-lg border flex items-center justify-center text-xs font-mono ${cls}`}
                      >
                        {d.dayNumber}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-sm font-semibold text-text-primary">
                  Bog'langan vazifalar ({linkedMissions.length})
                </h3>
                {linkedMissions.length === 0 ? (
                  <p className="text-xs text-text-muted">
                    Ushbu marraga hali vazifalar bog'lanmagan.
                  </p>
                ) : (
                  <div className="divide-y divide-border rounded-xl bg-bg border border-border overflow-hidden">
                    {linkedMissions.map((m) => {
                      const doneToday = completionKeySet.has(makeCompletionKey(m.id, todayKey));
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => void toggleMissionCompletion(m.id, todayKey)}
                          className="w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-surface-hover text-left"
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                doneToday
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-text-muted/50'
                              }`}
                            >
                              {doneToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </span>
                            <span
                              className={`text-sm truncate ${
                                doneToday ? 'line-through text-text-muted' : 'text-text-primary'
                              }`}
                            >
                              {m.title}
                            </span>
                          </span>
                          <span className="text-xs font-mono text-text-muted shrink-0">
                            {m.xp} XP
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void deleteChallenge(deleteTarget.id);
        }}
        title="Marrani o'chirish"
        description={`"${deleteTarget?.name ?? ''}" marrasi o'chiriladi. Bog'langan vazifalar o'chirilmaydi.`}
        confirmLabel="O'chirish"
        danger
      />
    </div>
  );
};