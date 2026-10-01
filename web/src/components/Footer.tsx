import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

// Was entirely missing — this is what actually makes the FAQ/Pulse pages
// reachable on narrow screens, since .desktop-nav disappears below 650px
// (see MobileNav for the other half of that fix) but the footer doesn't.
export function Footer() {
  const { profile } = useAuth();
  return (
    <footer className="app-footer">
      <div className="container">
        <p>משחק ניחושים עצמאי, לא גוף רשמי</p>
        <div className="footer-links">
          <Link to="/faq">חוקי המשחק</Link>
          <Link to="/pulse">תמונת מצב</Link>
          {profile?.role === 'admin' && <Link to="/admin">ניהול</Link>}
        </div>
      </div>
    </footer>
  );
}
