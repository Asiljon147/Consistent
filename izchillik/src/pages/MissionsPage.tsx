import React, { useMemo, useState } from 'react';
import {
  Archive,
  Check,
  Edit3,
  History,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { MissionHistoryModal } from '../components/missions/MissionHistoryModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useApp } from '../state/AppContext';
import type { Mission, Priority, RecurrenceType } from '../types';
import { formatUzbekShortDate } from '../utils/date';
import {
  getMissedDatesForMission,
  isMissionScheduledOnDate,
  makeCompletionKey,
} from '../utils/gameLogic';

type MissionTab = 'active' | 'today' | 'upcoming' | 'completed' | 'archived';

interface MissionsPageProps {
  onOpenCreateMission: () => void;
  onEditMission: (mission: Mission) => void;
}

const PRIORITY_BADGE: Record<Priority, { label: string; className: string }> = {
  high: { label: 'YUQORI', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  medium: { label: "O'RTA", className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  low: { label: 'PAST', className: 'bg-slate-500/15 text-text-muted border-border' },
};

const RECURRENCE_LABEL: Record<RecurrenceType, string> = {
  daily: 'Har kuni',
  weekdays: 'Tanlangan kunlar',
  weekly: 'Haftalik',
  once: 'Bir martalik',
};

export const MissionsPage: React.FC<MissionsPageProps> = ({
  onOpenCreateMission,
  onEditMission,
}) => {
  const {
    missions,
    categories,
    completions,
    todayKey,
    toggleMissionCompletion,
    archiveMission,
    restoreMission,
    deleteMission,
  } = useApp();

  const [tab, setTab] = useState<MissionTab>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyMission, setHistoryMission] = useState<Mission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const completionsByMission = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of completions) {
      map.set(c.missionId, (map.get(c.missionId) ?? 0) + 1);
    }
    return map;
  }, [completions]);

  const completionKeySet = useMemo(() => new Set(completions.map((c) => c.id)), [completions]);

  const filteredMissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return missions.filter((m) => {
      if (selectedCategory !== 'all' && m.categoryId !== selectedCategory) return false;
      if (q && !m.title.toLowerCase().includes(q) && !m.description.toLowerCase().includes(q)) {
        return false;
      }

      const doneCount = completionsByMission.get(m.id) ?? 0;
      switch (tab) {
        case 'active':
          return m.status === 'active';
        case 'today':
          return isMissionScheduledOnDate(m, todayKey);
        case 'upcoming':
          return m.status === 'active' && m.startDate > todayKey;
        case 'completed':
          return doneCount > 0;
        case 'archived':
          return m.status === 'archived';
        default:
          return true;
      }
    });
  }, [completionsByMission, missions, searchQuery, selectedCategory, tab, todayKey]);

  const tabs: Array<{ id: MissionTab; label: string }> = [
    { id: 'active', label: 'Faol' },
    { id: 'today', label: 'Bugun' },
    { id: 'upcoming', label: 'Kelgusi' },
    { id: 'completed', label: 'Bajarilgan' },
    { id: 'archived', label: 'Arxiv' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Vazifalar</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Kunlik odatlar, rejali ishlar va bir martalik maqsadlarni boshqaring.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateMission}
          className="min-h-[44px] px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Vazifa qo'shish
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors ${
                tab === t.id
                  ? 'bg-accent border-accent text-white'
                  : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Kategoriya bo'yicha filtrlash"
            className="min-h-[44px] text-base bg-surface border border-border rounded-xl px-3 text-text-primary"
          >
            <option value="all">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Vazifa qidirish..."
              className="w-full min-h-[44px] pl-10 pr-3 text-base bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {filteredMissions.length === 0 ? (
        <div className="p-10 rounded-2xl bg-surface border border-border text-center space-y-3">
          <p className="text-sm text-text-muted">Ushbu bo'limda vazifalar topilmadi.</p>
          {tab !== 'archived' && (
            <button
              type="button"
              onClick={onOpenCreateMission}
              className="min-h-[44px] px-4 rounded-xl bg-accent/15 text-accent text-sm font-semibold"
            >
              + Yangi vazifa yaratish
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMissions.map((m) => {
            const cat = categoryMap.get(m.categoryId);
            const totalDone = completionsByMission.get(m.id) ?? 0;
            const doneToday = completionKeySet.has(makeCompletionKey(m.id, todayKey));
            const missedCount = getMissedDatesForMission(m, completions, todayKey, 30).length;
            const pBadge = PRIORITY_BADGE[m.priority];

            return (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-surface border border-border flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={m.status === 'archived'}
                    onClick={() => void toggleMissionCompletion(m.id, todayKey)}
                    aria-label={`${m.title} bajarilganini belgilash`}
                    className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      doneToday
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-text-muted/50 hover:border-accent'
                    } ${m.status === 'archived' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {doneToday && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-text-primary">{m.title}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${pBadge.className}`}
                      >
                        {pBadge.label}
                      </span>
                    </div>

                    {m.description && (
                      <p className="text-xs text-text-muted line-clamp-2">{m.description}</p>
                    )}

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1.5 text-text-secondary">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat?.color ?? '#3b82f6' }}
                        />
                        {cat?.name ?? 'Kategoriya'}
                      </span>
                      <span>{RECURRENCE_LABEL[m.recurrence]}</span>
                      <span className="font-mono text-text-primary font-semibold">+{m.xp} XP</span>
                      {m.targetQuantity !== null && (
                        <span className="font-mono">
                          Maqsad: {m.targetQuantity} {m.targetUnit || 'birlik'}
                        </span>
                      )}
                      <span>Boshlanish: {formatUzbekShortDate(m.startDate)}</span>
                      <span className="text-emerald-400 font-mono">
                        {totalDone} marta bajarilgan
                      </span>
                      {missedCount > 0 && (
                        <span className="text-red-400 font-mono">
                          {missedCount} kun o'tkazilgan
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setHistoryMission(m)}
                    title="Tarix"
                    className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditMission(m)}
                    title="Tahrirlash"
                    className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {m.status === 'archived' ? (
                    <button
                      type="button"
                      onClick={() => void restoreMission(m.id)}
                      title="Faollashtirish"
                      className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-emerald-400 hover:bg-surface-hover"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void archiveMission(m.id)}
                      title="Arxivlash"
                      className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-amber-400 hover:bg-surface-hover"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(m)}
                    title="O'chirish"
                    className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-surface-hover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative sm:hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                    aria-label="Amallar"
                    className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-hover"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === m.id && (
                    <div className="absolute right-0 mt-1 w-44 rounded-xl bg-surface-alt border border-border shadow-xl z-20 py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setHistoryMission(m);
                        }}
                        className="w-full min-h-[44px] px-3.5 text-left text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2.5"
                      >
                        <History className="w-4 h-4" /> Tarix
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onEditMission(m);
                        }}
                        className="w-full min-h-[44px] px-3.5 text-left text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2.5"
                      >
                        <Edit3 className="w-4 h-4" /> Tahrirlash
                      </button>
                      {m.status === 'archived' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            void restoreMission(m.id);
                          }}
                          className="w-full min-h-[44px] px-3.5 text-left text-sm text-emerald-400 hover:bg-surface-hover flex items-center gap-2.5"
                        >
                          <RotateCcw className="w-4 h-4" /> Faollashtirish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            void archiveMission(m.id);
                          }}
                          className="w-full min-h-[44px] px-3.5 text-left text-sm text-amber-400 hover:bg-surface-hover flex items-center gap-2.5"
                        >
                          <Archive className="w-4 h-4" /> Arxivlash
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setDeleteTarget(m);
                        }}
                        className="w-full min-h-[44px] px-3.5 text-left text-sm text-red-400 hover:bg-surface-hover flex items-center gap-2.5"
                      >
                        <Trash2 className="w-4 h-4" /> O'chirish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MissionHistoryModal mission={historyMission} onClose={() => setHistoryMission(null)} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void deleteMission(deleteTarget.id);
        }}
        title="Vazifani o'chirish"
        description={`"${deleteTarget?.title ?? ''}" vazifasi va uning barcha bajarilish yozuvlari o'chiriladi. Davom etasizmi?`}
        confirmLabel="O'chirish"
        danger
      />
    </div>
  );
};