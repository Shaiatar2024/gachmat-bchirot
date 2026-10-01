import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { computeAllScores } from '../services/scoring.js';
import type { Bet, BonusQuestion, Results, SystemConfig, UserProfile } from '../types.js';

/**
 * Fires when the admin enters/edits results/final. Recomputes every player's
 * score from scratch — the rarity bonus depends on the whole bet set, so
 * there's no cheaper incremental update, and volume here (a few hundred
 * players) makes a full recompute fine.
 */
export const computeScores = onDocumentWritten('results/{docId}', async (event) => {
  const results = event.data?.after.data() as Results | undefined;
  if (!results) return; // results doc was deleted

  const db = getFirestore();
  const [betsSnap, partiesSnap, bonusSnap, configSnap, usersSnap] = await Promise.all([
    db.collection('bets').get(),
    db.collection('parties').get(),
    db.collection('bonusQuestions').get(),
    db.doc('config/system').get(),
    db.collection('users').get(),
  ]);

  const bets = betsSnap.docs.map((d) => d.data() as Bet);
  const partyIds = partiesSnap.docs.map((d) => d.id);
  const bonusQuestions: Record<string, BonusQuestion> = {};
  for (const d of bonusSnap.docs) bonusQuestions[d.id] = d.data() as BonusQuestion;
  const config = configSnap.data() as SystemConfig;
  const nicknames: Record<string, string> = {};
  for (const d of usersSnap.docs) nicknames[d.id] = (d.data() as UserProfile).nickname;

  const scores = computeAllScores(bets, results, partyIds, bonusQuestions, config);

  const batch = db.batch();
  for (const score of scores) {
    batch.set(db.doc(`scores/${score.uid}`), { ...score, nickname: nicknames[score.uid] ?? '—' });
  }
  await batch.commit();
});
