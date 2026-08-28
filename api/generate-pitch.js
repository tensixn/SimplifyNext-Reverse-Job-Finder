// Writes a short, specific pitch connecting the user's profile to one
// company's transformation signal, plus a short "reasoning" note explaining
// what pattern in the outcome log shaped this pitch (the visible half of
// the adaptation loop). Saves both to `pitches`.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You write short outreach pitches (3-5 sentences) from
a candidate to a company, framed around the company's specific transformation
signal, not a generic cover letter.

Rules for the pitch:
- Open by naming the company's specific transformation, not a greeting
- Connect ONE concrete piece of the candidate's history to that transformation
- No buzzwords, no "I am writing to express my interest"
- End with a low-friction ask (a short call, not "please consider my application")
- If the outcome log shows an angle that's worked before, lean into it
- Never uses em dashes. Use commas, periods, or "and"/"but" instead
- Avoids the common tells of AI-written text: no "not just X, but Y"
  constructions, no rule-of-three lists, no inflated words like "seamless,"
  "robust," "elevate," "unlock," "leverage," or "boasts," and nothing that
  reads like a cover letter template
- Varies sentence length instead of making every sentence the same shape

You also write a short "reasoning" note (1 sentence, plain language) explaining
WHY you wrote the pitch this way — what pattern in the outcome log (or lack of
one, if there's no log yet) shaped the angle you took. This is shown to the
user so they can see the adaptation happening, so be specific and concrete,
not vague ("tailored to the company").

Respond ONLY with JSON, no markdown fences, no preamble:
{"pitch": "...", "reasoning": "..."}`;

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

  const roleDetails = [company.role, company.employment_type, company.duration, company.pay_range]
    .filter(Boolean)
    .join(', ');

  const userTurn = `Profile:\n${profile[0].summary}\n\nCompany: ${company.name} (${company.location || 'location unknown'})\nSignal: ${company.signal}${roleDetails ? `\nHiring for: ${roleDetails}` : ''}\n\nPast pitch outcomes:\n${outcomeLog}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userTurn }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim();

  let parsed;
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return res.status(500).json({ error: 'Could not parse pitch response', raw: text });
  }

  const { pitch, reasoning } = parsed;
  if (!pitch) return res.status(500).json({ error: 'No pitch generated' });

  const { data: inserted, error: insertError } = await supabase
    .from('pitches')
    .insert({ user_id, company_id, pitch_text: pitch, reasoning })
    .select()
    .single();

  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json({ pitch, reasoning, pitchId: inserted.id });
}
