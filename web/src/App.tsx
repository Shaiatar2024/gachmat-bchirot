import { AuthEntry, NicknameStep } from './auth/AuthFlow';
import { useAuth } from './auth/AuthProvider';
import { Header } from './components/Header';
import { BettingPage } from './pages/BettingPage';

export function App() {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  return (
    <>
      <Header />
      {!user ? <AuthEntry /> : !profile?.nicknameSet ? <NicknameStep /> : <BettingPage />}
    </>
  );
}
