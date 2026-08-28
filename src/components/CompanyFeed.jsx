import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { matchCompanies, generatePitch, checkNewMatches } from '../lib/api';

export default function CompanyFeed({ userId, refreshKey }) {
  const [matches, setMatches] = useState([]);
  const [pitches, setPitches] = useState({}); // company_id -> { pitch, reasoning, id, outcome }
  const [loading, setLoading] = useState(false);
  const [pitchingId, setPitchingId] = useState(null);
  const [markingId, setMarkingId] = useState(null); // company_id currently being marked
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
        [companyId]: {
          pitch: result.pitch,
          reasoning: result.reasoning,
          id: result.pitchId,
          outcome: 'pending',
        },
      }));
    }
    setPitchingId(null);
  }

  async function markOutcome(companyId, outcome) {
    const pitch = pitches[companyId];
    if (!pitch?.id) return;

    setMarkingId(companyId);
    setError('');

    const { error: updateError } = await supabase
      .from('pitches')
      .update({ outcome })
      .eq('id', pitch.id);

    if (updateError) {
      setError('Could not save that outcome. Try again.');
    } else {
      setPitches((prev) => ({
        ...prev,
        [companyId]: { ...prev[companyId], outcome },
      }));
    }
    setMarkingId(null);
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

      {matches.map((m) => {
        const pitchState = pitches[m.company_id];
        const jobDetails = [
          m.company?.role,
          m.company?.employment_type,
          m.company?.duration,
          m.company?.pay_range,
        ].filter(Boolean);
        return (
          <div key={m.company_id} className="company-card">
            <div className="company-card-top">
              <div className="company-card-title">
                <h3>{m.company?.name}</h3>
                {m.company?.location && <span className="chip chip-location">{m.company.location}</span>}
              </div>
              {typeof m.fit_score === 'number' && (
                <div className="signal-meter">
                  <div className="bars" style={{ '--fit': `${m.fit_score}%` }} />
                  <span className="score">{m.fit_score}</span>
                </div>
              )}
            </div>
            <p className="signal">{m.company?.signal}</p>

            {jobDetails.length > 0 && (
              <div className="job-details">
                {jobDetails.map((d, i) => (
                  <span key={i} className="chip">
                    {d}
                  </span>
                ))}
              </div>
            )}
            {m.company?.requirements && (
              <p className="requirements">
                <span className="requirements-label">Looking for </span>
                {m.company.requirements}
              </p>
            )}
            {m.company?.url && (
              <a href={m.company.url} target="_blank" rel="noreferrer" className="listing-link">
                View listing ↗
              </a>
            )}

            <p className="reason">{m.reason}</p>

            {pitchState ? (
              <>
                <p className="pitch">{pitchState.pitch}</p>
                {pitchState.reasoning && (
                  <p className="pitch-reasoning">Why this angle: {pitchState.reasoning}</p>
                )}

                {pitchState.outcome && pitchState.outcome !== 'pending' ? (
                  <p className={`outcome-confirmed outcome-${pitchState.outcome}`}>
                    Marked as {pitchState.outcome === 'responded' ? 'Responded' : 'No response'}
                  </p>
                ) : (
                  <div className="outcome-buttons">
                    <button
                      onClick={() => markOutcome(m.company_id, 'responded')}
                      disabled={markingId === m.company_id}
                    >
                      {markingId === m.company_id ? <span className="spinner" /> : null}
                      Mark: Responded
                    </button>
                    <button
                      onClick={() => markOutcome(m.company_id, 'no_response')}
                      disabled={markingId === m.company_id}
                      className="ghost"
                    >
                      {markingId === m.company_id ? <span className="spinner" /> : null}
                      Mark: No response
                    </button>
                  </div>
                )}
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
        );
      })}
    </div>
  );
}
