import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Same three-shape normalizer as ProfileCard, kept local since this view
// reads other users' profiles directly rather than through the API layer.
function parsePoints(raw) {
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [{ label: raw, why: '' }];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((p) => (typeof p === 'string' ? { label: p, why: '' } : p));
}

export default function RecruiterView({ refreshKey }) {
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    supabase
      .from('companies')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setCompanies(data || []);
        setSelectedId((current) => current || data?.[0]?.id || '');
      });
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedId) return;
    loadCandidates(selectedId);
  }, [selectedId, refreshKey]);

  async function loadCandidates(companyId) {
    setLoading(true);
    const { data: pitches } = await supabase
      .from('pitches')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (!pitches || pitches.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(pitches.map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from('hireable_profile')
      .select('*')
      .in('user_id', userIds)
      .order('generated_at', { ascending: false });

    const latestByUser = {};
    (profiles || []).forEach((p) => {
      if (!latestByUser[p.user_id]) latestByUser[p.user_id] = p;
    });

    setCandidates(
      pitches.map((p) => ({
        pitch: p,
        points: parsePoints(latestByUser[p.user_id]?.summary),
      }))
    );
    setLoading(false);
  }

  async function markOutcome(pitchId, outcome) {
    setMarkingId(pitchId);
    const { error } = await supabase.from('pitches').update({ outcome }).eq('id', pitchId);
    if (!error) {
      setCandidates((prev) =>
        prev.map((c) => (c.pitch.id === pitchId ? { ...c, pitch: { ...c.pitch, outcome } } : c))
      );
    }
    setMarkingId(null);
  }

  const company = companies.find((c) => c.id === selectedId);
  const jobDetails = company
    ? [company.role, company.employment_type, company.duration, company.pay_range].filter(Boolean)
    : [];

  return (
    <div className="recruiter-view">
      <div className="recruiter-header">
        <div>
          <span className="eyebrow">Recruiter view</span>
          <h2>Inbound Candidates</h2>
        </div>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {company && (
        <div className="job-summary-card">
          <div className="job-summary-top">
            <h3>{company.name}</h3>
            {company.location && <span className="chip chip-location">{company.location}</span>}
          </div>
          <p className="signal">{company.signal}</p>

          {jobDetails.length > 0 && (
            <div className="job-details">
              {jobDetails.map((d, i) => (
                <span key={i} className="chip">
                  {d}
                </span>
              ))}
            </div>
          )}

          {company.requirements && (
            <p className="requirements">
              <span className="requirements-label">Looking for </span>
              {company.requirements}
            </p>
          )}

          {company.url && (
            <a href={company.url} target="_blank" rel="noreferrer" className="listing-link">
              View listing ↗
            </a>
          )}
        </div>
      )}

      {loading && <p className="empty-state">Loading candidates…</p>}

      {!loading && candidates.length === 0 && (
        <p className="empty-state">No pitches yet for this company.</p>
      )}

      {candidates.map(({ pitch, points }) => (
        <div key={pitch.id} className="candidate-card">
          {points.length > 0 && (
            <ul className="profile-points compact">
              {points.map((pt, i) => (
                <li key={i}>
                  <span className="point-label">{pt.label}</span>
                  {pt.why && <span className="point-why">{pt.why}</span>}
                </li>
              ))}
            </ul>
          )}

          <p className="pitch">{pitch.pitch_text}</p>

          <div className="candidate-footer">
            <span className={`outcome-tag outcome-${pitch.outcome}`}>
              {pitch.outcome === 'responded'
                ? 'Shortlisted'
                : pitch.outcome === 'no_response'
                  ? 'Passed'
                  : 'New'}
            </span>

            {pitch.outcome === 'pending' && (
              <div className="outcome-buttons">
                <button onClick={() => markOutcome(pitch.id, 'responded')} disabled={markingId === pitch.id}>
                  {markingId === pitch.id ? <span className="spinner" /> : null}
                  Shortlist
                </button>
                <button
                  onClick={() => markOutcome(pitch.id, 'no_response')}
                  disabled={markingId === pitch.id}
                  className="ghost"
                >
                  Pass
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
