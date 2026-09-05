-- Reverse Job Interview: schema.
-- Run this in Supabase SQL editor. If you already have the old tables,
-- run migration.sql first to add the new `reasoning` column, and
-- migration_auth.sql to add the RLS policies below to an existing project.
--
-- RLS note: profile_inputs is strictly owner-only. hireable_profile,
-- companies, and pitches are readable/writable by any *signed-in* user
-- (not just the owner), because the Recruiter view is a second lens on the
-- same data — any logged-in user can act as "the recruiter" and needs to
-- see/update pitches and profiles that aren't theirs. The api/*.js
-- functions use the service-role key and bypass RLS entirely, so they're
-- unaffected by any of this.

create table if not exists profile_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,            -- 'skill' | 'project' | 'interest'
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists hireable_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  summary text not null,
  generated_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  signal text not null,
  industry text,
  location text default 'Singapore',   -- city/area, e.g. "Raffles Place, Singapore"
  url text,                             -- careers page / listing link shown to candidates
  role text,                            -- the role/title being hired for
  employment_type text,                 -- 'Internship' | 'Full-time' | 'Part-time' | 'Contract'
  duration text,                        -- e.g. "3 months", "Permanent"
  pay_range text,                       -- e.g. "S$2,800 - S$3,500/mo"
  requirements text,                    -- 1-2 sentence summary of what they're looking for
  created_at timestamptz not null default now()
);

create table if not exists pitches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid not null references companies(id) on delete cascade,
  pitch_text text not null,
  reasoning text,                 -- why this pitch leans the way it does (adaptation feedback)
  outcome text default 'pending' check (outcome in ('pending', 'responded', 'no_response')),
  created_at timestamptz not null default now()
);

create index if not exists pitches_user_idx on pitches (user_id, created_at desc);
create index if not exists companies_location_idx on companies (location);

-- ===== Row Level Security =====
-- These only govern direct browser (anon-key) access via supabase-js.
-- The api/*.js serverless functions use the service-role key, which
-- bypasses RLS, so profile/match/pitch generation is unaffected.

alter table profile_inputs enable row level security;
alter table hireable_profile enable row level security;
alter table companies enable row level security;
alter table pitches enable row level security;

-- profile_inputs: strictly owner-only. Nothing in the frontend reads this
-- table cross-user, so it's safe to lock all the way down.
create policy "profile_inputs: owner select" on profile_inputs
  for select using (auth.uid() = user_id);
create policy "profile_inputs: owner insert" on profile_inputs
  for insert with check (auth.uid() = user_id);
create policy "profile_inputs: owner update" on profile_inputs
  for update using (auth.uid() = user_id);
create policy "profile_inputs: owner delete" on profile_inputs
  for delete using (auth.uid() = user_id);

-- hireable_profile: any signed-in user can read (RecruiterView loads
-- other users' profiles for candidates who pitched a company). Rows are
-- only ever inserted server-side (generate-profile.js), so no update/
-- delete policy is needed for the anon/authenticated role.
create policy "hireable_profile: authenticated select" on hireable_profile
  for select using (auth.role() = 'authenticated');

-- companies: any signed-in user can read, and can update requirements
-- from the Recruiter view (this demo has one shared recruiter "account"
-- concept, not per-company ownership). Inserts/deletes only happen via
-- supabase/seed.js with the service-role key.
create policy "companies: authenticated select" on companies
  for select using (auth.role() = 'authenticated');
create policy "companies: authenticated update" on companies
  for update using (auth.role() = 'authenticated');

-- pitches: any signed-in user can read and update outcome, since both the
-- job seeker (Responded/No response) and the recruiter (Shortlist/Pass)
-- write to the same column from different views. Inserts only happen via
-- generate-pitch.js with the service-role key.
create policy "pitches: authenticated select" on pitches
  for select using (auth.role() = 'authenticated');
create policy "pitches: authenticated update" on pitches
  for update using (auth.role() = 'authenticated');