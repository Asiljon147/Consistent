import { DB_VERSION, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../services/db';
import type {
  AppBackupPayload,
  Category,
  Challenge,
  ChallengeExportPayload,
  CompletionRecord,
  Mission,
  UnlockedAchievement,
  UserSettings,
} from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function createFullBackupPayload(data: {
  settings: UserSettings;
  categories: Category[];
  missions: Mission[];
  completions: CompletionRecord[];
  challenges: Challenge[];
  achievements: UnlockedAchievement[];
}): AppBackupPayload {
  return {
    schemaVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'Izchillik',
    settings: {
      ...data.settings,
      pinCode: null,
    },
    categories: data.categories,
    missions: data.missions,
    completions: data.completions,
    challenges: data.challenges,
    achievements: data.achievements,
  };
}

export function validateFullBackupJson(rawText: string): AppBackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("JSON fayl formati noto'g'ri.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Zaxira fayli tuzilmasi noto'g'ri.");
  }

  if (!Array.isArray(parsed.missions) || !Array.isArray(parsed.completions)) {
    throw new Error("Zaxira faylida vazifalar yoki bajarilish tarixi topilmadi.");
  }

  const rawSettings = isRecord(parsed.settings) ? parsed.settings : {};
  const rawPresets = isRecord(rawSettings.xpPresets) ? rawSettings.xpPresets : {};

  const settings: UserSettings = {
    id: 'user_settings',
    displayName: isString(rawSettings.displayName)
      ? rawSettings.displayName
      : DEFAULT_SETTINGS.displayName,
    theme:
      rawSettings.theme === 'light' ||
      rawSettings.theme === 'midnight' ||
      rawSettings.theme === 'obsidian'
        ? rawSettings.theme
        : DEFAULT_SETTINGS.theme,
    minMissionsPerDay: isNumber(rawSettings.minMissionsPerDay)
      ? Math.max(1, rawSettings.minMissionsPerDay)
      : DEFAULT_SETTINGS.minMissionsPerDay,
    weeklyMissionGoal: isNumber(rawSettings.weeklyMissionGoal)
      ? Math.max(1, rawSettings.weeklyMissionGoal)
      : DEFAULT_SETTINGS.weeklyMissionGoal,
    xpPresets: {
      easy: isNumber(rawPresets.easy) ? rawPresets.easy : DEFAULT_SETTINGS.xpPresets.easy,
      medium: isNumber(rawPresets.medium) ? rawPresets.medium : DEFAULT_SETTINGS.xpPresets.medium,
      difficult: isNumber(rawPresets.difficult)
        ? rawPresets.difficult
        : DEFAULT_SETTINGS.xpPresets.difficult,
      major: isNumber(rawPresets.major) ? rawPresets.major : DEFAULT_SETTINGS.xpPresets.major,
    },
    reminderEnabled: Boolean(rawSettings.reminderEnabled),
    reminderTime: isString(rawSettings.reminderTime)
      ? rawSettings.reminderTime
      : DEFAULT_SETTINGS.reminderTime,
    pinCode: null,
    lastReminderFiredDate: null,
  };

  const categories: Category[] = Array.isArray(parsed.categories)
    ? parsed.categories
        .filter((c): c is Record<string, unknown> => isRecord(c) && isString(c.id) && isString(c.name))
        .map((c) => ({
          id: c.id as string,
          name: c.name as string,
          color: isString(c.color) ? c.color : '#3b82f6',
        }))
    : DEFAULT_CATEGORIES;

  const missions: Mission[] = parsed.missions
    .filter((m): m is Record<string, unknown> => isRecord(m) && isString(m.id) && isString(m.title))
    .map((m) => ({
      id: m.id as string,
      title: m.title as string,
      description: isString(m.description) ? m.description : '',
      categoryId: isString(m.categoryId) ? m.categoryId : categories[0]?.id ?? 'cat-deep-work',
      priority:
        m.priority === 'low' || m.priority === 'medium' || m.priority === 'high'
          ? m.priority
          : 'medium',
      xp: isNumber(m.xp) ? Math.max(1, m.xp) : 25,
      recurrence:
        m.recurrence === 'daily' ||
        m.recurrence === 'weekdays' ||
        m.recurrence === 'weekly' ||
        m.recurrence === 'once'
          ? m.recurrence
          : 'daily',
      weekdays: Array.isArray(m.weekdays)
        ? m.weekdays.filter((d): d is number => isNumber(d))
        : [],
      startDate: isString(m.startDate) ? m.startDate : new Date().toISOString().slice(0, 10),
      deadline: isString(m.deadline) ? m.deadline : null,
      targetQuantity: isNumber(m.targetQuantity) ? m.targetQuantity : null,
      targetUnit: isString(m.targetUnit) ? m.targetUnit : '',
      estimatedMinutes: isNumber(m.estimatedMinutes) ? m.estimatedMinutes : null,
      status: m.status === 'archived' ? 'archived' : 'active',
      createdAt: isString(m.createdAt) ? m.createdAt : new Date().toISOString(),
      updatedAt: isString(m.updatedAt) ? m.updatedAt : new Date().toISOString(),
    }));

  const completions: CompletionRecord[] = parsed.completions
    .filter(
      (c): c is Record<string, unknown> =>
        isRecord(c) && isString(c.missionId) && isString(c.date)
    )
    .map((c) => ({
      id: isString(c.id) ? c.id : `${c.missionId as string}::${c.date as string}`,
      missionId: c.missionId as string,
      date: c.date as string,
      xpEarned: isNumber(c.xpEarned) ? Math.max(0, c.xpEarned) : 25,
      completedAt: isString(c.completedAt) ? c.completedAt : new Date().toISOString(),
    }));

  const challenges: Challenge[] = Array.isArray(parsed.challenges)
    ? parsed.challenges
        .filter(
          (ch): ch is Record<string, unknown> =>
            isRecord(ch) && isString(ch.id) && isString(ch.name)
        )
        .map((ch) => ({
          id: ch.id as string,
          name: ch.name as string,
          description: isString(ch.description) ? ch.description : '',
          categoryId: isString(ch.categoryId)
            ? ch.categoryId
            : categories[0]?.id ?? 'cat-deep-work',
          color: isString(ch.color) ? ch.color : '#3b82f6',
          startDate: isString(ch.startDate) ? ch.startDate : new Date().toISOString().slice(0, 10),
          endDate: isString(ch.endDate) ? ch.endDate : new Date().toISOString().slice(0, 10),
          linkedMissionIds: Array.isArray(ch.linkedMissionIds)
            ? ch.linkedMissionIds.filter((id): id is string => isString(id))
            : [],
          dailyCriteria: ch.dailyCriteria === 'all' ? 'all' : 'any',
          status:
            ch.status === 'paused' || ch.status === 'completed' || ch.status === 'archived'
              ? ch.status
              : 'active',
          pauseIntervals: Array.isArray(ch.pauseIntervals)
            ? ch.pauseIntervals
                .filter((p): p is Record<string, unknown> => isRecord(p) && isString(p.start))
                .map((p) => ({
                  start: p.start as string,
                  end: isString(p.end) ? p.end : null,
                }))
            : [],
          createdAt: isString(ch.createdAt) ? ch.createdAt : new Date().toISOString(),
          updatedAt: isString(ch.updatedAt) ? ch.updatedAt : new Date().toISOString(),
        }))
    : [];

  const achievements: UnlockedAchievement[] = Array.isArray(parsed.achievements)
    ? parsed.achievements
        .filter(
          (a): a is Record<string, unknown> =>
            isRecord(a) && isString(a.id) && isString(a.unlockedAt)
        )
        .map((a) => ({
          id: a.id as UnlockedAchievement['id'],
          unlockedAt: a.unlockedAt as string,
        }))
    : [];

  return {
    schemaVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'Izchillik',
    settings,
    categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
    missions,
    completions,
    challenges,
    achievements,
  };
}

