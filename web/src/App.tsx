import { Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { AdminPage } from './pages/AdminPage';
import { FaqPage } from './pages/FaqPage';
import { HomePage } from './pages/HomePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PredictGate } from './pages/PredictGate';
import { ProfilePage } from './pages/ProfilePage';
import { PulsePage } from './pages/PulsePage';

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
        <Route path="/pulse" element={<PulsePage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <Footer />
      <MobileNav />
    </>
  );
}
