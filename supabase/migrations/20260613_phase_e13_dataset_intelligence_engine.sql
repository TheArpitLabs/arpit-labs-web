-- E13 — DATASET INTELLIGENCE ENGINE
-- Additive migration - never modifies existing tables destructively

-- ============================================
-- DATASETS TABLE
-- ============================================
create table if not exists datasets (
  id uuid primary key default gen_random_uuid(),
  external_id text, -- Kaggle ID, HuggingFace ID, etc.
  source text not null, -- kaggle, huggingface, uci, github, other
  
  -- Basic Info
  name text not null,
  title text,
  description text,
  subtitle text,
  
  -- Creator
  creator_id uuid, -- References profiles.id or contributor_profiles.id
  creator_name text,
  creator_url text,
  organization text,
  
  -- Content
  dataset_url text not null,
  download_url text,
  file_format text[] default array[]::text[], -- csv, json, parquet, etc.
  file_size numeric, -- in bytes
  file_count integer not null default 1,
  
  -- License
  license_name text,
  license_url text,
  license_type text, -- open, restricted, proprietary
  
  -- Domain
  domain text not null,
  subdomains text[] default array[]::text[],
  task_type text[] default array[]::text[], -- classification, regression, nlp, cv, etc.
  data_type text[] default array[]::text[], -- tabular, image, text, audio, video, time-series
  
  -- Features
  feature_count integer,
  instance_count integer,
  features text[] default array[]::text[],
  target_variables text[] default array[]::text[],
  
  -- Quality
  completeness_score numeric, -- 0-100
  consistency_score numeric, -- 0-100
  accuracy_score numeric, -- 0-100
  documentation_quality numeric, -- 0-100
  overall_quality_score numeric, -- 0-100
  
  -- Metrics
  download_count integer not null default 0,
  view_count integer not null default 0,
  like_count integer not null default 0,
  fork_count integer not null default 0,
  citation_count integer not null default 0,
  usage_count integer not null default 0,
  
  -- Dates
  created_date timestamptz,
  updated_date timestamptz,
  indexed_at timestamptz not null default now(),
  
  -- Processing
  processing_status text not null default 'pending', -- pending, processing, completed, failed
  processed_at timestamptz,
  
  -- Metadata
  tags text[] default array[]::text[],
  keywords text[] default array[]::text[],
  languages text[] default array[]::text[],
  dataset_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(source, external_id)
);

-- ============================================
-- DATASET QUALITY METRICS TABLE
-- ============================================
create table if not exists dataset_quality_metrics (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  
  -- Data Quality Dimensions
  completeness numeric not null default 0, -- 0-100
  consistency numeric not null default 0, -- 0-100
  accuracy numeric not null default 0, -- 0-100
  validity numeric not null default 0, -- 0-100
  uniqueness numeric not null default 0, -- 0-100
  timeliness numeric not null default 0, -- 0-100
  
  -- Documentation Quality
  documentation_completeness numeric not null default 0, -- 0-100
  documentation_clarity numeric not null default 0, -- 0-100
  code_availability numeric not null default 0, -- 0-100
  paper_availability numeric not null default 0, -- 0-100
  
  -- Overall Quality
  overall_quality numeric not null default 0, -- 0-100
  quality_percentile numeric, -- 0-100 percentile rank
  
  -- Quality Breakdown
  quality_breakdown jsonb,
  
  -- Assessment
  assessed_at timestamptz not null default now(),
  assessment_method text not null, -- automated, manual, hybrid
  assessor_version text,
  
  -- Issues
  issues_found text[] default array[]::text[],
  warnings text[] default array[]::text[],
  
  created_at timestamptz not null default now(),
  
  unique(dataset_id)
);

