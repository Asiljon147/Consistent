import type {
  AchievementId,
  Category,
  Challenge,
  ChallengeDayInfo,
  ChallengeDayState,
  ChallengeProgressSummary,
  CompletionRecord,
  LevelInfo,
  Mission,
  UnlockedAchievement,
} from '../types';
import { addDays, diffDays, getIsoWeekday } from './date';

export function makeCompletionKey(missionId: string, dateKey: string): string {
  return `${missionId}::${dateKey}`;
}

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

export function calculateTotalXp(completions: CompletionRecord[]): number {
  return completions.reduce((sum, item) => sum + Math.max(0, item.xpEarned), 0);
}

export function calculateLevelInfo(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xpForLevel(level + 1) <= safeXp) {
    level += 1;
  }
  const currentLevelFloorXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = safeXp - currentLevelFloorXp;
  const xpNeededForLevel = nextLevelXp - currentLevelFloorXp;
  const xpRemaining = nextLevelXp - safeXp;
  const progressPercent =
    xpNeededForLevel > 0 ? Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100)) : 0;

  return {
    level,
    totalXp: safeXp,
    currentLevelFloorXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeededForLevel,
    xpRemaining,
    progressPercent,
  };
}

export function isMissionScheduledOnDate(mission: Mission, dateKey: string): boolean {
  if (mission.status === 'archived') return false;
  if (dateKey < mission.startDate) return false;
  if (mission.deadline && dateKey > mission.deadline) return false;

  switch (mission.recurrence) {
    case 'daily':
      return true;
    case 'weekdays': {
      const isoDay = getIsoWeekday(dateKey);
      return mission.weekdays.includes(isoDay);
    }
    case 'weekly': {
      return getIsoWeekday(dateKey) === getIsoWeekday(mission.startDate);
    }
    case 'once':
      return dateKey === mission.startDate;
    default:
      return false;
  }
}

export function getScheduledMissionsForDate(missions: Mission[], dateKey: string): Mission[] {
  return missions.filter((m) => isMissionScheduledOnDate(m, dateKey));
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  successfulDates: string[];
}

export function calculateStreaks(
  completions: CompletionRecord[],
  minMissionsPerDay: number,
  todayKey: string
): StreakResult {
  const minRequired = Math.max(1, minMissionsPerDay);
  const countByDate = new Map<string, number>();

  for (const c of completions) {
    countByDate.set(c.date, (countByDate.get(c.date) ?? 0) + 1);
  }

  const successfulDates = Array.from(countByDate.entries())
    .filter(([date, count]) => date <= todayKey && count >= minRequired)
    .map(([date]) => date)
    .sort();

  const successSet = new Set(successfulDates);

  let currentStreak = 0;
  let cursor: string | null = null;
  if (successSet.has(todayKey)) {
    cursor = todayKey;
  } else {
    const yesterday = addDays(todayKey, -1);
    if (successSet.has(yesterday)) {
      cursor = yesterday;
    }
  }

  while (cursor && successSet.has(cursor)) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  let longestStreak = 0;
  let run = 0;
  let prevDate: string | null = null;

  for (const date of successfulDates) {
    if (prevDate && diffDays(prevDate, date) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longestStreak) {
      longestStreak = run;
    }
    prevDate = date;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    successfulDates,
  };
}

export function isDatePausedInChallenge(challenge: Challenge, dateKey: string): boolean {
  for (const interval of challenge.pauseIntervals) {
    const afterStart = dateKey >= interval.start;
    const beforeEnd = interval.end === null || dateKey <= interval.end;
    if (afterStart && beforeEnd) return true;
  }
  return false;
}

