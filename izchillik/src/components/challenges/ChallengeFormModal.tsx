import React, { useEffect, useState } from 'react';
import { useApp } from '../../state/AppContext';
import type { Challenge, ChallengeDailyCriteria } from '../../types';
import { addDays, diffDays } from '../../utils/date';
import { BottomSheetModal } from '../ui/BottomSheetModal';

interface ChallengeFormModalProps {
  open: boolean;
  onClose: () => void;
  editingChallenge?: Challenge | null;
}

const COVER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const DURATION_CHIPS = [7, 30, 45, 90] as const;

export const ChallengeFormModal: React.FC<ChallengeFormModalProps> = ({
  open,
  onClose,
  editingChallenge,
}) => {
  const { categories, missions, todayKey, upsertChallenge, pushToast } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 'cat-deep-work');
  const [color, setColor] = useState(COVER_COLORS[0]);
  const [startDate, setStartDate] = useState(todayKey);
  const [durationDays, setDurationDays] = useState(30);
  const [endDate, setEndDate] = useState(addDays(todayKey, 29));
  const [dailyCriteria, setDailyCriteria] = useState<ChallengeDailyCriteria>('any');
  const [linkedMissionIds, setLinkedMissionIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingChallenge) {
      setName(editingChallenge.name);
      setDescription(editingChallenge.description);
      setCategoryId(editingChallenge.categoryId);
      setColor(editingChallenge.color);
      setStartDate(editingChallenge.startDate);
      setEndDate(editingChallenge.endDate);
      setDurationDays(Math.max(1, diffDays(editingChallenge.startDate, editingChallenge.endDate) + 1));
      setDailyCriteria(editingChallenge.dailyCriteria);
      setLinkedMissionIds(editingChallenge.linkedMissionIds);
    } else {
      setName('');
      setDescription('');
      setCategoryId(categories[0]?.id ?? 'cat-deep-work');
      setColor(COVER_COLORS[0]);
      setStartDate(todayKey);
      setDurationDays(30);
      setEndDate(addDays(todayKey, 29));
      setDailyCriteria('any');
      setLinkedMissionIds([]);
    }
    setFormError('');
  }, [open, editingChallenge, categories, todayKey]);

  const handleDurationChange = (days: number) => {
    const safe = Math.max(1, days);
    setDurationDays(safe);
    setEndDate(addDays(startDate, safe - 1));
  };

  const handleStartDateChange = (nextStart: string) => {
    setStartDate(nextStart);
    setEndDate(addDays(nextStart, Math.max(1, durationDays) - 1));
  };

  const handleEndDateChange = (nextEnd: string) => {
    setEndDate(nextEnd);
    if (nextEnd >= startDate) {
      setDurationDays(diffDays(startDate, nextEnd) + 1);
    }
  };

  const toggleMission = (id: string) => {
    setLinkedMissionIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Marra nomini kiriting.');
      return;
    }
    if (endDate < startDate) {
      setFormError("Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas.");
      return;
    }

    const now = new Date().toISOString();
    const challenge: Challenge = {
      id: editingChallenge?.id ?? `ch-${crypto.randomUUID()}`,
      name: name.trim(),
      description: description.trim(),
      categoryId,
      color,
      startDate,
      endDate,
      linkedMissionIds,
      dailyCriteria,
      status: editingChallenge?.status ?? 'active',
      pauseIntervals: editingChallenge?.pauseIntervals ?? [],
      createdAt: editingChallenge?.createdAt ?? now,
      updatedAt: now,
    };

    await upsertChallenge(challenge);
    pushToast({
      title: editingChallenge ? 'Marra yangilandi' : 'Yangi marra boshlandi!',
      variant: 'success',
    });
    onClose();
  };

  const activeMissions = missions.filter((m) => m.status === 'active');

  return (
    <BottomSheetModal
      open={open}
      onClose={onClose}
      title={editingChallenge ? 'Marrani tahrirlash' : 'Marra yaratish'}
      maxWidthClass="md:max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-sm text-red-300">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Marra nomi *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: 45 kunlik video montaj"
            className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3.5 text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Tavsif va qoidalar
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Maqsad va kundalik qoidalar..."
            className="w-full text-base bg-bg border border-border rounded-xl px-3.5 py-2.5 text-text-primary focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Kategoriya
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3 text-text-primary"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Muqova rangi
            </label>
            <div className="flex items-center gap-2 min-h-[44px]">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Rang ${c}`}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Davomiyligi (kun)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DURATION_CHIPS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDurationChange(d)}
                className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold border transition-colors ${
                  durationDays === d
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-bg border-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {d} kun
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={365}
              value={durationDays}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              className="w-24 min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary text-center"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Boshlanish sanasi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Tugash sanasi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3 text-text-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Kunlik bajarish mezoni
          </label>
          <select
            value={dailyCriteria}
            onChange={(e) => setDailyCriteria(e.target.value as ChallengeDailyCriteria)}
            className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3 text-text-primary"
          >
            <option value="any">Kuniga kamida 1 ta bog'langan vazifani bajarish</option>
            <option value="all">Bog'langan barcha vazifalarni bajarish</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Bog'langan vazifalar ({linkedMissionIds.length} ta tanlandi)
          </label>
          {activeMissions.length === 0 ? (
            <p className="text-xs text-text-muted p-3 rounded-xl bg-bg border border-border">
              Hali faol vazifalar mavjud emas. Avval Vazifalar bo'limida vazifa yarating.
            </p>
          ) : (
            <div className="max-h-44 overflow-y-auto rounded-xl bg-bg border border-border divide-y divide-border">
              {activeMissions.map((m) => {
                const checked = linkedMissionIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2.5 min-h-[44px] cursor-pointer hover:bg-surface-hover"
                  >
                    <span className="flex items-center gap-3 text-sm text-text-primary">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMission(m.id)}
                        className="w-4 h-4 accent-blue-500 rounded"
                      />
                      <span>{m.title}</span>
                    </span>
                    <span className="text-xs font-mono text-text-muted">{m.xp} XP</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-hover"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
          >
            {editingChallenge ? 'Saqlash' : 'Marrani boshlash'}
          </button>
        </div>
      </form>
    </BottomSheetModal>
  );
};