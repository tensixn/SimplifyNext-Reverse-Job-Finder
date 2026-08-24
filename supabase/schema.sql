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
