import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../lib/firebase';
import type { BonusQuestion, SystemConfig } from '../lib/types';

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <circle cx="12" cy="16" r="1.5" />
      <path d="M8 11V8a4 4 0 0 1 7.5-2" />
    </svg>
  );
}

const TYPE_LABELS: Record<BonusQuestion['type'], string> = {
  'single-choice': 'בחירה אחת',
  number: 'מספר חופשי',
  text: 'טקסט חופשי',
};

// Real admin controls for what the schema already supports (bonus questions,
// scoring config, manual lock). Results entry, bonus correct-answer entry,
// and party-list management aren't built yet — the prototype's own admin
// mockup left those as a "reserved" list too, not a working demo.
export function AdminPage() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<(BonusQuestion & { id: string })[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    const unsubQ = onSnapshot(query(collection(db, 'bonusQuestions'), orderBy('order')), (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as BonusQuestion) })));
    });
    const unsubC = onSnapshot(doc(db, 'config/system'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as SystemConfig);
    });
    return () => {
      unsubQ();
      unsubC();
    };
  }, []);

  if (profile?.role !== 'admin') {
    return (
      <main className="page">
        <div className="container narrow-450" style={{ textAlign: 'center' }}>
          <p>העמוד הזה פתוח למנהלים בלבד.</p>
        </div>
      </main>
    );
  }

  async function addQuestion() {
    const text = window.prompt('טקסט השאלה:');
    if (!text) return;
    await addDoc(collection(db, 'bonusQuestions'), {
      text,
      type: 'text',
      order: questions.length,
    });
  }

  async function deleteQuestion(id: string) {
    await deleteDoc(doc(db, 'bonusQuestions', id));
  }

  async function updateConfigField(field: keyof SystemConfig, value: number) {
    await updateDoc(doc(db, 'config/system'), { [field]: value });
  }

  async function toggleLock() {
    if (!config) return;
    await updateDoc(doc(db, 'config/system'), { locked: !config.locked });
  }

  return (
    <main className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <span className="eyebrow">ניהול</span>
            <h1>שאלות בונוס וניקוד</h1>
          </div>
        </div>

        <div className="admin-shell">
          <div>
            <div className="admin-main-section">
              <div className="section-heading">
                <h2 style={{ fontSize: 20 }}>שאלות בונוס ({questions.length})</h2>
                <button className="btn btn-secondary" onClick={() => void addQuestion()}>
                  + שאלה חדשה
                </button>
              </div>
              {questions.map((q) => (
                <div className="admin-row" key={q.id}>
                  <span>
                    {q.text} <span className="type-chip">{TYPE_LABELS[q.type]}</span>
                  </span>
                  <button className="icon-btn" aria-label="מחיקת שאלה" title="מחיקת שאלה" onClick={() => void deleteQuestion(q.id)}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>

            <div className="admin-main-section">
              <h2 style={{ fontSize: 20, marginBottom: 14 }}>הגדרות ניקוד</h2>
              {config && (
                <>
                  <div className="field" style={{ maxWidth: 280 }}>
                    <label>ניקוד לשאלת בונוס</label>
                    <input
                      className="form-input"
                      type="number"
                      defaultValue={config.defaultBonusPoints}
                      onBlur={(e) => void updateConfigField('defaultBonusPoints', Number(e.target.value))}
                    />
                  </div>
                  <div className="field" style={{ maxWidth: 280 }}>
                    <label>סף "חוק שי אתר" (%)</label>
                    <input
                      className="form-input"
                      type="number"
                      defaultValue={config.rarityThresholdPct}
                      onBlur={(e) => void updateConfigField('rarityThresholdPct', Number(e.target.value))}
                    />
                    <p className="helper">אם פחות מהאחוז הזה ניחשו מפלגה נכון בול — הניקוד עליה מוכפל.</p>
                  </div>
                  <div className="field" style={{ maxWidth: 280 }}>
                    <label>בונוס על חלוקה מושלמת</label>
                    <input
                      className="form-input"
                      type="number"
                      defaultValue={config.perfectBonusPoints}
                      onBlur={(e) => void updateConfigField('perfectBonusPoints', Number(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="admin-main-section">
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>אזורים נוספים (בבנייה)</h2>
              <div className="reserved-list">
                <div className="item">ניהול רשימת מפלגות וסטטוס</div>
                <div className="item">הזנת תוצאות מאושרות</div>
                <div className="item">הזנת תשובות נכונות לשאלות בונוס</div>
                <div className="item">סקירת משתמשים ומוכנות המשחק</div>
              </div>
            </div>
          </div>

          <div className={`lock-panel${config?.locked ? ' locked' : ''}`}>
            <h3>
              <LockIcon /> {config?.locked ? 'ההימורים נעולים' : 'ההימורים פתוחים'}
            </h3>
            <p>
              {config?.locked
                ? 'אף אחד לא יכול לשמור הימור כרגע, גם אם מועד הנעילה הרשמי עוד לא הגיע.'
                : 'כל השחקנים יכולים לערוך את הניחוש שלהם. הנעילה תיסגר את ההימורים לכולם בבת אחת, ללא קשר למועד הנעילה המתוכנן.'}
            </p>
            <button className="btn btn-danger btn-full" style={{ marginTop: 14 }} onClick={() => void toggleLock()}>
              {config?.locked ? 'פתיחת ההימורים' : 'נעילת ההימורים לכולם'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
