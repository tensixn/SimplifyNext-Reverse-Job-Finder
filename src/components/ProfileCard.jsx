import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { generateProfile, addProfileInput } from '../lib/api';

export default function ProfileCard({ userId }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [newInput, setNewInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

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
    setError('');
    const result = await generateProfile(userId);
    if (result.error) setError(result.error);
    else if (result.summary) setSummary(result.summary);
    setLoading(false);
  }

  async function handleAddInput(e) {
    e.preventDefault();
    if (!newInput.trim()) return;
    setAdding(true);
    setError('');
    const addResult = await addProfileInput(userId, 'skill', newInput.trim());
    if (addResult.error) {
      setError(addResult.error);
      setAdding(false);
      return;
    }
    setNewInput('');
    const result = await generateProfile(userId);
    if (result.error) setError(result.error);
    else if (result.summary) setSummary(result.summary);
    setAdding(false);
  }

  return (
    <div className="profile-card">
      <span className="eyebrow">Subject file</span>
      <div className="profile-header">
        <h2>Your Live Profile</h2>
        <button onClick={handleRefresh} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Refreshing
            </>
          ) : (
            'Refresh'
          )}
        </button>
      </div>
      <p>{summary || 'No profile generated yet — click Refresh.'}</p>

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleAddInput} className="add-input-form">
        <input
          type="text"
          value={newInput}
          onChange={(e) => setNewInput(e.target.value)}
          placeholder="Add a new skill or project (e.g. 'just learned Rust')"
          disabled={adding}
        />
        <button type="submit" disabled={adding}>
          {adding ? (
            <>
              <span className="spinner" /> Updating
            </>
          ) : (
            'Add & Regenerate'
          )}
        </button>
      </form>
    </div>
  );
}
