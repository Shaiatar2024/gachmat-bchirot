import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import type { Score } from '../lib/types';

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function LeaderboardTable({ scores }: { scores: Score[] }) {
  if (scores.length === 0) {
    return (
      <div className="empty-state">
        אין עדיין ניקוד — הטבלה תתמלא לאחר פרסום תוצאות (ולו גם חלקיות) ביום הבחירות.
      </div>
    );
  }
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="lb-header">
        <span>#</span>
        <span>שחקן</span>
        <span style={{ textAlign: 'end' }}>ניקוד</span>
      </div>
      <div>
        {scores.map((s, i) => (
          <div className="lb-row" key={s.uid}>
            <span className="lb-rank tabnum">{i + 1}</span>
            <span className="lb-player">
              <span className="lb-avatar">{s.nickname.charAt(0)}</span>
              {s.nickname}
            </span>
            <span className="lb-score tabnum">{s.totalScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// The prototype distinguishes a "live" (election-night, provisional-count)
// leaderboard from the final one — that needs a separate provisional-results
// admin flow we haven't built yet (see 00-workplan.md), so both tabs read the
// same real `scores` collection for now. Worth splitting once results entry
// supports a provisional stage.
export function LeaderboardPage() {
  const [tab, setTab] = useState<'regular' | 'live'>('regular');
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'scores'), orderBy('totalScore', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      setScores(snap.docs.map((d) => d.data() as Score));
    });
  }, []);

  return (
    <main className="page">
      <div className="container narrow-1050">
        <div className="page-heading">
          <div>
            <span className="eyebrow">מי הכי קרוב</span>
            <h1>טבלת המובילים</h1>
            <p>הדירוג האמיתי יופיע רק לאחר פרסום התוצאות הרשמיות והמאושרות.</p>
          </div>
        </div>

        <div className="tabs">
          <button className={tab === 'regular' ? 'active' : ''} onClick={() => setTab('regular')}>
            טבלה רגילה
          </button>
          <button className={tab === 'live' ? 'active' : ''} onClick={() => setTab('live')}>
            ליל הבחירות
          </button>
        </div>

        {tab === 'regular' ? (
          <div>
            <div className="demo-banner">
              <InfoIcon />
              <span>הטבלה מתעדכנת אוטומטית ברגע שהתוצאות הרשמיות נכנסות למערכת.</span>
            </div>
            <LeaderboardTable scores={scores} />
          </div>
        ) : (
          <div>
            <div className="live-panel">
              <span className="live-badge">
                <span className="live-dot" />
                LIVE
              </span>
              <span>דירוג זמני מבוסס על ספירות לא רשמיות — לא סופי.</span>
            </div>
            <LeaderboardTable scores={scores} />
          </div>
        )}
      </div>
    </main>
  );
}
