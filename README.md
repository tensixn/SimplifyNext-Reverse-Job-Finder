# Reverse Job Interview

Instead of you applying to jobs, an agent builds a scannable, point-form
"hireable profile" from your skills/projects and pitches you to organizations
undergoing transformation, with pitches personalized to each one's specific
change.

Built for students in ANY field, not just tech — the default seed profile is
a business/ops background, with CS, design, and health/science examples
included as swappable alternates. Every prompt reasons over whatever you
enter; there's no hardcoded assumption of a technical background.

**Singapore-first:** the seeded companies are all SG-based (with real
neighbourhood/area tags) and matching is instructed to prefer local companies
when fit is otherwise close. Each match links out to a (placeholder) listing
and shows what the company is actually hiring for — role, employment type,
duration, and pay range — so a candidate isn't guessing.

**Two views:** a Job seeker view (profile, matches, pitches) and a Recruiter
view (pick a company, see everyone who's pitched them, shortlist or pass).

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
    ProfileCard.jsx      — point-form hireable profile; "Add & Regenerate"
                           doubles as a plain refresh when the input is blank
    CompanyFeed.jsx       — matched companies (job seeker view): location,
                           role/pay/duration, listing link, pitch, outcome
    PitchHistory.jsx      — ledger of past pitches and their outcomes
    RecruiterView.jsx      — recruiter view: pick a company, see inbound
                           pitches with the candidate's profile, shortlist/pass
  lib/
    supabaseClient.js
    api.js
api/
  generate-profile.js     — builds/refreshes the point-form profile from raw inputs
  match-companies.js      — scores companies against the profile, SG-first
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

**Adaptation loop:** marking a pitch "Responded" / "No response" (job seeker
view) or "Shortlist" / "Pass" (recruiter view) writes to the same `pitches.
outcome` column. `match-companies` and `generate-pitch` both read that log
and are instructed to weight future pitches/matches based on what's worked
so far (e.g. "pitches emphasizing shipping speed got responses, emphasize
that more"). No real ML needed — the model reasons over the log the same
way it would over any other context.

**Recruiter view** is a second lens on the same data, not a separate app: it
lets a company (via a dropdown, since this demo has one shared account) see
every candidate who's pitched them, with that candidate's point-form profile
next to their pitch, and mark them shortlisted or passed.
