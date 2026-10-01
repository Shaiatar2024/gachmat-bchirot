import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

function BallotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M9 12h6M9 16h6M12 3v4" />
      <rect x="3" y="7" width="18" height="14" rx="2" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

// Matches the prototype's .app-header, minus the nav links to pages that
// don't exist yet (pulse, FAQ) — see 00-workplan.md.
export function Header() {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="app-header">
      <div className="container">
        <NavLink to="/" className="brand">
          <div className="brand-tile">
            <BallotIcon />
          </div>
          <span className="brand-text">גחמת בחירות</span>
        </NavLink>
        <nav className="desktop-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            בית
          </NavLink>
          <NavLink to="/predict" className={({ isActive }) => (isActive ? 'active' : '')}>
            הניחוש שלי
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            טבלת המובילים
          </NavLink>
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              ניהול
            </NavLink>
          )}
        </nav>
        <div className="header-actions">
          {user && profile ? (
            <>
              <span className="helper" style={{ margin: 0 }}>
                שלום, {profile.nickname}
              </span>
              <button className="btn btn-outline" onClick={() => void signOut()}>
                התנתקות
              </button>
            </>
          ) : (
            <NavLink to="/predict" className="btn btn-outline">
              <PersonIcon />
              התחברות
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
