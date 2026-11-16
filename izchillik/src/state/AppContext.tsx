import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  deleteCompletion,
  loadAllData,
  putCompletion,
  removeCategory,
  removeChallenge,
  removeMissionAndCompletions,
  replaceAllData,
  resetAllData,
  saveAchievements,
  saveCategory,
  saveChallenge,
  saveMission,
  saveSettings,
} from '../services/db';
import { showAppNotification } from '../services/notifications';
import type {
  AppBackupPayload,
  Category,
  Challenge,
  ChallengeExportPayload,
  CompletionRecord,
  LevelInfo,
  Mission,
  PageId,
  ToastMessage,
  UnlockedAchievement,
  UserSettings,
} from '../types';
import { toDateKey } from '../utils/date';
import {
  type AchievementProgressItem,
  calculateLevelInfo,
  calculateStreaks,
  calculateTotalXp,
  evaluateAchievements,
  getScheduledMissionsForDate,
  makeCompletionKey,
} from '../utils/gameLogic';

interface AppContextValue {
  loading: boolean;
  error: string | null;
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  selectedChallengeId: string | null;
  setSelectedChallengeId: (id: string | null) => void;
  todayKey: string;

  settings: UserSettings;
  categories: Category[];
  missions: Mission[];
  completions: CompletionRecord[];
  challenges: Challenge[];
  achievements: UnlockedAchievement[];
  achievementProgress: AchievementProgressItem[];

  totalXp: number;
  levelInfo: LevelInfo;
  currentStreak: number;
  longestStreak: number;

