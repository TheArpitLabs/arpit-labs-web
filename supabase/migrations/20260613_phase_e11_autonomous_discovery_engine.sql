-- E11 — AUTONOMOUS DISCOVERY ENGINE
-- Additive migration - never modifies existing tables destructively

-- ============================================
-- DISCOVERY SOURCES TABLE
-- ============================================
create table if not exists discovery_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null, -- github, gitlab, arxiv, kaggle, huggingface, devpost, hack2skill, unstop
  base_url text not null,
  api_endpoint text,
  auth_required boolean not null default false,
  rate_limit_per_hour integer not null default 100,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  sync_frequency_minutes integer not null default 120,
  source_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- DISCOVERY PIPELINES TABLE
-- ============================================
create table if not exists discovery_pipelines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_id uuid not null references discovery_sources(id) on delete cascade,
  pipeline_type text not null, -- discover, analyze, deduplicate, score, queue, approve, publish
  status text not null default 'active', -- active, paused, disabled
  priority text not null default 'medium', -- low, medium, high, critical
  
  -- Configuration
  query_config jsonb,
  filter_config jsonb,
  transform_config jsonb,
  
  -- Scheduling
  schedule_interval text not null default '2h', -- cron expression
  last_run_at timestamptz,
  next_run_at timestamptz,
  
  -- Statistics
  total_runs integer not null default 0,
  successful_runs integer not null default 0,
  failed_runs integer not null default 0,
  items_discovered integer not null default 0,
  items_processed integer not null default 0,
  
  -- Metadata
  pipeline_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- DISCOVERED ITEMS TABLE
-- ============================================
create table if not exists discovered_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references discovery_sources(id) on delete cascade,
  source_item_id text not null, -- External ID from source
  item_type text not null, -- project, repository, paper, dataset, hackathon, competition
  
  -- Basic Info
  title text not null,
  description text,
  url text not null,
  author text,
  authors text[] default array[]::text[],
  
  -- Content
  content text,
  raw_data jsonb,
  
  -- Metadata
  metadata jsonb,
  tags text[] default array[]::text[],
  categories text[] default array[]::text[],
  technologies text[] default array[]::text[],
  languages text[] default array[]::text[],
  licenses text[] default array[]::text[],
  
  -- Metrics
  stars_count integer not null default 0,
  forks_count integer not null default 0,
  views_count integer not null default 0,
  downloads_count integer not null default 0,
  citations_count integer not null default 0,
  
  -- Dates
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  last_updated_at timestamptz,
  
  -- Processing
  processing_status text not null default 'pending', -- pending, analyzing, deduplicating, scoring, queuing, approving, publishing, completed, failed
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  processing_error text,
  
  -- Scoring
  quality_score numeric, -- 0-100
  relevance_score numeric, -- 0-100
  popularity_score numeric, -- 0-100
  overall_score numeric, -- 0-100
  
  -- Deduplication
  duplicate_of uuid references discovered_items(id),
  is_duplicate boolean not null default false,
  similarity_score numeric,
  
  -- Publication
  publish_status text not null default 'pending', -- pending, approved, rejected, published
  published_at timestamptz,
  published_to text[] default array[]::text[], -- projects, research, marketplace, etc.
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(source_id, source_item_id)
);

-- ============================================
-- DISCOVERY ANALYSIS TABLE
-- ============================================
create table if not exists discovery_analysis (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references discovered_items(id) on delete cascade,
  analysis_type text not null, -- content, quality, relevance, technical, legal
  analysis_result jsonb not null,
  confidence_score numeric,
  analyzed_at timestamptz not null default now(),
  analyzer_version text,
  created_at timestamptz not null default now()
);

-- ============================================
-- DISCOVERY SCORES TABLE
-- ============================================
create table if not exists discovery_scores (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references discovered_items(id) on delete cascade,
  
  -- Score Components
  quality_score numeric not null default 0,
  relevance_score numeric not null default 0,
  popularity_score numeric not null default 0,
  freshness_score numeric not null default 0,
  completeness_score numeric not null default 0,
  authority_score numeric not null default 0,
  engagement_score numeric not null default 0,
  
  -- Overall Score
  overall_score numeric not null default 0,
  score_percentile numeric, -- 0-100 percentile rank
  
  -- Score Breakdown
  score_breakdown jsonb,
  
  -- Metadata
  scored_at timestamptz not null default now(),
  scoring_model_version text,
  created_at timestamptz not null default now(),
  
  unique(item_id)
);

