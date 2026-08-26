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

// This is one example set (a CS/engineering student). The app itself is NOT
// tech-specific — every prompt reasons over whatever's in these fields, so
// swap this for a business, art, biology, or any other student's real
// background and the generated profile/pitches will follow suit. Keep the
// same shape: { kind: 'field' | 'skill' | 'project' | 'interest', content }.
const profileInputs = [
  { kind: 'field', content: 'Computer Science, early years of the degree' },
  { kind: 'skill', content: 'Mobile app development (React Native / Expo)' },
  { kind: 'skill', content: 'Backend and database work with Postgres-based platforms (Supabase)' },
  { kind: 'project', content: 'Built a full-stack mobile app from scratch during a hackathon, backend, geolocation features, and theming, shipped in hackathon time' },
  { kind: 'project', content: 'Built and maintains a personal automation bot that tracks financial data and runs unattended' },
  { kind: 'interest', content: 'Software engineering, especially shipping fast under a tight deadline' },
];

// Example inputs for other fields — uncomment/swap in `profileInputs` above
// to test the app for a non-tech student without writing your own data.
//
// const businessStudentExample = [
//   { kind: 'field', content: 'Business Administration, focus on marketing' },
//   { kind: 'skill', content: 'Market research and competitive analysis' },
//   { kind: 'skill', content: 'Building financial models in Excel' },
//   { kind: 'project', content: 'Led a case competition team to a top-3 finish, owned the go-to-market section' },
//   { kind: 'project', content: 'Ran social media strategy for a student org, grew engagement significantly over a semester' },
//   { kind: 'interest', content: 'Brand strategy and consumer behavior' },
// ];
//
// const artStudentExample = [
//   { kind: 'field', content: 'Fine Arts, concentration in illustration' },
//   { kind: 'skill', content: 'Digital illustration and character design (Procreate, Photoshop)' },
//   { kind: 'skill', content: 'Traditional media: gouache and ink' },
//   { kind: 'project', content: 'Self-published a short illustrated zine and sold out a print run at a local market' },
//   { kind: 'project', content: 'Freelanced small commission work for local businesses' },
//   { kind: 'interest', content: 'Editorial illustration and visual storytelling' },
// ];

// Companies now span multiple industries, not just tech, so the matcher has
// something relevant to surface regardless of the student's field.
const companies = [
  // Tech / engineering
  { name: 'Northwind Labs', signal: 'Just raised Series B, scaling engineering team from 12 to 40 in 6 months', industry: 'fintech' },
  { name: 'Reroute', signal: 'Pivoted from B2C logistics app to B2B routing API last quarter', industry: 'logistics' },
  { name: 'Fernbridge', signal: 'Just launched a developer platform, needs people who can build fast demos', industry: 'devtools' },

  // Business / consulting / finance
  { name: 'Aldermere Partners', signal: 'Expanding into a new market after a strong fundraising round, building out the strategy team', industry: 'consulting' },
  { name: 'Cobalt & Finch', signal: 'Rebranding after a merger, rebuilding brand strategy and marketing from scratch', industry: 'marketing' },
  { name: 'Ridgeline Capital', signal: 'Restructuring its analyst program to bring on more junior talent this cycle', industry: 'finance' },

  // Design / creative
  { name: 'Hollow & Vane Studio', signal: 'Just landed a major client and is scaling its illustration and brand identity team', industry: 'design' },
  { name: 'Lumen Press', signal: 'Launching a new editorial imprint, looking for illustrators and visual storytellers', industry: 'publishing' },

  // Health / science
  { name: 'Cascade Health', signal: 'Rebuilding its entire patient-facing product after an acquisition', industry: 'healthtech' },
  { name: 'Verdant Biosciences', signal: 'Just opened a new research division after a grant award', industry: 'biotech' },

  // Media / comms
  { name: 'Fieldnote', signal: 'Restructuring around a new content strategy after sunsetting a legacy product', industry: 'media' },
  { name: 'Harborline', signal: 'Opened a new studio, hiring sprint across design and communications roles', industry: 'consumer' },
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
