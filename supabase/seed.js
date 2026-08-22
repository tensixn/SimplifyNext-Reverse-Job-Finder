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

// Edit to match your actual skills/projects.
const profileInputs = [
  { kind: 'skill', content: 'React Native / Expo' },
  { kind: 'skill', content: 'Supabase (Postgres, Auth, RLS)' },
  { kind: 'skill', content: 'React + Vite web apps' },
  { kind: 'project', content: 'SummerBuild: built an NTU campus sports pickup app from scratch during a hackathon, full Supabase backend, geolocation court map, dark mode theming' },
  { kind: 'project', content: 'Stoxed: a personal Telegram bot for tracking stocks/crypto' },
  { kind: 'project', content: 'Personal portfolio site, plain HTML/CSS/JS deployed on Vercel' },
  { kind: 'interest', content: 'Software engineering, especially fast-shipping under time pressure' },
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
