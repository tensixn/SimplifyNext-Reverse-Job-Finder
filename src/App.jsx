import { useState } from 'react';
import ProfileCard from './components/ProfileCard';
import CompanyFeed from './components/CompanyFeed';
import PitchHistory from './components/PitchHistory';
import { resetDemo } from './lib/api';
import './App.css';

// Swap for real Supabase auth later. Fixed ID is enough for a hackathon demo.
const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID;

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!window.confirm('Clear all pitches and outcomes for this demo run?')) return;
    setResetting(true);
    await resetDemo(DEMO_USER_ID);
    setRefreshKey((k) => k + 1);
    setResetting(false);
  }

  return (
    <div className="app">
      <div className="app-top">
        <div>
          <h1>Reverse Job Interview</h1>
          <p className="tagline">Don't apply to jobs. Let them apply to you.</p>
        </div>
        <button onClick={handleReset} disabled={resetting} className="reset-button">
          {resetting ? (
            <>
              <span className="spinner" /> Resetting
            </>
          ) : (
            'Reset Demo'
          )}
        </button>
      </div>

      <ProfileCard userId={DEMO_USER_ID} />
      <CompanyFeed userId={DEMO_USER_ID} refreshKey={refreshKey} />
      <PitchHistory userId={DEMO_USER_ID} refreshKey={refreshKey} />
    </div>
  );
}
