-- E14 — ORGANIZATION INTELLIGENCE ENGINE
-- Additive migration - never modifies existing tables destructively

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  external_id text, -- Crunchbase ID, GitHub Org ID, etc.
  source text not null, -- crunchbase, github, linkedin, manual
  
  -- Basic Info
  name text not null,
  legal_name text,
  description text,
  tagline text,
  logo_url text,
  website_url text,
  
  -- Classification
  organization_type text not null, -- company, university, research_lab, government, nonprofit, startup
  industry text,
  sub_industries text[] default array[]::text[],
  sectors text[] default array[]::text[],
  categories text[] default array[]::text[],
  
  -- Size
  employee_count integer,
  employee_range text, -- 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
  founded_year integer,
  founded_month integer,
  
  -- Location
  headquarters_location text,
  headquarters_country text,
  headquarters_city text,
  locations text[] default array[]::text[],
  countries text[] default array[]::text[],
  
  -- Contact
  email text,
  phone text,
  linkedin_url text,
  twitter_url text,
  github_url text,
  
  -- Funding (for startups/companies)
  total_funding numeric,
  funding_rounds integer not null default 0,
  last_funding_date timestamptz,
  last_funding_round text, -- seed, series_a, series_b, series_c, etc.
  investors text[] default array[]::text[],
  valuation numeric,
  
  -- Research (for universities/labs)
  research_areas text[] default array[]::text[],
  lab_count integer,
  patent_count integer,
  publication_count integer,
  
  -- Technology
  tech_stack text[] default array[]::text[],
  technologies text[] default array[]::text[],
  tools text[] default array[]::text[],
  platforms text[] default array[]::text[],
  
  -- Metrics
  github_stars integer not null default 0,
  github_repos integer not null default 0,
  github_contributors integer not null default 0,
  social_followers integer not null default 0,
  alexa_rank integer,
  
  -- Status
  status text not null default 'active', -- active, inactive, acquired, closed, ipo
  acquisition_date timestamptz,
  acquired_by text,
  
  -- Intelligence Scores
  innovation_score numeric, -- 0-100
  research_score numeric, -- 0-100
  open_source_score numeric, -- 0-100
  community_score numeric, -- 0-100
  overall_score numeric, -- 0-100
  
  -- Dates
  indexed_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now(),
  
  -- Processing
  processing_status text not null default 'pending', -- pending, processing, completed, failed
  processed_at timestamptz,
  
  -- Metadata
  tags text[] default array[]::text[],
  keywords text[] default array[]::text[],
  organization_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(source, external_id)
);

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================
create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid, -- References profiles.id or contributor_profiles.id
  member_name text,
  member_title text,
  member_role text, -- founder, ceo, cto, engineer, researcher, etc.
  department text,
  
  -- Employment
  start_date date,
  end_date date,
  is_current boolean not null default true,
  
  -- Contribution
  contribution_score numeric, -- 0-100
  projects_contributed integer not null default 0,
  research_papers integer not null default 0,
  
  -- Metadata
  member_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- ORGANIZATION TECHNOLOGY GRAPH TABLE
-- ============================================
create table if not exists organization_technology_graph (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  technology_id uuid, -- References technology_trends.id if applicable
  technology_name text not null,
  technology_category text,
  
  -- Technology Usage
  usage_level text not null default 'low', -- low, medium, high, core
  adoption_date date,
  maturity_level text, -- experimental, developing, mature, legacy
  
  -- Technology Impact
  impact_score numeric, -- 0-100
  strategic_importance numeric, -- 0-100
  investment_level text, -- low, medium, high
  
  -- Projects Using
  project_count integer not null default 0,
  repository_count integer not null default 0,
  
  -- Metadata
  technology_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(organization_id, technology_name)
);

-- ============================================
-- ORGANIZATION RESEARCH GRAPH TABLE
-- ============================================
create table if not exists organization_research_graph (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  research_area text not null,
  research_domain text,
  
  -- Research Metrics
  paper_count integer not null default 0,
  citation_count integer not null default 0,
  patent_count integer not null default 0,
  grant_count integer not null default 0,
  
  -- Research Impact
  impact_score numeric, -- 0-100
  novelty_score numeric, -- 0-100
  collaboration_score numeric, -- 0-100
  
  -- Research Timeline
  first_publication_date date,
  last_publication_date date,
  active_years integer,
  
  -- Collaboration
  collaborator_organizations text[] default array[]::text[],
  key_researchers text[] default array[]::text[],
  
  -- Metadata
  research_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(organization_id, research_area)
);

