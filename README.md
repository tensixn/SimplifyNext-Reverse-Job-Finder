# Reverse Job Interview

Instead of you applying to jobs, an agent builds a live "hireable profile" from
your skills/projects and pitches you to organizations undergoing transformation,
autonomously, with pitches personalized to each one's specific change.

Built for students in ANY field, not just tech. Every prompt reasons over
whatever you enter, there's no hardcoded assumption of a technical background.
The seeded demo data spans tech, business, design, health/science, and media
so a business, art, or CS student all see something relevant out of the box.

## Stack
- **Frontend:** React + Vite
- **Data:** Supabase (Postgres + Auth)
- **Agent:** Claude API (Anthropic), called from serverless functions

## 1. Supabase setup
1. Create a project at supabase.com
2. In the SQL editor, run `supabase/schema.sql`
3. Copy your Project URL and anon key into `.env` (see `.env.example`)

## 2. Anthropic API key
Get a key at console.anthropic.com, add it to `.env` as `ANTHROPIC_API_KEY`.
Used only server-side in `api/*.js` — never exposed to the browser.

## 3. Install & run
```bash
npm install
npm run dev
```

## 4. Seed demo data
```bash
node supabase/seed.js
```
Seeds:
- Your profile inputs (skills, project history) — edit these to match you
- 10–15 fake companies with "transformation signals" (funding round, pivot,
  restructuring, hiring spree) standing in for a live scraper. Be upfront in
  the demo/pitch that this is curated data, not a live feed — judges respect
  the honesty and it doesn't hurt the concept.

## Project shape
```
src/
  components/
    ProfileCard.jsx      — the live hireable profile
    CompanyFeed.jsx       — list of matched companies + generated pitches
    OutcomeLog.jsx         — mark pitches as "responded" / "no response"
  lib/
    supabaseClient.js
    api.js
api/
  generate-profile.js     — builds/refreshes the hireable profile from raw inputs
  match-companies.js      — scores companies against the profile
  generate-pitch.js        — writes a personalized pitch for one company
supabase/
  schema.sql
  seed.js
```

## How the agent works
Three chained calls, each a thin wrapper around the Claude API:

1. **generate-profile** — turns raw project/skill entries into a framed
   "hireable profile" (what you'd be good at *next*, not just what you've
   done). Re-run whenever inputs change.
2. **match-companies** — given the profile + the list of companies and their
   transformation signals, ranks/selects the best-fit matches and says why.
3. **generate-pitch** — for each matched company, writes a short pitch
   connecting a specific piece of your history to their specific signal.

**Adaptation loop:** `OutcomeLog` lets you mark whether a pitch got a
response. `match-companies` and `generate-pitch` both read the outcome log
and are instructed to weight future pitches/matches based on what's worked
so far (e.g. "pitches emphasizing shipping speed got responses, emphasize
that more"). No real ML needed — the model reasons over the log the same
way it would over any other context.
