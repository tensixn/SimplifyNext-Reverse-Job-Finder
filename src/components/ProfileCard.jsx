import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { generateProfile, addProfileInput } from '../lib/api';

// Handles three shapes for backward compatibility as the format evolved:
// a plain paragraph (oldest), an array of strings (point-form v1), and an
// array of {label, why} objects (current). Normalizes all to the latter.
function parsePoints(raw) {
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [{ label: raw, why: '' }];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((p) =>
    typeof p === 'string' ? { label: p, why: '' } : p
  );
}

export default function ProfileCard({ userId }) {
  const [points, setPoints] = useState([]);
  const [working, setWorking] = useState(false);
  const [newInput, setNewInput] = useState('');
  const [newKind, setNewKind] = useState('skill');
  const [error, setError] = useState('');

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
  }, [userId]);

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

    const result = await generateProfile(userId);
    if (result.error) setError(result.error);
    else if (result.points) setPoints(result.points);
    setWorking(false);
  }

  return (
    <div className="profile-card">
      <span className="eyebrow">Your profile</span>
      <div className="profile-header">
        <h2>Hireable Profile</h2>
      </div>

      {points.length > 0 ? (
        <ul className="profile-points">
          {points.map((point, i) => (
            <li key={i}>
              <span className="point-label">{point.label}</span>
              {point.why && <span className="point-why">{point.why}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p>No profile generated yet, add a field of study or skill below and click Add &amp; Regenerate.</p>
      )}

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSubmit} className="add-input-form">
        <select value={newKind} onChange={(e) => setNewKind(e.target.value)} disabled={working}>
          <option value="field">Field of study</option>
          <option value="skill">Skill</option>
          <option value="project">Project</option>
          <option value="interest">Interest</option>
        </select>
        <input
          type="text"
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          placeholder="e.g. 'Business Administration, marketing focus' — leave blank to just refresh"
          disabled={working}
        />
        <button type="submit" disabled={working}>
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
    </div>
  );
}