-- ============================================
-- DISCOVERY QUEUE TABLE
-- ============================================
create table if not exists discovery_queue (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references discovered_items(id) on delete cascade,
  queue_type text not null, -- approval, publication, review
  priority text not null default 'medium', -- low, medium, high, critical
  status text not null default 'pending', -- pending, processing, completed, skipped, failed
  
  -- Assignment
  assigned_to uuid,
  assigned_at timestamptz,
  
  -- Processing
  processed_at timestamptz,
  processed_by uuid,
  processing_notes text,
  
  -- Decision
  decision text, -- approve, reject, skip, request_changes
  decision_reason text,
  decided_at timestamptz,
  decided_by uuid,
  
  -- Metadata
  queue_data jsonb,
  
  queued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- DISCOVERY APPROVALS TABLE
-- ============================================
create table if not exists discovery_approvals (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references discovered_items(id) on delete cascade,
  approver_id uuid not null,
  approval_status text not null default 'pending', -- pending, approved, rejected
  approval_level text not null, -- level1, level2, level3
  comments text,
  approved_at timestamptz,
  rejection_reason text,
  approval_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- DISCOVERY LOGS TABLE
-- ============================================
create table if not exists discovery_logs (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid references discovery_pipelines(id) on delete cascade,
  source_id uuid references discovery_sources(id) on delete cascade,
  item_id uuid references discovered_items(id) on delete cascade,
  
  log_type text not null, -- info, warning, error, debug
  log_level text not null default 'info', -- info, warning, error, critical
  message text not null,
  
  -- Context
  context jsonb,
  stack_trace text,
  
  -- Timing
  logged_at timestamptz not null default now(),
  
  created_at timestamptz not null default now()
);

-- ============================================
-- DISCOVERY METRICS TABLE
-- ============================================
create table if not exists discovery_metrics (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references discovery_sources(id) on delete cascade,
  pipeline_id uuid references discovery_pipelines(id) on delete cascade,
  
  -- Metrics
  metric_name text not null,
  metric_value numeric not null,
  metric_unit text,
  
  -- Dimensions
  dimensions jsonb,
  
  -- Time
  recorded_at timestamptz not null default now(),
  
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_discovery_sources_type on discovery_sources(type);
create index if not exists idx_discovery_sources_active on discovery_sources(is_active);

create index if not exists idx_discovery_pipelines_source on discovery_pipelines(source_id);
create index if not exists idx_discovery_pipelines_type on discovery_pipelines(pipeline_type);
create index if not exists idx_discovery_pipelines_status on discovery_pipelines(status);

create index if not exists idx_discovered_items_source on discovered_items(source_id);
create index if not exists idx_discovered_items_type on discovered_items(item_type);
create index if not exists idx_discovered_items_status on discovered_items(processing_status);
create index if not exists idx_discovered_items_publish on discovered_items(publish_status);
create index if not exists idx_discovered_items_overall on discovered_items(overall_score desc);
create index if not exists idx_discovered_items_duplicate on discovered_items(is_duplicate);
create index if not exists idx_discovered_items_discovered on discovered_items(discovered_at desc);

create index if not exists idx_discovery_analysis_item on discovery_analysis(item_id);
create index if not exists idx_discovery_analysis_type on discovery_analysis(analysis_type);

create index if not exists idx_discovery_scores_item on discovery_scores(item_id);
create index if not exists idx_discovery_scores_overall on discovery_scores(overall_score desc);

create index if not exists idx_discovery_queue_item on discovery_queue(item_id);
create index if not exists idx_discovery_queue_type on discovery_queue(queue_type);
create index if not exists idx_discovery_queue_status on discovery_queue(status);
create index if not exists idx_discovery_queue_assigned on discovery_queue(assigned_to);

create index if not exists idx_discovery_approvals_item on discovery_approvals(item_id);
create index if not exists idx_discovery_approvals_status on discovery_approvals(approval_status);

create index if not exists idx_discovery_logs_pipeline on discovery_logs(pipeline_id);
create index if not exists idx_discovery_logs_source on discovery_logs(source_id);
create index if not exists idx_discovery_logs_item on discovery_logs(item_id);
create index if not exists idx_discovery_logs_type on discovery_logs(log_type);
create index if not exists idx_discovery_logs_logged on discovery_logs(logged_at desc);

create index if not exists idx_discovery_metrics_source on discovery_metrics(source_id);
create index if not exists idx_discovery_metrics_pipeline on discovery_metrics(pipeline_id);
create index if not exists idx_discovery_metrics_name on discovery_metrics(metric_name);
create index if not exists idx_discovery_metrics_recorded on discovery_metrics(recorded_at desc);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table discovery_sources enable row level security;
alter table discovery_pipelines enable row level security;
alter table discovered_items enable row level security;
alter table discovery_analysis enable row level security;
alter table discovery_scores enable row level security;
alter table discovery_queue enable row level security;
alter table discovery_approvals enable row level security;
alter table discovery_logs enable row level security;
alter table discovery_metrics enable row level security;

-- Public read access for published items
create policy "Public can view discovered items" on discovered_items for select using (publish_status = 'published');
create policy "Public can view discovery sources" on discovery_sources for select using (is_active = true);

-- Admin full access
create policy "Admins can manage discovery sources" on discovery_sources for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovery pipelines" on discovery_pipelines for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovered items" on discovered_items for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovery analysis" on discovery_analysis for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovery scores" on discovery_scores for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovery queue" on discovery_queue for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovery approvals" on discovery_approvals for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovery logs" on discovery_logs for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovery metrics" on discovery_metrics for all using (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
create trigger update_discovery_sources_updated_at before update on discovery_sources
  for each row execute function update_updated_at_column();

create trigger update_discovery_pipelines_updated_at before update on discovery_pipelines
  for each row execute function update_updated_at_column();

create trigger update_discovered_items_updated_at before update on discovered_items
  for each row execute function update_updated_at_column();

create trigger update_discovery_queue_updated_at before update on discovery_queue
  for each row execute function update_updated_at_column();

create trigger update_discovery_approvals_updated_at before update on discovery_approvals
  for each row execute function update_updated_at_column();
