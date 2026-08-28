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

// Default seed profile — deliberately field-agnostic (not a CS/engineering
// example) since the app is built for students in ANY field. This one is a
// generalist business/ops background. Swap it for your own real inputs, or
// for one of the alternate examples below, by editing `profileInputs`.
// Keep the same shape: { kind: 'field' | 'skill' | 'project' | 'interest', content }.
const profileInputs = [
  { kind: 'field', content: 'Business Administration, second year, ops and strategy focus' },
  { kind: 'skill', content: 'Financial modelling and budgeting in Excel' },
  { kind: 'skill', content: 'Stakeholder coordination across cross-functional teams' },
  { kind: 'project', content: 'Led a 5-person case competition team to a top-3 placing in an NUS/SMU inter-school event, owned the market sizing and go-to-market slides' },
  { kind: 'project', content: 'Ran logistics and vendor coordination for a 300-attendee student org event on a tight budget, came in under budget' },
  { kind: 'interest', content: 'Operations strategy and how fast-growing companies scale their processes' },
];

// Alternate examples for other fields — swap the active `profileInputs`
// array above for one of these (or your own) to see the app adapt. The
// prompts reason over whatever is entered; there's no hardcoded field.
//
// const csStudentExample = [
//   { kind: 'field', content: 'Computer Science, early years of the degree' },
//   { kind: 'skill', content: 'Mobile app development (React Native / Expo)' },
//   { kind: 'skill', content: 'Backend and database work with Postgres-based platforms (Supabase)' },
//   { kind: 'project', content: 'Built a full-stack mobile app from scratch during a hackathon, backend, geolocation features, and theming, shipped in hackathon time' },
//   { kind: 'project', content: 'Built and maintains a personal automation bot that tracks financial data and runs unattended' },
//   { kind: 'interest', content: 'Software engineering, especially shipping fast under a tight deadline' },
// ];
//
// const designStudentExample = [
//   { kind: 'field', content: 'Fine Arts, concentration in illustration' },
//   { kind: 'skill', content: 'Digital illustration and character design (Procreate, Photoshop)' },
//   { kind: 'skill', content: 'Traditional media: gouache and ink' },
//   { kind: 'project', content: 'Self-published a short illustrated zine and sold out a print run at a local market' },
//   { kind: 'project', content: 'Freelanced small commission work for local businesses' },
//   { kind: 'interest', content: 'Editorial illustration and visual storytelling' },
// ];
//
// const healthScienceExample = [
//   { kind: 'field', content: 'Life Sciences, molecular biology track' },
//   { kind: 'skill', content: 'Lab technique: PCR, cell culture, basic bioinformatics' },
//   { kind: 'skill', content: 'Scientific writing and grant-style proposal drafting' },
//   { kind: 'project', content: 'Research attachment analysing gene expression data, co-authored a poster presented at a school symposium' },
//   { kind: 'interest', content: 'Translational research, moving lab findings toward real patient use' },
// ];

