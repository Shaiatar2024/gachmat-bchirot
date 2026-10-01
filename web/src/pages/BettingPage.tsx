import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { db, functions } from '../lib/firebase';
import type { Bet, BonusQuestion, Party } from '../lib/types';

const TOTAL_SEATS = 120;

// Ports the betting screen from the approved prototype
// (../../03-design/prototype/gachmat-bchirot.html, view-predict) markup and
// CSS classes as closely as possible, rather than a from-scratch reinterpretation.

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function PartyRow({
  party,
  value,
  onChange,
}: {
  party: Party;
  value: number;
  onChange: (next: number) => void;
}) {
  const numRef = useRef<HTMLInputElement>(null);

  function bump(delta: number) {
    if (delta > 0) onChange(value === 0 ? 4 : value + 1);
    else onChange(value <= 4 ? 0 : value - 1);
  }

  return (
    <div className="party-row">
      <div className="party-id">
        <span className="name">{party.name}</span>
        <span className="leader">בראשות {party.leader}</span>
      </div>
      <div className="party-controls">
        <div className="party-controls-row">
          <button className="stepper-btn" aria-label={`הוספת מנדט ל${party.name}`} onClick={() => bump(1)}>
            <PlusIcon />
          </button>
          <input
            ref={numRef}
            className="seat-number tabnum"
            type="number"
            min={0}
            max={120}
            value={value}
            aria-label={`מספר מנדטים ל${party.name}`}
            onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
            onWheel={(e) => {
              if (document.activeElement !== numRef.current) return;
              e.preventDefault();
              bump(e.deltaY < 0 ? 1 : -1);
            }}
          />
          <button className="stepper-btn" aria-label={`הפחתת מנדט מ${party.name}`} onClick={() => bump(-1)}>
            <MinusIcon />
          </button>
        </div>
        <input
          type="range"
          className="party-slider"
          min={0}
          max={120}
          step={1}
          value={value}
          aria-label={`מחוון מנדטים ל${party.name}`}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        />
      </div>
    </div>
  );
}

