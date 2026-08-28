-- Run this ONLY if you already ran the old schema.sql and have existing data
-- you want to keep. Adds the new `reasoning` column without dropping anything.

alter table pitches add column if not exists reasoning text;
