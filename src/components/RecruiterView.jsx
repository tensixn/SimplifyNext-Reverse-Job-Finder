import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parsePoints, groupPoints } from '../lib/profilePoints';

export default function RecruiterView({ refreshKey }) {
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  // Multiple requirements are stored as a single "; "-joined string in the
  // existing `requirements` column (no schema change needed), and split back
  // into a list here so they can be added/removed individually.
  const [reqList, setReqList] = useState([]);
  const [newReq, setNewReq] = useState('');
  const [savingReq, setSavingReq] = useState(false);
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

  // Keep the requirements list in sync whenever the selected company changes,
  // so switching companies doesn't carry over the previous one's edits. Only
  // clear the error state on an actual company switch, not on every
  // `companies` update — a successful save updates `companies` too, and that
  // was wiping out feedback before it could ever be seen.
  const prevSelectedId = useRef(null);
  useEffect(() => {
    const company = companies.find((c) => c.id === selectedId);
    setReqList(parseRequirements(company?.requirements || ''));
    if (prevSelectedId.current !== selectedId) {
      setReqError('');
      prevSelectedId.current = selectedId;
    }
  }, [selectedId, companies]);

  function parseRequirements(text) {
    return text
      ? text.split(';').map((s) => s.trim()).filter(Boolean)
      : [];
  }

  async function persistRequirements(list) {
    setSavingReq(true);
    setReqError('');
    const joined = list.join('; ');

    const { error } = await supabase
      .from('companies')
      .update({ requirements: joined })
      .eq('id', selectedId);

    if (error) {
      setReqError(error.message);
    } else {
      setCompanies((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, requirements: joined } : c))
      );
      setReqList(list);
    }
    setSavingReq(false);
  }

  async function handleAddRequirement(e) {
    e.preventDefault();
    const trimmed = newReq.trim();
    if (!trimmed) return;
    await persistRequirements([...reqList, trimmed]);
    setNewReq('');
  }

  async function handleRemoveRequirement(index) {
    await persistRequirements(reqList.filter((_, i) => i !== index));
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

          <div className="requirements-editor">
            <span className="requirements-label">Looking for</span>

            {reqList.length > 0 ? (
              <ul className="requirement-chips">
                {reqList.map((r, i) => (
                  <li key={i} className="requirement-chip">
                    <span>{r}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(i)}
                      disabled={savingReq}
                      aria-label={`Remove requirement: ${r}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No specific requirements added yet.</p>
            )}

            <form onSubmit={handleAddRequirement} className="add-input-form">
              <input
                type="text"
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                placeholder="Add a requirement, e.g. 'Comfortable with financial modelling'"
                disabled={savingReq}
              />
              <button type="submit" disabled={savingReq || !newReq.trim()}>
                {savingReq ? (
                  <>
                    <span className="spinner" /> Saving
                  </>
                ) : (
                  'Add requirement'
                )}
              </button>
            </form>
            {reqError && <p className="error-text">{reqError}</p>}
          </div>

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
