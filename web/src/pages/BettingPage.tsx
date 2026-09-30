import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { db, functions } from '../lib/firebase';
import type { Bet, Party } from '../lib/types';

const TOTAL_SEATS = 120;
const THRESHOLD_MIN_SEATS = 4;

// Ports the seat-allocation interaction validated in the HTML prototype
// (03-design/prototype/gachmat-bchirot.html): a live running tally, an
// over-120 state that turns the bar red instead of stealing seats from other
// parties, and a save button gated on the tally being exactly 120.
export function BettingPage() {
  const { user } = useAuth();
  const [parties, setParties] = useState<(Party & { id: string })[]>([]);
  const [seats, setSeats] = useState<Record<string, number>>({});
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const q = query(collection(db, 'parties'), orderBy('order'));
    return onSnapshot(q, (snap) => {
      setParties(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Party) })));
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    void getDoc(doc(db, 'bets', user.uid)).then((snap) => {
      if (snap.exists()) {
        setSeats((snap.data() as Bet).seats);
        setSaveState('saved');
      }
    });
  }, [user]);

  const total = useMemo(() => Object.values(seats).reduce((a, b) => a + b, 0), [seats]);
  const overLimit = total > TOTAL_SEATS;

  function setSeat(partyId: string, value: number) {
    const clamped = Math.max(0, Math.min(120, Math.round(value) || 0));
    setSeats((prev) => ({ ...prev, [partyId]: clamped }));
    setSaveState('dirty');
  }

  async function handleSave() {
    if (total !== TOTAL_SEATS) return;
    setSaveState('saving');
    const submitBet = httpsCallable(functions, 'submitBet');
    await submitBet({ seats, bonusAnswers: {} });
    setSaveState('saved');
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-6">
      <h1 className="text-xl font-bold">חלקו 120 מנדטים בין המפלגות</h1>

      {overLimit && (
        <div
          className="mt-4 rounded-lg border px-4 py-3 text-sm"
          style={{ background: 'var(--red-soft)', borderColor: 'var(--destructive)' }}
        >
          חריגה של {total - TOTAL_SEATS} מנדטים מהמכסה — לא ניתן לשמור עד שהסכום יהיה 120.
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {parties.map((party) => (
          <li
            key={party.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div>
              <div className="font-medium">{party.name}</div>
              <div className="text-sm text-muted-foreground">בראשות {party.leader}</div>
            </div>
            <input
              type="number"
              min={0}
              step={THRESHOLD_MIN_SEATS}
              value={seats[party.id] ?? 0}
              onChange={(e) => setSeat(party.id, Number(e.target.value))}
              className="w-16 rounded-md border border-border px-2 py-1 text-center"
            />
          </li>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card px-4 py-3">
        <div className="mx-auto max-w-lg">
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (total / TOTAL_SEATS) * 100)}%`,
                background: overLimit ? 'var(--destructive)' : 'var(--primary)',
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {total}/{TOTAL_SEATS}
            </span>
            <button
              disabled={total !== TOTAL_SEATS || saveState === 'saving'}
              onClick={() => void handleSave()}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-40"
            >
              {saveState === 'saved' ? 'שמירה שוב' : 'שמירת ההימור'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
