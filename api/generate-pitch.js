// Writes a short, specific pitch connecting the user's profile to one
// company's transformation signal, and saves it to `pitches`.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You write short outreach pitches (3-5 sentences) from
a candidate to a company, framed around the company's specific transformation
signal, not a generic cover letter.

Rules:
- Open by naming the company's specific transformation, not a greeting
- Connect ONE concrete piece of the candidate's history to that transformation
- No buzzwords, no "I am writing to express my interest"
- End with a low-friction ask (a short call, not "please consider my application")
- If the outcome log shows an angle that's worked before, lean into it

Output only the pitch text.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { user_id, company_id } = req.body;

  const [{ data: profile }, { data: company }, { data: pitches }] = await Promise.all([
    supabase
      .from('hireable_profile')
      .select('*')
      .eq('user_id', user_id)
      .order('generated_at', { ascending: false })
      .limit(1),
    supabase.from('companies').select('*').eq('id', company_id).single(),
    supabase.from('pitches').select('*, companies(name)').eq('user_id', user_id),
  ]);

  if (!profile || profile.length === 0) {
    return res.status(400).json({ error: 'No profile generated yet' });
  }
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const outcomeLog =
    pitches && pitches.length > 0
      ? pitches.map((p) => `${p.companies?.name ?? 'Unknown'}: ${p.outcome}`).join('\n')
      : 'No pitches sent yet.';

  const userTurn = `Profile:\n${profile[0].summary}\n\nCompany: ${company.name}\nSignal: ${company.signal}\n\nPast pitch outcomes:\n${outcomeLog}`;

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
      messages: [{ role: 'user', content: userTurn }],
    }),
  });

  const data = await response.json();
  const pitchText = data.content?.find((c) => c.type === 'text')?.text?.trim();

  if (!pitchText) return res.status(500).json({ error: 'No pitch generated' });

  const { error: insertError } = await supabase
    .from('pitches')
    .insert({ user_id, company_id, pitch_text: pitchText });

  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json({ pitch: pitchText });
}
