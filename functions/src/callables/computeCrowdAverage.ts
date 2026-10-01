import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import type { Bet, CrowdAverage } from '../types.js';

/**
 * Recomputes the crowd-average seat allocation every time any bet is
 * written. bets/{uid} is only readable by its own owner (see
 * firestore.rules), so this is the one thing ever derived from the full set
 * and exposed publicly — an average, never anyone's individual bet.
 */
export const computeCrowdAverage = onDocumentWritten('bets/{uid}', async () => {
  const db = getFirestore();
  const betsSnap = await db.collection('bets').get();
  const bets = betsSnap.docs.map((d) => d.data() as Bet);

  const totals: Record<string, number> = {};
  for (const bet of bets) {
    for (const [partyId, seats] of Object.entries(bet.seats)) {
      totals[partyId] = (totals[partyId] ?? 0) + seats;
    }
  }

  const sampleSize = bets.length;
  const averages: Record<string, number> = {};
  for (const [partyId, total] of Object.entries(totals)) {
    averages[partyId] = sampleSize > 0 ? total / sampleSize : 0;
  }

  const crowdAverage: CrowdAverage = {
    averages,
    sampleSize,
    updatedAt: new Date().toISOString(),
  };
  await db.doc('stats/crowdAverage').set(crowdAverage);
});
