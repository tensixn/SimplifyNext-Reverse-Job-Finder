-- Reverse Job Interview: schema (no RLS — single shared demo account, no real auth)
-- Run this in Supabase SQL editor. If you already have the old tables,
-- run migration.sql first to add the new `reasoning` column.

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
