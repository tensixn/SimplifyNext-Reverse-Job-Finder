

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You suggest skills for a student to add to their
profile, based on their field of study and what they've already entered.

These are suggestions for the person to PICK FROM, so suggest skills someone
with their background plausibly already HAS. Not skills they should learn,
not aspirational ones. If a business student is described, suggest things a
business student actually does. If it's a fine arts student, suggest studio
and craft skills. Never default to software or engineering skills unless
their own inputs are about that.

Rules:
- Suggest 10 to 12 skills
- Each is 2 to 5 words, the skill itself, no sentence and no explanation
- Mix concrete, nameable skills (specific tools, methods, techniques) with
  transferable ones, weighted toward the concrete. "Gouache and ink" and
  "Financial modelling in Excel" are useful. "Hard working" is not
- Never suggest something already in their inputs, or an obvious rewording
  of it
- No buzzwords, nothing inflated, no "synergy" or "passionate about"
- Order them most-likely-to-apply first
- If very little information was given, stay broad and safe for that field
  rather than inventing specifics about this person

Respond ONLY with a JSON array of strings, no markdown fences, no preamble:
["...", "...", "..."]`;


function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const { data: inputs, error: inputError } = await supabase
    .from('profile_inputs')
    .select('kind, content')
    .eq('user_id', user_id);

  if (inputError) return res.status(500).json({ error: inputError.message });

  if (!inputs || inputs.length === 0) {
    return res.status(400).json({
      error: 'Add your field of study first, then suggestions can be tailored to it.',
    });
  }

  const inputText = inputs.map((i) => `[${i.kind}] ${i.content}`).join('\n');

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: inputText }],
      }),
    });
  } catch {
    return res.status(502).json({ error: 'Could not reach the model. Try again.' });
  }

  if (!response.ok) {
    const detail = response.status === 429 ? 'Rate limited, wait a moment.' : `Model error (${response.status}).`;
    return res.status(502).json({ error: detail });
  }

  const data = await response.json();
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim();

  let suggestions;
  try {
    suggestions = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return res.status(500).json({ error: 'Could not parse suggestions', raw: text });
  }

  if (!Array.isArray(suggestions)) {
    return res.status(500).json({ error: 'Unexpected suggestion format' });
  }

  const existing = new Set(inputs.map((i) => normalize(i.content)));
  const seen = new Set();

  const cleaned = suggestions
    .filter((s) => typeof s === 'string' && s.trim())
    .map((s) => s.trim())
    .filter((s) => {
      const key = normalize(s);
      if (!key || existing.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);

  return res.status(200).json({ suggestions: cleaned });
}