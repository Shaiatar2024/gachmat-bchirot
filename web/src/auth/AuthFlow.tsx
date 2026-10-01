import type { ConfirmationResult } from 'firebase/auth';
import { useRef, useState } from 'react';
import { useAuth } from './AuthProvider';

// Israel-only: players type their number the normal local way (e.g.
// 0501234567) and we prepend +972 ourselves — asking a non-technical user to
// type a country code themselves is exactly how the real-world sign-in
// failure happened (Firebase rejects anything that isn't E.164).
function toIsraeliE164(local: string): string | null {
  const digits = local.replace(/\D/g, '').replace(/^0+/, '');
  if (!/^5\d{8}$/.test(digits)) return null; // Israeli mobile: 05X-XXXXXXX
  return `+972${digits}`;
}

function IsraelFlag() {
  // Two overlapping equilateral triangles centered on (9, 6.5) = a clean
  // hexagram, instead of a hand-drawn star outline that wouldn't look right.
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" aria-hidden="true" style={{ flex: 'none' }}>
      <rect width="18" height="13" fill="white" stroke="#d1d5db" strokeWidth="0.5" />
      <rect y="1.5" width="18" height="1.8" fill="#0038b8" />
      <rect y="9.7" width="18" height="1.8" fill="#0038b8" />
      <polygon points="9,3.8 11.8,8.3 6.2,8.3" fill="none" stroke="#0038b8" strokeWidth="0.45" />
      <polygon points="9,9.2 6.2,4.7 11.8,4.7" fill="none" stroke="#0038b8" strokeWidth="0.45" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
      <path fill="#4285F4" d="M23.5 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.74Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.96H1.24v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.25 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.24a12 12 0 0 0 0 10.78l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.24 6.61l4.01 3.1C6.2 6.87 8.86 4.75 12 4.75Z" />
    </svg>
  );
}

type Step = 'entry' | 'otp';

// Firebase's own error messages are English/technical — translate the ones
// a real user can actually hit, and show the raw code for anything else so
// a failure is reportable instead of a dead end ("it doesn't work").
function describePhoneAuthError(e: unknown): string {
  const code = e instanceof Error && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code.includes('too-many-requests') || code.includes('quota-exceeded')) {
    return 'יותר מדי נסיונות היום — נסו שוב מאוחר יותר';
  }
  if (code.includes('invalid-phone-number')) {
    return 'מספר הטלפון לא תקין';
  }
  return `שליחת הקוד נכשלה (${code || 'שגיאה לא ידועה'}) — נסו שוב`;
}

export function AuthEntry() {
  const { signInWithGoogle, startPhoneSignIn, confirmPhoneCode } = useAuth();
  const [step, setStep] = useState<Step>('entry');
  const [localNumber, setLocalNumber] = useState('');
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      setStep('otp');
    } catch (e) {
      console.error('Phone sign-in failed:', e);
      setError(describePhoneAuthError(e));
    }
  }

  async function handleConfirmCode(fullCode: string) {
    if (!confirmation || fullCode.length !== 6) return;
    setError(null);
    try {
      await confirmPhoneCode(confirmation, fullCode);
    } catch (e) {
      console.error('OTP confirmation failed:', e);
      setError(e instanceof Error && e.message.includes('invalid-verification-code') ? 'הקוד שגוי' : describePhoneAuthError(e));
    }
  }

  function handleOtpChange(i: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && otpRefs.current[i + 1]) otpRefs.current[i + 1]?.focus();
    const fullCode = next.join('');
    if (fullCode.length === 6) void handleConfirmCode(fullCode);
  }

  if (step === 'otp') {
    const maskedNumber = `+972-${localNumber.replace(/\D/g, '').slice(0, 2)}-•••••${localNumber.slice(-2)}`;
    return (
      <div className="auth-shell">
        <div className="panel auth-panel">
          <h1 style={{ fontSize: 28 }}>הזינו את הקוד</h1>
          <p>
            שלחנו קוד בן 6 ספרות למספר <span className="ltr tabnum">{maskedNumber}</span>
          </p>
          <div className="otp-boxes" style={{ marginTop: 24 }}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                className="tabnum"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
              />
            ))}
          </div>
          <button
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: 22 }}
            onClick={() => void handleConfirmCode(code.join(''))}
          >
            אישור
          </button>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button className="link" style={{ justifyContent: 'center', width: '100%' }} onClick={() => setStep('entry')}>
              חזרה למספר טלפון
            </button>
          </div>
          {error && <p style={{ textAlign: 'center', color: 'var(--destructive)', marginTop: 14 }}>{error}</p>}
          <div id="recaptcha-container" />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="panel auth-panel">
        <div className="feature-icon" style={{ width: 52, height: 52, marginInline: 'auto' }}>
          <PersonIcon />
        </div>
        <h1>בואו נתחיל</h1>
        <p>מתחברים כדי לשמור את הניחוש ולהופיע בטבלת המובילים.</p>
        <div style={{ marginTop: 24 }}>
          <button className="btn btn-outline btn-full btn-lg" onClick={() => void signInWithGoogle()}>
            <GoogleIcon />
            המשך עם Google
          </button>
          <div className="divider">או</div>
          <div className="field">
            <label>מספר טלפון</label>
            <div className="phone-group">
              <span className="phone-prefix">
                <IsraelFlag />
                +972
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="50-1234567"
                value={localNumber}
                onChange={(e) => setLocalNumber(e.target.value)}
              />
            </div>
            <p className="helper">נשלח אליכם קוד חד-פעמי ב-SMS.</p>
          </div>
          <button className="btn btn-primary btn-full btn-lg" onClick={() => void handleSendCode()}>
            שליחת קוד אימות
          </button>
        </div>
        {error && <p style={{ textAlign: 'center', color: 'var(--destructive)', marginTop: 14 }}>{error}</p>}
        <div id="recaptcha-container" />
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function NicknameStep() {
  const { setNickname } = useAuth();
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);
  const disabled = value.trim().length < 2;

  async function handleSubmit() {
    if (disabled) return;
    await setNickname(value.trim());
    setSaved(true);
  }

  return (
    <div className="auth-shell">
      <div className="panel auth-panel">
        <h1 style={{ fontSize: 28 }}>איך נקרא לכם?</h1>
        <p>הכינוי הזה יופיע בטבלת המובילים לכולם.</p>
        <div className="field" style={{ marginTop: 22 }}>
          <label>כינוי ציבורי</label>
          <input
            className="form-input"
            maxLength={24}
            placeholder="למשל: השחקן שתמיד צודק"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
          />
          <p className="helper">בין 2 ל-24 תווים.</p>
        </div>
        <button className="btn btn-primary btn-full btn-lg" disabled={disabled} onClick={() => void handleSubmit()}>
          סיום ולניחוש הראשון
        </button>
        {saved && (
          <div style={{ marginTop: 14 }}>
            <span className="saved-check">
              <CheckIcon />
              נשמר
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
