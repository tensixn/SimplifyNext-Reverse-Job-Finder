import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parsePoints, groupPoints } from '../lib/profilePoints';

export default function RecruiterView({ refreshKey }) {
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [reqDraft, setReqDraft] = useState('');
  const [savingReq, setSavingReq] = useState(false);
  const [reqSaved, setReqSaved] = useState(false);
  const [reqError, setReqError] = useState('');

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

  // Keep the requirements draft in sync whenever the selected company changes,
  // so switching companies doesn't carry over the previous one's edits.
  useEffect(() => {
    const company = companies.find((c) => c.id === selectedId);
    setReqDraft(company?.requirements || '');
    setReqSaved(false);
    setReqError('');
  }, [selectedId, companies]);

  async function handleSaveRequirements(e) {
    e.preventDefault();
    if (!selectedId) return;
    setSavingReq(true);
    setReqSaved(false);
    setReqError('');

    const { error } = await supabase
      .from('companies')
      .update({ requirements: reqDraft.trim() })
      .eq('id', selectedId);

    if (error) {
      setReqError(error.message);
    } else {
      setCompanies((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, requirements: reqDraft.trim() } : c))
      );
      setReqSaved(true);
    }
    setSavingReq(false);
  }

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

          <form onSubmit={handleSaveRequirements} className="add-input-form">
            <input
              type="text"
              value={reqDraft}
              onChange={(e) => {
                setReqDraft(e.target.value);
                setReqSaved(false);
              }}
              placeholder="What are you looking for in a candidate? e.g. 'Comfortable with financial modelling and fast-paced ops'"
              disabled={savingReq}
            />
            <button type="submit" disabled={savingReq || reqDraft.trim() === (company.requirements || '')}>
              {savingReq ? (
                <>
                  <span className="spinner" /> Saving
                </>
              ) : (
                'Save requirements'
              )}
            </button>
          </form>
          {reqError && <p className="error-text">{reqError}</p>}
          {reqSaved && !reqError && (
            <p className="saved-text">Saved — this will be used the next time a candidate finds matches.</p>
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
          <div className="profile-groups compact">
            {groupPoints(points).map((group) => (
              <section key={group.kind} className="profile-group">
                {group.heading && (
                  <h4 className="profile-group-heading">{group.heading}</h4>
                )}
                <ul className="profile-points compact">
                  {group.points.map((pt, i) => (
                    <li key={i}>
                      <span className="point-label">{pt.label}</span>
                      {pt.why && <span className="point-why">{pt.why}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

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
