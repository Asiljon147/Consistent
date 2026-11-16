import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AppBackupPayload,
  Category,
  Challenge,
  CompletionRecord,
  Mission,
  UnlockedAchievement,
  UserSettings,
} from '../types';

export const DB_NAME = 'izchillik-db';
export const DB_VERSION = 2;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-deep-work', name: 'Chuqur ish', color: '#8b5cf6' },
  { id: 'cat-learning', name: "O'rganish", color: '#10b981' },
  { id: 'cat-health', name: 'Salomatlik', color: '#f59e0b' },
  { id: 'cat-personal', name: 'Shaxsiy', color: '#3b82f6' },
];

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'user_settings',
  displayName: "Do'stim",
  theme: 'obsidian',
  minMissionsPerDay: 1,
  weeklyMissionGoal: 15,
  xpPresets: {
    easy: 10,
    medium: 25,
    difficult: 40,
    major: 60,
  },
  reminderEnabled: false,
  reminderTime: '20:30',
  pinCode: null,
  lastReminderFiredDate: null,
};

interface IzchillikDBSchema extends DBSchema {
  settings: {
    key: 'user_settings';
    value: UserSettings;
  };
  categories: {
    key: string;
    value: Category;
  };
  missions: {
    key: string;
    value: Mission;
    indexes: { 'by-status': string; 'by-category': string };
  };
  completions: {
    key: string;
    value: CompletionRecord;
    indexes: { 'by-date': string; 'by-mission': string };
  };
  challenges: {
    key: string;
    value: Challenge;
    indexes: { 'by-status': string };
  };
  achievements: {
    key: string;
    value: UnlockedAchievement;
  };
}

let dbPromise: Promise<IDBPDatabase<IzchillikDBSchema>> | null = null;

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    try {
      const already = await navigator.storage.persisted();
      if (already) return true;
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

export function getDb(): Promise<IDBPDatabase<IzchillikDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<IzchillikDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          db.createObjectStore('settings', { keyPath: 'id' });
          db.createObjectStore('categories', { keyPath: 'id' });

          const missionStore = db.createObjectStore('missions', { keyPath: 'id' });
          missionStore.createIndex('by-status', 'status');
          missionStore.createIndex('by-category', 'categoryId');

          const completionStore = db.createObjectStore('completions', { keyPath: 'id' });
          completionStore.createIndex('by-date', 'date');
          completionStore.createIndex('by-mission', 'missionId');

          const challengeStore = db.createObjectStore('challenges', { keyPath: 'id' });
          challengeStore.createIndex('by-status', 'status');

          db.createObjectStore('achievements', { keyPath: 'id' });
        }

        if (oldVersion < 2) {
          const settingsStore = transaction.objectStore('settings');
          void settingsStore.get('user_settings').then((existing) => {
            if (existing) {
              void settingsStore.put({
                ...DEFAULT_SETTINGS,
                ...existing,
                xpPresets: {
                  ...DEFAULT_SETTINGS.xpPresets,
                  ...(existing.xpPresets ?? {}),
                },
              });
            }
          });
        }
      },
    });
  }
  return dbPromise;
}

export interface LoadedAppData {
  settings: UserSettings;
  categories: Category[];
  missions: Mission[];
  completions: CompletionRecord[];
  challenges: Challenge[];
  achievements: UnlockedAchievement[];
}

export async function loadAllData(): Promise<LoadedAppData> {
  const db = await getDb();
  await requestPersistentStorage();

  const [settingsRow, categories, missions, completions, challenges, achievements] =
    await Promise.all([
      db.get('settings', 'user_settings'),
      db.getAll('categories'),
      db.getAll('missions'),
      db.getAll('completions'),
      db.getAll('challenges'),
      db.getAll('achievements'),
    ]);

  let settings = settingsRow;
  if (!settings) {
    settings = DEFAULT_SETTINGS;
    await db.put('settings', settings);
  }

  let finalCategories = categories;
  if (finalCategories.length === 0) {
    const tx = db.transaction('categories', 'readwrite');
    await Promise.all(DEFAULT_CATEGORIES.map((cat) => tx.store.put(cat)));
    await tx.done;
    finalCategories = DEFAULT_CATEGORIES;
  }

  return {
    settings,
    categories: finalCategories,
    missions,
    completions,
    challenges,
    achievements,
  };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDb();
  await db.put('settings', settings);
}

export async function saveCategory(category: Category): Promise<void> {
  const db = await getDb();
  await db.put('categories', category);
}

export async function removeCategory(categoryId: string): Promise<void> {
  const db = await getDb();
  await db.delete('categories', categoryId);
}

export async function saveMission(mission: Mission): Promise<void> {
  const db = await getDb();
  await db.put('missions', mission);
}

export async function removeMissionAndCompletions(missionId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['missions', 'completions'], 'readwrite');
  await tx.objectStore('missions').delete(missionId);
  const completionIndex = tx.objectStore('completions').index('by-mission');
  let cursor = await completionIndex.openCursor(missionId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function putCompletion(record: CompletionRecord): Promise<void> {
  const db = await getDb();
  await db.put('completions', record);
}

export async function deleteCompletion(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('completions', id);
}

export async function saveChallenge(challenge: Challenge): Promise<void> {
  const db = await getDb();
  await db.put('challenges', challenge);
}

export async function removeChallenge(challengeId: string): Promise<void> {
  const db = await getDb();
  await db.delete('challenges', challengeId);
}

export async function saveAchievements(items: UnlockedAchievement[]): Promise<void> {
  if (items.length === 0) return;
  const db = await getDb();
  const tx = db.transaction('achievements', 'readwrite');
  await Promise.all(items.map((item) => tx.store.put(item)));
  await tx.done;
}

export async function replaceAllData(payload: AppBackupPayload): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    ['settings', 'categories', 'missions', 'completions', 'challenges', 'achievements'],
    'readwrite'
  );

  await Promise.all([
    tx.objectStore('settings').clear(),
    tx.objectStore('categories').clear(),
    tx.objectStore('missions').clear(),
    tx.objectStore('completions').clear(),
    tx.objectStore('challenges').clear(),
    tx.objectStore('achievements').clear(),
  ]);

  await tx.objectStore('settings').put(payload.settings);
  await Promise.all(payload.categories.map((c) => tx.objectStore('categories').put(c)));
  await Promise.all(payload.missions.map((m) => tx.objectStore('missions').put(m)));
  await Promise.all(payload.completions.map((c) => tx.objectStore('completions').put(c)));
  await Promise.all(payload.challenges.map((ch) => tx.objectStore('challenges').put(ch)));
  await Promise.all(payload.achievements.map((a) => tx.objectStore('achievements').put(a)));

  await tx.done;
}

export async function resetAllData(): Promise<LoadedAppData> {
  const freshPayload: AppBackupPayload = {
    schemaVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'Izchillik',
    settings: DEFAULT_SETTINGS,
    categories: DEFAULT_CATEGORIES,
    missions: [],
    completions: [],
    challenges: [],
    achievements: [],
  };
  await replaceAllData(freshPayload);
  return {
    settings: DEFAULT_SETTINGS,
    categories: DEFAULT_CATEGORIES,
    missions: [],
    completions: [],
    challenges: [],
    achievements: [],
  };
}