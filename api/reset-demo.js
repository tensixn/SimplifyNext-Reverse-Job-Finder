// Clears this user's pitches (and optionally profile) so the demo flow
// can be re-run cleanly without re-seeding from scratch. Keeps companies
// and profile_inputs intact — just wipes the "state" that accumulates
// as you click through a demo.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const { error } = await supabase.from('pitches').delete().eq('user_id', user_id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ reset: true });
}
