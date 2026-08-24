import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { matchCompanies, generatePitch, checkNewMatches } from '../lib/api';

export default function CompanyFeed({ userId, refreshKey }) {
  const [matches, setMatches] = useState([]);
  const [pitches, setPitches] = useState({}); // company_id -> { pitch, reasoning }
  const [loading, setLoading] = useState(false);
  const [pitchingId, setPitchingId] = useState(null); // which company is mid-pitch
  const [newMatch, setNewMatch] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkNewMatches(userId).then((result) => {
      if (result.should_notify) setNewMatch(result);
    });
  }, [userId, refreshKey]);

  async function handleFindMatches() {
    setLoading(true);
    setError('');
    const result = await matchCompanies(userId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.matches) {
      const { data: companies, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .in('id', result.matches.map((m) => m.company_id));

      if (fetchError) {
        setError('Could not load company details.');
        setLoading(false);
        return;
      }

      const enriched = result.matches.map((m) => ({
        ...m,
        company: companies.find((c) => c.id === m.company_id),
      }));
      setMatches(enriched);
    }
    setLoading(false);
  }

  async function handlePitch(companyId) {
    setPitchingId(companyId);
    setError('');
    const result = await generatePitch(userId, companyId);
    if (result.error) {
      setError(result.error);
    } else if (result.pitch) {
      setPitches((prev) => ({
        ...prev,
        [companyId]: { pitch: result.pitch, reasoning: result.reasoning },
      }));
    }
    setPitchingId(null);
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
      {newMatch && (
        <div className="new-match-banner">
          <span>
            <strong>New match found:</strong> {newMatch.company?.name} — {newMatch.reason}
          </span>
          <button onClick={() => setNewMatch(null)} className="dismiss">
            Dismiss
          </button>
        </div>
      )}

      <span className="eyebrow">Signal log</span>
      <div className="feed-header">
        <h2>Matched Companies</h2>
        <button onClick={handleFindMatches} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Matching
            </>
          ) : (
            'Find Matches'
          )}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {!loading && matches.length === 0 && !error && (
        <p className="empty-state">No matches yet — click Find Matches to scan companies.</p>
      )}

      {matches.map((m) => (
        <div key={m.company_id} className="company-card">
          <div className="company-card-top">
            <h3>{m.company?.name}</h3>
            {typeof m.fit_score === 'number' && (
              <div className="signal-meter">
                <div className="bars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`bar ${i < Math.round(m.fit_score / 20) ? 'filled' : ''}`}
                    />
                  ))}
                </div>
                <span className="score">{m.fit_score}</span>
              </div>
            )}
          </div>
          <p className="signal">{m.company?.signal}</p>
          <p className="reason">{m.reason}</p>

          {pitches[m.company_id] ? (
            <>
              <p className="pitch">{pitches[m.company_id].pitch}</p>
              {pitches[m.company_id].reasoning && (
                <p className="pitch-reasoning">
                  Why this angle: {pitches[m.company_id].reasoning}
                </p>
              )}
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
            <button onClick={() => handlePitch(m.company_id)} disabled={pitchingId === m.company_id}>
              {pitchingId === m.company_id ? (
                <>
                  <span className="spinner" /> Writing pitch
                </>
              ) : (
                'Generate Pitch'
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
