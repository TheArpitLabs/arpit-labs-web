-- Phase 10: Global Technology, Education, AI, and Innovation Ecosystem

-- 1. RESEARCH LABS
create table if not exists research_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  abstract text not null,
  content text, -- PDF URL or Markdown
  authors text[] default array[]::text[],
  division text not null, -- ai, iot, cybersecurity
  tags text[] default array[]::text[],
  published_at timestamptz,
  is_featured boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research_datasets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  download_url text,
  size text,
  format text,
  license text,
  created_at timestamptz not null default now()
);

create table if not exists research_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  status text default 'active',
  division text not null,
  created_at timestamptz not null default now()
);

-- 2. LEARNING UNIVERSITY (Extended)
create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  topic text not null, -- AI, IoT, Cybersecurity, Web Dev, Data Science
  level text default 'intermediate',
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid references certifications(id) on delete cascade,
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  passing_score integer default 70,
  duration_minutes integer default 60,
  created_at timestamptz not null default now()
);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  exam_id uuid references exams(id) on delete cascade,
  score integer not null,
  passed boolean not null,
  completed_at timestamptz not null default now()
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  icon_url text,
  criteria text,
  created_at timestamptz not null default now()
);

create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  awarded_at timestamptz not null default now()
);

-- 3. INNOVATION HUB
create table if not exists startups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  logo_url text,
  website_url text,
  founder_id uuid references auth.users(id),
  stage text default 'ideation',
  created_at timestamptz not null default now()
);

create table if not exists innovation_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  challenge_id uuid, -- Link to innovation challenges if any
  team_members uuid[] default array[]::uuid[],
  created_at timestamptz not null default now()
);

create table if not exists mentorship_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  mentor_id uuid references auth.users(id),
  max_mentees integer default 5,
  created_at timestamptz not null default now()
);

-- 4. VENTURE STUDIO
create table if not exists founders (
  id uuid primary key references auth.users(id) on delete cascade,
  bio text,
  expertise text[] default array[]::text[],
  linked_in text,
  created_at timestamptz not null default now()
);

create table if not exists investors (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_name text,
  investment_focus text[] default array[]::text[],
  ticket_size_min numeric,
  ticket_size_max numeric,
  created_at timestamptz not null default now()
);

create table if not exists pitch_decks (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete cascade,
  file_url text not null,
  version text,
  created_at timestamptz not null default now()
);

create table if not exists funding_rounds (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete cascade,
  round_type text not null, -- Pre-seed, Seed, Series A, etc.
  amount numeric,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. GLOBAL COMMUNITY
create table if not exists community_chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  city text,
  lead_id uuid references auth.users(id),
  member_count integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists community_events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references community_chapters(id) on delete cascade,
  title text not null,
  description text not null,
  event_type text default 'meetup', -- meetup, webinar, workshop
  location text, -- Physical address or online link
  start_time timestamptz not null,
  end_time timestamptz,
  max_attendees integer,
  created_at timestamptz not null default now()
);

-- 6. DATA & AI PLATFORM
create table if not exists user_behavior (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  action_type text not null, -- view, click, purchase, enroll
  entity_type text not null, -- course, project, product, research
  entity_id uuid not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  user_id uuid references auth.users(id),
  session_id text,
  created_at timestamptz not null default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  recommended_entity_type text not null,
  recommended_entity_id uuid not null,
  score numeric,
  reason text,
  created_at timestamptz not null default now()
);

-- RLS POLICIES

-- Research
alter table research_papers enable row level security;
create policy "Public can view published research" on research_papers for select using (published_at <= now());
create policy "Admins can manage research_papers" on research_papers for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpit@labs.com')); -- Assuming arpit@labs.com is admin

alter table research_datasets enable row level security;
create policy "Public can view research_datasets" on research_datasets for select using (true);

-- University
alter table certifications enable row level security;
create policy "Public can view certifications" on certifications for select using (true);

alter table exams enable row level security;
create policy "Authenticated users can see exams" on exams for select using (auth.role() = 'authenticated');

alter table assessments enable row level security;
create policy "Users can view their own assessments" on assessments for select using (auth.uid() = user_id);

-- Innovation & Venture (Private mostly)
alter table startups enable row level security;
create policy "Founders can manage their startups" on startups for all using (auth.uid() = founder_id);
create policy "Public can view active startups" on startups for select using (true);

-- Community
alter table community_chapters enable row level security;
create policy "Public can view chapters" on community_chapters for select using (true);

alter table community_events enable row level security;
create policy "Public can view events" on community_events for select using (true);

-- Analytics (Private)
alter table user_behavior enable row level security;
create policy "Only system/admins can view behavior" on user_behavior for select using (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS for all new tables
alter table research_projects enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table innovation_projects enable row level security;
alter table mentorship_programs enable row level security;
alter table founders enable row level security;
alter table investors enable row level security;
alter table pitch_decks enable row level security;
alter table funding_rounds enable row level security;
alter table analytics_events enable row level security;
alter table recommendations enable row level security;