-- ============================================
-- ORGANIZATION CONTRIBUTOR GRAPH TABLE
-- ============================================
create table if not exists organization_contributor_graph (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contributor_id uuid, -- References contributor_profiles.id
  contributor_name text not null,
  
  -- Contribution Metrics
  contribution_count integer not null default 0,
  project_count integer not null default 0,
  commit_count integer not null default 0,
  
  -- Relationship
  relationship_type text not null, -- employee, contractor, contributor, collaborator, alumni
  relationship_strength numeric, -- 0-100
  influence_score numeric, -- 0-100
  
  -- Expertise
  expertise_areas text[] default array[]::text[],
  primary_domain text,
  
  -- Timeline
  first_contribution_date date,
  last_contribution_date date,
  is_active boolean not null default true,
  
  -- Metadata
  contributor_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(organization_id, contributor_id)
);

-- ============================================
-- ORGANIZATION RANKINGS TABLE
-- ============================================
create table if not exists organization_rankings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  ranking_type text not null, -- innovation, research, open_source, community, overall, industry_specific
  ranking_category text, -- global, regional, industry, domain
  ranking_period text not null, -- monthly, quarterly, yearly
  
  -- Ranking Metrics
  rank integer not null,
  percentile numeric, -- 0-100
  score numeric not null, -- 0-100
  
  -- Score Components
  innovation_score numeric,
  research_score numeric,
  open_source_score numeric,
  community_score numeric,
  business_score numeric,
  
  -- Comparison
  total_organizations integer not null default 0,
  rank_change integer, -- Change from previous period
  
  -- Metadata
  ranking_data jsonb,
  
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  
  unique(organization_id, ranking_type, ranking_category, ranking_period)
);

-- ============================================
-- ORGANIZATION SIMILARITY TABLE
-- ============================================
create table if not exists organization_similarity (
  id uuid primary key default gen_random_uuid(),
  organization1_id uuid not null references organizations(id) on delete cascade,
  organization2_id uuid not null references organizations(id) on delete cascade,
  
  -- Similarity Scores
  technology_similarity numeric not null default 0, -- 0-1
  research_similarity numeric not null default 0, -- 0-1
  industry_similarity numeric not null default 0, -- 0-1
  size_similarity numeric not null default 0, -- 0-1
  location_similarity numeric not null default 0, -- 0-1
  overall_similarity numeric not null default 0, -- 0-1
  
  -- Similarity Type
  similarity_type text not null, -- technology, research, industry, hybrid
  
  -- Metadata
  similarity_data jsonb,
  
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  
  -- Ensure uniqueness and prevent self-similarity
  check (organization1_id < organization2_id),
  unique(organization1_id, organization2_id, similarity_type)
);

-- ============================================
-- ORGANIZATION PROJECTS TABLE
-- ============================================
create table if not exists organization_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid, -- References projects.id if applicable
  project_name text not null,
  project_url text,
  
  -- Project Classification
  project_type text, -- open_source, internal, research, product
  project_domain text,
  technologies text[] default array[]::text[],
  
  -- Project Metrics
  stars_count integer not null default 0,
  forks_count integer not null default 0,
  contributors_count integer not null default 0,
  
  -- Status
  status text not null default 'active', -- active, archived, deprecated
  
  -- Dates
  created_date date,
  last_updated_date date,
  
  -- Metadata
  project_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- ORGANIZATION COMPETITORS TABLE
-- ============================================
create table if not exists organization_competitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  competitor_id uuid not null references organizations(id) on delete cascade,
  
  -- Competition Analysis
  competition_level text not null, -- direct, indirect, potential
  market_overlap numeric, -- 0-100
  technology_overlap numeric, -- 0-100
  target_market_similarity numeric, -- 0-100
  
  -- Competitive Advantages
  advantages text[] default array[]::text[],
  disadvantages text[] default array[]::text[],
  
  -- Metadata
  competitor_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(organization_id, competitor_id)
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_organizations_source on organizations(source);
create index if not exists idx_organizations_external on organizations(external_id);
create index if not exists idx_organizations_type on organizations(organization_type);
create index if not exists idx_organizations_industry on organizations(industry);
create index if not exists idx_organizations_status on organizations(status);
create index if not exists idx_organizations_score on organizations(overall_score desc);
create index if not exists idx_organizations_innovation on organizations(innovation_score desc);
create index if not exists idx_organizations_tags on organizations using gin(tags);

