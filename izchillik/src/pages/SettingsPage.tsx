import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Download,
  Edit3,
  Lock,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  showAppNotification,
} from '../services/notifications';
import { useApp } from '../state/AppContext';
import type { AppBackupPayload, Category, ThemeId } from '../types';
import {
  createFullBackupPayload,
  downloadJsonFile,
  validateFullBackupJson,
} from '../utils/exportImport';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const APP_VERSION = '1.0.0';
const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export const SettingsPage: React.FC = () => {
  const {
    settings,
    categories,
    missions,
    completions,
    challenges,
    achievements,
    updateSettings,
    upsertCategory,
    deleteCategory,
    importFullBackup,
    factoryReset,
    pushToast,
  } = useApp();

  const [displayName, setDisplayName] = useState(settings.displayName);
  const [theme, setTheme] = useState<ThemeId>(settings.theme);
  const [minMissionsPerDay, setMinMissionsPerDay] = useState(settings.minMissionsPerDay);
  const [weeklyMissionGoal, setWeeklyMissionGoal] = useState(settings.weeklyMissionGoal);
  const [xpEasy, setXpEasy] = useState(settings.xpPresets.easy);
  const [xpMedium, setXpMedium] = useState(settings.xpPresets.medium);
  const [xpDifficult, setXpDifficult] = useState(settings.xpPresets.difficult);
  const [xpMajor, setXpMajor] = useState(settings.xpPresets.major);

  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime);
  const [notifPermission, setNotifPermission] = useState(() => getNotificationPermissionStatus());

  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [pendingImport, setPendingImport] = useState<AppBackupPayload | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(settings.displayName);
    setTheme(settings.theme);
    setMinMissionsPerDay(settings.minMissionsPerDay);
    setWeeklyMissionGoal(settings.weeklyMissionGoal);
    setXpEasy(settings.xpPresets.easy);
    setXpMedium(settings.xpPresets.medium);
    setXpDifficult(settings.xpPresets.difficult);
    setXpMajor(settings.xpPresets.major);
    setReminderEnabled(settings.reminderEnabled);
    setReminderTime(settings.reminderTime);
  }, [settings]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      displayName: displayName.trim() || "Do'stim",
      theme,
      minMissionsPerDay: Math.max(1, Number(minMissionsPerDay) || 1),
      weeklyMissionGoal: Math.max(1, Number(weeklyMissionGoal) || 15),
      xpPresets: {
        easy: Math.max(1, Number(xpEasy) || 10),
        medium: Math.max(1, Number(xpMedium) || 25),
        difficult: Math.max(1, Number(xpDifficult) || 40),
        major: Math.max(1, Number(xpMajor) || 60),
      },
    });
    pushToast({ title: 'Sozlamalar saqlandi', variant: 'success' });
  };

  const handleThemeChange = async (nextTheme: ThemeId) => {
    setTheme(nextTheme);
    await updateSettings({ theme: nextTheme });
  };

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled) {
      const perm = await requestNotificationPermission();
      setNotifPermission(perm);
      if (perm === 'denied') {
        pushToast({
          title: 'Brauzer bildirishnomasi bloklangan',
          description: "Brauzer sozlamalaridan ruxsat bersangiz, eslatmalar ko'rinadi.",
          variant: 'warning',
        });
      }
    }
    setReminderEnabled(enabled);
    await updateSettings({ reminderEnabled: enabled, reminderTime });
  };

  const handleReminderTimeChange = async (time: string) => {
    setReminderTime(time);
    await updateSettings({ reminderTime: time });
  };

  const handleTestNotification = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    const ok = await showAppNotification(
      'Izchillik — Test eslatma',
      'Kunlik eslatma tizimi muvaffaqiyatli ishlamoqda!'
    );
    if (!ok) {
      pushToast({
        title: 'Test xabari (Ilova ichida)',
        description: 'Brauzer bildirishnomasi ruxsati berilmagan, lekin ilova ichida ishlaydi.',
        variant: 'info',
      });
    } else {
      pushToast({ title: 'Test bildirishnomasi yuborildi', variant: 'success' });
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pinInput)) {
      pushToast({
        title: "Noto'g'ri PIN formati",
        description: "PIN-kod 4 tadan 8 tagacha raqamdan iborat bo'lishi kerak.",
        variant: 'warning',
      });
      return;
    }
    if (pinInput !== pinConfirm) {
      pushToast({ title: 'PIN-kodlar mos kelmadi', variant: 'warning' });
      return;
    }
    await updateSettings({ pinCode: pinInput });
    setPinInput('');
    setPinConfirm('');
    pushToast({ title: "PIN-kod o'rnatildi", variant: 'success' });
  };

  const handleClearPin = async () => {
    await updateSettings({ pinCode: null });
    pushToast({ title: 'PIN-kod olib tashlandi', variant: 'info' });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      if (!editingCat.name.trim()) return;
      await upsertCategory({ ...editingCat, name: editingCat.name.trim() });
      setEditingCat(null);
      pushToast({ title: 'Kategoriya yangilandi', variant: 'success' });
      return;
    }
    if (!newCatName.trim()) return;
    await upsertCategory({
      id: `cat-${crypto.randomUUID()}`,
      name: newCatName.trim(),
      color: newCatColor,
    });
    setNewCatName('');
    pushToast({ title: "Kategoriya qo'shildi", variant: 'success' });
  };

  const handleExportAll = () => {
    const payload = createFullBackupPayload({
      settings,
      categories,
      missions,
      completions,
      challenges,
      achievements,
    });
    downloadJsonFile(`izchillik-zaxira-${new Date().toISOString().slice(0, 10)}.json`, payload);
    pushToast({ title: 'Zaxira nusxa yuklab olindi', variant: 'success' });
  };

  const handleImportSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const validated = validateFullBackupJson(text);
      setPendingImport(validated);
    } catch (err: unknown) {
      pushToast({
        title: 'Import xatosi',
        description: err instanceof Error ? err.message : 'Fayl yaroqsiz.',
        variant: 'error',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleInstallPwa = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    const res = await installPromptEvent.userChoice;
    if (res.outcome === 'accepted') {
      setInstallPromptEvent(null);
      pushToast({ title: "Ilova o'rnatildi!", variant: 'success' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Sozlamalar</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Shaxsiy profil, mavzu, seriya qoidalari, kategoriyalar va ma'lumotlar zaxirasi.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSaveGeneral(e)}
        className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-4"
      >
        <h2 className="text-base font-semibold text-text-primary">
          Umumiy va rivojlanish sozlamalari
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Salomlashishdagi ismingiz
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Do'stim"
              className="w-full min-h-[44px] text-base bg-bg border border-border rounded-xl px-3.5 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Mavzu (Theme)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'obsidian', label: "Qorong'i" },
                  { id: 'midnight', label: 'Zumrad' },
                  { id: 'light', label: "Yorug'" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => void handleThemeChange(t.id)}
                  className={`min-h-[44px] rounded-xl text-xs font-semibold border inline-flex items-center justify-center gap-1.5 transition-colors ${
                    theme === t.id
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-bg border-border text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Seriya qoidasi (kuniga kamida N ta vazifa)
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={minMissionsPerDay}
              onChange={(e) => setMinMissionsPerDay(Number(e.target.value))}
              className="w-full min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3.5 text-text-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Haftalik vazifa maqsadi
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={weeklyMissionGoal}
              onChange={(e) => setWeeklyMissionGoal(Number(e.target.value))}
              className="w-full min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3.5 text-text-primary"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="text-xs font-medium text-text-secondary">
            Standart XP shablonlari (yangi vazifalar uchun)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Oson</label>
              <input
                type="number"
                min={1}
                value={xpEasy}
                onChange={(e) => setXpEasy(Number(e.target.value))}
                className="w-full min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">O'rta</label>
              <input
                type="number"
                min={1}
                value={xpMedium}
                onChange={(e) => setXpMedium(Number(e.target.value))}
                className="w-full min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Qiyin</label>
              <input
                type="number"
                min={1}
                value={xpDifficult}
                onChange={(e) => setXpDifficult(Number(e.target.value))}
                className="w-full min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Katta</label>
              <input
                type="number"
                min={1}
                value={xpMajor}
                onChange={(e) => setXpMajor(Number(e.target.value))}
                className="w-full min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Sozlamalarni saqlash
          </button>
        </div>
      </form>

      <section className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-4">
        <h2 className="text-base font-semibold text-text-primary">Kategoriyalar boshqaruvi</h2>

        <form onSubmit={(e) => void handleSaveCategory(e)} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={editingCat ? editingCat.name : newCatName}
              onChange={(e) =>
                editingCat
                  ? setEditingCat({ ...editingCat, name: e.target.value })
                  : setNewCatName(e.target.value)
              }
              placeholder="Yangi kategoriya nomi..."
              className="flex-1 min-h-[44px] text-base bg-bg border border-border rounded-xl px-3.5 text-text-primary"
            />
            <div className="flex items-center gap-2">
              {CATEGORY_COLORS.map((c) => {
                const selected = editingCat ? editingCat.color === c : newCatColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      editingCat ? setEditingCat({ ...editingCat, color: c }) : setNewCatColor(c)
                    }
                    className={`w-7 h-7 rounded-full border-2 ${
                      selected ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Rang ${c}`}
                  />
                );
              })}
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {editingCat ? 'Saqlash' : "Qo'shish"}
            </button>
            {editingCat && (
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="min-h-[44px] px-3 rounded-xl border border-border text-xs text-text-secondary"
              >
                Bekor
              </button>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-bg border border-border"
            >
              <span className="inline-flex items-center gap-2.5 text-sm text-text-primary font-medium">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditingCat(cat)}
                  aria-label={`${cat.name} tahrirlash`}
                  className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteCategory(cat.id)}
                  aria-label={`${cat.name} o'chirish`}
                  className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-text-muted hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          <h2 className="text-base font-semibold text-text-primary">Kunlik eslatma</h2>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          Ilova ochiq yoki o'rnatilgan holatda ishlaganda belgilangan vaqtda bajarilmagan vazifalar
          haqida eslatma chiqaradi (ruxsat holati:{' '}
          <span className="font-mono text-text-primary">{notifPermission}</span>). Ilova butunlay
          yopiq paytdagi fon push-bildirishnomalari uchun README dagi Web Push (VAPID + Netlify
          Function) sozlamasi talab qilinadi.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer text-sm text-text-primary">
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => void handleToggleReminder(e.target.checked)}
              className="w-4 h-4 accent-blue-500 rounded"
            />
            Eslatmani yoqish
          </label>

          <input
            type="time"
            value={reminderTime}
            onChange={(e) => void handleReminderTimeChange(e.target.value)}
            className="min-h-[44px] text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary"
          />

          <button
            type="button"
            onClick={() => void handleTestNotification()}
            className="min-h-[44px] px-4 rounded-xl bg-bg border border-border hover:bg-surface-hover text-xs font-semibold text-text-primary"
          >
            Test yuborish
          </button>
        </div>
      </section>

      <section className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <h2 className="text-base font-semibold text-text-primary">PIN-kod qulfi (ixtiyoriy)</h2>
          </div>
          {settings.pinCode && <span className="text-xs font-mono text-emerald-400">Yoqilgan</span>}
        </div>
        <p className="text-xs text-text-muted">
          Ilovani ochishda PIN-kod so'raydi. Bu faqat tasodifiy ko'zlardan himoya qiladi —
          ma'lumotlarni kriptografik shifrlamaydi va JSON zaxiraga qo'shilmaydi.
        </p>

        <form onSubmit={(e) => void handleSetPin(e)} className="flex flex-wrap items-center gap-2">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="PIN (4-8 raqam)"
            className="min-h-[44px] w-40 text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary"
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value)}
            placeholder="PINni tasdiqlang"
            className="min-h-[44px] w-40 text-base font-mono bg-bg border border-border rounded-xl px-3 text-text-primary"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold"
          >
            PIN o'rnatish
          </button>
          {settings.pinCode && (
            <button
              type="button"
              onClick={() => void handleClearPin()}
              className="min-h-[44px] px-4 rounded-xl bg-bg border border-border text-xs font-semibold text-red-400 hover:bg-surface-hover"
            >
              O'chirish
            </button>
          )}
        </form>
      </section>

      <section className="p-4 sm:p-6 rounded-2xl bg-surface border border-border space-y-4">
        <h2 className="text-base font-semibold text-text-primary">
          Zaxira nusxa, tiklash va ilova
        </h2>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleExportAll}
            className="min-h-[44px] px-4 rounded-xl bg-bg border border-border hover:bg-surface-hover text-sm font-medium text-text-primary inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-accent" />
            JSON eksport
          </button>

          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            className="min-h-[44px] px-4 rounded-xl bg-bg border border-border hover:bg-surface-hover text-sm font-medium text-text-primary inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            JSON import
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json"
            onChange={(e) => void handleImportSelect(e)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="min-h-[44px] px-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-sm font-medium text-red-400 inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Barchasini tozalash
          </button>
        </div>

        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Smartphone className="w-4 h-4 text-accent shrink-0" />
            <span>
              Izchillik PWA v<span className="font-mono text-text-primary">{APP_VERSION}</span> ·
              Oflayn rejim faol
            </span>
          </div>

          {installPromptEvent ? (
            <button
              type="button"
              onClick={() => void handleInstallPwa()}
              className="min-h-[44px] px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold"
            >
              Ilovani telefonga / kompyuterga o'rnatish
            </button>
          ) : (
            <span className="text-[11px] text-text-muted">
              iOS Safari: Ulashish → "Asosiy ekranga qo'shish" orqali o'rnating.
            </span>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) void importFullBackup(pendingImport);
        }}
        title="Zaxira nusxani tiklash"
        description={`Import qilinayotgan faylda ${pendingImport?.missions.length ?? 0} ta vazifa va ${pendingImport?.completions.length ?? 0} ta bajarilish yozuvi bor. Hozirgi ma'lumotlar o'rniga yoziladi. Davom etasizmi?`}
        confirmLabel="Tiklash"
      />

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => void factoryReset()}
        title="Barcha ma'lumotlarni tozalash"
        description="Barcha vazifalar, marralar, XP, seriyalar va yutuqlar butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi."
        confirmLabel="Tozalash"
        danger
      />
    </div>
  );
};