export function calculateChallengeProgress(
  challenge: Challenge,
  completions: CompletionRecord[],
  todayKey: string
): ChallengeProgressSummary {
  const totalCalendarDays = Math.max(1, diffDays(challenge.startDate, challenge.endDate) + 1);
  const linkedSet = new Set(challenge.linkedMissionIds);

  const completedMissionsByDate = new Map<string, Set<string>>();
  const xpByDate = new Map<string, number>();

  for (const c of completions) {
    if (!linkedSet.has(c.missionId)) continue;
    if (c.date < challenge.startDate || c.date > challenge.endDate) continue;
    const set = completedMissionsByDate.get(c.date) ?? new Set<string>();
    set.add(c.missionId);
    completedMissionsByDate.set(c.date, set);
    xpByDate.set(c.date, (xpByDate.get(c.date) ?? 0) + c.xpEarned);
  }

  const days: ChallengeDayInfo[] = [];
  let totalActiveDays = 0;
  let successfulDays = 0;
  let missedDays = 0;
  let bestStreak = 0;
  let currentRun = 0;
  let challengeXp = 0;

  for (let i = 0; i < totalCalendarDays; i++) {
    const date = addDays(challenge.startDate, i);
    const paused = isDatePausedInChallenge(challenge, date);
    const doneSet = completedMissionsByDate.get(date);
    const completedCount = doneSet ? doneSet.size : 0;

    const dayCompleted =
      linkedSet.size > 0 &&
      (challenge.dailyCriteria === 'all'
        ? completedCount >= linkedSet.size
        : completedCount >= 1);

    if (!paused) {
      totalActiveDays += 1;
    }

    let state: ChallengeDayState;
    if (paused && !dayCompleted) {
      state = 'paused';
      currentRun = 0;
    } else if (dayCompleted) {
      state = 'completed';
      successfulDays += 1;
      currentRun += 1;
      if (currentRun > bestStreak) bestStreak = currentRun;
      challengeXp += xpByDate.get(date) ?? 0;
    } else if (date === todayKey && challenge.status !== 'completed') {
      state = 'today';
      currentRun = 0;
    } else if (date < todayKey || challenge.status === 'completed') {
      state = 'missed';
      missedDays += 1;
      currentRun = 0;
    } else {
      state = 'upcoming';
    }

    days.push({
      dayNumber: i + 1,
      date,
      state,
    });
  }

  const denominator = Math.max(1, totalActiveDays);
  const completionPercent = Math.min(100, Math.round((successfulDays / denominator) * 100));
  const daysRemaining =
    todayKey > challenge.endDate ? 0 : Math.max(0, diffDays(todayKey, challenge.endDate));

  return {
    totalActiveDays,
    totalCalendarDays,
    successfulDays,
    missedDays,
    completionPercent,
    bestStreak,
    challengeXp,
    daysRemaining,
    days,
  };
}

export function getMissedDatesForMission(
  mission: Mission,
  completions: CompletionRecord[],
  todayKey: string,
  lookbackDays = 60
): string[] {
  if (mission.status === 'archived') return [];
  const doneDates = new Set(
    completions.filter((c) => c.missionId === mission.id).map((c) => c.date)
  );
  const earliest = addDays(todayKey, -lookbackDays);
  const start = mission.startDate > earliest ? mission.startDate : earliest;
  const yesterday = addDays(todayKey, -1);

  if (start > yesterday) return [];

  const missed: string[] = [];
  const total = diffDays(start, yesterday) + 1;
  for (let i = 0; i < total; i++) {
    const d = addDays(start, i);
    if (isMissionScheduledOnDate(mission, d) && !doneDates.has(d)) {
      missed.push(d);
    }
  }
  return missed;
}

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  target: number;
  unitLabel: string;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_step',
    title: 'Birinchi qadam',
    description: 'Ilk vazifangizni muvaffaqiyatli bajaring.',
    target: 1,
    unitLabel: 'vazifa',
  },
  {
    id: 'getting_started',
    title: 'Boshlanishi yaxshi',
    description: 'Jami 10 ta vazifani bajaring.',
    target: 10,
    unitLabel: 'vazifa',
  },
  {
    id: 'dedicated',
    title: 'Sadoqatli',
    description: 'Jami 30 ta vazifani bajaring.',
    target: 30,
    unitLabel: 'vazifa',
  },
  {
    id: 'unstoppable',
    title: "To'xtatib bo'lmas",
    description: 'Jami 100 ta vazifani bajaring.',
    target: 100,
    unitLabel: 'vazifa',
  },
  {
    id: 'consistent',
    title: 'Izchil',
    description: '7 kunlik uzluksiz seriyaga erishing.',
    target: 7,
    unitLabel: 'kun',
  },
  {
    id: 'iron_discipline',
    title: 'Temir intizom',
    description: '30 kunlik uzluksiz seriyaga erishing.',
    target: 30,
    unitLabel: 'kun',
  },
  {
    id: 'challenger',
    title: 'Marra egasi',
    description: "Kamida 1 ta marrani to'liq yakunlang.",
    target: 1,
    unitLabel: 'marra',
  },
  {
    id: 'century',
    title: 'Minglik dovon',
    description: "Jami 1 000 XP to'plang.",
    target: 1000,
    unitLabel: 'XP',
  },
  {
    id: 'compounding_force',
    title: 'Kuchlar jamlanmasi',
    description: "Jami 5 000 XP to'plang.",
    target: 5000,
    unitLabel: 'XP',
  },
  {
    id: 'ascending',
    title: 'Yuksalish',
    description: "5-darajaga ko'tariling.",
    target: 5,
    unitLabel: 'daraja',
  },
  {
    id: 'multi_disciplinary',
    title: "Ko'p qirrali",
    description: '3 ta turli kategoriyada vazifalarni bajaring.',
    target: 3,
    unitLabel: 'kategoriya',
  },
  {
    id: 'clean_sweep',
    title: 'Toza natija',
    description: 'Bir kunda rejalashtirilgan barcha vazifalarni bajaring (kamida 3 ta).',
    target: 1,
    unitLabel: 'kun',
  },
];

