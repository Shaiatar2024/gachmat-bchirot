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

// Both cards are honestly empty, same as the prototype itself (it never
// wired real data here either — this is listed open in 00-workplan.md):
// external polls need a sourcing decision (link vs. embed littlepolls.com),
// and the crowd average needs a new Cloud Function, since bets/{uid} is only
// readable by its own owner — averaging everyone's bet requires a
// server-side aggregate, not a client-side read across all bets.
export function PulsePage() {
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
              <PollIcon />
              <h3>סקרים חיצוניים</h3>
            </div>
            <p className="desc">ממוצע סקרים מפורסמים, ברמת גוש. מקור נפרד לגמרי מהניחושים באפליקציה.</p>
            <div className="empty-state">נתוני הסקרים עדיין לא חוברו.</div>
          </div>
          <div className="pulse-card">
            <div className="icon-row">
              <ClockIcon />
              <h3>ממוצע השחקנים</h3>
            </div>
            <p className="desc">כך בממוצע כל השחקנים חילקו את 120 המנדטים. לא סקר מדעי — רק חוכמת הקהל.</p>
            <div className="empty-state">עדיין אין מספיק הימורים כדי להציג ממוצע.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
