import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SystemConfig } from '../lib/types';

const ELECTION_DATE = new Date('2026-10-27T00:00:00+03:00');

function daysUntil(target: Date): number {
  const ms = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function BallotBoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="1" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 4h3v2a3 3 0 0 1-3 3" />
      <path d="M7 4H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}

export function HomePage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    // config/system requires signedIn() per firestore.rules — anonymous
    // visitors just won't see the live lock countdown, which is fine (it
    // falls back to the election date itself).
    return onSnapshot(doc(db, 'config/system'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as SystemConfig);
    });
  }, []);

  const lockDate = config ? new Date(config.betLockAt) : ELECTION_DATE;
  const days = daysUntil(lockDate);

  return (
    <main>
      {/* Structure/classes/behavior per CLAUDE-HERO-IMPLEMENTATION.md — keep
          in sync with that doc if this section changes again. */}
      <section className="home-hero">
        <img
          className="home-hero__image"
          src="/home-election-hero.jpg"
          alt="קלפי מאוירת על רקע משכן הכנסת"
          width={1920}
          height={1080}
          fetchPriority="high"
        />
        <div className="home-hero__overlay" aria-hidden="true" />
        <div className="home-hero__content">
          <span className="eyebrow">27 באוקטובר 2026 · הכנסת ה-26</span>
          <h1>אז כמה מנדטים הם יקבלו?</h1>
          <p>מחלקים 120 מושבים בין המפלגות, עונים על כמה שאלות בונוס, ורואים מי צדק כשהתוצאות ייכנסו. בלי כסף, רק כבוד.</p>
          <div className="hero-meta">
            <span className="tabnum ltr">⏳ {days} ימים לנעילת ההימורים</span>
            <span>בלי כסף, רק כבוד</span>
          </div>
          <div className="hero-actions">
            <Link to="/predict" className="btn btn-primary btn-lg">
              בואו ננחש <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <div className="container feature-grid">
          <div className="feature-item">
            <div className="feature-icon">
              <BallotBoxIcon />
            </div>
            <div>
              <h3>בדיוק 120 מנדטים</h3>
              <p>מחלקים את כל מושבי הכנסת בין המפלגות — לא פחות, לא יותר.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <PencilIcon />
            </div>
            <div>
              <h3>ניחוש אחד, ניתן לעריכה</h3>
              <p>אפשר לשנות את הניחוש כל עוד ההימורים פתוחים.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <TrophyIcon />
            </div>
            <div>
              <h3>התוצאות קובעות</h3>
              <p>ברגע שהתוצאות הרשמיות מתפרסמות, טבלת המובילים נסגרת.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="howitworks">
        <div className="container">
          <div className="section-heading">
            <h2>איך משחקים</h2>
            <Link to="/faq" className="link">
              כל הכללים <ArrowIcon />
            </Link>
          </div>
          <div className="how-grid">
            <div className="how-card">
              <div className="num">01</div>
              <h3>מחלקים 120 מנדטים</h3>
              <p>גוררים, לוחצים או מקלידים — עד שכל המושבים חולקו.</p>
            </div>
            <div className="how-card">
              <div className="num">02</div>
              <h3>עונים על שאלות בונוס</h3>
              <p>מי תהיה המפלגה הגדולה, איזה גוש ינצח, ועוד כמה שאלות קלילות.</p>
            </div>
            <div className="how-card">
              <div className="num">03</div>
              <h3>מחכים לתוצאות</h3>
              <p>ביום הבחירות רואים דירוג זמני, ואחרי האישור הרשמי — את התוצאה הסופית.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
