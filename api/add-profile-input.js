// Adds profile inputs (skill/project/interest/field). Accepts either a single
// `content` string or a `contents` array, so picking several suggested skills
// at once is one insert instead of one request per chip.
//
// The caller regenerates the hireable profile afterwards (see ProfileCard),
// which keeps this cheap when adding several inputs in a row.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALID_KINDS = new Set(['field', 'skill', 'project', 'interest']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { user_id, kind, content, contents } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const resolvedKind = VALID_KINDS.has(kind) ? kind : 'skill';

  const raw = Array.isArray(contents) ? contents : [content];
  const items = raw
    .filter((c) => typeof c === 'string' && c.trim())
    .map((c) => c.trim().slice(0, 300));

  if (items.length === 0) {
    return res.status(400).json({ error: 'content is required' });
  }

  const { error } = await supabase
    .from('profile_inputs')
    .insert(items.map((c) => ({ user_id, kind: resolvedKind, content: c })));

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ added: items.length });
}