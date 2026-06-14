-- E9 — CONTRIBUTOR INTELLIGENCE ENGINE
-- Additive migration - never modifies existing tables destructively

-- ============================================
-- UNIFIED CONTRIBUTOR PROFILES TABLE
-- ============================================
create table if not exists contributor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- References profiles.id if linked
  unified_id text unique not null, -- Cross-platform unique identifier
  
  -- Basic Info
  display_name text not null,
  bio text,
  avatar_url text,
  location text,
  website_url text,
  linkedin_url text,
  twitter_url text,
  
  -- Scores
  contributor_score numeric not null default 0, -- Overall contributor score 0-100
  expertise_score numeric not null default 0, -- Technical expertise 0-100
  contribution_score numeric not null default 0, -- Contribution activity 0-100
  research_score numeric not null default 0, -- Research impact 0-100
  collaboration_score numeric not null default 0, -- Collaboration activity 0-100
  
  -- Statistics
  total_contributions integer not null default 0,
  total_projects integer not null default 0,
  total_research_papers integer not null default 0,
  total_patents integer not null default 0,
  total_hackathons integer not null default 0,
  total_mentorships integer not null default 0,
  
  -- Expertise
  primary_domains text[] default array[]::text[],
  secondary_domains text[] default array[]::text[],
  skills text[] default array[]::text[],
  languages text[] default array[]::text[],
  
  -- Activity
  last_active_at timestamptz,
  activity_level text not null default 'inactive', -- inactive, low, medium, high, very_high
  activity_streak integer not null default 0,
  
  -- Reputation
  followers_count integer not null default 0,
  following_count integer not null default 0,
  reputation_score numeric not null default 0,
  
  -- Metadata
  profile_data jsonb, -- Additional platform-specific data
  social_links jsonb, -- All social media links
  achievements text[] default array[]::text[],
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(unified_id)
);

-- ============================================
-- GITHUB PROFILES TABLE
-- ============================================
create table if not exists github_profiles (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references contributor_profiles(id) on delete cascade,
  github_id text unique not null,
  username text not null,
  avatar_url text,
  bio text,
  location text,
  company text,
  blog text,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  public_repos integer not null default 0,
  public_gists integer not null default 0,
  total_stars integer not null default 0,
  total_forks integer not null default 0,
  contributions_count integer not null default 0,
  languages text[] default array[]::text[],
  organizations text[] default array[]::text[],
  last_synced_at timestamptz not null default now(),
  profile_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(github_id)
);

-- ============================================
-- GITLAB PROFILES TABLE
-- ============================================
create table if not exists gitlab_profiles (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references contributor_profiles(id) on delete cascade,
  gitlab_id text unique not null,
  username text not null,
  avatar_url text,
  bio text,
  location text,
  organization text,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  public_projects integer not null default 0,
  total_stars integer not null default 0,
  total_forks integer not null default 0,
  contributions_count integer not null default 0,
  languages text[] default array[]::text[],
  last_synced_at timestamptz not null default now(),
  profile_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(gitlab_id)
);

