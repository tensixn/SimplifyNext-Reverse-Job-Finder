// Seeds profile inputs and fake companies with transformation signals
// so the demo has something real to match/pitch against.
//
// Usage: node supabase/seed.js
// Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_USER_ID in .env

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_USER_ID = process.env.DEMO_USER_ID;

// Kept generic on purpose — described by what each thing demonstrates,
// not by naming a specific person or project, since the generated profile
// speaks directly to whoever's reading it ("you..."), not about a named
// individual. Edit the specifics to match your own background if you want.
const profileInputs = [
  { kind: 'skill', content: 'Mobile app development (React Native / Expo)' },
  { kind: 'skill', content: 'Backend and database work with Postgres-based platforms (Supabase)' },
  { kind: 'skill', content: 'Building and deploying React web apps end to end' },
  { kind: 'project', content: 'Built a full-stack mobile app from scratch during a hackathon — backend, geolocation features, and theming, shipped in hackathon time' },
  { kind: 'project', content: 'Built and maintains a personal automation bot that tracks financial data and runs unattended' },
  { kind: 'project', content: 'Designed and deployed a personal portfolio site from a plain HTML/CSS/JS stack' },
  { kind: 'interest', content: 'Software engineering, especially shipping fast under a tight deadline' },
];

// Fake companies standing in for a live "transformation scanner."
const companies = [
  { name: 'Northwind Labs', signal: 'Just raised Series B, scaling engineering team from 12 to 40 in 6 months', industry: 'fintech' },
  { name: 'Reroute', signal: 'Pivoted from B2C logistics app to B2B routing API last quarter', industry: 'logistics' },
  { name: 'Fieldnote', signal: 'Restructuring around AI-assisted note-taking after sunsetting legacy product', industry: 'productivity' },
  { name: 'Harborline', signal: 'Opened a new engineering hub, hiring sprint for mobile developers', industry: 'consumer' },
  { name: 'Cascade Health', signal: 'Rebuilding entire patient app from scratch after acquisition', industry: 'healthtech' },
  { name: 'Fernbridge', signal: 'Just launched a developer platform, needs devs who can build fast demos', industry: 'devtools' },
];

async function seed() {
  if (!DEMO_USER_ID) {
    console.error('Set DEMO_USER_ID in .env before seeding.');
    process.exit(1);
  }

  const { error: profileError } = await supabase
    .from('profile_inputs')
    .insert(profileInputs.map((p) => ({ ...p, user_id: DEMO_USER_ID })));

  if (profileError) {
    console.error('Profile seed failed:', profileError.message);
    process.exit(1);
  }

  const { error: companyError } = await supabase.from('companies').insert(companies);

  if (companyError) {
    console.error('Company seed failed:', companyError.message);
    process.exit(1);
  }

  console.log(`Seeded ${profileInputs.length} profile inputs and ${companies.length} companies.`);
}

seed();