  isLocked: boolean;
  unlockApp: (pin: string) => boolean;

  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  upsertCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  upsertMission: (mission: Mission) => Promise<void>;
  archiveMission: (missionId: string) => Promise<void>;
  restoreMission: (missionId: string) => Promise<void>;
  deleteMission: (missionId: string) => Promise<void>;
  toggleMissionCompletion: (missionId: string, dateKey: string) => Promise<void>;
  upsertChallenge: (challenge: Challenge) => Promise<void>;
  pauseChallenge: (challengeId: string) => Promise<void>;
  resumeChallenge: (challengeId: string) => Promise<void>;
  archiveChallenge: (challengeId: string) => Promise<void>;
  deleteChallenge: (challengeId: string) => Promise<void>;
  importChallengePayload: (payload: ChallengeExportPayload) => Promise<void>;
  importFullBackup: (payload: AppBackupPayload) => Promise<void>;
  factoryReset: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [todayKey, setTodayKey] = useState(() => toDateKey());

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${crypto.randomUUID()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let mounted = true;
    loadAllData()
      .then((data) => {
        if (!mounted) return;
        setSettings(data.settings);
        setCategories(data.categories);
        setMissions(data.missions);
        setCompletions(data.completions);
        setChallenges(data.challenges);
        setAchievements(data.achievements);
        if (data.settings.pinCode) {
          setIsLocked(true);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik yuz berdi.");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = toDateKey();
      setTodayKey((prev) => (prev === current ? prev : current));
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading) return;
    const toComplete = challenges.filter(
      (ch) => ch.status === 'active' && ch.endDate < todayKey
    );
    if (toComplete.length === 0) return;

    const updated = challenges.map((ch) =>
      ch.status === 'active' && ch.endDate < todayKey
        ? { ...ch, status: 'completed' as const, updatedAt: new Date().toISOString() }
        : ch
    );
    setChallenges(updated);
    for (const ch of updated) {
      if (toComplete.some((item) => item.id === ch.id)) {
        void saveChallenge(ch);
      }
    }
  }, [challenges, loading, todayKey]);

  const totalXp = useMemo(() => calculateTotalXp(completions), [completions]);
  const levelInfo = useMemo(() => calculateLevelInfo(totalXp), [totalXp]);
  const streakInfo = useMemo(
    () => calculateStreaks(completions, settings.minMissionsPerDay, todayKey),
    [completions, settings.minMissionsPerDay, todayKey]
  );

  const achievementEval = useMemo(
    () =>
      evaluateAchievements({
        missions,
        completions,
        challenges,
        existingUnlocked: achievements,
        minMissionsPerDay: settings.minMissionsPerDay,
        todayKey,
        nowIso: new Date().toISOString(),
      }),
    [achievements, challenges, completions, missions, settings.minMissionsPerDay, todayKey]
  );

  useEffect(() => {
    if (loading || achievementEval.newlyUnlocked.length === 0) return;
    const newly = achievementEval.newlyUnlocked;
    setAchievements((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const uniqueNew = newly.filter((n) => !existingIds.has(n.id));
      return uniqueNew.length > 0 ? [...prev, ...uniqueNew] : prev;
    });
    void saveAchievements(newly);

    for (const unlocked of newly) {
      const def = achievementEval.progressList.find(
        (p) => p.definition.id === unlocked.id
      )?.definition;
      if (def) {
        pushToast({
          title: `Yangi yutuq: ${def.title}!`,
          description: def.description,
          variant: 'achievement',
        });
      }
    }
  }, [achievementEval, loading, pushToast]);

  useEffect(() => {
    if (loading || !settings.reminderEnabled) return;

    const checkReminder = async () => {
      const now = new Date();
      const currentDate = toDateKey(now);
      if (settings.lastReminderFiredDate === currentDate) return;

      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentHHMM = `${hh}:${mm}`;
      if (currentHHMM < settings.reminderTime) return;

      const scheduledToday = getScheduledMissionsForDate(missions, currentDate);
      const doneSet = new Set(
        completions.filter((c) => c.date === currentDate).map((c) => c.missionId)
      );
      const remaining = scheduledToday.filter((m) => !doneSet.has(m.id)).length;

      if (remaining > 0) {
        const sent = await showAppNotification(
          'Izchillik — Kunlik eslatma',
          `Bugun bajarilmagan ${remaining} ta vazifangiz qoldi.`
        );
        if (!sent) {
          pushToast({
            title: 'Kunlik eslatma',
            description: `Bugun ${remaining} ta vazifangiz bajarilishini kutmoqda.`,
            variant: 'info',
          });
        }
        const nextSettings: UserSettings = {
          ...settings,
          lastReminderFiredDate: currentDate,
        };
        setSettings(nextSettings);
        await saveSettings(nextSettings);
      }
    };

    void checkReminder();
    const timer = window.setInterval(() => {
      void checkReminder();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [completions, loading, missions, pushToast, settings]);

  const unlockApp = useCallback(
    (pin: string): boolean => {
      if (!settings.pinCode || pin === settings.pinCode) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [settings.pinCode]
  );

  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      const next: UserSettings = {
        ...settings,
        ...partial,
        id: 'user_settings',
      };
      setSettings(next);
      await saveSettings(next);
    },
    [settings]
  );

  const upsertCategory = useCallback(async (category: Category) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === category.id);
      return exists ? prev.map((c) => (c.id === category.id ? category : c)) : [...prev, category];
    });
    await saveCategory(category);
  }, []);

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      if (categories.length <= 1) {
        pushToast({
          title: "O'chirib bo'lmaydi",
          description: 'Kamida bitta kategoriya qolishi shart.',
          variant: 'warning',
        });
        return;
      }
      const fallbackId = categories.find((c) => c.id !== categoryId)?.id ?? categories[0].id;
      const affectedMissions = missions
        .filter((m) => m.categoryId === categoryId)
        .map((m) => ({ ...m, categoryId: fallbackId, updatedAt: new Date().toISOString() }));

      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setMissions((prev) =>
        prev.map((m) => (m.categoryId === categoryId ? { ...m, categoryId: fallbackId } : m))
      );

      await Promise.all([
        removeCategory(categoryId),
        ...affectedMissions.map((m) => saveMission(m)),
      ]);
    },
    [categories, missions, pushToast]
  );

  const upsertMission = useCallback(async (mission: Mission) => {
    setMissions((prev) => {
      const exists = prev.some((m) => m.id === mission.id);
      return exists ? prev.map((m) => (m.id === mission.id ? mission : m)) : [mission, ...prev];
    });
    await saveMission(mission);
  }, []);

  const archiveMission = useCallback(
    async (missionId: string) => {
      const target = missions.find((m) => m.id === missionId);
      if (!target) return;
      await upsertMission({
        ...target,
        status: 'archived',
        updatedAt: new Date().toISOString(),
      });
      pushToast({ title: 'Vazifa arxivlandi', variant: 'info' });
    },
    [missions, pushToast, upsertMission]
  );

  const restoreMission = useCallback(
    async (missionId: string) => {
      const target = missions.find((m) => m.id === missionId);
      if (!target) return;
      await upsertMission({
        ...target,
        status: 'active',
        updatedAt: new Date().toISOString(),
      });
      pushToast({ title: 'Vazifa faollashtirildi', variant: 'success' });
    },
    [missions, pushToast, upsertMission]
  );

  const deleteMission = useCallback(
    async (missionId: string) => {
      const affectedChallenges = challenges
        .filter((ch) => ch.linkedMissionIds.includes(missionId))
        .map((ch) => ({
          ...ch,
          linkedMissionIds: ch.linkedMissionIds.filter((id) => id !== missionId),
          updatedAt: new Date().toISOString(),
        }));

      setMissions((prev) => prev.filter((m) => m.id !== missionId));
      setCompletions((prev) => prev.filter((c) => c.missionId !== missionId));
      setChallenges((prev) =>
        prev.map((ch) => ({
          ...ch,
          linkedMissionIds: ch.linkedMissionIds.filter((id) => id !== missionId),
        }))
      );

      await Promise.all([
        removeMissionAndCompletions(missionId),
        ...affectedChallenges.map((ch) => saveChallenge(ch)),
      ]);
      pushToast({ title: "Vazifa o'chirildi", variant: 'info' });
    },
    [challenges, pushToast]
  );

  const toggleMissionCompletion = useCallback(
    async (missionId: string, dateKey: string) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;

      const key = makeCompletionKey(missionId, dateKey);
      const existing = completions.find((c) => c.id === key);

      if (existing) {
        setCompletions((prev) => prev.filter((c) => c.id !== key));
        await deleteCompletion(key);
        return;
      }

      const prevLevel = calculateLevelInfo(calculateTotalXp(completions)).level;
      const newRecord: CompletionRecord = {
        id: key,
        missionId,
        date: dateKey,
        xpEarned: mission.xp,
        completedAt: new Date().toISOString(),
      };
      const nextCompletions = [...completions, newRecord];
      setCompletions(nextCompletions);
      await putCompletion(newRecord);

      const newLevel = calculateLevelInfo(calculateTotalXp(nextCompletions)).level;
      if (newLevel > prevLevel) {
        pushToast({
          title: `Tabriklaymiz! ${newLevel}-darajaga ko'tarildingiz!`,
          description: 'Izchillik natija bermoqda. Davom eting!',
          variant: 'levelup',
        });
      }
    },
    [completions, missions, pushToast]
  );

  const upsertChallenge = useCallback(async (challenge: Challenge) => {
    setChallenges((prev) => {
      const exists = prev.some((c) => c.id === challenge.id);
      return exists ? prev.map((c) => (c.id === challenge.id ? challenge : c)) : [challenge, ...prev];
    });
    await saveChallenge(challenge);
  }, []);

  const pauseChallenge = useCallback(
    async (challengeId: string) => {
      const ch = challenges.find((c) => c.id === challengeId);
      if (!ch || ch.status !== 'active') return;
      await upsertChallenge({
        ...ch,
        status: 'paused',
        pauseIntervals: [...ch.pauseIntervals, { start: todayKey, end: null }],
        updatedAt: new Date().toISOString(),
      });
      pushToast({ title: "Marra vaqtincha to'xtatildi", variant: 'info' });
    },
    [challenges, pushToast, todayKey, upsertChallenge]
  );

  const resumeChallenge = useCallback(
    async (challengeId: string) => {
      const ch = challenges.find((c) => c.id === challengeId);
      if (!ch || ch.status !== 'paused') return;
      const nextIntervals = ch.pauseIntervals.map((interval, idx) =>
        idx === ch.pauseIntervals.length - 1 && interval.end === null
          ? { ...interval, end: todayKey }
          : interval
      );
      await upsertChallenge({
        ...ch,
        status: 'active',
        pauseIntervals: nextIntervals,
        updatedAt: new Date().toISOString(),
      });
      pushToast({ title: 'Marra davom ettirildi', variant: 'success' });
    },
    [challenges, pushToast, todayKey, upsertChallenge]
  );

  const archiveChallenge = useCallback(
    async (challengeId: string) => {
      const ch = challenges.find((c) => c.id === challengeId);
      if (!ch) return;
      await upsertChallenge({
        ...ch,
        status: 'archived',
        updatedAt: new Date().toISOString(),
      });
      pushToast({ title: 'Marra arxivlandi', variant: 'info' });
    },
    [challenges, pushToast, upsertChallenge]
  );

  const deleteChallenge = useCallback(
    async (challengeId: string) => {
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      setSelectedChallengeId((prev) => (prev === challengeId ? null : prev));
      await removeChallenge(challengeId);
      pushToast({ title: "Marra o'chirildi", variant: 'info' });
    },
    [pushToast]
  );

  const importChallengePayload = useCallback(
    async (payload: ChallengeExportPayload) => {
      for (const cat of payload.categories) {
        if (!categories.some((c) => c.id === cat.id)) {
          await upsertCategory(cat);
        }
      }
      const newMissionIds: string[] = [];
      for (const m of payload.linkedMissions) {
        const exists = missions.find((em) => em.id === m.id);
        if (exists) {
          newMissionIds.push(exists.id);
        } else {
          const cloned: Mission = { ...m, id: `m-${crypto.randomUUID()}` };
          newMissionIds.push(cloned.id);
          await upsertMission(cloned);
        }
      }
      const importedChallenge: Challenge = {
        ...payload.challenge,
        linkedMissionIds:
          newMissionIds.length > 0 ? newMissionIds : payload.challenge.linkedMissionIds,
      };
      await upsertChallenge(importedChallenge);
      setSelectedChallengeId(importedChallenge.id);
      pushToast({ title: 'Marra muvaffaqiyatli import qilindi', variant: 'success' });
    },
    [categories, missions, pushToast, upsertCategory, upsertChallenge, upsertMission]
  );

  const importFullBackup = useCallback(
    async (payload: AppBackupPayload) => {
      await replaceAllData(payload);
      setSettings(payload.settings);
      setCategories(payload.categories);
      setMissions(payload.missions);
      setCompletions(payload.completions);
      setChallenges(payload.challenges);
      setAchievements(payload.achievements);
      pushToast({ title: "Ma'lumotlar muvaffaqiyatli tiklandi", variant: 'success' });
    },
    [pushToast]
  );

  const factoryReset = useCallback(async () => {
    const fresh = await resetAllData();
    setSettings(fresh.settings);
    setCategories(fresh.categories);
    setMissions(fresh.missions);
    setCompletions(fresh.completions);
    setChallenges(fresh.challenges);
    setAchievements(fresh.achievements);
    setSelectedChallengeId(null);
    pushToast({ title: "Barcha ma'lumotlar tozalandi", variant: 'info' });
  }, [pushToast]);

  const value: AppContextValue = {
    loading,
    error,
    activePage,
    setActivePage,
    selectedChallengeId,
    setSelectedChallengeId,
    todayKey,
    settings,
    categories,
    missions,
    completions,
    challenges,
    achievements,
    achievementProgress: achievementEval.progressList,
    totalXp,
    levelInfo,
    currentStreak: streakInfo.currentStreak,
    longestStreak: streakInfo.longestStreak,
    isLocked,
    unlockApp,
    toasts,
    pushToast,
    dismissToast,
    updateSettings,
    upsertCategory,
    deleteCategory,
    upsertMission,
    archiveMission,
    restoreMission,
    deleteMission,
    toggleMissionCompletion,
    upsertChallenge,
    pauseChallenge,
    resumeChallenge,
    archiveChallenge,
    deleteChallenge,
    importChallengePayload,
    importFullBackup,
    factoryReset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}