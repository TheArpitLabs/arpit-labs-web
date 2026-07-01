-- Phase 2: Domain Content Platform
-- Adds trending scores, content quality, and enhanced analytics for domain pages

-- 1. CONTENT TRENDING SCORES TABLE
create table if not exists content_trending_scores (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null, -- 'project', 'research_paper', 'dataset', 'learning_resource'
  domain_id uuid references engineering_domains(id) on delete cascade,
  subdomain_id uuid references engineering_subdomains(id) on delete cascade,
  
  -- Engagement metrics
  views_count integer not null default 0,
  saves_count integer not null default 0,
  shares_count integer not null default 0,
  clones_count integer not null default 0,
  forks_count integer not null default 0,
  
  -- Trending calculation
  trending_score numeric not null default 0,
  momentum_score numeric not null default 0,
  velocity_score numeric not null default 0,
  
  -- Time-based metrics
  daily_views integer not null default 0,
  weekly_views integer not null default 0,
  monthly_views integer not null default 0,
  
  -- Search frequency
  search_count integer not null default 0,
  
  -- Timestamps
  last_calculated_at timestamptz not null default now(),
  trend_period text not null default 'daily', -- 'daily', 'weekly', 'monthly'
  trend_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(content_id, content_type, trend_period)
);

-- 2. CONTENT QUALITY LEVELS TABLE
create table if not exists content_quality_levels (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null,
  
  -- Quality level
  quality_level text not null check (quality_level in ('bronze', 'silver', 'gold', 'platinum')),
  
  -- Quality metrics
  documentation_score numeric not null default 0,
  activity_score numeric not null default 0,
  trust_score numeric not null default 0,
  community_engagement_score numeric not null default 0,
  ai_score numeric not null default 0,
  
  -- Overall quality score
  overall_quality_score numeric not null default 0,
  
  -- Quality criteria met
  criteria_met text[] default array[]::text[],
  
  -- Assessment metadata
  assessed_at timestamptz not null default now(),
  assessed_by uuid, -- User or system ID
  assessment_method text not null default 'automated', -- 'automated', 'manual', 'hybrid'
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(content_id, content_type)
);

-- 3. DOMAIN ANALYTICS ENHANCED TABLE
create table if not exists domain_analytics_enhanced (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references engineering_domains(id) on delete cascade,
  
  -- Growth metrics
  growth_rate numeric not null default 0,
  content_velocity numeric not null default 0, -- New content per day
  
  -- Trending technologies
  trending_technologies text[] default array[]::text[],
  
  -- Search volume
  search_volume integer not null default 0,
  search_trend text not null default 'stable', -- 'rising', 'stable', 'declining'
  
  -- Popular subdomains
  popular_subdomains jsonb default '{}'::jsonb,
  
  -- Time period
  analytics_period text not null default 'weekly',
  period_start timestamptz not null default now() - interval '7 days',
  period_end timestamptz not null default now(),
  
  -- Analytics data
  analytics_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(domain_id, analytics_period, period_start)
);

-- 4. CONTRIBUTOR DOMAIN RANKINGS TABLE
create table if not exists contributor_domain_rankings (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null,
  domain_id uuid not null references engineering_domains(id) on delete cascade,
  
  -- Ranking metrics
  total_contributions integer not null default 0,
  project_contributions integer not null default 0,
  research_contributions integer not null default 0,
  dataset_contributions integer not null default 0,
  
  -- Influence metrics
  followers_count integer not null default 0,
  views_received integer not null default 0,
  saves_received integer not null default 0,
  
  -- Ranking
  rank_position integer,
  rank_trend text not null default 'stable', -- 'rising', 'stable', 'declining'
  
  -- Expertise areas
  expertise_areas text[] default array[]::text[],
  
  -- Time period
  ranking_period text not null default 'monthly',
  period_start timestamptz not null default now() - interval '30 days',
  period_end timestamptz not null default now(),
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(contributor_id, domain_id, ranking_period, period_start)
);

-- 5. CREATE INDEXES
create index if not exists idx_content_trending_content on content_trending_scores(content_id, content_type);
create index if not exists idx_content_trending_domain on content_trending_scores(domain_id);
create index if not exists idx_content_trending_subdomain on content_trending_scores(subdomain_id);
create index if not exists idx_content_trending_score on content_trending_scores(trending_score desc);
create index if not exists idx_content_trending_period on content_trending_scores(trend_period, last_calculated_at desc);

create index if not exists idx_content_quality_content on content_quality_levels(content_id, content_type);
create index if not exists idx_content_quality_level on content_quality_levels(quality_level);
create index if not exists idx_content_quality_score on content_quality_levels(overall_quality_score desc);

create index if not exists idx_domain_analytics_domain on domain_analytics_enhanced(domain_id);
create index if not exists idx_domain_analytics_period on domain_analytics_enhanced(analytics_period, period_start desc);
create index if not exists idx_domain_analytics_growth on domain_analytics_enhanced(growth_rate desc);

