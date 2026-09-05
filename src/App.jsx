import { useEffect, useState } from 'react';
import ProfileCard from './components/ProfileCard';
import CompanyFeed from './components/CompanyFeed';
import PitchHistory from './components/PitchHistory';
import RecruiterView from './components/RecruiterView';
import AuthScreen from './components/AuthScreen';
import { supabase } from './lib/supabaseClient';
import { resetDemo } from './lib/api';
import './App.css';

export default function App() {
  // undefined = still checking for an existing session, null = signed out,
  // object = signed in. Every table (profile_inputs, hireable_profile,
  // pitches) is already keyed by user_id, so the real auth user's id is a
  // drop-in replacement for the old hardcoded DEMO_USER_ID.
  const [session, setSession] = useState(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [view, setView] = useState('seeker'); // 'seeker' | 'recruiter'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="app auth-loading">
        <span className="spinner" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  const userId = session.user.id;

  async function handleReset() {
    if (!window.confirm('Clear this profile, its skills/projects, and all pitches and outcomes for this demo run?')) return;
    setResetting(true);
    await resetDemo(userId);
    setRefreshKey((k) => k + 1);
    setResetting(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <>
      <section className="hero-band">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-inner">
          <p className="hero-eyebrow">
            <span className="prompt-symbol">&gt;</span>
            <span className="prompt-text">reverse --job-interview</span>
            <span className="cursor" aria-hidden="true" />
          </p>
          <h1 className="hero-title">
            Don't apply to jobs.
            <br />
            <span className="accent-text">Let them apply to you.</span>
          </h1>
        </div>
      </section>

      <div className="app" id="app-panel">
        <div className="app-top">
          <div className="brand">
            <span className="logomark">RJ</span>
            <div>
              <p className="brand-word">Reverse Job Interview</p>
            </div>
          </div>
          <div className="app-top-actions">
            <span className="signed-in-as">{session.user.email}</span>
            <button onClick={handleReset} disabled={resetting} className="reset-button">
              {resetting ? (
                <>
                  <span className="spinner" /> Resetting
                </>
              ) : (
                'Reset demo'
              )}
            </button>
            <button onClick={handleSignOut} className="reset-button">
              Sign out
            </button>
          </div>
        </div>

        <div className="view-switch" role="tablist" aria-label="Choose a view">
          <button
            role="tab"
            aria-selected={view === 'seeker'}
            className={view === 'seeker' ? 'active' : ''}
            onClick={() => setView('seeker')}
          >
            Job seeker
          </button>
          <button
            role="tab"
            aria-selected={view === 'recruiter'}
            className={view === 'recruiter' ? 'active' : ''}
            onClick={() => setView('recruiter')}
          >
            Recruiter
          </button>
        </div>

        {view === 'seeker' ? (
          <>
            <ProfileCard userId={userId} refreshKey={refreshKey} />
            <CompanyFeed userId={userId} refreshKey={refreshKey} />
            <PitchHistory userId={userId} refreshKey={refreshKey} />
          </>
        ) : (
          <RecruiterView refreshKey={refreshKey} />
        )}
      </div>
    </>
  );
}