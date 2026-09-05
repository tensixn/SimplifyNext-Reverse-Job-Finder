import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Magic-link (passwordless) sign-in. Replaces the old hardcoded
// DEMO_USER_ID: once someone verifies the link in their inbox, Supabase
// creates a real row in auth.users and every table that's already keyed by
// user_id (profile_inputs, hireable_profile, pitches) just works against
// that real id instead of one shared demo id.
export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus('sending');
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="app auth-screen">
      <div className="profile-card auth-card">
        <span className="eyebrow">Sign in</span>
        <div className="profile-header">
          <h2>Reverse Job Interview</h2>
        </div>

        {status === 'sent' ? (
          <p>
            Check <strong>{email.trim()}</strong> for a sign-in link. Click it
            on this device to come back here signed in.
          </p>
        ) : (
          <>
            <p>
              No password needed, just your email. We'll send a one-time link
              that signs you in.
            </p>
            <form onSubmit={handleSubmit} className="add-input-form auth-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === 'sending'}
                autoComplete="email"
                required
              />
              <button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? (
                  <>
                    <span className="spinner" /> Sending
                  </>
                ) : (
                  'Send magic link'
                )}
              </button>
            </form>
            {error && <p className="error-text">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}