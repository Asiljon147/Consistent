export type PageId =
  | 'overview'
  | 'missions'
  | 'challenges'
  | 'calendar'
  | 'analytics'
  | 'achievements'
  | 'settings';

export type ThemeId = 'obsidian' | 'light' | 'midnight';
export type Priority = 'low' | 'medium' | 'high';
export type RecurrenceType = 'daily' | 'weekdays' | 'weekly' | 'once';
export type MissionStatus = 'active' | 'archived';
export type ChallengeStatus = 'active' | 'paused' | 'completed' | 'archived';
export type ChallengeDailyCriteria = 'any' | 'all';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  xp: number;
  recurrence: RecurrenceType;
  weekdays: number[];
  startDate: string;
  deadline: string | null;
  targetQuantity: number | null;
  targetUnit: string;
  estimatedMinutes: number | null;
  status: MissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompletionRecord {
  id: string;
  missionId: string;
  date: string;
  xpEarned: number;
  completedAt: string;
}

export interface PauseInterval {
  start: string;
  end: string | null;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  color: string;
  startDate: string;
  endDate: string;
  linkedMissionIds: string[];
  dailyCriteria: ChallengeDailyCriteria;
  status: ChallengeStatus;
  pauseIntervals: PauseInterval[];
  createdAt: string;
  updatedAt: string;
}

export type AchievementId =
  | 'first_step'
  | 'getting_started'
  | 'dedicated'
  | 'unstoppable'
  | 'consistent'
  | 'iron_discipline'
  | 'challenger'
  | 'century'
  | 'compounding_force'
  | 'ascending'
  | 'multi_disciplinary'
  | 'clean_sweep';

export interface UnlockedAchievement {
  id: AchievementId;
  unlockedAt: string;
}

export interface XpPresets {
  easy: number;
  medium: number;
  difficult: number;
  major: number;
}

export interface UserSettings {
  id: 'user_settings';
  displayName: string;
  theme: ThemeId;
  minMissionsPerDay: number;
  weeklyMissionGoal: number;
  xpPresets: XpPresets;
  reminderEnabled: boolean;
  reminderTime: string;
  pinCode: string | null;
  lastReminderFiredDate: string | null;
}

export interface AppBackupPayload {
  schemaVersion: number;
  exportedAt: string;
  app: 'Izchillik';
  settings: UserSettings;
  categories: Category[];
  missions: Mission[];
  completions: CompletionRecord[];
  challenges: Challenge[];
  achievements: UnlockedAchievement[];
}

export interface ChallengeExportPayload {
  schemaVersion: number;
  exportedAt: string;
  app: 'Izchillik';
  type: 'challenge';
  challenge: Challenge;
  linkedMissions: Mission[];
  categories: Category[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'info' | 'success' | 'warning' | 'error' | 'levelup' | 'achievement';
}

export type ChallengeDayState = 'completed' | 'missed' | 'today' | 'upcoming' | 'paused';

export interface ChallengeDayInfo {
  dayNumber: number;
  date: string;
  state: ChallengeDayState;
}

export interface ChallengeProgressSummary {
  totalActiveDays: number;
  totalCalendarDays: number;
  successfulDays: number;
  missedDays: number;
  completionPercent: number;
  bestStreak: number;
  challengeXp: number;
  daysRemaining: number;
  days: ChallengeDayInfo[];
}

export interface LevelInfo {
  level: number;
  totalXp: number;
  currentLevelFloorXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  xpRemaining: number;
  progressPercent: number;
}