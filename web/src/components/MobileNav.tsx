import { NavLink } from 'react-router-dom';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function BallotBoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="1" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 4h3v2a3 3 0 0 1-3 3M7 4H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </svg>
  );
}

// The prototype's bottom bar for <650px screens — .desktop-nav hides itself
// at that width via CSS, and nothing was replacing it until now, so a phone
// visitor had NO navigation at all except the header's sign-in button.
export function MobileNav() {
  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-row">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <HomeIcon />
          <span>בית</span>
        </NavLink>
        <NavLink to="/predict" className={({ isActive }) => (isActive ? 'active' : '')}>
          <BallotBoxIcon />
          <span>הניחוש שלי</span>
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          <TrophyIcon />
          <span>מובילים</span>
        </NavLink>
        <NavLink to="/pulse" className={({ isActive }) => (isActive ? 'active' : '')}>
          <PulseIcon />
          <span>תמונת מצב</span>
        </NavLink>
      </div>
    </nav>
  );
}
