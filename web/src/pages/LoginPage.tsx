import type { ConfirmationResult } from 'firebase/auth';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

// Israel-only: players type their number the normal local way (e.g.
// 0501234567) and we prepend +972 ourselves — asking a non-technical user to
// type a country code themselves is exactly how the real-world phone
// sign-in failure happened (Firebase rejects anything that isn't E.164).
function toIsraeliE164(local: string): string | null {
  const digits = local.replace(/\D/g, '').replace(/^0+/, '');
  if (!/^5\d{8}$/.test(digits)) return null; // Israeli mobile: 05X-XXXXXXX
  return `+972${digits}`;
}

function IsraelFlag() {
  // Two overlapping equilateral triangles centered on (9, 6.5) = a clean
  // hexagram, instead of a hand-drawn star outline that wouldn't look right.
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" aria-hidden="true">
      <rect width="18" height="13" fill="white" stroke="#d1d5db" strokeWidth="0.5" />
      <rect y="1.5" width="18" height="1.8" fill="#0038b8" />
      <rect y="9.7" width="18" height="1.8" fill="#0038b8" />
      <polygon points="9,3.8 11.8,8.3 6.2,8.3" fill="none" stroke="#0038b8" strokeWidth="0.45" />
      <polygon points="9,9.2 6.2,4.7 11.8,4.7" fill="none" stroke="#0038b8" strokeWidth="0.45" />
    </svg>
  );
}

export function LoginPage() {
  const { signInWithGoogle, startPhoneSignIn, confirmPhoneCode } = useAuth();
  const [localNumber, setLocalNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    setError(null);
    const phone = toIsraeliE164(localNumber);
    if (!phone) {
      setError('מספר לא תקין — הזינו מספר נייד ישראלי, לדוגמה 0501234567');
      return;
    }
    try {
      const result = await startPhoneSignIn(phone, 'recaptcha-container');
      setConfirmation(result);
    } catch {
      setError('שליחת הקוד נכשלה, נסו שוב');
    }
  }

  async function handleConfirmCode() {
    if (!confirmation) return;
    setError(null);
    try {
      await confirmPhoneCode(confirmation, code);
    } catch {
      setError('הקוד שגוי');
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">גחמת בחירות</h1>
        <p className="mt-1 text-sm text-muted-foreground">התחברו כדי להגיש את ההימור שלכם</p>
      </div>

      <button
        onClick={() => void signInWithGoogle()}
        className="rounded-lg border border-border bg-card px-4 py-3 font-medium shadow-sm"
      >
        התחברות עם Google
      </button>

      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs">או</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {!confirmation ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-stretch overflow-hidden rounded-lg border border-border" dir="ltr">
            <span className="flex items-center gap-1.5 border-l border-border bg-muted px-3 text-sm text-muted-foreground">
              <IsraelFlag />+972
            </span>
            <input
              type="tel"
              inputMode="numeric"
              dir="ltr"
              placeholder="050-1234567"
              value={localNumber}
              onChange={(e) => setLocalNumber(e.target.value)}
              className="flex-1 px-3 py-2 text-center"
            />
          </div>
          <button
            onClick={() => void handleSendCode()}
            className="rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground"
          >
            שליחת קוד אימות
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-center tracking-widest"
          />
          <button
            onClick={() => void handleConfirmCode()}
            className="rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground"
          >
            אישור קוד
          </button>
        </div>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <div id="recaptcha-container" />
    </div>
  );
}
