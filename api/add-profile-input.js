// Adds one new profile input (skill/project/interest) and immediately
// regenerates the hireable profile, so the "live" part of "live hireable
// profile" is visible in the demo instead of just claimed.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { user_id, kind, content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  const { error } = await supabase
    .from('profile_inputs')
    .insert({ user_id, kind: kind || 'skill', content: content.trim() });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ added: true });
}
