-- Reverse Job Interview: core schema

create table if not exists profile_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null,            -- 'skill' | 'project' | 'interest'
  content text not null,         -- e.g. "React Native / Expo", "Built SummerBuild, a campus sports pickup app"
  created_at timestamptz not null default now()
);

create table if not exists hireable_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  summary text not null,         -- the generated "live profile" text
  generated_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  signal text not null,          -- e.g. "Just raised Series B, scaling engineering team"
  industry text,
  created_at timestamptz not null default now()
);

create table if not exists pitches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  company_id uuid not null references companies(id) on delete cascade,
  pitch_text text not null,
  outcome text default 'pending' check (outcome in ('pending', 'responded', 'no_response')),
  created_at timestamptz not null default now()
);

alter table profile_inputs enable row level security;
alter table hireable_profile enable row level security;
alter table pitches enable row level security;
-- companies table is shared/global demo data, no RLS needed for the hackathon

create policy "Users manage their own profile inputs"
  on profile_inputs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own profile"
  on hireable_profile for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own pitches"
  on pitches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists pitches_user_idx on pitches (user_id, created_at desc);
