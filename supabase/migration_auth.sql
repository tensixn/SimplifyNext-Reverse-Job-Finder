-- Run this ONLY if you already ran the old schema.sql (before real auth
-- was added) and want to lock down direct anon-key access now that
-- accounts are real. Safe to re-run: policies are dropped and recreated.
--
-- Prerequisite: enable magic-link sign-in in the Supabase dashboard under
-- Authentication > Providers (Email is on by default), and add your local
-- dev URL (e.g. http://localhost:3000) under Authentication > URL
-- Configuration > Redirect URLs.

alter table profile_inputs enable row level security;
alter table hireable_profile enable row level security;
alter table companies enable row level security;
alter table pitches enable row level security;

drop policy if exists "profile_inputs: owner select" on profile_inputs;
drop policy if exists "profile_inputs: owner insert" on profile_inputs;
drop policy if exists "profile_inputs: owner update" on profile_inputs;
drop policy if exists "profile_inputs: owner delete" on profile_inputs;

create policy "profile_inputs: owner select" on profile_inputs
  for select using (auth.uid() = user_id);
create policy "profile_inputs: owner insert" on profile_inputs
  for insert with check (auth.uid() = user_id);
create policy "profile_inputs: owner update" on profile_inputs
  for update using (auth.uid() = user_id);
create policy "profile_inputs: owner delete" on profile_inputs
  for delete using (auth.uid() = user_id);

drop policy if exists "hireable_profile: authenticated select" on hireable_profile;
create policy "hireable_profile: authenticated select" on hireable_profile
  for select using (auth.role() = 'authenticated');

drop policy if exists "companies: authenticated select" on companies;
drop policy if exists "companies: authenticated update" on companies;
create policy "companies: authenticated select" on companies
  for select using (auth.role() = 'authenticated');
create policy "companies: authenticated update" on companies
  for update using (auth.role() = 'authenticated');

drop policy if exists "pitches: authenticated select" on pitches;
drop policy if exists "pitches: authenticated update" on pitches;
create policy "pitches: authenticated select" on pitches
  for select using (auth.role() = 'authenticated');
create policy "pitches: authenticated update" on pitches
  for update using (auth.role() = 'authenticated');