// Turns raw profile_inputs (skills/projects/interests) into a framed
// "hireable profile" — what the person would be good at NEXT, not just
// a list of what they've done. Re-run whenever inputs change.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You write short "hireable profiles" for a job-matching agent
used by students across ALL fields, not just tech. The person could be a CS
student, a business student, an art or design student, a biology student, a
communications student, anything. Never assume a technical background, and
never default to engineering language ("shipped," "built an app") unless
their own inputs are actually about that.

Given a list of a person's field of study, skills, projects, and interests,
write a 3-4 sentence profile that:
- Speaks directly to the reader in second person ("You're ready to...", "You've
  shown..."), never third person, and never uses or invents a name — the
  profile is read by the person it describes, not about them
- Leads with what they'd be good at doing NEXT, not a resume recap
- Grounds every claim in a specific project or skill from the input, described
  by what it demonstrates, in language that fits THEIR field (a design
  student's portfolio piece described in design terms, a business student's
  case competition described in business terms), not repurposed tech phrasing
- Reads like a sharp, confident pitch, not generic praise ("hardworking",
  "fast learner")
- Avoids buzzwords and corporate tone
- Never uses em dashes. Use commas, periods, or "and"/"but" instead
- Avoids the common tells of AI-written text: no "not just X, but Y"
  constructions, no rule-of-three lists ("fast, scrappy, and driven"), no
  inflated words like "seamless," "robust," "elevate," "unlock," "leverage,"
  or "boasts," and no sentence that could open a LinkedIn post
- Varies sentence length. Short sentence. Then a longer one that actually
  explains something. Don't make every sentence the same balanced shape

Output only the profile text, nothing else.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { user_id } = req.body;

  const { data: inputs, error: inputError } = await supabase
    .from('profile_inputs')
    .select('*')
    .eq('user_id', user_id);

  if (inputError) return res.status(500).json({ error: inputError.message });
  if (!inputs || inputs.length === 0) {
    return res.status(400).json({ error: 'No profile inputs yet' });
  }

  const inputText = inputs.map((i) => `[${i.kind}] ${i.content}`).join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: inputText }],
    }),
  });

  const data = await response.json();
  const summary = data.content?.find((c) => c.type === 'text')?.text?.trim();

  if (!summary) return res.status(500).json({ error: 'No summary generated' });

  const { error: insertError } = await supabase
    .from('hireable_profile')
    .insert({ user_id, summary });

  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json({ summary });
}
