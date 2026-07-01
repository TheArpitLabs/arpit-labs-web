-- E10 — COLLABORATION MARKETPLACE
-- Additive migration - never modifies existing tables destructively

-- ============================================
-- COLLABORATION OPPORTUNITIES TABLE
-- ============================================
create table if not exists collaboration_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  type text not null, -- team_formation, mentor_discovery, research_collaboration, startup_collaboration, hackathon_collaboration
  status text not null default 'open', -- open, in_progress, completed, cancelled
  priority text not null default 'medium', -- low, medium, high, urgent
  
  -- Requirements
  skills_required text[] default array[]::text[],
  experience_level text, -- beginner, intermediate, advanced, expert
  time_commitment text, -- part_time, full_time, flexible
  duration text, -- short_term, long_term, ongoing
  location_preference text, -- remote, on_site, hybrid
  
  -- Domain
  domain text not null,
  subdomains text[] default array[]::text[],
  technologies text[] default array[]::text[],
  
  -- Participants
  creator_id uuid not null, -- References profiles.id or contributor_profiles.id
  max_participants integer,
  current_participants integer not null default 0,
  participant_ids uuid[] default array[]::uuid[],
  
  -- Timeline
  deadline_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Metrics
  views_count integer not null default 0,
  applications_count integer not null default 0,
  matches_count integer not null default 0,
  
  -- Metadata
  tags text[] default array[]::text[],
  requirements jsonb,
  benefits text[] default array[]::text[],
  opportunity_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- COLLABORATION APPLICATIONS TABLE
-- ============================================
create table if not exists collaboration_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references collaboration_opportunities(id) on delete cascade,
  applicant_id uuid not null, -- References profiles.id or contributor_profiles.id
  status text not null default 'pending', -- pending, accepted, rejected, withdrawn
  cover_letter text,
  resume_url text,
  portfolio_url text,
  skills text[] default array[]::text[],
  availability text,
  proposed_role text,
  expected_compensation text,
  applied_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  feedback text,
  application_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(opportunity_id, applicant_id)
);

-- ============================================
-- TEAM FORMATIONS TABLE
-- ============================================
create table if not exists team_formations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null, -- project, startup, research, hackathon
  status text not null default 'forming', -- forming, active, completed, dissolved
  
  -- Goals
  goals text[] default array[]::text[],
  project_idea text,
  target_milestone text,
  
  -- Requirements
  roles_needed text[] default array[]::text[],
  skills_needed text[] default array[]::text[],
  commitment_level text,
  
  -- Team
  leader_id uuid not null,
  member_ids uuid[] default array[]::uuid[],
  max_members integer,
  current_members integer not null default 1,
  
  -- Timeline
  formation_deadline timestamptz,
  project_start_date timestamptz,
  expected_duration text,
  
  -- Matching
  compatibility_score numeric,
  matched_candidates uuid[] default array[]::uuid[],
  
  -- Metadata
  technologies text[] default array[]::text[],
  domains text[] default array[]::text[],
  team_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- MENTOR DISCOVERY TABLE
-- ============================================
create table if not exists mentor_discovery (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null, -- References profiles.id or contributor_profiles.id
  mentorship_areas text[] not null,
  expertise_level text not null, -- beginner, intermediate, advanced, expert
  industries text[] default array[]::text[],
  technologies text[] default array[]::text[],
  
  -- Availability
  availability_status text not null default 'available', -- available, busy, unavailable
  time_slots text[] default array[]::text[],
  mentorship_format text, -- one_on_one, group, hybrid
  session_duration text, -- 30min, 1hour, custom
  
  -- Pricing
  is_paid boolean not null default false,
  hourly_rate numeric,
  pricing_model text, -- hourly, session, package
  
  -- Statistics
  total_mentees integer not null default 0,
  active_mentees integer not null default 0,
  completed_sessions integer not null default 0,
  rating numeric not null default 0,
  review_count integer not null default 0,
  
  -- Preferences
  mentee_level text[] default array[]::text[], -- beginner, intermediate, advanced
  communication_style text,
  languages text[] default array[]::text[],
  
  -- Metadata
  bio text,
  achievements text[] default array[]::text[],
  mentor_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(mentor_id)
);

