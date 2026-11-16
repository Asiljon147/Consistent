import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Mission, Priority, RecurrenceType } from '../../types';
import { UZ_WEEKDAYS_SHORT_MON_FIRST } from '../../utils/date';
import { BottomSheetModal } from '../ui/BottomSheetModal';

interface MissionFormModalProps {
  open: boolean;
  onClose: () => void;
  editingMission?: Mission | null;
}

const COLOR_SWATCHES = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export const MissionFormModal: React.FC<MissionFormModalProps> = ({
  open,
  onClose,
  editingMission,
}) => {
  const {
    categories,
    challenges,
    settings,
    todayKey,
    upsertCategory,
    upsertMission,
    upsertChallenge,
    pushToast,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 'cat-deep-work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [xp, setXp] = useState<number>(settings.xpPresets.medium);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(todayKey);
  const [deadline, setDeadline] = useState('');
  const [targetQuantity, setTargetQuantity] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [linkedChallengeIds, setLinkedChallengeIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_SWATCHES[0]);

  useEffect(() => {
    if (!open) return;
    if (editingMission) {
      setTitle(editingMission.title);
      setDescription(editingMission.description);
      setCategoryId(editingMission.categoryId);
      setPriority(editingMission.priority);
      setXp(editingMission.xp);
      setRecurrence(editingMission.recurrence);
      setWeekdays(editingMission.weekdays.length > 0 ? editingMission.weekdays : [1, 3, 5]);
      setStartDate(editingMission.startDate);
      setDeadline(editingMission.deadline ?? '');
      setTargetQuantity(
        editingMission.targetQuantity !== null ? String(editingMission.targetQuantity) : ''
      );
      setTargetUnit(editingMission.targetUnit);
      setEstimatedMinutes(
        editingMission.estimatedMinutes !== null ? String(editingMission.estimatedMinutes) : ''
      );
      setLinkedChallengeIds(
        challenges
          .filter((ch) => ch.linkedMissionIds.includes(editingMission.id))
          .map((ch) => ch.id)
      );
    } else {
      setTitle('');
      setDescription('');
      setCategoryId(categories[0]?.id ?? 'cat-deep-work');
      setPriority('medium');
      setXp(settings.xpPresets.medium);
      setRecurrence('daily');
      setWeekdays([1, 2, 3, 4, 5]);
      setStartDate(todayKey);
      setDeadline('');
      setTargetQuantity('');
      setTargetUnit('');
      setEstimatedMinutes('');
      setLinkedChallengeIds([]);
    }
    setFormError('');
    setAddingCat(false);
    setNewCatName('');
  }, [open, editingMission, categories, challenges, settings.xpPresets.medium, todayKey]);

  const toggleWeekday = (isoDay: number) => {
    setWeekdays((prev) =>
      prev.includes(isoDay) ? prev.filter((d) => d !== isoDay) : [...prev, isoDay].sort()
    );
  };

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const cat = {
      id: `cat-${crypto.randomUUID()}`,
      name: trimmed,
      color: newCatColor,
    };
    await upsertCategory(cat);
    setCategoryId(cat.id);
    setAddingCat(false);
    setNewCatName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Vazifa nomini kiriting.');
      return;
    }
    if (recurrence === 'weekdays' && weekdays.length === 0) {
      setFormError('Kamida bitta hafta kunini tanlang.');
      return;
    }
    if (deadline && deadline < startDate) {
      setFormError("Tugash muddati boshlanish sanasidan oldin bo'lishi mumkin emas.");
      return;
    }

    const now = new Date().toISOString();
    const missionId = editingMission?.id ?? `m-${crypto.randomUUID()}`;
    const mission: Mission = {
      id: missionId,
      title: trimmedTitle,
      description: description.trim(),
      categoryId,
      priority,
      xp: Math.max(1, Number(xp) || settings.xpPresets.medium),
      recurrence,
      weekdays: recurrence === 'weekdays' ? weekdays : [],
      startDate,
      deadline: deadline || null,
      targetQuantity: targetQuantity ? Math.max(1, Number(targetQuantity)) : null,
      targetUnit: targetUnit.trim(),
      estimatedMinutes: estimatedMinutes ? Math.max(1, Number(estimatedMinutes)) : null,
      status: editingMission?.status ?? 'active',
      createdAt: editingMission?.createdAt ?? now,
      updatedAt: now,
    };

    await upsertMission(mission);

    for (const ch of challenges) {
      const shouldLink = linkedChallengeIds.includes(ch.id);
      const isLinked = ch.linkedMissionIds.includes(missionId);
      if (shouldLink && !isLinked) {
        await upsertChallenge({
          ...ch,
          linkedMissionIds: [...ch.linkedMissionIds, missionId],
          updatedAt: now,
        });
      } else if (!shouldLink && isLinked) {
        await upsertChallenge({
          ...ch,
          linkedMissionIds: ch.linkedMissionIds.filter((id) => id !== missionId),
          updatedAt: now,
        });
      }
    }

    pushToast({
      title: editingMission ? 'Vazifa yangilandi' : "Yangi vazifa qo'shildi",
      variant: 'success',
    });
    onClose();
  };

  const presets = [
    { label: `Oson (${settings.xpPresets.easy})`, value: settings.xpPresets.easy },
    { label: `O'rta (${settings.xpPresets.medium})`, value: settings.xpPresets.medium },
    { label: `Qiyin (${settings.xpPresets.difficult})`, value: settings.xpPresets.difficult },
    { label: `Katta (${settings.xpPresets.major})`, value: settings.xpPresets.major },
  ];

  const activeChallenges = challenges.filter(
    (c) => c.status === 'active' || c.status === 'paused'
  );

  return (
    <BottomSheetModal
      open={open}
      onClose={onClose}
      title={editingMission ? 'Vazifani tahrirlash' : 'Vazifa yaratish'}
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
            Sarlavha *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: Koreys tilidan 10 ta so'z yodlash"
            className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3.5 text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Tavsif</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bajarilish mezoni yoki eslatma..."
            className="w-full text-base bg-bg border border-border rounded-xl px-3.5 py-2.5 text-text-primary focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-secondary">Kategoriya *</label>
              <button
                type="button"
                onClick={() => setAddingCat((v) => !v)}
                className="text-xs text-accent hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Yangi
              </button>
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3 text-text-primary focus:outline-none focus:border-accent"
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
              Muhimlik darajasi
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'low', label: 'Past' },
                  { id: 'medium', label: "O'rta" },
                  { id: 'high', label: 'Yuqori' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`min-h-[44px] rounded-xl text-xs font-semibold border transition-colors ${
                    priority === p.id
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-bg border-border text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {addingCat && (
          <div className="p-3 rounded-xl bg-bg border border-border space-y-2.5">
            <div className="text-xs font-semibold text-text-primary">Yangi kategoriya qo'shish</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Kategoriya nomi"
                className="flex-1 min-h-[44px] text-base bg-surface border border-border rounded-xl px-3 text-text-primary"
              />
              <button
                type="button"
                onClick={() => void handleAddCategory()}
                className="min-h-[44px] px-4 rounded-xl bg-accent text-white text-sm font-semibold"
              >
                Qo'shish
              </button>
            </div>
            <div className="flex gap-2">
              {COLOR_SWATCHES.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNewCatColor(col)}
                  className={`w-7 h-7 rounded-full border-2 ${
                    newCatColor === col ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: col }}
                  aria-label={`Rang ${col}`}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            XP mukofoti
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setXp(p.value)}
                className={`min-h-[44px] px-3 rounded-xl text-xs font-medium border transition-colors ${
                  xp === p.value
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-bg border-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {p.label}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={1000}
              value={xp}
              onChange={(e) => setXp(Number(e.target.value))}
              className="w-20 min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary text-center"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Takrorlanish
          </label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
            className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3 text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="daily">Har kuni</option>
            <option value="weekdays">Tanlangan hafta kunlari</option>
            <option value="weekly">Haftalik</option>
            <option value="once">Bir martalik</option>
          </select>

          {recurrence === 'weekdays' && (
            <div className="grid grid-cols-7 gap-1.5 mt-2">
              {UZ_WEEKDAYS_SHORT_MON_FIRST.map((dayLabel, idx) => {
                const isoDay = idx + 1;
                const active = weekdays.includes(isoDay);
                return (
                  <button
                    key={isoDay}
                    type="button"
                    onClick={() => toggleWeekday(isoDay)}
                    className={`min-h-[44px] rounded-xl text-xs font-semibold border transition-colors ${
                      active
                        ? 'bg-accent border-accent text-white'
                        : 'bg-bg border-border text-text-secondary'
                    }`}
                  >
                    {dayLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Boshlanish sanasi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Ixtiyoriy muddat (deadline)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3 text-text-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Miqdor</label>
            <input
              type="number"
              min={1}
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(e.target.value)}
              placeholder="20"
              className="w-full min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Birlik</label>
            <input
              type="text"
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              placeholder="so'z, bet..."
              className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Daqiqa</label>
            <input
              type="number"
              min={1}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="30"
              className="w-full min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary"
            />
          </div>
        </div>

        {activeChallenges.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Marraga bog'lash (ixtiyoriy)
            </label>
            <div className="flex flex-wrap gap-2">
              {activeChallenges.map((ch) => {
                const selected = linkedChallengeIds.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() =>
                      setLinkedChallengeIds((prev) =>
                        selected ? prev.filter((id) => id !== ch.id) : [...prev, ch.id]
                      )
                    }
                    className={`min-h-[44px] px-3 rounded-xl text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-bg border-border text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {ch.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
            {editingMission ? 'Saqlash' : 'Vazifa yaratish'}
          </button>
        </div>
      </form>
    </BottomSheetModal>
  );
};