-- ============================================
-- RESEARCH PROFILES TABLE
-- ============================================
create table if not exists research_profiles (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references contributor_profiles(id) on delete cascade,
  orcid_id text unique,
  google_scholar_id text unique,
  researchgate_id text unique,
  semantic_scholar_id text unique,
  display_name text not null,
  affiliation text,
  department text,
  h_index integer not null default 0,
  i10_index integer not null default 0,
  total_citations integer not null default 0,
  total_papers integer not null default 0,
  research_interests text[] default array[]::text[],
  co_authors text[] default array[]::text[],
  last_synced_at timestamptz not null default now(),
  profile_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- HACKATHON PROFILES TABLE
-- ============================================
create table if not exists hackathon_profiles (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references contributor_profiles(id) on delete cascade,
  devpost_username text unique,
  hack2skill_id text unique,
  unstop_id text unique,
  total_hackathons integer not null default 0,
  total_wins integer not null default 0,
  total_participations integer not null default 0,
  prize_money numeric not null default 0,
  skills text[] default array[]::text[],
  team_preferences text[] default array[]::text[],
  last_synced_at timestamptz not null default now(),
  profile_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- MARKETPLACE PROFILES TABLE
-- ============================================
create table if not exists marketplace_profiles (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references contributor_profiles(id) on delete cascade,
  marketplace_id text unique not null,
  rating numeric not null default 0,
  total_reviews integer not null default 0,
  total_sales integer not null default 0,
  total_purchases integer not null default 0,
  services_offered text[] default array[]::text[],
  skills text[] default array[]::text[],
  availability text not null default 'available', -- available, busy, unavailable
  hourly_rate numeric,
  last_synced_at timestamptz not null default now(),
  profile_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(marketplace_id)
);

-- ============================================
-- CONTRIBUTOR MERGE LOGS TABLE
-- ============================================
create table if not exists contributor_merge_logs (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references contributor_profiles(id) on delete cascade,
  source_platform text not null, -- github, gitlab, research, hackathon, marketplace
  source_id text not null,
  merge_type text not null, -- initial, update, unlink
  status text not null default 'pending', -- pending, completed, failed
  merged_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================
-- CONTRIBUTOR SCORE HISTORY TABLE
-- ============================================
create table if not exists contributor_score_history (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references contributor_profiles(id) on delete cascade,
  contributor_score numeric not null,
  expertise_score numeric not null,
  contribution_score numeric not null,
  research_score numeric not null,
  collaboration_score numeric not null,
  recorded_at timestamptz not null default now(),
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_contributor_profiles_user on contributor_profiles(user_id);
create index if not exists idx_contributor_profiles_score on contributor_profiles(contributor_score desc);
create index if not exists idx_contributor_profiles_activity on contributor_profiles(activity_level);
create index if not exists idx_contributor_profiles_domains on contributor_profiles using gin(primary_domains);

create index if not exists idx_github_profiles_contributor on github_profiles(contributor_id);
create index if not exists idx_github_profiles_username on github_profiles(username);

create index if not exists idx_gitlab_profiles_contributor on gitlab_profiles(contributor_id);
create index if not exists idx_gitlab_profiles_username on gitlab_profiles(username);

create index if not exists idx_research_profiles_contributor on research_profiles(contributor_id);
create index if not exists idx_research_profiles_orcid on research_profiles(orcid);

create index if not exists idx_hackathon_profiles_contributor on hackathon_profiles(contributor_id);
create index if not exists idx_marketplace_profiles_contributor on marketplace_profiles(contributor_id);

create index if not exists idx_contributor_merge_logs_contributor on contributor_merge_logs(contributor_id);
create index if not exists idx_contributor_merge_logs_status on contributor_merge_logs(status);

create index if not exists idx_contributor_score_history_contributor on contributor_score_history(contributor_id);
create index if not exists idx_contributor_score_history_recorded on contributor_score_history(recorded_at desc);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table contributor_profiles enable row level security;
alter table github_profiles enable row level security;
alter table gitlab_profiles enable row level security;
alter table research_profiles enable row level security;
alter table hackathon_profiles enable row level security;
alter table marketplace_profiles enable row level security;
alter table contributor_merge_logs enable row level security;
alter table contributor_score_history enable row level security;

-- Public read access for contributor profiles
create policy "Public can view contributor profiles" on contributor_profiles for select using (true);
create policy "Public can view github profiles" on github_profiles for select using (true);
create policy "Public can view gitlab profiles" on gitlab_profiles for select using (true);
create policy "Public can view research profiles" on research_profiles for select using (true);
create policy "Public can view hackathon profiles" on hackathon_profiles for select using (true);
create policy "Public can view marketplace profiles" on marketplace_profiles for select using (true);

-- Admin full access
create policy "Admins can manage contributor profiles" on contributor_profiles for all using (auth.role() = 'authenticated');
create policy "Admins can manage github profiles" on github_profiles for all using (auth.role() = 'authenticated');
create policy "Admins can manage gitlab profiles" on gitlab_profiles for all using (auth.role() = 'authenticated');
create policy "Admins can manage research profiles" on research_profiles for all using (auth.role() = 'authenticated');
create policy "Admins can manage hackathon profiles" on hackathon_profiles for all using (auth.role() = 'authenticated');
create policy "Admins can manage marketplace profiles" on marketplace_profiles for all using (auth.role() = 'authenticated');
create policy "Admins can manage merge logs" on contributor_merge_logs for all using (auth.role() = 'authenticated');
create policy "Admins can manage score history" on contributor_score_history for all using (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
create trigger update_contributor_profiles_updated_at before update on contributor_profiles
  for each row execute function update_updated_at_column();

create trigger update_github_profiles_updated_at before update on github_profiles
  for each row execute function update_updated_at_column();

create trigger update_gitlab_profiles_updated_at before update on gitlab_profiles
  for each row execute function update_updated_at_column();

create trigger update_research_profiles_updated_at before update on research_profiles
  for each row execute function update_updated_at_column();

create trigger update_hackathon_profiles_updated_at before update on hackathon_profiles
  for each row execute function update_updated_at_column();

create trigger update_marketplace_profiles_updated_at before update on marketplace_profiles
  for each row execute function update_updated_at_column();
