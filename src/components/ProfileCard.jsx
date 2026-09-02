import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  generateProfile,
  addProfileInput,
  addProfileInputs,
  suggestSkills,
} from '../lib/api';
import { parsePoints, normalizePoints, groupPoints } from '../lib/profilePoints';

export default function ProfileCard({ userId, refreshKey }) {
  const [points, setPoints] = useState([]);
  const [working, setWorking] = useState(false);
  const [newInput, setNewInput] = useState('');
  const [newKind, setNewKind] = useState('skill');
  const [error, setError] = useState('');

  // Suggested skills are fetched on demand and kept in state, so opening the
  // page or re-rendering never costs an API call.
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [hasSuggested, setHasSuggested] = useState(false);

  async function load() {
    const { data } = await supabase
      .from('hireable_profile')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1);
    setPoints(parsePoints(data?.[0]?.summary));
  }

  useEffect(() => {
    load();
    setSuggestions([]);
    setSelected([]);
    setHasSuggested(false);
  }, [userId, refreshKey]);

  async function regenerate() {
    const result = await generateProfile(userId);
    if (result.error) setError(result.error);
    else if (result.points) setPoints(normalizePoints(result.points));
  }

  // Doubles as both "Add & Regenerate" and plain "Refresh": if there's no
  // text in the input, it just regenerates from what's already saved.
  async function handleSubmit(e) {
    e.preventDefault();
    setWorking(true);
    setError('');

    if (newInput.trim()) {
      const addResult = await addProfileInput(userId, newKind, newInput.trim());
      if (addResult.error) {
        setError(addResult.error);
        setWorking(false);
        return;
      }
      setNewInput('');
    }

    await regenerate();
    setWorking(false);
  }

  async function handleSuggest() {
    setSuggesting(true);
    setError('');
    const result = await suggestSkills(userId);
    if (result.error) {
      setError(result.error);
    } else {
      setSuggestions(result.suggestions || []);
      setSelected([]);
      setHasSuggested(true);
    }
    setSuggesting(false);
  }

  function toggleSuggestion(skill) {
    setSelected((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  // One insert for every picked chip, then a single profile regeneration,
  // rather than a round trip per chip.
  async function handleAddSelected() {
    if (selected.length === 0) return;
    setWorking(true);
    setError('');

    const addResult = await addProfileInputs(userId, 'skill', selected);
    if (addResult.error) {
      setError(addResult.error);
      setWorking(false);
      return;
    }

    setSuggestions((prev) => prev.filter((s) => !selected.includes(s)));
    setSelected([]);

    await regenerate();
    setWorking(false);
  }

  const groups = groupPoints(points);
  const busy = working || suggesting;

  return (
    <div className="profile-card">
      <span className="eyebrow">Your profile</span>
      <div className="profile-header">
        <h2>Hireable Profile</h2>
      </div>

      {groups.length > 0 ? (
        <div className="profile-groups">
          {groups.map((group) => (
            <section key={group.kind} className="profile-group">
              {group.heading && (
                <h3 className="profile-group-heading">{group.heading}</h3>
              )}
              <ul className="profile-points">
                {group.points.map((point, i) => (
                  <li key={i}>
                    <span className="point-label">{point.label}</span>
                    {point.why && <span className="point-why">{point.why}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p>No profile generated yet, add a field of study or skill below and click Add &amp; Regenerate.</p>
      )}

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit} className="add-input-form">
        <select value={newKind} onChange={(e) => setNewKind(e.target.value)} disabled={busy}>
          <option value="field">Field of study</option>
          <option value="skill">Skill</option>
          <option value="project">Project</option>
          <option value="interest">Interest</option>
        </select>
        <input
          type="text"
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          placeholder="e.g. 'Business Administration, marketing focus', leave blank to just refresh"
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          {working ? (
            <>
              <span className="spinner" /> Working
            </>
          ) : newInput.trim() ? (
            'Add & Regenerate'
          ) : (
            'Refresh'
          )}
        </button>
      </form>

      <div className="suggestions">
        <div className="suggestions-header">
          <span className="suggestions-label">
            {hasSuggested ? 'Tap the ones that apply' : 'Not sure what to add?'}
          </span>
          <button
            type="button"
            onClick={handleSuggest}
            disabled={busy}
            className="ghost small"
          >
            {suggesting ? (
              <>
                <span className="spinner" /> Thinking
              </>
            ) : hasSuggested ? (
              'Suggest more'
            ) : (
              'Suggest skills'
            )}
          </button>
        </div>

        {hasSuggested && suggestions.length === 0 && !suggesting && (
          <p className="empty-state">
            Nothing new to suggest, everything relevant is already on the profile.
          </p>
        )}

        {suggestions.length > 0 && (
          <>
            <div className="suggestion-chips">
              {suggestions.map((skill) => {
                const isSelected = selected.includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => toggleSuggestion(skill)}
                    disabled={busy}
                    aria-pressed={isSelected}
                    className={`suggestion-chip${isSelected ? ' selected' : ''}`}
                  >
                    {skill}
                    <span className="chip-mark">{isSelected ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>

            {selected.length > 0 && (
              <button type="button" onClick={handleAddSelected} disabled={busy}>
                {working ? (
                  <>
                    <span className="spinner" /> Adding
                  </>
                ) : (
                  `Add ${selected.length} skill${selected.length > 1 ? 's' : ''} & Regenerate`
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
