// Client-side copy of functions/src/types.ts — see the note there on why
// this isn't a shared package yet.

export interface SystemConfig {
  betLockAt: string;
  defaultBonusPoints: number;
  rarityThresholdPct: number;
  perfectBonusPoints: number;
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
  correctAnswer?: string | number | null;
}

export interface Bet {
  uid: string;
  seats: Record<string, number>;
  bonusAnswers: Record<string, string | number>;
  submittedAt: string;
  updatedAt: string;
}

export interface Score {
  uid: string;
  totalScore: number;
  perParty: Record<string, number>;
  perBonus: Record<string, number>;
  rarityBonusParties: string[];
  perfectBonusApplied: boolean;
}

export interface UserProfile {
  uid: string;
  nickname: string;
  nicknameSet: boolean;
  role: 'user' | 'admin';
  createdAt: string;
}
