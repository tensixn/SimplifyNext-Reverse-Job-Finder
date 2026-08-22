import ProfileCard from './components/ProfileCard';
import CompanyFeed from './components/CompanyFeed';
import './App.css';

// Swap for real Supabase auth later. Fixed ID is enough for a hackathon demo.
const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID;

export default function App() {
  return (
    <div className="app">
      <h1>Reverse Job Interview</h1>
      <p className="tagline">Don't apply to jobs. Let them apply to you.</p>

      <ProfileCard userId={DEMO_USER_ID} />
      <CompanyFeed userId={DEMO_USER_ID} />
    </div>
  );
}