-- ============================================
-- DATASET RECOMMENDATIONS TABLE
-- ============================================
create table if not exists dataset_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- References profiles.id
  dataset_id uuid not null references datasets(id) on delete cascade,
  recommendation_type text not null, -- similar, trending, popular, task_based, domain_based
  recommendation_score numeric not null, -- 0-100
  recommendation_reason text,
  
  -- Context
  context jsonb,
  
  -- Interaction
  viewed_at timestamptz,
  downloaded_at timestamptz,
  bookmarked_at timestamptz,
  dismissed_at timestamptz,
  feedback text,
  
  -- Metadata
  recommendation_data jsonb,
  
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ============================================
-- DATASET SIMILARITY TABLE
-- ============================================
create table if not exists dataset_similarity (
  id uuid primary key default gen_random_uuid(),
  dataset1_id uuid not null references datasets(id) on delete cascade,
  dataset2_id uuid not null references datasets(id) on delete cascade,
  
  -- Similarity Scores
  name_similarity numeric not null default 0, -- 0-1
  description_similarity numeric not null default 0, -- 0-1
  feature_similarity numeric not null default 0, -- 0-1
  domain_similarity numeric not null default 0, -- 0-1
  task_similarity numeric not null default 0, -- 0-1
  overall_similarity numeric not null default 0, -- 0-1
  
  -- Similarity Type
  similarity_type text not null, -- semantic, feature, domain, task, hybrid
  
  -- Metadata
  similarity_data jsonb,
  
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  
  -- Ensure uniqueness and prevent self-similarity
  check (dataset1_id < dataset2_id),
  unique(dataset1_id, dataset2_id, similarity_type)
);