-- ============================================
-- MENTORSHIP REQUESTS TABLE
-- ============================================
create table if not exists mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentor_discovery(mentor_id) on delete cascade,
  mentee_id uuid not null, -- References profiles.id or contributor_profiles.id
  status text not null default 'pending', -- pending, accepted, rejected, completed, cancelled
  request_message text,
  goals text[] default array[]::text[],
  preferred_format text,
  preferred_duration text,
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  sessions_count integer not null default 0,
  feedback_mentee text,
  feedback_mentor text,
  rating_mentee numeric,
  rating_mentor numeric,
  request_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(mentor_id, mentee_id)
);

-- ============================================
-- RESEARCH COLLABORATIONS TABLE
-- ============================================
create table if not exists research_collaborations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  research_domain text not null,
  research_areas text[] not null,
  
  -- Status
  status text not null default 'seeking', -- seeking, active, completed, cancelled
  collaboration_type text not null, -- paper, project, grant, study
  
  -- Requirements
  expertise_required text[] default array[]::text[],
  institutions_preferred text[] default array[]::text[],
  timeline text,
  expected_outcome text,
  
  -- Participants
  lead_researcher_id uuid not null,
  collaborator_ids uuid[] default array[]::uuid[],
  institution_affiliations text[] default array[]::text[],
  
  -- Publication
  target_venue text,
  submission_deadline timestamptz,
  expected_publication_date timestamptz,
  
  -- Metrics
  citations_count integer not null default 0,
  downloads_count integer not null default 0,
  
  -- Metadata
  keywords text[] default array[]::text[],
  collaboration_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- STARTUP COLLABORATIONS TABLE