// Companies are seeded Singapore-first: every entry has a real SG area/
// neighbourhood as its location, a (placeholder) listing link, and the role
// details a candidate would actually want to see (type, duration, pay).
// Spans multiple industries so the matcher has something relevant regardless
// of the student's field, not just tech.
const companies = [
  // Tech / fintech
  {
    name: 'Northwind Labs',
    signal: 'Just raised Series B, scaling engineering and ops from 12 to 40 in 6 months',
    industry: 'fintech',
    location: 'Raffles Place, Singapore',
    url: 'https://northwindlabs.example.com/careers/ops-associate',
    role: 'Operations Associate',
    employment_type: 'Full-time',
    duration: 'Permanent',
    pay_range: 'S$3,200 - S$3,800/mo',
    requirements: 'Someone comfortable working across product, finance, and hiring as headcount roughly triples this year.',
  },
  {
    name: 'Fernbridge',
    signal: 'Just launched a developer platform, needs people who can build fast demos',
    industry: 'devtools',
    location: 'one-north, Singapore',
    url: 'https://fernbridge.example.com/careers/platform-intern',
    role: 'Platform Engineering Intern',
    employment_type: 'Internship',
    duration: '3 months',
    pay_range: 'S$1,200/mo',
    requirements: 'Fast, scrappy building over polish, comfortable shipping rough demos in days not weeks.',
  },

  // Logistics
  {
    name: 'Reroute',
    signal: 'Pivoted from B2C logistics app to B2B routing API last quarter',
    industry: 'logistics',
    location: 'Tanjong Pagar, Singapore',
    url: 'https://reroute.example.com/careers/biz-ops',
    role: 'Business Operations Executive',
    employment_type: 'Full-time',
    duration: 'Permanent',
    pay_range: 'S$3,000 - S$3,600/mo',
    requirements: 'Enterprise-facing ops mindset, someone who can translate messy B2B requirements into a working process.',
  },

  // Business / consulting / finance
  {
    name: 'Aldermere Partners',
    signal: 'Expanding into Southeast Asia after a strong fundraising round, building out the strategy team',
    industry: 'consulting',
    location: 'Marina Bay, Singapore',
    url: 'https://aldermerepartners.example.com/careers/strategy-associate',
    role: 'Strategy Associate',
    employment_type: 'Full-time',
    duration: 'Permanent',
    pay_range: 'S$3,800 - S$4,500/mo',
    requirements: 'Strong market-sizing and case-style thinking, comfortable presenting to senior stakeholders early.',
  },
  {
    name: 'Ridgeline Capital',
    signal: 'Restructuring its analyst program to bring on more junior talent this cycle',
    industry: 'finance',
    location: 'Shenton Way, Singapore',
    url: 'https://ridgelinecapital.example.com/careers/junior-analyst',
    role: 'Junior Analyst',
    employment_type: 'Full-time',
    duration: 'Permanent, 2-year rotational program',
    pay_range: 'S$4,000 - S$4,800/mo',
    requirements: 'Solid financial modelling fundamentals and the judgment to flag what a model is missing, not just build it.',
  },
  {
    name: 'Cobalt & Finch',
    signal: 'Rebranding after a merger, rebuilding brand strategy and marketing from scratch',
    industry: 'marketing',
    location: 'Kampong Glam, Singapore',
    url: 'https://cobaltandfinch.example.com/careers/brand-exec',
    role: 'Brand & Marketing Executive',
    employment_type: 'Full-time',
    duration: 'Permanent',
    pay_range: 'S$2,900 - S$3,400/mo',
    requirements: 'Comfortable owning a brand voice from the ground up post-merger, not just executing an existing playbook.',
  },

  // Design / creative
  {
    name: 'Hollow & Vane Studio',
    signal: 'Just landed a major regional client and is scaling its illustration and brand identity team',
    industry: 'design',
    location: 'Tiong Bahru, Singapore',
    url: 'https://hollowandvane.example.com/careers/junior-illustrator',
    role: 'Junior Illustrator',
    employment_type: 'Full-time',
    duration: 'Permanent',
    pay_range: 'S$2,800 - S$3,300/mo',
    requirements: 'A portfolio that shows range across a client brief, not just personal style work.',
  },
  {
    name: 'Lumen Press',
    signal: 'Launching a new editorial imprint, looking for illustrators and visual storytellers',
    industry: 'publishing',
    location: 'Jalan Besar, Singapore',
    url: 'https://lumenpress.example.com/careers/visual-storyteller',
    role: 'Visual Storyteller (Editorial)',
    employment_type: 'Part-time',
    duration: '6-month contract',
    pay_range: 'S$25 - S$35/hr',
    requirements: 'Editorial sensibility, someone who can pace a visual narrative across a multi-page spread.',
  },

  // Health / science
  {
    name: 'Cascade Health',
    signal: 'Rebuilding its entire patient-facing product after an acquisition',
    industry: 'healthtech',
    location: 'Buona Vista, Singapore',
    url: 'https://cascadehealth.example.com/careers/research-associate',
    role: 'Research & Insights Associate',
    employment_type: 'Full-time',
    duration: 'Permanent',
    pay_range: 'S$3,100 - S$3,700/mo',
    requirements: 'Comfortable turning patient research into product decisions during a full product rebuild.',
  },
  {
    name: 'Verdant Biosciences',
    signal: 'Just opened a new research division after a grant award',
    industry: 'biotech',
    location: 'Biopolis, Singapore',
    url: 'https://verdantbio.example.com/careers/research-attachment',
    role: 'Research Attachment',
    employment_type: 'Internship',
    duration: '6 months',
    pay_range: 'S$1,400/mo',
    requirements: 'Wet-lab fundamentals and the discipline to keep clean records as the new division stands up its protocols.',
  },

  // Media / comms
  {
    name: 'Fieldnote',
    signal: 'Restructuring around a new content strategy after sunsetting a legacy product',
    industry: 'media',
    location: 'Somerset, Singapore',
    url: 'https://fieldnote.example.com/careers/content-strategist',
    role: 'Content Strategist',
    employment_type: 'Full-time',
    duration: 'Permanent',
    pay_range: 'S$3,000 - S$3,500/mo',
    requirements: 'Able to define a new content direction, not just execute an existing one.',
  },
  {
    name: 'Harborline',
    signal: 'Opened a new Singapore studio, hiring sprint across design and communications roles',
    industry: 'consumer',
    location: 'Robertson Quay, Singapore',
    url: 'https://harborline.example.com/careers/comms-exec',
    role: 'Communications Executive',
    employment_type: 'Full-time',
    duration: 'Permanent',
    pay_range: 'S$2,900 - S$3,400/mo',
    requirements: 'Comfortable setting up comms processes from scratch as a brand-new studio ramps up.',
  },
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

  console.log(`Seeded ${profileInputs.length} profile inputs and ${companies.length} companies (Singapore-based).`);
}

seed();