-- ============================================
-- DATASET GRAPHS TABLE
-- ============================================
create table if not exists dataset_graphs (
  id uuid primary key default gen_random_uuid(),
  graph_type text not null, -- similarity, usage, citation, domain, task, hybrid
  graph_name text not null,
  description text,
  
  -- Graph Configuration
  nodes jsonb not null, -- Array of node objects
  edges jsonb not null, -- Array of edge objects
  layout_config jsonb,
  
  -- Statistics
  node_count integer not null default 0,
  edge_count integer not null default 0,
  density numeric,
  avg_degree numeric,
  
  -- Metadata
  graph_data jsonb,
  
  -- Generation
  generated_at timestamptz not null default now(),
  generated_by text not null, -- system, user, ai
  model_version text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- DATASET USAGE TABLE
-- ============================================
create table if not exists dataset_usage (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  user_id uuid, -- References profiles.id
  project_id uuid, -- References projects.id
  
  -- Usage Type
  usage_type text not null, -- download, view, like, fork, cite, integrate
  usage_context text,
  
  -- Metadata
  usage_data jsonb,
  
  used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================
-- DATASET VERSIONS TABLE
-- ============================================
create table if not exists dataset_versions (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  version_number text not null,
  version_name text,
  
  -- Changes
  changelog text,
  changes_made text[] default array[]::text[],
  
  -- Metrics
  file_size numeric,
  file_count integer,
  feature_count integer,
  instance_count integer,
  
  -- URLs
  download_url text,
  
  -- Dates
  released_date timestamptz,
  created_at timestamptz not null default now(),
  
  unique(dataset_id, version_number)
);

-- ============================================
-- DATASET REVIEWS TABLE
-- ============================================
create table if not exists dataset_reviews (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  user_id uuid not null, -- References profiles.id
  rating numeric not null, -- 1-5
  title text,
  review text,
  
  -- Review Aspects
  quality_rating numeric, -- 1-5
  documentation_rating numeric, -- 1-5
  usability_rating numeric, -- 1-5
  
  -- Metadata
  pros text[] default array[]::text[],
  cons text[] default array[]::text[],
  use_cases text[] default array[]::text[],
  
  -- Moderation
  status text not null default 'pending', -- pending, approved, rejected, flagged
  moderated_at timestamptz,
  moderated_by uuid,
  moderation_notes text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(dataset_id, user_id)
);

-- ============================================
-- DATASET TAGS TABLE
-- ============================================
create table if not exists dataset_tags (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  tag text not null,
  tag_type text not null default 'general', -- general, domain, task, format
  confidence numeric, -- 0-1 for auto-generated tags
  is_auto_generated boolean not null default false,
  created_at timestamptz not null default now(),
  unique(dataset_id, tag, tag_type)
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_datasets_source on datasets(source);
create index if not exists idx_datasets_external on datasets(external_id);
create index if not exists idx_datasets_creator on datasets(creator_id);
create index if not exists idx_datasets_domain on datasets(domain);
create index if not exists idx_datasets_status on datasets(processing_status);
create index if not exists idx_datasets_quality on datasets(overall_quality_score desc);
create index if not exists idx_datasets_downloads on datasets(download_count desc);
create index if not exists idx_datasets_tags on datasets using gin(tags);
create index if not exists idx_datasets_keywords on datasets using gin(keywords);

create index if not exists idx_dataset_quality_metrics_dataset on dataset_quality_metrics(dataset_id);
create index if not exists idx_dataset_quality_metrics_overall on dataset_quality_metrics(overall_quality desc);

create index if not exists idx_dataset_recommendations_user on dataset_recommendations(user_id);
create index if not exists idx_dataset_recommendations_dataset on dataset_recommendations(dataset_id);
create index if not exists idx_dataset_recommendations_score on dataset_recommendations(recommendation_score desc);
create index if not exists idx_dataset_recommendations_type on dataset_recommendations(recommendation_type);

create index if not exists idx_dataset_similarity_dataset1 on dataset_similarity(dataset1_id);
create index if not exists idx_dataset_similarity_dataset2 on dataset_similarity(dataset2_id);
create index if not exists idx_dataset_similarity_overall on dataset_similarity(overall_similarity desc);

create index if not exists idx_dataset_graphs_type on dataset_graphs(graph_type);

create index if not exists idx_dataset_usage_dataset on dataset_usage(dataset_id);
create index if not exists idx_dataset_usage_user on dataset_usage(user_id);
create index if not exists idx_dataset_usage_project on dataset_usage(project_id);
create index if not exists idx_dataset_usage_type on dataset_usage(usage_type);

create index if not exists idx_dataset_versions_dataset on dataset_versions(dataset_id);
create index if not exists idx_dataset_versions_number on dataset_versions(version_number);

create index if not exists idx_dataset_reviews_dataset on dataset_reviews(dataset_id);
create index if not exists idx_dataset_reviews_user on dataset_reviews(user_id);
create index if not exists idx_dataset_reviews_rating on dataset_reviews(rating desc);
create index if not exists idx_dataset_reviews_status on dataset_reviews(status);

create index if not exists idx_dataset_tags_dataset on dataset_tags(dataset_id);
create index if not exists idx_dataset_tags_tag on dataset_tags(tag);
create index if not exists idx_dataset_tags_type on dataset_tags(tag_type);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table datasets enable row level security;
alter table dataset_quality_metrics enable row level security;
alter table dataset_recommendations enable row level security;
alter table dataset_similarity enable row level security;
alter table dataset_graphs enable row level security;
alter table dataset_usage enable row level security;
alter table dataset_versions enable row level security;
alter table dataset_reviews enable row level security;
alter table dataset_tags enable row level security;

-- Public read access
create policy "Public can view datasets" on datasets for select using (processing_status = 'completed');
create policy "Public can view dataset quality metrics" on dataset_quality_metrics for select using (true);
create policy "Public can view dataset graphs" on dataset_graphs for select using (true);
create policy "Public can view dataset versions" on dataset_versions for select using (true);
create policy "Public can view dataset reviews" on dataset_reviews for select using (status = 'approved');
create policy "Public can view dataset tags" on dataset_tags for select using (true);

-- Admin full access
create policy "Admins can manage datasets" on datasets for all using (auth.role() = 'authenticated');
create policy "Admins can manage dataset quality metrics" on dataset_quality_metrics for all using (auth.role() = 'authenticated');
create policy "Admins can manage dataset recommendations" on dataset_recommendations for all using (auth.role() = 'authenticated');
create policy "Admins can manage dataset similarity" on dataset_similarity for all using (auth.role() = 'authenticated');
create policy "Admins can manage dataset graphs" on dataset_graphs for all using (auth.role() = 'authenticated');
create policy "Admins can manage dataset usage" on dataset_usage for all using (auth.role() = 'authenticated');
create policy "Admins can manage dataset versions" on dataset_versions for all using (auth.role() = 'authenticated');
create policy "Admins can manage dataset reviews" on dataset_reviews for all using (auth.role() = 'authenticated');
create policy "Admins can manage dataset tags" on dataset_tags for all using (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
create trigger update_datasets_updated_at before update on datasets
  for each row execute function update_updated_at_column();

create trigger update_dataset_graphs_updated_at before update on dataset_graphs
  for each row execute function update_updated_at_column();

create trigger update_dataset_reviews_updated_at before update on dataset_reviews
  for each row execute function update_updated_at_column();
