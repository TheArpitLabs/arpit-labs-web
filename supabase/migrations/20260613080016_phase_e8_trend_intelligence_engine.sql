-- E8 — TREND INTELLIGENCE ENGINE
-- Additive migration - never modifies existing tables destructively

-- Enable required extensions
create extension if not exists "pg_trgm"; -- For text similarity
create extension if not exists "vector";   -- For vector similarity (if available)

-- ============================================
-- TECHNOLOGY TRENDS TABLE
-- ============================================
create table if not exists technology_trends (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null, -- AI, AI Agents, MCP, Cybersecurity, IoT, Robotics, Cloud, DevOps, Quantum, Computer Vision
  trend_score numeric not null default 0, -- 0-100
  momentum numeric not null default 0, -- Rate of change
  mentions_count integer not null default 0,
  projects_count integer not null default 0,
  research_count integer not null default 0,
  contributors_count integer not null default 0,
  last_analyzed_at timestamptz not null default now(),
  trend_data jsonb, -- Historical trend data
  keywords text[] default array[]::text[],
  related_trends text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- EMERGING DOMAINS TABLE
-- ============================================
create table if not exists emerging_domains (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  maturity_level text not null default 'emerging', -- emerging, growing, mature, declining
  potential_score numeric not null default 0, -- 0-100
  adoption_rate numeric not null default 0,
  investment_level text, -- low, medium, high
  key_technologies text[] default array[]::text[],
  use_cases text[] default array[]::text[],
  challenges text[] default array[]::text[],
  opportunities text[] default array[]::text[],
  first_detected_at timestamptz not null default now(),
  last_analyzed_at timestamptz not null default now(),
  domain_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- RESEARCH TRENDS TABLE
-- ============================================
create table if not exists research_trends (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  domain text not null,
  trend_score numeric not null default 0,
  paper_count integer not null default 0,
  citation_count integer not null default 0,
  author_count integer not null default 0,
  institution_count integer not null default 0,
  growth_rate numeric not null default 0,
  keywords text[] default array[]::text[],
  related_topics text[] default array[]::text[],
  last_analyzed_at timestamptz not null default now(),
  trend_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- CONTRIBUTOR TRENDS TABLE
-- ============================================
create table if not exists contributor_trends (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null, -- References profiles.id
  trend_score numeric not null default 0,
  activity_score numeric not null default 0,
  influence_score numeric not null default 0,
  contribution_count integer not null default 0,
  project_count integer not null default 0,
  research_count integer not null default 0,
  collaboration_count integer not null default 0,
  expertise_areas text[] default array[]::text[],
  trending_topics text[] default array[]::text[],
  last_analyzed_at timestamptz not null default now(),
  trend_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contributor_id)
);

-- ============================================
-- PROJECT TRENDS TABLE
-- ============================================
create table if not exists project_trends (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null, -- References projects.id
  trend_score numeric not null default 0,
  popularity_score numeric not null default 0,
  innovation_score numeric not null default 0,
  star_count integer not null default 0,
  fork_count integer not null default 0,
  contributor_count integer not null default 0,
  view_count integer not null default 0,
  clone_count integer not null default 0,
  technologies text[] default array[]::text[],
  use_cases text[] default array[]::text[],
  last_analyzed_at timestamptz not null default now(),
  trend_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id)
);

-- ============================================
-- TREND ANALYSIS LOGS TABLE
-- ============================================
create table if not exists trend_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  analysis_type text not null, -- technology, domain, research, contributor, project
  status text not null default 'pending', -- pending, running, completed, failed
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  items_analyzed integer not null default 0,
  trends_detected integer not null default 0,
  errors_count integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_technology_trends_category on technology_trends(category);
create index if not exists idx_technology_trends_trend_score on technology_trends(trend_score desc);
create index if not exists idx_technology_trends_last_analyzed on technology_trends(last_analyzed_at desc);

create index if not exists idx_emerging_domains_maturity on emerging_domains(maturity_level);
create index if not exists idx_emerging_domains_potential on emerging_domains(potential_score desc);

create index if not exists idx_research_trends_domain on research_trends(domain);
create index if not exists idx_research_trends_score on research_trends(trend_score desc);

create index if not exists idx_contributor_trends_contributor on contributor_trends(contributor_id);
create index if not exists idx_contributor_trends_score on contributor_trends(trend_score desc);

create index if not exists idx_project_trends_project on project_trends(project_id);
create index if not exists idx_project_trends_score on project_trends(trend_score desc);

create index if not exists idx_trend_analysis_logs_status on trend_analysis_logs(status);
create index if not exists idx_trend_analysis_logs_started on trend_analysis_logs(started_at desc);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table technology_trends enable row level security;
alter table emerging_domains enable row level security;
alter table research_trends enable row level security;
alter table contributor_trends enable row level security;
alter table project_trends enable row level security;
alter table trend_analysis_logs enable row level security;

-- Public read access for trend data
create policy "Public can view technology trends" on technology_trends for select using (true);
create policy "Public can view emerging domains" on emerging_domains for select using (true);
create policy "Public can view research trends" on research_trends for select using (true);
create policy "Public can view contributor trends" on contributor_trends for select using (true);
create policy "Public can view project trends" on project_trends for select using (true);

-- Admin full access
create policy "Admins can manage technology trends" on technology_trends for all using (auth.role() = 'authenticated');
create policy "Admins can manage emerging domains" on emerging_domains for all using (auth.role() = 'authenticated');
create policy "Admins can manage research trends" on research_trends for all using (auth.role() = 'authenticated');
create policy "Admins can manage contributor trends" on contributor_trends for all using (auth.role() = 'authenticated');
create policy "Admins can manage project trends" on project_trends for all using (auth.role() = 'authenticated');
create policy "Admins can manage analysis logs" on trend_analysis_logs for all using (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_technology_trends_updated_at before update on technology_trends
  for each row execute function update_updated_at_column();

create trigger update_emerging_domains_updated_at before update on emerging_domains
  for each row execute function update_updated_at_column();

create trigger update_research_trends_updated_at before update on research_trends
  for each row execute function update_updated_at_column();

create trigger update_contributor_trends_updated_at before update on contributor_trends
  for each row execute function update_updated_at_column();

create trigger update_project_trends_updated_at before update on project_trends
  for each row execute function update_updated_at_column();