-- ============================================
create table if not exists startup_collaborations (
  id uuid primary key default gen_random_uuid(),
  startup_name text not null,
  idea_description text not null,
  stage text not null, -- idea, mvp, growth, scaling
  industry text not null,
  
  -- Status
  status text not null default 'seeking', -- seeking, active, funded, dissolved
  collaboration_type text not null, -- cofounder, advisor, investor, partner
  
  -- Requirements
  roles_needed text[] default array[]::text[],
  skills_needed text[] default array[]::text[],
  investment_stage text, -- pre_seed, seed, series_a, series_b
  funding_amount numeric,
  equity_offer text,
  
  -- Team
  founder_id uuid not null,
  team_member_ids uuid[] default array[]::uuid[],
  advisor_ids uuid[] default array[]::uuid[],
  
  -- Timeline
  funding_deadline timestamptz,
  launch_target timestamptz,
  
  -- Metrics
  interest_count integer not null default 0,
  meeting_count integer not null default 0,
  
  -- Metadata
  technologies text[] default array[]::text[],
  business_model text,
  traction_data jsonb,
  collaboration_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- HACKATHON COLLABORATIONS TABLE
-- ============================================
create table if not exists hackathon_collaborations (
  id uuid primary key default gen_random_uuid(),
  hackathon_name text not null,
  hackathon_platform text not null, -- devpost, hack2skill, unstop, other
  hackathon_url text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  
  -- Team
  team_name text not null,
  team_leader_id uuid not null,
  team_member_ids uuid[] default array[]::uuid[],
  max_team_size integer not null default 4,
  current_team_size integer not null default 1,
  
  -- Project
  project_idea text,
  project_domain text,
  technologies_needed text[] default array[]::text[],
  roles_needed text[] default array[]::text[],
  
  -- Status
  status text not null default 'forming', -- forming, registered, active, submitted, awarded
  submission_status text,
  
  -- Results
  prize_won text,
  prize_amount numeric,
  rank_achieved integer,
  
  -- Metadata
  collaboration_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- COLLABORATION MATCHES TABLE
-- ============================================
create table if not exists collaboration_matches (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references collaboration_opportunities(id) on delete cascade,
  candidate_id uuid not null,
  match_score numeric not null, -- 0-100
  match_reasons text[] default array[]::text[],
  match_type text not null, -- team, mentor, research, startup, hackathon
  status text not null default 'pending', -- pending, accepted, rejected, expired
  matched_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz,
  match_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_collaboration_opportunities_type on collaboration_opportunities(type);
create index if not exists idx_collaboration_opportunities_status on collaboration_opportunities(status);
create index if not exists idx_collaboration_opportunities_creator on collaboration_opportunities(creator_id);
create index if not exists idx_collaboration_opportunities_domain on collaboration_opportunities(domain);

create index if not exists idx_collaboration_applications_opportunity on collaboration_applications(opportunity_id);
create index if not exists idx_collaboration_applications_applicant on collaboration_applications(applicant_id);
create index if not exists idx_collaboration_applications_status on collaboration_applications(status);

create index if not exists idx_team_formations_leader on team_formations(leader_id);
create index if not exists idx_team_formations_status on team_formations(status);

create index if not exists idx_mentor_discovery_mentor on mentor_discovery(mentor_id);
create index if not exists idx_mentor_discovery_areas on mentor_discovery using gin(mentorship_areas);
create index if not exists idx_mentor_discovery_status on mentor_discovery(availability_status);

create index if not exists idx_mentorship_requests_mentor on mentorship_requests(mentor_id);
create index if not exists idx_mentorship_requests_mentee on mentorship_requests(mentee_id);
create index if not exists idx_mentorship_requests_status on mentorship_requests(status);

create index if not exists idx_research_collaborations_lead on research_collaborations(lead_researcher_id);
create index if not exists idx_research_collaborations_status on research_collaborations(status);

create index if not exists idx_startup_collaborations_founder on startup_collaborations(founder_id);
create index if not exists idx_startup_collaborations_status on startup_collaborations(status);

create index if not exists idx_hackathon_collaborations_leader on hackathon_collaborations(team_leader_id);
create index if not exists idx_hackathon_collaborations_status on hackathon_collaborations(status);

create index if not exists idx_collaboration_matches_opportunity on collaboration_matches(opportunity_id);
create index if not exists idx_collaboration_matches_candidate on collaboration_matches(candidate_id);
create index if not exists idx_collaboration_matches_score on collaboration_matches(match_score desc);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table collaboration_opportunities enable row level security;
alter table collaboration_applications enable row level security;
alter table team_formations enable row level security;
alter table mentor_discovery enable row level security;
alter table mentorship_requests enable row level security;
alter table research_collaborations enable row level security;
alter table startup_collaborations enable row level security;
alter table hackathon_collaborations enable row level security;
alter table collaboration_matches enable row level security;

-- Public read access
create policy "Public can view collaboration opportunities" on collaboration_opportunities for select using (true);
create policy "Public can view team formations" on team_formations for select using (true);
create policy "Public can view mentor discovery" on mentor_discovery for select using (true);
create policy "Public can view research collaborations" on research_collaborations for select using (true);
create policy "Public can view startup collaborations" on startup_collaborations for select using (true);
create policy "Public can view hackathon collaborations" on hackathon_collaborations for select using (true);

-- Admin full access
create policy "Admins can manage collaboration opportunities" on collaboration_opportunities for all using (auth.role() = 'authenticated');
create policy "Admins can manage collaboration applications" on collaboration_applications for all using (auth.role() = 'authenticated');
create policy "Admins can manage team formations" on team_formations for all using (auth.role() = 'authenticated');
create policy "Admins can manage mentor discovery" on mentor_discovery for all using (auth.role() = 'authenticated');
create policy "Admins can manage mentorship requests" on mentorship_requests for all using (auth.role() = 'authenticated');
create policy "Admins can manage research collaborations" on research_collaborations for all using (auth.role() = 'authenticated');
create policy "Admins can manage startup collaborations" on startup_collaborations for all using (auth.role() = 'authenticated');
create policy "Admins can manage hackathon collaborations" on hackathon_collaborations for all using (auth.role() = 'authenticated');
create policy "Admins can manage collaboration matches" on collaboration_matches for all using (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
create trigger update_collaboration_opportunities_updated_at before update on collaboration_opportunities
  for each row execute function update_updated_at_column();

create trigger update_collaboration_applications_updated_at before update on collaboration_applications
  for each row execute function update_updated_at_column();

create trigger update_team_formations_updated_at before update on team_formations
  for each row execute function update_updated_at_column();

create trigger update_mentor_discovery_updated_at before update on mentor_discovery
  for each row execute function update_updated_at_column();

create trigger update_mentorship_requests_updated_at before update on mentorship_requests
  for each row execute function update_updated_at_column();

create trigger update_research_collaborations_updated_at before update on research_collaborations
  for each row execute function update_updated_at_column();

create trigger update_startup_collaborations_updated_at before update on startup_collaborations
  for each row execute function update_updated_at_column();

create trigger update_hackathon_collaborations_updated_at before update on hackathon_collaborations
  for each row execute function update_updated_at_column();

create trigger update_collaboration_matches_updated_at before update on collaboration_matches
  for each row execute function update_updated_at_column();
