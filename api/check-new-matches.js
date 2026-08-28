// Proactive trigger: checks whether there's a company worth surfacing
// unprompted (no button click), the same way a "real" version of this
// agent would run on a schedule watching for new transformation signals.
// For the demo, it scans companies the user hasn't been pitched to yet
// and decides whether any is a strong enough match to flag as a "new match"
// banner without the user asking.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You are the proactive half of a job-matching agent.
Given a candidate profile and a list of companies with transformation
signals, some of which the candidate has already been pitched to, decide
if there's ONE company not yet pitched that is a strong enough match to
flag unprompted, right now.

Only flag a company if it's a genuinely strong, specific match — not just
"any company left." If nothing stands out, say so. This is a
Singapore-first tool, so a Singapore-based company is a real point in its
favor, all else being equal.

Never use em dashes in your reasoning text. Use commas, periods, or "and"/"but" instead.
Write plainly, like a person explaining a decision out loud, not a corporate summary.

Respond ONLY with JSON, no markdown fences:
{"should_notify": true/false, "company_id": "..." or null, "reason": "1 sentence, or null"}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { user_id } = req.body;

  const [{ data: profile }, { data: companies }, { data: pitches }] = await Promise.all([
    supabase
      .from('hireable_profile')
      .select('*')
      .eq('user_id', user_id)
      .order('generated_at', { ascending: false })
      .limit(1),
    supabase.from('companies').select('*'),
    supabase.from('pitches').select('company_id').eq('user_id', user_id),
  ]);

  if (!profile || profile.length === 0) {
    return res.status(200).json({ should_notify: false });
  }

  const pitchedIds = new Set((pitches || []).map((p) => p.company_id));
  const unpitched = companies.filter((c) => !pitchedIds.has(c.id));

  if (unpitched.length === 0) {
    return res.status(200).json({ should_notify: false });
  }

  const companyList = unpitched
    .map((c) => `id: ${c.id} | ${c.name} (${c.industry}) | ${c.location || 'location unknown'} — ${c.signal}`)
    .join('\n');

  const userTurn = `Profile:\n${profile[0].summary}\n\nNot-yet-pitched companies:\n${companyList}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userTurn }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim();

  let result;
  try {
    result = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return res.status(200).json({ should_notify: false });
  }

  if (result.should_notify && result.company_id) {
    const company = unpitched.find((c) => c.id === result.company_id);
    return res.status(200).json({
      should_notify: true,
      company,
      reason: result.reason,
    });
  }

  return res.status(200).json({ should_notify: false });
}
