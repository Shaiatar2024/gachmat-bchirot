import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// Reached by clicking your name in the header. Per DESIGN_GUIDELINES.md
// section 14 (Profile setup): a clear saved state with a check icon, reset
// as soon as a saved field is edited again.
export function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setNickname(profile.nickname);
    }
  }, [profile]);

  if (!user || !profile) {
    return (
      <main className="page">
        <div className="container narrow-450" style={{ textAlign: 'center' }}>
          <p>התחברו כדי לראות את הפרופיל שלכם.</p>
        </div>
      </main>
    );
  }

  const nicknameValid = nickname.trim().length >= 2 && nickname.trim().length <= 24;

  async function handleSave() {
    if (!nicknameValid) return;
    await updateProfile({ name: name.trim(), nickname: nickname.trim() });
    setSaved(true);
    setTimeout(() => navigate('/'), 600);
  }

  return (
    <main className="page">
      <div className="container narrow-450">
        <div className="page-heading">
          <div>
            <span className="eyebrow">החשבון שלי</span>
            <h1>פרופיל</h1>
          </div>
        </div>

        <div className="panel" style={{ padding: 30 }}>
          <div className="field">
            <label>שם</label>
            <input
              className="form-input"
              maxLength={40}
              placeholder="השם שלכם"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
            />
            <p className="helper">פרטי בלבד — לא מוצג לאף אחד אחר.</p>
          </div>

          <div className="field">
            <label>כינוי ציבורי</label>
            <input
              className="form-input"
              maxLength={24}
              placeholder="למשל: השחקן שתמיד צודק"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setSaved(false);
              }}
            />
            <p className="helper">בין 2 ל-24 תווים. זה מה שמופיע בטבלת המובילים.</p>
          </div>

          <button className="btn btn-primary btn-full btn-lg" disabled={!nicknameValid} onClick={() => void handleSave()}>
            שמירת שינויים
          </button>

          {saved && (
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <span className="saved-check">
                <CheckIcon />
                נשמר
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
