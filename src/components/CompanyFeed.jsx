import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { matchCompanies, generatePitch } from '../lib/api';

export default function CompanyFeed({ userId }) {
  const [matches, setMatches] = useState([]);
  const [pitches, setPitches] = useState({}); // company_id -> pitch text
  const [loading, setLoading] = useState(false);

  async function handleFindMatches() {
    setLoading(true);
    const result = await matchCompanies(userId);
    if (result.matches) {
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .in('id', result.matches.map((m) => m.company_id));

      const enriched = result.matches.map((m) => ({
        ...m,
        company: companies.find((c) => c.id === m.company_id),
      }));
      setMatches(enriched);
    }
    setLoading(false);
  }

  async function handlePitch(companyId) {
    const result = await generatePitch(userId, companyId);
    if (result.pitch) {
      setPitches((prev) => ({ ...prev, [companyId]: result.pitch }));
    }
  }

  async function markOutcome(companyId, outcome) {
    await supabase
      .from('pitches')
      .update({ outcome })
      .eq('user_id', userId)
      .eq('company_id', companyId);
  }

  return (
    <div className="company-feed">
      <div className="feed-header">
        <h2>Matched Companies</h2>
        <button onClick={handleFindMatches} disabled={loading}>
          {loading ? 'Matching...' : 'Find Matches'}
        </button>
      </div>

      {matches.map((m) => (
        <div key={m.company_id} className="company-card">
          <h3>{m.company?.name}</h3>
          <p className="signal">{m.company?.signal}</p>
          <p className="reason">{m.reason}</p>

          {pitches[m.company_id] ? (
            <>
              <p className="pitch">{pitches[m.company_id]}</p>
              <div className="outcome-buttons">
                <button onClick={() => markOutcome(m.company_id, 'responded')}>
                  Mark: Responded
                </button>
                <button onClick={() => markOutcome(m.company_id, 'no_response')}>
                  Mark: No response
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => handlePitch(m.company_id)}>Generate Pitch</button>
          )}
        </div>
      ))}
    </div>
  );
}
