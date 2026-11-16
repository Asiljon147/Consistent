import { describe, expect, it } from 'vitest';
import type { Challenge, CompletionRecord, Mission } from '../types';
import {
  calculateChallengeProgress,
  calculateLevelInfo,
  calculateStreaks,
  calculateTotalXp,
  isMissionScheduledOnDate,
  makeCompletionKey,
  xpForLevel,
} from './gameLogic';

const baseMission: Mission = {
  id: 'm1',
  title: 'Koreys tili',
  description: '',
  categoryId: 'cat-learning',
  priority: 'high',
  xp: 25,
  recurrence: 'daily',
  weekdays: [],
  startDate: '2026-11-10',
  deadline: null,
  targetQuantity: 10,
  targetUnit: 'soz',
  estimatedMinutes: 20,
  status: 'active',
  createdAt: '2026-11-10T08:00:00.000Z',
  updatedAt: '2026-11-10T08:00:00.000Z',
};

describe('XP va Daraja formulasi', () => {
  it('daraja chegaralarini aniq hisoblaydi', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(xpForLevel(4)).toBe(600);
    expect(xpForLevel(5)).toBe(1000);
  });

  it('205 XP da 2-daraja va 95 XP qolganini qaytaradi', () => {
    const info = calculateLevelInfo(205);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(105);
    expect(info.xpNeededForLevel).toBe(200);
    expect(info.xpRemaining).toBe(95);
  });

  it('bajarilish yozuvlaridan umumiy XP ni jamlaydi', () => {
    const completions: CompletionRecord[] = [
      { id: makeCompletionKey('m1', '2026-11-15'), missionId: 'm1', date: '2026-11-15', xpEarned: 25, completedAt: '' },
      { id: makeCompletionKey('m2', '2026-11-15'), missionId: 'm2', date: '2026-11-15', xpEarned: 40, completedAt: '' },
    ];
    expect(calculateTotalXp(completions)).toBe(65);
  });
});

describe('Seriya (Streak) hisoblash', () => {
  it('kunlik minimumga qarab joriy va eng uzun seriyani hisoblaydi', () => {
    const completions: CompletionRecord[] = [
      { id: '1', missionId: 'm1', date: '2026-11-10', xpEarned: 25, completedAt: '' },
      { id: '2', missionId: 'm1', date: '2026-11-11', xpEarned: 25, completedAt: '' },
      { id: '3', missionId: 'm1', date: '2026-11-12', xpEarned: 25, completedAt: '' },
      { id: '4', missionId: 'm1', date: '2026-11-14', xpEarned: 25, completedAt: '' },
      { id: '5', missionId: 'm1', date: '2026-11-15', xpEarned: 25, completedAt: '' },
    ];
    const res = calculateStreaks(completions, 1, '2026-11-16');
    expect(res.currentStreak).toBe(2);
    expect(res.longestStreak).toBe(3);
  });

  it('kunlik minimum 2 bolganda 1 ta vazifali kunni hisoblamaydi', () => {
    const completions: CompletionRecord[] = [
      { id: '1', missionId: 'm1', date: '2026-11-15', xpEarned: 25, completedAt: '' },
      { id: '2', missionId: 'm1', date: '2026-11-16', xpEarned: 25, completedAt: '' },
      { id: '3', missionId: 'm2', date: '2026-11-16', xpEarned: 25, completedAt: '' },
    ];
    const res = calculateStreaks(completions, 2, '2026-11-16');
    expect(res.currentStreak).toBe(1);
    expect(res.longestStreak).toBe(1);
  });
});

describe('Takrorlanish qoidalari', () => {
  it('weekdays boyicha togri rejalashtiradi', () => {
    const mission: Mission = {
      ...baseMission,
      recurrence: 'weekdays',
      weekdays: [1, 3, 5],
    };
    expect(isMissionScheduledOnDate(mission, '2026-11-16')).toBe(true);
    expect(isMissionScheduledOnDate(mission, '2026-11-17')).toBe(false);
    expect(isMissionScheduledOnDate(mission, '2026-11-18')).toBe(true);
  });

  it('bir martalik vazifani faqat startDate kunida korsatadi', () => {
    const mission: Mission = {
      ...baseMission,
      recurrence: 'once',
      startDate: '2026-11-16',
    };
    expect(isMissionScheduledOnDate(mission, '2026-11-15')).toBe(false);
    expect(isMissionScheduledOnDate(mission, '2026-11-16')).toBe(true);
    expect(isMissionScheduledOnDate(mission, '2026-11-17')).toBe(false);
  });
});

describe('Marra progressi', () => {
  it('kun holatlari, foiz va pauza kunlarini aniq hisoblaydi', () => {
    const challenge: Challenge = {
      id: 'ch1',
      name: '4 kunlik sprint',
      description: '',
      categoryId: 'cat-learning',
      color: '#3b82f6',
      startDate: '2026-11-13',
      endDate: '2026-11-16',
      linkedMissionIds: ['m1'],
      dailyCriteria: 'any',
      status: 'active',
      pauseIntervals: [{ start: '2026-11-14', end: '2026-11-14' }],
      createdAt: '',
      updatedAt: '',
    };

    const completions: CompletionRecord[] = [
      { id: makeCompletionKey('m1', '2026-11-13'), missionId: 'm1', date: '2026-11-13', xpEarned: 25, completedAt: '' },
    ];

    const summary = calculateChallengeProgress(challenge, completions, '2026-11-16');
    expect(summary.totalCalendarDays).toBe(4);
    expect(summary.totalActiveDays).toBe(3);
    expect(summary.successfulDays).toBe(1);
    expect(summary.missedDays).toBe(1);
    expect(summary.completionPercent).toBe(33);
    expect(summary.challengeXp).toBe(25);
    expect(summary.days.map((d) => d.state)).toEqual([
      'completed',
      'paused',
      'missed',
      'today',
    ]);
  });
});