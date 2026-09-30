import { useAuth } from './auth/AuthProvider';
import { BettingPage } from './pages/BettingPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? <BettingPage /> : <LoginPage />;
}