export interface AchievementProgressItem {
  definition: AchievementDefinition;
  current: number;
  percent: number;
  unlocked: UnlockedAchievement | null;
}

export function evaluateAchievements(params: {
  missions: Mission[];
  completions: CompletionRecord[];
  challenges: Challenge[];
  existingUnlocked: UnlockedAchievement[];
  minMissionsPerDay: number;
  todayKey: string;
  nowIso: string;
}): {
  progressList: AchievementProgressItem[];
  newlyUnlocked: UnlockedAchievement[];
} {
  const {
    missions,
    completions,
    challenges,
    existingUnlocked,
    minMissionsPerDay,
    todayKey,
    nowIso,
  } = params;

  const totalCompletions = completions.length;
  const totalXp = calculateTotalXp(completions);
  const level = calculateLevelInfo(totalXp).level;
  const { longestStreak } = calculateStreaks(completions, minMissionsPerDay, todayKey);
  const completedChallenges = challenges.filter((c) => c.status === 'completed').length;

  const missionById = new Map(missions.map((m) => [m.id, m]));
  const distinctCategories = new Set<string>();
  const completionsByDate = new Map<string, Set<string>>();

  for (const c of completions) {
    const m = missionById.get(c.missionId);
    if (m) distinctCategories.add(m.categoryId);
    const set = completionsByDate.get(c.date) ?? new Set<string>();
    set.add(c.missionId);
    completionsByDate.set(c.date, set);
  }

  let hasCleanSweep = false;
  for (const [dateKey, doneIds] of completionsByDate.entries()) {
    const scheduled = getScheduledMissionsForDate(missions, dateKey);
    if (scheduled.length >= 3 && scheduled.every((m) => doneIds.has(m.id))) {
      hasCleanSweep = true;
      break;
    }
  }

  const metricById: Record<AchievementId, number> = {
    first_step: totalCompletions,
    getting_started: totalCompletions,
    dedicated: totalCompletions,
    unstoppable: totalCompletions,
    consistent: longestStreak,
    iron_discipline: longestStreak,
    challenger: completedChallenges,
    century: totalXp,
    compounding_force: totalXp,
    ascending: level,
    multi_disciplinary: distinctCategories.size,
    clean_sweep: hasCleanSweep ? 1 : 0,
  };

  const unlockedMap = new Map(existingUnlocked.map((u) => [u.id, u]));
  const newlyUnlocked: UnlockedAchievement[] = [];

  const progressList: AchievementProgressItem[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const rawValue = metricById[def.id];
    const current = Math.min(def.target, rawValue);
    const percent = Math.min(100, Math.round((current / def.target) * 100));

    let unlocked = unlockedMap.get(def.id) ?? null;
    if (!unlocked && rawValue >= def.target) {
      unlocked = { id: def.id, unlockedAt: nowIso };
      newlyUnlocked.push(unlocked);
      unlockedMap.set(def.id, unlocked);
    }

    return {
      definition: def,
      current,
      percent: unlocked ? 100 : percent,
      unlocked,
    };
  });

  return { progressList, newlyUnlocked };
}

export interface CategoryBreakdownItem {
  category: Category;
  completedCount: number;
  scheduledCount: number;
  ratePercent: number;
  xpEarned: number;
}

