import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { db } from '../lib/firebase';
import type { BonusQuestion, Party, PartyStatus, Results, SystemConfig } from '../lib/types';

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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const TYPE_LABELS: Record<BonusQuestion['type'], string> = {
  'single-choice': 'בחירה אחת',
  number: 'מספר חופשי',
  text: 'טקסט חופשי',
};

const STATUS_LABELS: Record<PartyStatus, string> = {
  registered: 'רשומה',
  'disqualified-pending-appeal': 'נפסלה (בערעור)',
  withdrawn: 'פרשה',
};

const TOTAL_SEATS = 120;

export function AdminPage() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<(BonusQuestion & { id: string })[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [parties, setParties] = useState<(Party & { id: string })[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [resultSeats, setResultSeats] = useState<Record<string, number>>({});
  const [resultBonusAnswers, setResultBonusAnswers] = useState<Record<string, string | number>>({});
  const [resultsSaved, setResultsSaved] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [betCount, setBetCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubQ = onSnapshot(query(collection(db, 'bonusQuestions'), orderBy('order')), (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as BonusQuestion) })));
    });
    const unsubC = onSnapshot(doc(db, 'config/system'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as SystemConfig);
    });
    const unsubP = onSnapshot(query(collection(db, 'parties'), orderBy('order')), (snap) => {
      setParties(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Party) })));
    });
    const unsubR = onSnapshot(doc(db, 'results/final'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Results;
        setResults(data);
        setResultSeats(data.seats);
        setResultBonusAnswers(data.bonusAnswers);
      }
    });
    return () => {
      unsubQ();
      unsubC();
      unsubP();
      unsubR();
    };
  }, []);

  // One-off reads (not live) — this is an admin overview, not a dashboard
  // that needs to update in real time while the page is open.
  useEffect(() => {
    if (profile?.role !== 'admin') return;
    void getDocs(collection(db, 'users')).then((snap) => setUserCount(snap.size));
    void getDocs(collection(db, 'bets')).then((snap) => setBetCount(snap.size));
  }, [profile]);

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

  async function addParty() {
    const name = window.prompt('שם המפלגה:');
    if (!name) return;
    const leader = window.prompt('שם ראש/ת הרשימה:') ?? '';
    await addDoc(collection(db, 'parties'), {
      name,
      leader,
      status: 'registered',
      order: parties.length,
    });
  }

  async function updatePartyStatus(id: string, status: PartyStatus) {
    await updateDoc(doc(db, 'parties', id), { status });
  }

  async function deleteParty(id: string) {
    await deleteDoc(doc(db, 'parties', id));
  }

  function setResultSeat(partyId: string, value: number) {
    setResultSeats((prev) => ({ ...prev, [partyId]: Math.max(0, Math.round(value) || 0) }));
    setResultsSaved(false);
  }

  function setResultBonusAnswer(questionId: string, value: string | number) {
    setResultBonusAnswers((prev) => ({ ...prev, [questionId]: value }));
    setResultsSaved(false);
  }

  async function saveResults() {
    const payload: Results = {
      seats: resultSeats,
      bonusAnswers: resultBonusAnswers,
      certifiedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'results/final'), payload);
    setResultsSaved(true);
  }

  const registeredParties = parties.filter((p) => p.status === 'registered');
  const resultTotal = Object.values(resultSeats).reduce((a, b) => a + b, 0);

  return (
    <main className="page">
      <div className="container">
        <div className="page-heading">
          <div>
            <span className="eyebrow">ניהול</span>
            <h1>ניהול המשחק</h1>
          </div>
        </div>

        <div className="admin-shell">
          <div>
            <div className="admin-main-section">
              <h2 style={{ fontSize: 20, marginBottom: 14 }}>מוכנות המשחק</h2>
              <div className="admin-row">
                <span>מפלגות רשומות</span>
                <span className="type-chip">{registeredParties.length}</span>
              </div>
              <div className="admin-row">
                <span>שאלות בונוס</span>
                <span className="type-chip">{questions.length}</span>
              </div>
              <div className="admin-row">
                <span>משתמשים רשומים</span>
                <span className="type-chip">{userCount ?? '…'}</span>
              </div>
              <div className="admin-row">
                <span>הימורים שנשמרו</span>
                <span className="type-chip">{betCount ?? '…'}</span>
              </div>
            </div>

            <div className="admin-main-section">
              <div className="section-heading">
                <h2 style={{ fontSize: 20 }}>רשימת מפלגות ({parties.length})</h2>
                <button className="btn btn-secondary" onClick={() => void addParty()}>
                  + מפלגה חדשה
                </button>
              </div>
              {parties.map((p) => (
                <div className="admin-row" key={p.id}>
                  <span>
                    {p.name} <span className="type-chip">{p.leader}</span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                      className="form-input"
                      style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
                      value={p.status}
                      onChange={(e) => void updatePartyStatus(p.id, e.target.value as PartyStatus)}
                    >
                      {(Object.keys(STATUS_LABELS) as PartyStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button className="icon-btn" aria-label={`מחיקת ${p.name}`} title="מחיקה" onClick={() => void deleteParty(p.id)}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>

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
              <div className="section-heading">
                <div>
                  <h2 style={{ fontSize: 20 }}>תוצאות סופיות</h2>
                  {results && <p className="helper">הוזנו לאחרונה: {new Date(results.certifiedAt).toLocaleString('he-IL')}</p>}
                </div>
                <span className="type-chip" style={{ background: resultTotal === TOTAL_SEATS ? undefined : 'var(--red-soft)' }}>
                  {resultTotal} / {TOTAL_SEATS}
                </span>
              </div>
              <p className="helper" style={{ marginBottom: 14 }}>
                אין API רשמי לתוצאות — יש להזין ידנית לפי האתר הרשמי של ועדת הבחירות, פעם אחת, לאחר אישור סופי.
              </p>
              {registeredParties.map((p) => (
                <div className="admin-row" key={p.id}>
                  <span>{p.name}</span>
                  <input
                    className="form-input"
                    type="number"
                    style={{ width: 90 }}
                    value={resultSeats[p.id] ?? 0}
                    onChange={(e) => setResultSeat(p.id, Number(e.target.value))}
                  />
                </div>
              ))}

              {questions.length > 0 && (
                <>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 18, marginBottom: 8 }}>תשובות נכונות לשאלות בונוס</h3>
                  {questions.map((q) => (
                    <div className="admin-row" key={q.id} style={{ flexWrap: 'wrap' }}>
                      <span>{q.text}</span>
                      {q.type === 'single-choice' && q.options ? (
                        <select
                          className="form-input"
                          style={{ width: 'auto' }}
                          value={String(resultBonusAnswers[q.id] ?? '')}
                          onChange={(e) => setResultBonusAnswer(q.id, e.target.value)}
                        >
                          <option value="">— בחרו —</option>
                          {q.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="form-input"
                          type={q.type === 'number' ? 'number' : 'text'}
                          style={{ width: 140 }}
                          value={resultBonusAnswers[q.id] ?? ''}
                          onChange={(e) =>
                            setResultBonusAnswer(q.id, q.type === 'number' ? Number(e.target.value) : e.target.value)
                          }
                        />
                      )}
                    </div>
                  ))}
                </>
              )}

              <button className="btn btn-primary btn-lg" style={{ marginTop: 16 }} onClick={() => void saveResults()}>
                שמירת תוצאות
              </button>
              {resultsSaved && (
                <span className="saved-check" style={{ marginInlineStart: 12 }}>
                  <CheckIcon /> נשמר
                </span>
              )}
              <p className="helper" style={{ marginTop: 8 }}>
                השמירה מפעילה אוטומטית את חישוב הניקוד לכל השחקנים (דורש שה-Cloud Functions פרוסות).
              </p>
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
