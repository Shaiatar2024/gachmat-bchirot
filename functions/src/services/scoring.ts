import type { Bet, BonusQuestion, Results, Score, SystemConfig } from '../types.js';

/**
 * "Shai Atar's Law" per-party scoring:
 *   exact match       -> points = actual seat count for that party
 *   off by exactly 1  -> half of that, rounded up
 *   off by 2 or more  -> 0
 */
export function partyScore(guess: number, actual: number): number {
  const diff = Math.abs(guess - actual);
  if (diff === 0) return actual;
  if (diff === 1) return Math.ceil(actual / 2);
  return 0;
}

/**
 * Scores every submitted bet against certified results.
 *
 * The rarity bonus needs a first pass over every bet (to know what fraction
 * of players got each party exactly right) before any player's final score
 * can be known, so this takes the whole bet set rather than one bet at a time.
 */
export function computeAllScores(
  bets: Bet[],
  results: Results,
  parties: string[],
  bonusQuestions: Record<string, BonusQuestion>,
  config: SystemConfig
): Score[] {
  const exactCountByParty: Record<string, number> = {};
  for (const partyId of parties) exactCountByParty[partyId] = 0;
  for (const bet of bets) {
    for (const partyId of parties) {
      if ((bet.seats[partyId] ?? 0) === (results.seats[partyId] ?? 0)) {
        exactCountByParty[partyId] += 1;
      }
    }
  }

  const rarePartyIds = parties.filter((partyId) => {
    const pct = (exactCountByParty[partyId] / Math.max(bets.length, 1)) * 100;
    return pct < config.rarityThresholdPct;
  });

  return bets.map((bet) => {
    const perParty: Record<string, number> = {};
    const rarityBonusParties: string[] = [];
    let allExact = true;

    for (const partyId of parties) {
      const guess = bet.seats[partyId] ?? 0;
      const actual = results.seats[partyId] ?? 0;
      let points = partyScore(guess, actual);
      if (guess !== actual) allExact = false;
      if (guess === actual && rarePartyIds.includes(partyId)) {
        points *= 2;
        rarityBonusParties.push(partyId);
      }
      perParty[partyId] = points;
    }

    const perBonus: Record<string, number> = {};
    for (const [questionId, question] of Object.entries(bonusQuestions)) {
      const correct = question.correctAnswer;
      const answer = bet.bonusAnswers[questionId];
      const pointValue = question.pointValue ?? config.defaultBonusPoints;
      perBonus[questionId] = correct != null && answer === correct ? pointValue : 0;
    }

    const perfectBonusApplied = allExact && parties.length > 0;
    const totalScore =
      Object.values(perParty).reduce((a, b) => a + b, 0) +
      Object.values(perBonus).reduce((a, b) => a + b, 0) +
      (perfectBonusApplied ? config.perfectBonusPoints : 0);

    return {
      uid: bet.uid,
      totalScore,
      perParty,
      perBonus,
      rarityBonusParties,
      perfectBonusApplied,
    };
  });
}
