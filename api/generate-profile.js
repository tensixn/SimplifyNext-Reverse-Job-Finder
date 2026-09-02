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
produce 5-8 points. Each point has three parts:
- "kind": which section it belongs under. Exactly one of "field", "project",
  "skill", or "interest". Use the kind of the input it came from.
- "label": the skill, project, or field itself, 2-5 words, no sentence, just
  the thing (e.g. "Case competition, top 3 finish" or "React Native")
- "why": one short phrase (under 10 words) on why it matters to a recruiter,
  not a restated sentence (e.g. "Shows ability to build under pressure",
  not "This demonstrates that the candidate can build things under pressure")

Rules:
- Every point MUST have a "kind" from that list of four. Never invent others.
- At most ONE point with kind "field". If multiple field inputs are given,
  use only the most recently added one (marked "(just added)" or latest in
  the list) and ignore the older ones. Omit "field" entirely if none was given.
  Its label is the field itself (e.g. "Business Administration, marketing focus")
- Cover whichever kinds the inputs actually contain. Don't pad a section with
  a weak point just to fill it, and don't drop a section that has real input
- Inputs marked "(just added)" were added in this most recent edit. Give them
  priority: they should almost always earn a point of their own unless truly
  redundant with something already covered, even if it means dropping a
  weaker, older input to make room within the 5-8 point budget
- Uses language that fits THEIR field (a design student's work described in
  design terms, a business student's in business terms), not tech phrasing
  forced onto a non-technical background
- Never uses a name, "you," "they," or "I" anywhere
- Never uses em dashes. Use commas instead
- No buzzwords, no inflated words like "seamless," "robust," "elevate,"
  "unlock," or "leverage"
- Keep both label and why SHORT. This is a scannable list, not sentences

Respond ONLY with a JSON array, no markdown fences, no preamble:
[{"kind": "field", "label": "...", "why": "..."}, ...]`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { user_id } = req.body;

  const { data: rawInputs, error: inputError } = await supabase
    .from('profile_inputs')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: true });

  if (inputError) return res.status(500).json({ error: inputError.message });
  if (!rawInputs || rawInputs.length === 0) {
    return res.status(400).json({ error: 'No profile inputs yet' });
  }

  // Repeated testing/typos accumulate duplicate or near-duplicate inputs
  // over time (same kind+content added more than once). Collapse those to
  // their most recent occurrence so old noise doesn't crowd out what the
  // person actually just added.
  const seen = new Map();
  for (const input of rawInputs) {
    const key = `${input.kind}::${input.content.trim().toLowerCase()}`;
    seen.set(key, input);
  }
  const inputs = [...seen.values()].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  // Flag whatever landed in the last minute (i.e. what this request's
  // "Add & Regenerate" click just inserted) so the prompt can weight it.
  const cutoff = Date.now() - 60_000;
  const inputText = inputs
    .map((i) => {
      const justAdded = new Date(i.created_at).getTime() >= cutoff;
      return `[${i.kind}] ${i.content}${justAdded ? ' (just added)' : ''}`;
    })
    .join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
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