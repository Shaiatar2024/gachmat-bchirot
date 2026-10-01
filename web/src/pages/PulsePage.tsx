import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import type { CrowdAverage, Party } from '../lib/types';

function PollIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

// One row per party rather than vertical columns — with 16 parties, vertical
// bars would need tiny rotated labels to fit a half-width card; a horizontal
// list stays readable at any count and still reads as a bar chart.
function CrowdAverageChart({
  parties,
  crowdAverage,
}: {
  parties: (Party & { id: string })[];
  crowdAverage: CrowdAverage;
}) {
  const maxAvg = Math.max(1, ...parties.map((p) => crowdAverage.averages[p.id] ?? 0));
  const sorted = [...parties].sort(
    (a, b) => (crowdAverage.averages[b.id] ?? 0) - (crowdAverage.averages[a.id] ?? 0)
  );

  return (
    <div className="crowd-chart">
      {sorted.map((party) => {
        const avg = crowdAverage.averages[party.id] ?? 0;
        return (
          <div className="crowd-chart-row" key={party.id}>
            <span className="crowd-chart-label">{party.name}</span>
            <div className="crowd-chart-track">
              <div className="crowd-chart-fill" style={{ width: `${(avg / maxAvg) * 100}%` }} />
            </div>
            <span className="crowd-chart-value tabnum">{avg.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

// "External polls" and "crowd average" are deliberately two separate cards,
// never merged — different sources, not to be confused (see page copy).
export function PulsePage() {
  const [parties, setParties] = useState<(Party & { id: string })[]>([]);
  const [crowdAverage, setCrowdAverage] = useState<CrowdAverage | null>(null);

  useEffect(() => {
    const unsubParties = onSnapshot(query(collection(db, 'parties'), orderBy('order')), (snap) => {
      setParties(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Party) })));
    });
    const unsubStats = onSnapshot(doc(db, 'stats/crowdAverage'), (snap) => {
      setCrowdAverage(snap.exists() ? (snap.data() as CrowdAverage) : null);
    });
    return () => {
      unsubParties();
      unsubStats();
    };
  }, []);

  const hasCrowdData = crowdAverage !== null && crowdAverage.sampleSize > 0 && parties.length > 0;

  return (
    <main className="page">
      <div className="container narrow-1050">
        <div className="page-heading">
          <div>
            <span className="eyebrow">תמונת מצב</span>
            <h1>סקרים וממוצע השחקנים</h1>
            <p>שני מקורות מידע שונים — לא להתבלבל ביניהם.</p>
          </div>
        </div>
        <div className="pulse-grid">
          <div className="pulse-card">
            <div className="icon-row">
              <ClockIcon />
              <h3>ממוצע השחקנים</h3>
            </div>
            <p className="desc">
              כך בממוצע כל השחקנים חילקו את 120 המנדטים. לא סקר מדעי — רק חוכמת הקהל
              {hasCrowdData && ` (מבוסס על ${crowdAverage.sampleSize} הימורים שנשמרו).`}
            </p>
            {hasCrowdData ? (
              <CrowdAverageChart parties={parties} crowdAverage={crowdAverage} />
            ) : (
              <div className="empty-state">עדיין אין מספיק הימורים כדי להציג ממוצע.</div>
            )}
          </div>
          <div className="pulse-card">
            <div className="icon-row">
              <PollIcon />
              <h3>סקרים חיצוניים</h3>
            </div>
            <p className="desc">ממוצע סקרים מפורסמים, ברמת גוש. מקור נפרד לגמרי מהניחושים באפליקציה.</p>
            <div className="empty-state">נתוני הסקרים עדיין לא חוברו.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
