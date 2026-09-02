// Clears this user's pitches, profile inputs, and generated profile so the
// demo can be re-run from a truly blank slate. Keeps `companies` intact,
// since that's shared seed data, not per-user demo state.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const tables = ['pitches', 'hireable_profile', 'profile_inputs'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', user_id);
    if (error) return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ reset: true });
}