create index if not exists idx_contributor_rankings_contributor on contributor_domain_rankings(contributor_id);
create index if not exists idx_contributor_rankings_domain on contributor_domain_rankings(domain_id);
create index if not exists idx_contributor_rankings_rank on contributor_domain_rankings(rank_position);
create index if not exists idx_contributor_rankings_contributions on contributor_domain_rankings(total_contributions desc);

-- 6. ENABLE RLS
alter table content_trending_scores enable row level security;
alter table content_quality_levels enable row level security;
alter table domain_analytics_enhanced enable row level security;
alter table contributor_domain_rankings enable row level security;

-- 7. RLS POLICIES
-- Public read access
create policy "Public can view trending scores" on content_trending_scores for select using (true);
create policy "Public can view quality levels" on content_quality_levels for select using (true);
create policy "Public can view domain analytics" on domain_analytics_enhanced for select using (true);
create policy "Public can view contributor rankings" on contributor_domain_rankings for select using (true);

-- Admin full access
create policy "Admins can manage trending scores" on content_trending_scores for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);
create policy "Admins can manage quality levels" on content_quality_levels for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);
create policy "Admins can manage domain analytics" on domain_analytics_enhanced for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);
create policy "Admins can manage contributor rankings" on contributor_domain_rankings for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);

-- 8. CREATE FUNCTIONS FOR TRENDING CALCULATION
create or replace function calculate_trending_score(
  p_content_id uuid,
  p_content_type text,
  p_trend_period text default 'daily'
) returns numeric as $$
declare
  views_weight numeric := 0.3;
  saves_weight numeric := 0.25;
  shares_weight numeric := 0.2;
  recent_activity_weight numeric := 0.15;
  search_weight numeric := 0.1;
  
  total_score numeric;
  momentum_score numeric;
  velocity_score numeric;
begin
  -- This is a simplified trending calculation
  -- In production, this would use more sophisticated time-decay algorithms
  
  select 
    (views_count * views_weight +
     saves_count * saves_weight +
     shares_count * shares_weight +
     daily_views * recent_activity_weight +
     search_count * search_weight) into total_score
  from content_trending_scores
  where content_id = p_content_id 
    and content_type = p_content_type 
    and trend_period = p_trend_period;
  
  -- Normalize score to 0-100 range
  total_score := least(total_score, 100);
  
  -- Calculate momentum (rate of change)
  momentum_score := total_score * 0.1; -- Simplified
  
  -- Calculate velocity (speed of growth)
  velocity_score := total_score * 0.15; -- Simplified
  
  return total_score;
end;
$$ language plpgsql;

create or replace function update_trending_scores()
returns void as $$
begin
  -- Update trending scores for all content
  update content_trending_scores
  set 
    trending_score = calculate_trending_score(content_id, content_type, trend_period),
    momentum_score = trending_score * 0.1,
    velocity_score = trending_score * 0.15,
    last_calculated_at = now()
  where trend_period = 'daily';
  
  -- Similar updates for weekly and monthly periods would go here
end;
$$ language plpgsql;

-- 9. CREATE FUNCTION FOR QUALITY ASSESSMENT
create or replace function assess_content_quality(
  p_content_id uuid,
  p_content_type text
) returns text as $$
declare
  doc_score numeric;
  activity_score numeric;
  trust_score numeric;
  community_score numeric;
  ai_score numeric;
  overall_score numeric;
  quality_level text;
begin
  -- Simplified quality assessment
  -- In production, this would use ML models and comprehensive metrics
  
  doc_score := 70; -- Placeholder
  activity_score := 65; -- Placeholder
  trust_score := 75; -- Placeholder
  community_score := 60; -- Placeholder
  ai_score := 68; -- Placeholder
  
  overall_score := (doc_score + activity_score + trust_score + community_score + ai_score) / 5;
  
  -- Determine quality level
  if overall_score >= 90 then
    quality_level := 'platinum';
  elsif overall_score >= 75 then
    quality_level := 'gold';
  elsif overall_score >= 60 then
    quality_level := 'silver';
  else
    quality_level := 'bronze';
  end if;
  
  -- Insert or update quality level
  insert into content_quality_levels (
    content_id, content_type, quality_level,
    documentation_score, activity_score, trust_score,
    community_engagement_score, ai_score, overall_quality_score
  ) values (
    p_content_id, p_content_type, quality_level,
    doc_score, activity_score, trust_score,
    community_score, ai_score, overall_score
  )
  on conflict (content_id, content_type) do update set
    quality_level = excluded.quality_level,
    documentation_score = excluded.documentation_score,
    activity_score = excluded.activity_score,
    trust_score = excluded.trust_score,
    community_engagement_score = excluded.community_engagement_score,
    ai_score = excluded.ai_score,
    overall_quality_score = excluded.overall_quality_score,
    updated_at = now();
  
  return quality_level;
