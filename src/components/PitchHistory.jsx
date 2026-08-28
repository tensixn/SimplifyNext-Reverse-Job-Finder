import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function PitchHistory({ userId, refreshKey }) {
  const [pitches, setPitches] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('pitches')
        .select('*, companies(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setPitches(data || []);
    }
    load();
  }, [userId, refreshKey]);

  if (pitches.length === 0) return null;

  return (
    <div className="pitch-history">
      <h2>Pitch History</h2>
      {pitches.map((p) => (
        <div key={p.id} className="history-row">
          <div className="history-top">
            <strong>{p.companies?.name ?? 'Unknown company'}</strong>
            <span className={`outcome-tag outcome-${p.outcome}`}>{p.outcome}</span>
          </div>
          <span className="history-date">
            {new Date(p.created_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}
