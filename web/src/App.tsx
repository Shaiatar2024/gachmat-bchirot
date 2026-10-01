import { Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PredictGate } from './pages/PredictGate';

export function App() {
  const { loading } = useAuth();

  if (loading) return null;

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/predict" element={<PredictGate />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </>
  );
}
