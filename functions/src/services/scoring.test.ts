import { describe, it, expect } from 'vitest';
import { partyScore, computeAllScores } from './scoring.js';
import type { Bet, BonusQuestion, Results, SystemConfig } from '../types.js';

describe('partyScore', () => {
  it('awards the actual seat count on an exact match', () => {
    expect(partyScore(20, 20)).toBe(20);
  });
  it('awards half (rounded up) when off by exactly one', () => {
    expect(partyScore(19, 20)).toBe(10);
    expect(partyScore(21, 20)).toBe(10);
    expect(partyScore(4, 5)).toBe(3); // ceil(5/2)
  });
  it('awards zero when off by two or more', () => {
    expect(partyScore(18, 20)).toBe(0);
    expect(partyScore(0, 20)).toBe(0);
  });
});

describe('computeAllScores', () => {
  const config: SystemConfig = {
    betLockAt: '2026-10-27T20:00:00+03:00',
    defaultBonusPoints: 5,
    rarityThresholdPct: 50,
    perfectBonusPoints: 50,
    locked: false,
  };
  const parties = ['likud', 'yesh'];
  const results: Results = { seats: { likud: 20, yesh: 10 }, bonusAnswers: {}, certifiedAt: 'x' };
  const bonusQuestions: Record<string, BonusQuestion> = {
    pm: { text: 'PM?', type: 'text', order: 0, correctAnswer: 'A' },
  };

  it("doubles the score for a rare exact guess (Shai Atar's Law)", () => {
    // Only 1 of 3 players (< 50%) guessed "yesh" exactly -> that party doubles
    // for the player who got it.
    const bets: Bet[] = [
      { uid: 'a', seats: { likud: 20, yesh: 10 }, bonusAnswers: {}, submittedAt: '', updatedAt: '' },
      { uid: 'b', seats: { likud: 20, yesh: 8 }, bonusAnswers: {}, submittedAt: '', updatedAt: '' },
      { uid: 'c', seats: { likud: 20, yesh: 9 }, bonusAnswers: {}, submittedAt: '', updatedAt: '' },
    ];
    const scores = computeAllScores(bets, results, parties, bonusQuestions, config);
    const a = scores.find((s) => s.uid === 'a')!;
    // likud is guessed exactly by all 3 (100% >= 50%) -> no rarity bonus there.
    // yesh is guessed exactly by only 1 of 3 (33% < 50%) -> doubled for 'a'.
    expect(a.perParty.likud).toBe(20);
    expect(a.perParty.yesh).toBe(20); // 10 doubled
    expect(a.rarityBonusParties).toEqual(['yesh']);
  });

  it('applies the perfect bonus only when every party matches exactly', () => {
    const bets: Bet[] = [
      { uid: 'a', seats: { likud: 20, yesh: 10 }, bonusAnswers: { pm: 'A' }, submittedAt: '', updatedAt: '' },
      { uid: 'b', seats: { likud: 19, yesh: 10 }, bonusAnswers: { pm: 'A' }, submittedAt: '', updatedAt: '' },
    ];
    const scores = computeAllScores(bets, results, parties, bonusQuestions, config);
    const a = scores.find((s) => s.uid === 'a')!;
    const b = scores.find((s) => s.uid === 'b')!;
    expect(a.perfectBonusApplied).toBe(true);
    expect(b.perfectBonusApplied).toBe(false);
    expect(a.perBonus.pm).toBe(5);
    expect(a.totalScore).toBe(a.perParty.likud + a.perParty.yesh + 5 + config.perfectBonusPoints);
  });
});
