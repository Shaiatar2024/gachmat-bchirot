import type { ConfirmationResult } from 'firebase/auth';
import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

export function LoginPage() {
  const { signInWithGoogle, startPhoneSignIn, confirmPhoneCode } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    setError(null);
    try {
      const result = await startPhoneSignIn(phone, 'recaptcha-container');
      setConfirmation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שליחת הקוד נכשלה');
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
          <input
            type="tel"
            dir="ltr"
            placeholder="+972501234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-center"
          />
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
