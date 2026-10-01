import { AuthEntry, NicknameStep } from '../auth/AuthFlow';
import { useAuth } from '../auth/AuthProvider';
import { BettingPage } from './BettingPage';

// Reaching /predict while signed out shows sign-in right there, matching the
// prototype's behavior (auth is a step on the way to betting, not a
// separate destination you navigate to directly).
export function PredictGate() {
  const { user, profile } = useAuth();
  if (!user) return <AuthEntry />;
  if (!profile?.nicknameSet) return <NicknameStep />;
  return <BettingPage />;
}
