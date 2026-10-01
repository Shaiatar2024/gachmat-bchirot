import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import type { Bet, Party, SystemConfig } from '../types.js';

const TOTAL_SEATS = 120;
const THRESHOLD_MIN_SEATS = 4;

/**
 * Validates and writes the caller's one-shot bet. Direct client writes to
 * bets/{uid} are blocked in firestore.rules — summing a map and checking a
 * 0-or->=4 constraint per entry isn't expressible cleanly in rules, so all
 * of that validation lives here instead, using the Admin SDK to write.
 */
export const submitBet = onCall<{
  seats: Record<string, number>;
  bonusAnswers: Record<string, string | number>;
}>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to place a bet.');
  }
  const uid = request.auth.uid;
  const { seats, bonusAnswers } = request.data;
  if (!seats || typeof seats !== 'object') {
    throw new HttpsError('invalid-argument', 'seats is required.');
  }

  const db = getFirestore();

  const configSnap = await db.doc('config/system').get();
  const config = configSnap.data() as SystemConfig | undefined;
  if (config && (config.locked || new Date() >= new Date(config.betLockAt))) {
    throw new HttpsError('failed-precondition', 'Betting is locked.');
  }

  const partiesSnap = await db.collection('parties').get();
  const validPartyIds = new Set(partiesSnap.docs.map((d) => d.id));
  const registeredPartyIds = new Set(
    partiesSnap.docs
      .filter((d) => (d.data() as Party).status === 'registered')
      .map((d) => d.id)
  );

  let total = 0;
  for (const [partyId, count] of Object.entries(seats)) {
    if (!validPartyIds.has(partyId)) {
      throw new HttpsError('invalid-argument', `Unknown party: ${partyId}`);
    }
    if (!registeredPartyIds.has(partyId) && count !== 0) {
      throw new HttpsError('invalid-argument', `${partyId} is not a registered party.`);
    }
    if (count !== 0 && count < THRESHOLD_MIN_SEATS) {
      throw new HttpsError(
        'invalid-argument',
        `${partyId}: ${count} is below the electoral threshold — must be 0 or >= ${THRESHOLD_MIN_SEATS}.`
      );
    }
    total += count;
  }
  if (total !== TOTAL_SEATS) {
    throw new HttpsError('invalid-argument', `Seats must sum to ${TOTAL_SEATS}, got ${total}.`);
  }

  const now = new Date().toISOString();
  const existing = await db.doc(`bets/${uid}`).get();
  const bet: Bet = {
    uid,
    seats,
    bonusAnswers: bonusAnswers ?? {},
    submittedAt: existing.exists ? (existing.data() as Bet).submittedAt : now,
    updatedAt: now,
  };
  await db.doc(`bets/${uid}`).set(bet);
  return { ok: true };
});