export interface AnalyticsRangeSummary {
  completedCount: number;
  scheduledCount: number;
  completionRate: number;
  xpEarned: number;
  dailyPoints: Array<{ date: string; xp: number; completed: number; scheduled: number }>;
  buckets: Array<{ labelDate: string; completed: number; scheduled: number }>;
  categoryBreakdown: CategoryBreakdownItem[];
  strongestCategory: CategoryBreakdownItem | null;
  weakestCategory: CategoryBreakdownItem | null;
}

export function computeAnalyticsForRange(params: {
  missions: Mission[];
  completions: CompletionRecord[];
  categories: Category[];
  todayKey: string;
  rangeDays: number | 'all';
}): AnalyticsRangeSummary {
  const { missions, completions, categories, todayKey, rangeDays } = params;

  let startDate: string;
  if (rangeDays === 'all') {
    const allDates = [
      ...missions.map((m) => m.startDate),
      ...completions.map((c) => c.date),
      todayKey,
    ].sort();
    startDate = allDates[0] ?? todayKey;
  } else {
    startDate = addDays(todayKey, -(rangeDays - 1));
  }

  const totalDays = Math.max(1, diffDays(startDate, todayKey) + 1);
  const completionsByDate = new Map<string, CompletionRecord[]>();
  for (const c of completions) {
    if (c.date < startDate || c.date > todayKey) continue;
    const list = completionsByDate.get(c.date) ?? [];
    list.push(c);
    completionsByDate.set(c.date, list);
  }

  const missionMap = new Map(missions.map((m) => [m.id, m]));
  const catStats = new Map<string, { completed: number; scheduled: number; xp: number }>();
  for (const cat of categories) {
    catStats.set(cat.id, { completed: 0, scheduled: 0, xp: 0 });
  }

  let completedCount = 0;
  let scheduledCount = 0;
  let xpEarned = 0;
  const dailyPoints: AnalyticsRangeSummary['dailyPoints'] = [];

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const scheduled = getScheduledMissionsForDate(missions, date);
    const dayCompletions = completionsByDate.get(date) ?? [];

    scheduledCount += scheduled.length;
    completedCount += dayCompletions.length;

    const dayXp = dayCompletions.reduce((s, item) => s + item.xpEarned, 0);
    xpEarned += dayXp;

    for (const m of scheduled) {
      const st = catStats.get(m.categoryId);
      if (st) st.scheduled += 1;
    }
    for (const c of dayCompletions) {
      const m = missionMap.get(c.missionId);
      if (m) {
        const st = catStats.get(m.categoryId);
        if (st) {
          st.completed += 1;
          st.xp += c.xpEarned;
        }
      }
    }

    dailyPoints.push({
      date,
      xp: dayXp,
      completed: dayCompletions.length,
      scheduled: scheduled.length,
    });
  }

  const buckets: AnalyticsRangeSummary['buckets'] = [];
  for (let i = 0; i < dailyPoints.length; i += 7) {
    const slice = dailyPoints.slice(i, i + 7);
    buckets.push({
      labelDate: slice[0].date,
      completed: slice.reduce((s, p) => s + p.completed, 0),
      scheduled: slice.reduce((s, p) => s + p.scheduled, 0),
    });
  }

  const categoryBreakdown: CategoryBreakdownItem[] = categories
    .map((category) => {
      const st = catStats.get(category.id) ?? { completed: 0, scheduled: 0, xp: 0 };
      const ratePercent =
        st.scheduled > 0 ? Math.min(100, Math.round((st.completed / st.scheduled) * 100)) : 0;
      return {
        category,
        completedCount: st.completed,
        scheduledCount: st.scheduled,
        ratePercent,
        xpEarned: st.xp,
      };
    })
    .filter((item) => item.scheduledCount > 0 || item.completedCount > 0)
    .sort((a, b) => b.ratePercent - a.ratePercent || b.xpEarned - a.xpEarned);

  const strongestCategory = categoryBreakdown[0] ?? null;
  const weakestCategory =
    categoryBreakdown.length > 1 ? categoryBreakdown[categoryBreakdown.length - 1] : null;

  const completionRate =
    scheduledCount > 0 ? Math.min(100, Math.round((completedCount / scheduledCount) * 100)) : 0;

  return {
    completedCount,
    scheduledCount,
    completionRate,
    xpEarned,
    dailyPoints,
    buckets: buckets.slice(-6),
    categoryBreakdown,
    strongestCategory,
    weakestCategory,
  };
}