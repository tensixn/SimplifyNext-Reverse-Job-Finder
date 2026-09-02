import { useState } from 'react';
import ProfileCard from './components/ProfileCard';
import CompanyFeed from './components/CompanyFeed';
import PitchHistory from './components/PitchHistory';
import RecruiterView from './components/RecruiterView';
import { resetDemo } from './lib/api';
import './App.css';

// Swap for real Supabase auth later. Fixed ID is enough for a hackathon demo.
const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID;

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [view, setView] = useState('seeker'); // 'seeker' | 'recruiter'

  async function handleReset() {
    if (!window.confirm('Clear this profile, its skills/projects, and all pitches and outcomes for this demo run?')) return;
    setResetting(true);
    await resetDemo(DEMO_USER_ID);
    setRefreshKey((k) => k + 1);
    setResetting(false);
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
          <button onClick={handleReset} disabled={resetting} className="reset-button">
            {resetting ? (
              <>
                <span className="spinner" /> Resetting
              </>
            ) : (
              'Reset demo'
            )}
          </button>
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
            <ProfileCard userId={DEMO_USER_ID} refreshKey={refreshKey} />
            <CompanyFeed userId={DEMO_USER_ID} refreshKey={refreshKey} />
            <PitchHistory userId={DEMO_USER_ID} refreshKey={refreshKey} />
          </>
        ) : (
          <RecruiterView refreshKey={refreshKey} />
        )}
      </div>
    </>
  );
}
