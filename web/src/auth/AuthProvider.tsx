import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '../lib/firebase';

// Two sign-in methods per the PRD: Google (fast for people comfortable with
// it) and phone/SMS OTP (for people who aren't) — not everyone in scope for
// this game is Google-native. Both are native Firebase Auth, so there's no
// Twilio/notifier dependency here (that's a separate, still-undecided piece —
// see nfl-betting-pool's disabled WhatsApp notifier for that story).

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  startPhoneSignIn: (phoneNumber: string, containerId: string) => Promise<ConfirmationResult>;
  confirmPhoneCode: (confirmation: ConfirmationResult, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureUserProfile(user: User) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      nickname: user.displayName ?? 'שחקן חדש',
      role: 'user',
      createdAt: new Date().toISOString(),
    });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) void ensureUserProfile(u);
    });
  }, []);

  async function signInWithGoogle() {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function startPhoneSignIn(phoneNumber: string, containerId: string) {
    const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
  }

  async function confirmPhoneCode(confirmation: ConfirmationResult, code: string) {
    await confirmation.confirm(code);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, startPhoneSignIn, confirmPhoneCode, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
