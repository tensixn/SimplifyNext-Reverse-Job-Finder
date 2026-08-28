// Turns raw profile_inputs (field/skills/projects/interests) into a
// point-form "hireable profile" a recruiter can scan in seconds. Each
// point is a short label (the skill/project itself) plus a brief note on
// why it matters, not a full sentence that reads like a mini-paragraph.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You write short, scannable "hireable profiles" for a
job-matching agent used by students across ALL fields, not just tech. The
person could be a CS student, a business student, an art or design student,
a biology student, a communications student, anything. Never assume a
technical background, and never default to engineering language ("shipped,"
"built an app") unless their own inputs are actually about that.

Given a list of a person's field of study, skills, projects, and interests,
produce 4-6 points, each with two short parts:
- "label": the skill, project, or field itself, 2-5 words, no sentence, just
  the thing (e.g. "Case competition, top 3 finish" or "React Native")
- "why": one short phrase (under 10 words) on why it matters to a recruiter,
  not a restated sentence (e.g. "Shows ability to build under pressure",
  not "This demonstrates that the candidate can build things under pressure")

Rules:
- Uses language that fits THEIR field (a design student's work described in
  design terms, a business student's in business terms), not tech phrasing
  forced onto a non-technical background
- Never uses a name, "you," "they," or "I" anywhere
- Never uses em dashes. Use commas instead
- No buzzwords, no inflated words like "seamless," "robust," "elevate,"
  "unlock," "leverage," or "boasts"
- Keep both label and why SHORT. This is a scannable list, not sentences

If a field of study was given, the first point's label should be that field
(e.g. "Business Administration, marketing focus").

Respond ONLY with a JSON array, no markdown fences, no preamble:
[{"label": "...", "why": "..."}, ...]`;

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
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: inputText }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim();

  let points;
  try {
    points = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return res.status(500).json({ error: 'Could not parse profile response', raw: text });
  }

  if (!Array.isArray(points) || points.length === 0) {
    return res.status(500).json({ error: 'No profile points generated' });
  }

  // Stored as JSON in the existing `summary` text column, so no schema
  // migration is needed — the frontend parses it back into a list.
  const { error: insertError } = await supabase
    .from('hireable_profile')
    .insert({ user_id, summary: JSON.stringify(points) });

  if (insertError) return res.status(500).json({ error: insertError.message });

  return res.status(200).json({ points });
}
