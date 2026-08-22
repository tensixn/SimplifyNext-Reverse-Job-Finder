import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { generateProfile } from '../lib/api';

export default function ProfileCard({ userId }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await supabase
      .from('hireable_profile')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1);
    setSummary(data?.[0]?.summary ?? '');
  }

  useEffect(() => {
    load();
  }, [userId]);

  async function handleRefresh() {
    setLoading(true);
    const result = await generateProfile(userId);
    if (result.summary) setSummary(result.summary);
    setLoading(false);
  }

  return (
    <div className="profile-card">
      <div className="profile-header">
        <h2>Your Live Profile</h2>
        <button onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <p>{summary || 'No profile generated yet — click Refresh.'}</p>
    </div>
  );
}
