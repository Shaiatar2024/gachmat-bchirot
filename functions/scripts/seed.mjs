// Seeds the default-16 party list, scoring config, and bonus questions into
// the emulator (or a real project, if FIRESTORE_EMULATOR_HOST isn't set —
// double-check which project .firebaserc points at before running that way).
// Run via `npm run emulators:seed` from the repo root.
//
// Plain JS, not TS: this is a one-off admin script, not app code, so it
// doesn't need the functions/ build step — see functions/src/types.ts for
// the canonical shape these documents follow.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'gachmat-bchirot' });
const db = getFirestore();

// Source: littlepolls.com poll aggregation, reviewed 2026-09-29 — see
// 00-workplan.md "Where I stopped" for the sourcing discussion per party.
const PARTIES = [
  { id: 'likud', name: 'הליכוד', leader: 'בנימין נתניהו' },
  { id: 'yesh', name: 'ישר', leader: 'גדי איזנקוט' },
  { id: 'beyachad', name: 'ביחד', leader: 'נפתלי בנט' },
  { id: 'democrats', name: 'הדמוקרטים', leader: 'יאיר גולן' },
  { id: 'kahol-lavan', name: 'כחול לבן', leader: 'בני גנץ' },
  { id: 'yisrael-beiteinu', name: 'ישראל ביתנו', leader: 'אביגדור ליברמן' },
  { id: 'shas', name: 'ש״ס', leader: 'אריה דרעי' },
  { id: 'yahadut-hatorah', name: 'יהדות התורה', leader: 'יצחק גולדקנופף' },
  { id: 'religious-zionism', name: 'הציונות הדתית', leader: "בצלאל סמוטריץ'" },
  { id: 'otzma-yehudit', name: 'עוצמה יהודית', leader: 'איתמר בן גביר' },
  { id: 'noam', name: 'נועם', leader: 'אבי מעוז' },
  { id: 'amcha-israel', name: 'עמך ישראל', leader: 'עופר וינטר' },
  { id: 'miluimnikim', name: 'המילואימניקים', leader: 'יואז הנדל' },
  { id: 'joint-list', name: 'הרשימה המשותפת', leader: 'איימן עודה' },
  { id: 'raam', name: 'רע״ם', leader: 'מנצור עבאס' },
  { id: 'ale-yarok', name: 'עלה ירוק', leader: 'ניר יופטרו' },
];

const BONUS_QUESTIONS = [
  { id: 'largest-party', text: 'איזו מפלגה תהיה הגדולה ביותר?', type: 'text', order: 0 },
  { id: 'winning-bloc', text: 'איזה גוש ינצח?', type: 'single-choice', options: ['ימין', 'שמאל-מרכז'], order: 1 },
  { id: 'turnout-pct', text: 'מה יהיה אחוז ההצבעה?', type: 'number', order: 2 },
];

async function main() {
  const batch = db.batch();
  PARTIES.forEach((p, i) => {
    batch.set(db.doc(`parties/${p.id}`), {
      name: p.name,
      leader: p.leader,
      status: 'registered',
      order: i,
    });
  });
  BONUS_QUESTIONS.forEach((q) => {
    const { id, ...data } = q;
    batch.set(db.doc(`bonusQuestions/${id}`), data);
  });
  batch.set(db.doc('config/system'), {
    // Still open — see 00-workplan.md open questions. Placeholder: election
    // day, 2 hours before polls close.
    betLockAt: '2026-10-27T18:00:00+02:00',
    defaultBonusPoints: 5,
    rarityThresholdPct: 20,
    perfectBonusPoints: 50,
  });
  await batch.commit();
  console.log(`Seeded ${PARTIES.length} parties, ${BONUS_QUESTIONS.length} bonus questions, config/system.`);
}

main().then(() => process.exit(0));
