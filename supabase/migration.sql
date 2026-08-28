-- Run this ONLY if you already ran the old schema.sql and have existing data
-- you want to keep. Adds new columns without dropping anything.

alter table pitches add column if not exists reasoning text;

-- Location, listing link, and "what they're looking for" details, added for
-- the local (Singapore-first) job-details view.
alter table companies add column if not exists location text default 'Singapore';
alter table companies add column if not exists url text;
alter table companies add column if not exists role text;
alter table companies add column if not exists employment_type text;
alter table companies add column if not exists duration text;
alter table companies add column if not exists pay_range text;
alter table companies add column if not exists requirements text;

create index if not exists companies_location_idx on companies (location);
