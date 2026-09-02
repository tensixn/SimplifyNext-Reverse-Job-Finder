// Ranks companies against the user's hireable profile, factoring in past
// pitch outcomes so matching improves over time. Now also returns a 0-100
// fit_score per company so the ranking is visible, not just implied by order.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You match a candidate's profile against companies
undergoing some kind of transformation (funding, pivot, restructuring,
hiring sprint). Given the profile, a list of companies with their
transformation signal, location, role details (employment type, duration,
pay), and what each company says it's looking for in a candidate, and a log
of which past pitches got responses vs not, pick the top 3 companies that
are the best fit RIGHT NOW because of their specific transformation — not
just general fit.

When a company states what it's looking for, treat that as a real
requirement to weigh, not decoration. A company whose stated need doesn't
match anything in the profile should score lower even if its transformation
signal is compelling.

This is a local, Singapore-first tool. All else being roughly equal, prefer
companies based in Singapore over companies elsewhere, since that's who the
candidate can realistically start a conversation with right now. Don't
force a bad match just because it's local, but treat "in Singapore" as a
real point in a company's favor.

If the outcome log shows a pattern (e.g. pitches emphasizing a certain
skill or angle got responses), factor that into which companies you
prioritize and note it briefly in your reasoning.

Never use em dashes in your reasoning text. Use commas, periods, or "and"/"but" instead.
Write plainly, like a person explaining a decision out loud, not a corporate summary.

For each match, also give a fit_score from 0-100 reflecting how strong the
match is right now. Be honest and vary the scores meaningfully — don't
cluster everything at 85-95.

Respond ONLY with a JSON array, no markdown fences, no preamble:
[{"company_id": "...", "reason": "1-2 sentences on why this match, right now", "fit_score": 0}]`;

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
    supabase.from('pitches').select('*, companies(name)').eq('user_id', user_id),
  ]);

  if (!profile || profile.length === 0) {
    return res.status(400).json({ error: 'No profile generated yet' });
  }

  const outcomeLog =
    pitches && pitches.length > 0
      ? pitches
          .map((p) => `${p.companies?.name ?? 'Unknown'}: ${p.outcome}`)
          .join('\n')
      : 'No pitches sent yet.';

  const companyList = companies
    .map((c) => {
      const details = [c.role, c.employment_type, c.duration, c.pay_range]
        .filter(Boolean)
        .join(', ');
      return `id: ${c.id} | ${c.name} (${c.industry}) | ${c.location || 'location unknown'} — ${c.signal}${details ? ` | Hiring for: ${details}` : ''}${c.requirements ? ` | Looking for: ${c.requirements}` : ''}`;
    })
    .join('\n');

  const userTurn = `Profile:\n${profile[0].summary}\n\nCompanies:\n${companyList}\n\nPast pitch outcomes:\n${outcomeLog}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userTurn }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim();

  let matches;
  try {
    matches = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return res.status(500).json({ error: 'Could not parse match response', raw: text });
  }

  return res.status(200).json({ matches });
}
