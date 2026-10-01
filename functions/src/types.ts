// Shared shapes for Firestore documents. Kept in sync with firestore.rules
// and web/src/lib/types.ts by hand — no shared package yet, this is a small
// enough project that a build-time sync step would be overkill.

export interface SystemConfig {
  /** ISO 8601. Bets are frozen at/after this instant. */
  betLockAt: string;
  /** Points for an exactly-correct bonus-question answer, when a question omits its own. */
  defaultBonusPoints: number;
  /**
   * "Shai Atar's Law": if fewer than this % of *other* players also guessed a
   * party's seat count exactly right, that party's score is doubled for
   * everyone who got it exactly right.
   */
  rarityThresholdPct: number;
  /** Bonus added on top when a player matches every party's seat count exactly. */
  perfectBonusPoints: number;
  /** Admin override: force bets closed right now, independent of betLockAt. */
  locked: boolean;
}

export type PartyStatus = 'registered' | 'disqualified-pending-appeal' | 'withdrawn';

export interface Party {
  name: string;
  leader: string;
  status: PartyStatus;
  order: number;
}

export interface BonusQuestion {
  text: string;
  type: 'single-choice' | 'number' | 'text';
  options?: string[];
  order: number;
  pointValue?: number;
  /** Filled in by an admin once known; null/absent until then. */
  correctAnswer?: string | number | null;
}

export interface Bet {
  uid: string;
  /** partyId -> seat count. Every value is 0 or >= 4; values sum to 120. */
  seats: Record<string, number>;
  /** questionId -> the player's answer. */
  bonusAnswers: Record<string, string | number>;
  submittedAt: string;
  updatedAt: string;
}

export interface Results {
  /** partyId -> certified mandate count. Sums to 120. */
  seats: Record<string, number>;
  bonusAnswers: Record<string, string | number>;
  certifiedAt: string;
}

export interface Score {
  uid: string;
  // Denormalized at write time (scores/{uid} is publicly readable for the
  // leaderboard, but users/{uid} isn't) so the client never has to join.
  nickname: string;
  totalScore: number;
  perParty: Record<string, number>;
  perBonus: Record<string, number>;
  rarityBonusParties: string[];
  perfectBonusApplied: boolean;
}

export interface UserProfile {
  uid: string;
  /** Private — not shown on the leaderboard, just for the player's own profile. */
  name: string;
  /** Public — shown on the leaderboard. */
  nickname: string;
  nicknameSet: boolean;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface CrowdAverage {
  /** partyId -> average seats across all submitted bets. */
  averages: Record<string, number>;
  sampleSize: number;
  updatedAt: string;
}