export function createChallengeExportPayload(
  challenge: Challenge,
  missions: Mission[],
  categories: Category[]
): ChallengeExportPayload {
  const linkedMissions = missions.filter((m) => challenge.linkedMissionIds.includes(m.id));
  const usedCats = new Set([challenge.categoryId, ...linkedMissions.map((m) => m.categoryId)]);
  return {
    schemaVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'Izchillik',
    type: 'challenge',
    challenge,
    linkedMissions,
    categories: categories.filter((c) => usedCats.has(c.id)),
  };
}

export function validateChallengeImportJson(rawText: string): ChallengeExportPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Marra JSON fayli noto'g'ri.");
  }

  if (!isRecord(parsed) || !isRecord(parsed.challenge) || !isString(parsed.challenge.name)) {
    throw new Error("Marra ma'lumotlari topilmadi.");
  }

  const ch = parsed.challenge;
  const challenge: Challenge = {
    id: `ch-${crypto.randomUUID()}`,
    name: ch.name as string,
    description: isString(ch.description) ? ch.description : '',
    categoryId: isString(ch.categoryId) ? ch.categoryId : 'cat-deep-work',
    color: isString(ch.color) ? ch.color : '#3b82f6',
    startDate: isString(ch.startDate) ? ch.startDate : new Date().toISOString().slice(0, 10),
    endDate: isString(ch.endDate) ? ch.endDate : new Date().toISOString().slice(0, 10),
    linkedMissionIds: Array.isArray(ch.linkedMissionIds)
      ? ch.linkedMissionIds.filter((id): id is string => isString(id))
      : [],
    dailyCriteria: ch.dailyCriteria === 'all' ? 'all' : 'any',
    status: 'active',
    pauseIntervals: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const linkedMissions: Mission[] = Array.isArray(parsed.linkedMissions)
    ? parsed.linkedMissions
        .filter((m): m is Record<string, unknown> => isRecord(m) && isString(m.id) && isString(m.title))
        .map((m) => ({
          id: m.id as string,
          title: m.title as string,
          description: isString(m.description) ? m.description : '',
          categoryId: isString(m.categoryId) ? m.categoryId : 'cat-deep-work',
          priority:
            m.priority === 'low' || m.priority === 'medium' || m.priority === 'high'
              ? m.priority
              : 'medium',
          xp: isNumber(m.xp) ? m.xp : 25,
          recurrence:
            m.recurrence === 'daily' ||
            m.recurrence === 'weekdays' ||
            m.recurrence === 'weekly' ||
            m.recurrence === 'once'
              ? m.recurrence
              : 'daily',
          weekdays: Array.isArray(m.weekdays)
            ? m.weekdays.filter((d): d is number => isNumber(d))
            : [],
          startDate: isString(m.startDate) ? m.startDate : challenge.startDate,
          deadline: isString(m.deadline) ? m.deadline : null,
          targetQuantity: isNumber(m.targetQuantity) ? m.targetQuantity : null,
          targetUnit: isString(m.targetUnit) ? m.targetUnit : '',
          estimatedMinutes: isNumber(m.estimatedMinutes) ? m.estimatedMinutes : null,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
    : [];

  const categories: Category[] = Array.isArray(parsed.categories)
    ? parsed.categories
        .filter((c): c is Record<string, unknown> => isRecord(c) && isString(c.id) && isString(c.name))
        .map((c) => ({
          id: c.id as string,
          name: c.name as string,
          color: isString(c.color) ? c.color : '#3b82f6',
        }))
    : [];

  return {
    schemaVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'Izchillik',
    type: 'challenge',
    challenge,
    linkedMissions,
    categories,
  };
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}