end;
$$ language plpgsql;

-- 10. CREATE VIEWS FOR DOMAIN PAGES
create or replace view domain_landing_page_data as
select 
  ed.id as domain_id,
  ed.name as domain_name,
  ed.slug as domain_slug,
  ed.description as domain_description,
  ed.icon as domain_icon,
  ed.color as domain_color,
  
  -- Content counts
  dcs.total_projects,
  dcs.total_research_papers,
  dcs.total_datasets,
  dcs.total_learning_resources,
  dcs.total_contributors,
  dcs.total_content,
  
  -- Trending content
  (select array_agg(
    jsonb_build_object(
      'content_id', cts.content_id,
      'content_type', cts.content_type,
      'trending_score', cts.trending_score,
      'momentum_score', cts.momentum_score
    ) order by cts.trending_score desc limit 10)
  ) as trending_content,
  
  -- Top contributors
  (select array_agg(
    jsonb_build_object(
      'contributor_id', cdr.contributor_id,
      'rank_position', cdr.rank_position,
      'total_contributions', cdr.total_contributions
    ) order by cdr.total_contributions desc limit 10)
  ) as top_contributors,
  
  -- Analytics
  dae.growth_rate,
  dae.content_velocity,
  dae.search_volume,
  dae.trending_technologies,
  dae.popular_subdomains
  
from engineering_domains ed
left join domain_content_statistics dcs on ed.id = dcs.domain_id
left join domain_analytics_enhanced dae on ed.id = dae.domain_id and dae.analytics_period = 'weekly'
left join content_trending_scores cts on ed.id = cts.domain_id and cts.trend_period = 'daily'
left join contributor_domain_rankings cdr on ed.id = cdr.domain_id and cdr.ranking_period = 'monthly'
group by ed.id, ed.name, ed.slug, ed.description, ed.icon, ed.color, 
         dcs.total_projects, dcs.total_research_papers, dcs.total_datasets,
         dcs.total_learning_resources, dcs.total_contributors, dcs.total_content,
         dae.growth_rate, dae.content_velocity, dae.search_volume,
         dae.trending_technologies, dae.popular_subdomains;

create or replace view subdomain_landing_page_data as
select 
  es.id as subdomain_id,
  es.name as subdomain_name,
  es.slug as subdomain_slug,
  es.description as subdomain_description,
  es.domain_id,
  ed.name as domain_name,
  ed.slug as domain_slug,
  ed.icon as domain_icon,
  ed.color as domain_color,
  
  -- Content counts
  scs.total_content,
  scs.avg_confidence_score,
  
  -- Trending content in subdomain
  (select array_agg(
    jsonb_build_object(
      'content_id', cts.content_id,
      'content_type', cts.content_type,
      'trending_score', cts.trending_score
    ) order by cts.trending_score desc limit 10)
  ) as trending_content
  
from engineering_subdomains es
join engineering_domains ed on es.domain_id = ed.id
left join subdomain_content_statistics scs on es.id = scs.subdomain_id
left join content_trending_scores cts on es.id = cts.subdomain_id and cts.trend_period = 'daily'
group by es.id, es.name, es.slug, es.description, es.domain_id, 
         ed.name, ed.slug, ed.icon, ed.color,
         scs.total_content, scs.avg_confidence_score;

-- 11. TRIGGERS FOR UPDATED_AT
create trigger update_content_trending_scores_updated_at before update on content_trending_scores
  for each row execute function update_updated_at_column();

create trigger update_content_quality_levels_updated_at before update on content_quality_levels
  for each row execute function update_updated_at_column();

create trigger update_domain_analytics_enhanced_updated_at before update on domain_analytics_enhanced
  for each row execute function update_updated_at_column();

create trigger update_contributor_domain_rankings_updated_at before update on contributor_domain_rankings
  for each row execute function update_updated_at_column();

-- 12. COMMENTS FOR DOCUMENTATION
comment on table content_trending_scores is 'Tracks trending scores for content based on engagement metrics';
comment on table content_quality_levels is 'Quality assessment levels (bronze, silver, gold, platinum) for content';
comment on table domain_analytics_enhanced is 'Enhanced analytics for domains including growth rate and trending technologies';
comment on table contributor_domain_rankings is 'Rankings of contributors within specific domains';

comment on column content_trending_scores.trending_score is 'Overall trending score (0-100) calculated from engagement metrics';
comment on column content_quality_levels.quality_level is 'Quality tier: bronze, silver, gold, or platinum';
comment on column domain_analytics_enhanced.growth_rate is 'Growth rate percentage for the domain';
comment on column contributor_domain_rankings.rank_position is 'Contributor ranking position within the domain';

-- Migration complete