function BonusQuestionRow({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: BonusQuestion;
  value: string | number | undefined;
  onChange: (next: string | number) => void;
}) {
  return (
    <div className="bonus-q">
      <div className="bonus-num">{String(index + 1).padStart(2, '0')}</div>
      <div className="bonus-body">
        <h3>{question.text}</h3>
        {question.type === 'single-choice' && question.options && (
          <div className="option-group">
            {question.options.map((option) => (
              <button
                key={option}
                className="option-btn"
                aria-pressed={value === option}
                onClick={() => onChange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        {question.type === 'number' && (
          <div className="percent-field">
            <input
              className="form-input"
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={value ?? ''}
              onChange={(e) => onChange(Number(e.target.value))}
            />
            <span className="ltr" style={{ fontWeight: 700 }}>
              %
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function BettingPage() {
  const { user } = useAuth();
  const [parties, setParties] = useState<(Party & { id: string })[]>([]);
  const [bonusQuestions, setBonusQuestions] = useState<(BonusQuestion & { id: string })[]>([]);
  const [seats, setSeats] = useState<Record<string, number>>({});
  const [bonusAnswers, setBonusAnswers] = useState<Record<string, string | number>>({});
  const [search, setSearch] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const unsubParties = onSnapshot(query(collection(db, 'parties'), orderBy('order')), (snap) => {
      setParties(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Party) })));
    });
    const unsubBonus = onSnapshot(query(collection(db, 'bonusQuestions'), orderBy('order')), (snap) => {
      setBonusQuestions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as BonusQuestion) })));
    });
    return () => {
      unsubParties();
      unsubBonus();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    void getDoc(doc(db, 'bets', user.uid)).then((snap) => {
      if (snap.exists()) {
        const bet = snap.data() as Bet;
        setSeats(bet.seats);
        setBonusAnswers(bet.bonusAnswers);
        setSaveState('saved');
      }
    });
  }, [user]);

  const total = useMemo(() => Object.values(seats).reduce((a, b) => a + b, 0), [seats]);
  const overLimit = total > TOTAL_SEATS;
  const complete = total === TOTAL_SEATS;

  const shownParties = useMemo(
    () => (search ? parties.filter((p) => p.name.includes(search)) : parties),
    [parties, search]
  );

  const answeredCount = Object.keys(bonusAnswers).length;

  function setSeat(partyId: string, value: number) {
    setSeats((prev) => ({ ...prev, [partyId]: Math.max(0, Math.min(120, value)) }));
    setSaveState('dirty');
  }

  function setBonusAnswer(questionId: string, value: string | number) {
    setBonusAnswers((prev) => ({ ...prev, [questionId]: value }));
    setSaveState('dirty');
  }

  function resetAll() {
    setSeats({});
    setSaveState('dirty');
  }

  async function handleSave() {
    if (!complete) return;
    setSaveState('saving');
    const submitBet = httpsCallable(functions, 'submitBet');
    await submitBet({ seats, bonusAnswers });
    setSaveState('saved');
  }

  let tallyMsg = `נשארו ${TOTAL_SEATS - total} מנדטים לחלק`;
  if (overLimit) tallyMsg = `חריגה של ${total - TOTAL_SEATS} מנדטים מהמכסה`;
  else if (complete) tallyMsg = 'בול! כל המנדטים חולקו';

  let saveStatusText = 'אפשר לשמור את ההימור בכל שלב';
  if (overLimit) saveStatusText = 'לא ניתן לשמור — החלוקה חורגת מ-120 מנדטים';
  else if (saveState === 'dirty') saveStatusText = 'יש לכם שינויים שעוד לא נשמרו';
  else if (saveState === 'saved') saveStatusText = 'ההימור נשמר';

  return (
    <main className="page">
      <div className="container narrow-1050">
        <div className="page-heading">
          <div>
            <span className="eyebrow">ההימור שלי</span>
            <h1>מחלקים 120 מנדטים</h1>
            <p>גררו את המחוון, הקלידו מספר, או השתמשו בכפתורים — כל מפלגה מקבלת 0 או לפחות 4 מושבים.</p>
          </div>
        </div>

        <div className="demo-banner">
          <InfoIcon />
          <span>רשימת 16 המפלגות מבוססת על סקרים נוכחיים ועשויה להתעדכן לקראת הבחירות.</span>
        </div>

        {overLimit && (
          <div className="error-banner">
            <AlertIcon />
            <span>החלוקה הנוכחית חורגת ממכסת 120 המנדטים האפשרית — צריך להוריד מנדטים לפני שאפשר לשמור.</span>
          </div>
        )}

        <div className={`seat-tally${complete ? ' complete' : ''}${overLimit ? ' over' : ''}`}>
          <div className="count">
            <span className="tabnum">{total}</span>
            <small> / {TOTAL_SEATS}</small>
          </div>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${Math.min(100, (total / TOTAL_SEATS) * 100)}%` }} />
          </div>
          <div className="msg">{tallyMsg}</div>
        </div>

        <div className="predict-toolbar">
          <span className="helper" style={{ margin: 0 }}>
            {search ? `מציג ${shownParties.length} מתוך ${parties.length} מפלגות` : `${parties.length} מפלגות`}
          </span>
          <div className="search-field">
            <SearchIcon />
            <input
              className="form-input"
              placeholder="חיפוש מפלגה…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={resetAll}>
            איפוס
          </button>
        </div>

        <div className="party-list">
          {shownParties.map((party) => (
            <PartyRow
              key={party.id}
              party={party}
              value={seats[party.id] ?? 0}
              onChange={(v) => setSeat(party.id, v)}
            />
          ))}
        </div>
        {shownParties.length === 0 && <p className="no-results">לא נמצאה מפלגה בשם הזה.</p>}

        {bonusQuestions.length > 0 && (
          <section className="bonus-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  סיבוב הבונוס · {answeredCount}/{bonusQuestions.length} נענו
                </span>
                <h2 style={{ marginTop: 6 }}>שאלות בונוס</h2>
              </div>
            </div>
            {bonusQuestions.map((q, i) => (
              <BonusQuestionRow
                key={q.id}
                index={i}
                question={q}
                value={bonusAnswers[q.id]}
                onChange={(v) => setBonusAnswer(q.id, v)}
              />
            ))}
          </section>
        )}

        <div className="status-band" style={{ marginTop: 32 }}>
          <strong>
            {overLimit ? <AlertIcon /> : saveState === 'saved' ? <InfoIcon /> : <InfoIcon />}
            {saveStatusText}
          </strong>
          <button className="btn btn-primary btn-lg" disabled={!complete || saveState === 'saving'} onClick={() => void handleSave()}>
            {saveState === 'saved' ? 'שמירה שוב' : 'שמירת ההימור'}
          </button>
        </div>
      </div>
    </main>
  );
}
