import { useAuth } from '../auth/AuthProvider';

function BallotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M9 12h6M9 16h6M12 3v4" />
      <rect x="3" y="7" width="18" height="14" rx="2" />
    </svg>
  );
}

// Matches the prototype's .app-header, minus the nav links to pages that
// don't exist yet (home, leaderboard, pulse, FAQ) — see 00-workplan.md.
export function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="app-header">
      <div className="container">
        <div className="brand">
          <div className="brand-tile">
            <BallotIcon />
          </div>
          <span className="brand-text">גחמת בחירות</span>
        </div>
        {profile && (
          <div className="header-actions">
            <span className="helper" style={{ margin: 0 }}>
              שלום, {profile.nickname}
            </span>
            <button className="btn btn-outline" onClick={() => void signOut()}>
              התנתקות
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