create index if not exists idx_organization_members_org on organization_members(organization_id);
create index if not exists idx_organization_members_user on organization_members(user_id);
create index if not exists idx_organization_members_role on organization_members(member_role);

create index if not exists idx_organization_technology_graph_org on organization_technology_graph(organization_id);
create index if not exists idx_organization_technology_graph_name on organization_technology_graph(technology_name);
create index if not exists idx_organization_technology_graph_usage on organization_technology_graph(usage_level);

create index if not exists idx_organization_research_graph_org on organization_research_graph(organization_id);
create index if not exists idx_organization_research_graph_area on organization_research_graph(research_area);
create index if not exists idx_organization_research_graph_impact on organization_research_graph(impact_score desc);

create index if not exists idx_organization_contributor_graph_org on organization_contributor_graph(organization_id);
create index if not exists idx_organization_contributor_graph_contributor on organization_contributor_graph(contributor_id);
create index if not exists idx_organization_contributor_graph_strength on organization_contributor_graph(relationship_strength desc);

create index if not exists idx_organization_rankings_org on organization_rankings(organization_id);
create index if not exists idx_organization_rankings_type on organization_rankings(ranking_type);
create index if not exists idx_organization_rankings_rank on organization_rankings(rank);
create index if not exists idx_organization_rankings_score on organization_rankings(score desc);

create index if not exists idx_organization_similarity_org1 on organization_similarity(organization1_id);
create index if not exists idx_organization_similarity_org2 on organization_similarity(organization2_id);
create index if not exists idx_organization_similarity_overall on organization_similarity(overall_similarity desc);

create index if not exists idx_organization_projects_org on organization_projects(organization_id);
create index if not exists idx_organization_projects_project on organization_projects(project_id);

create index if not exists idx_organization_competitors_org on organization_competitors(organization_id);
create index if not exists idx_organization_competitors_competitor on organization_competitors(competitor_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table organization_technology_graph enable row level security;
alter table organization_research_graph enable row level security;
alter table organization_contributor_graph enable row level security;
alter table organization_rankings enable row level security;
alter table organization_similarity enable row level security;
alter table organization_projects enable row level security;
alter table organization_competitors enable row level security;

-- Public read access
create policy "Public can view organizations" on organizations for select using (processing_status = 'completed');
create policy "Public can view organization technology graph" on organization_technology_graph for select using (true);
create policy "Public can view organization research graph" on organization_research_graph for select using (true);
create policy "Public can view organization rankings" on organization_rankings for select using (true);
create policy "Public can view organization projects" on organization_projects for select using (true);

-- Admin full access
create policy "Admins can manage organizations" on organizations for all using (auth.role() = 'authenticated');
create policy "Admins can manage organization members" on organization_members for all using (auth.role() = 'authenticated');
create policy "Admins can manage organization technology graph" on organization_technology_graph for all using (auth.role() = 'authenticated');
create policy "Admins can manage organization research graph" on organization_research_graph for all using (auth.role() = 'authenticated');
create policy "Admins can manage organization contributor graph" on organization_contributor_graph for all using (auth.role() = 'authenticated');
create policy "Admins can manage organization rankings" on organization_rankings for all using (auth.role() = 'authenticated');
create policy "Admins can manage organization similarity" on organization_similarity for all using (auth.role() = 'authenticated');
create policy "Admins can manage organization projects" on organization_projects for all using (auth.role() = 'authenticated');
create policy "Admins can manage organization competitors" on organization_competitors for all using (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
create trigger update_organizations_updated_at before update on organizations
  for each row execute function update_updated_at_column();

create trigger update_organization_members_updated_at before update on organization_members
  for each row execute function update_updated_at_column();

create trigger update_organization_technology_graph_updated_at before update on organization_technology_graph
  for each row execute function update_updated_at_column();

create trigger update_organization_research_graph_updated_at before update on organization_research_graph
  for each row execute function update_updated_at_column();

create trigger update_organization_contributor_graph_updated_at before update on organization_contributor_graph
  for each row execute function update_updated_at_column();

create trigger update_organization_projects_updated_at before update on organization_projects
  for each row execute function update_updated_at_column();

create trigger update_organization_competitors_updated_at before update on organization_competitors
  for each row execute function update_updated_at_column();
