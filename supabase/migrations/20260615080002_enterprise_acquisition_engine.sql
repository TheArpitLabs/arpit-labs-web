-- ============================================================================
-- ARPIT LABS ENTERPRISE CONTENT ACQUISITION ENGINE
-- ============================================================================
-- Migration: 20260615_enterprise_acquisition_engine.sql
-- Description: Complete database schema for enterprise-scale content acquisition
-- Supports: 100,000+ projects, 50,000+ research papers, 10,000+ datasets
-- ============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "vector";

-- ============================================================================
-- SOURCE DISCOVERY LAYER
-- ============================================================================

-- Content sources (GitHub, ArXiv, Kaggle, HuggingFace, ProductHunt, etc.)
create table if not exists content_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  provider_type text not null, -- github, arxiv, kaggle, huggingface, producthunt, custom
  base_url text,
  api_endpoint text,
  auth_config jsonb,
  rate_limit jsonb, -- { requests_per_minute: 60, requests_per_hour: 1000 }
  is_active boolean default true,
  priority integer default 0, -- Higher priority sources checked first
  last_synced_at timestamptz,
  sync_frequency interval default '1 hour',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Source discovery rules and patterns
create table if not exists discovery_rules (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references content_sources(id) on delete cascade,
  rule_name text not null,
  rule_type text not null, -- keyword, topic, organization, language, custom
  pattern text not null,
  weight real default 1.0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_id, rule_name)
);

-- Discovered content candidates
create table if not exists discovered_content (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references content_sources(id) on delete cascade,
  external_id text not null, -- GitHub repo ID, ArXiv ID, etc.
  source_url text not null,
  content_type text not null, -- project, research_paper, dataset, learning_resource, hackathon, repository
  title text not null,
  description text,
  author text,
  organization text,
  discovery_metadata jsonb default '{}',
  discovered_at timestamptz not null default now(),
  processed_at timestamptz,
  status text default 'pending', -- pending, queued, processing, completed, failed, skipped
  error_message text,
  unique(source_id, external_id)
);

-- ============================================================================
-- ACQUISITION QUEUE LAYER
-- ============================================================================

-- Main acquisition queue
create table if not exists content_acquisition_queue (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references content_sources(id) on delete set null,
  discovered_id uuid references discovered_content(id) on delete set null,
  
  -- Content identification
  provider text not null, -- github, arxiv, kaggle, huggingface, producthunt, manual
  external_id text not null,
  source_url text not null,
  canonical_url text,
  repository_id text, -- Normalized repository identifier
  
  -- Content data
  content_type text not null, -- project, research_paper, dataset, learning_resource, hackathon, repository
  title text not null,
  description text,
  raw_content text,
  extracted_content text,
  
  -- Authorship
  author text,
  author_url text,
  organization text,
  organization_url text,
  
  -- Media
  screenshot_url text,
  cover_image text,
  screenshots text[] default array[]::text[],
  
  -- Metadata
  metadata jsonb default '{}',
  tags text[] default array[]::text[],
  categories text[] default array[]::text[],
  
  -- Deduplication
  content_hash text,
  similarity_score real,
  duplicate_of_id uuid references content_acquisition_queue(id) on delete set null,
  
  -- Processing state
  status text not null default 'pending', -- pending, fetching, fetched, analyzing, enriching, quality_check, moderating, approved, rejected, published, failed
  priority integer default 0,
  retry_count integer default 0,
  max_retries integer default 3,
  
  -- AI enrichment
  ai_analysis jsonb,
  ai_summary text,
  ai_tags text[] default array[]::text[],
  ai_categories text[] default array[]::text[],
  ai_quality_score real,
  
  -- Quality scoring
  quality_score real,
  quality_factors jsonb, -- { completeness: 0.8, documentation: 0.6, activity: 0.9, ... }
  
  -- Compliance
  compliance_status text default 'pending', -- pending, checking, compliant, non_compliant, review_needed
  license_type text,
  license_url text,
  compliance_notes text,
  
  -- Moderation
  moderation_status text default 'pending', -- pending, approved, rejected, review_needed
  moderator_id uuid references profiles(id) on delete set null,
  moderation_notes text,
  moderated_at timestamptz,
  
  -- Publishing
  published_content_id uuid, -- References the actual published content table
  published_content_type text, -- projects, research_papers, datasets, etc.
  published_at timestamptz,
  
  -- Scheduling
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Error handling
  error_message text,
  error_stack text,
  last_error_at timestamptz,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  
  -- Indexes for performance
  unique(provider, external_id),
  unique(canonical_url)
);

-- Queue job tracking (for BullMQ integration)
create table if not exists acquisition_jobs (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references content_acquisition_queue(id) on delete cascade,
  job_id text, -- BullMQ job ID
  job_type text not null, -- fetch, analyze, enrich, quality_check, moderate, publish
  status text not null default 'pending', -- pending, active, completed, failed, delayed
  priority integer default 0,
  attempts integer default 0,
  max_attempts integer default 3,
  delay integer default 0, -- milliseconds
  backoff jsonb, -- { type: 'exponential', delay: 2000 }
  data jsonb default '{}',
  result jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- DEDUPLICATION ENGINE
-- ============================================================================

-- Content hash registry for exact duplicate detection
create table if not exists content_hashes (
  id uuid primary key default gen_random_uuid(),
  content_hash text not null unique,
  content_type text not null,
  first_seen_id uuid not null, -- Reference to first content with this hash
  first_seen_at timestamptz not null default now(),
  occurrence_count integer default 1,
  last_seen_at timestamptz not null default now()
);

-- Similar content clusters
create table if not exists content_clusters (
  id uuid primary key default gen_random_uuid(),
  cluster_name text,
  content_type text not null,
  canonical_id uuid not null, -- The representative content for this cluster
  similarity_threshold real default 0.85,
  member_count integer default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cluster membership
create table if not exists content_cluster_members (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid not null references content_clusters(id) on delete cascade,
  content_id uuid not null, -- Could reference queue or published content
  content_type text not null,
  similarity_score real not null,
  is_canonical boolean default false,
  created_at timestamptz not null default now(),
  unique(cluster_id, content_id)
);

-- ============================================================================
-- COMPLIANCE ENGINE
-- ============================================================================

-- License registry
create table if not exists license_registry (
  id uuid primary key default gen_random_uuid(),
  spdx_id text not null unique,
  name text not null,
  is_osi_approved boolean default false,
  is_fsf_libre boolean default false,
  can_commercially_use boolean default false,
  can_modify boolean default false,
  can_distribute boolean default false,
  can_sublicense boolean default false,
  requires attribution boolean default false,
  requires_same_license boolean default false,
  requires_documentation boolean default false,
  description text,
  compatibility jsonb, -- { mit: [apache, bsd], gpl: [gpl] }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compliance checks
create table if not exists compliance_checks (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null, -- References acquisition queue or published content
  content_type text not null,
  check_type text not null, -- license, content_policy, security, quality
  status text not null default 'pending', -- pending, passed, failed, review_needed
  result jsonb,
  notes text,
  checked_at timestamptz not null default now(),
  checked_by text, -- system or user ID
  unique(content_id, content_type, check_type)
);

-- ============================================================================
-- AI ENRICHMENT ENGINE
-- ============================================================================

-- AI enrichment tasks
create table if not exists ai_enrichment_tasks (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null, -- References acquisition queue
  task_type text not null, -- analyze, summarize, categorize, extract_entities, generate_tags
  status text not null default 'pending', -- pending, processing, completed, failed
  input_data jsonb,
  output_data jsonb,
  model_used text,
  tokens_used integer,
  processing_time_ms integer,
  error_message text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Extracted entities
create table if not exists extracted_entities (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null,
  entity_type text not null, -- person, organization, technology, concept, location
  entity_name text not null,
  entity_value text,
  confidence real,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  unique(content_id, content_type, entity_type, entity_name)
);

-- AI-generated tags
create table if not exists ai_generated_tags (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null,
  tag text not null,
  confidence real,
  category text,
  created_at timestamptz not null default now(),
  unique(content_id, content_type, tag)
);

-- ============================================================================
-- QUALITY SCORING ENGINE
-- ============================================================================

-- Quality metrics
create table if not exists quality_metrics (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null,
  
  -- Individual quality factors
  completeness_score real, -- 0-1
  documentation_score real, -- 0-1
  activity_score real, -- 0-1
  popularity_score real, -- 0-1
  maintenance_score real, -- 0-1
  originality_score real, -- 0-1
  relevance_score real, -- 0-1
  
  -- Overall score
  overall_score real, -- 0-1
  
  -- Score breakdown
  factors jsonb, -- { completeness: { value: 0.8, weight: 0.2, reason: "..." }, ... }
  
  -- Metadata
  calculated_at timestamptz not null default now(),
  algorithm_version text,
  
  unique(content_id, content_type)
);

-- Quality thresholds by content type
create table if not exists quality_thresholds (
  id uuid primary key default gen_random_uuid(),
  content_type text not null unique,
  min_overall_score real default 0.5,
  auto_publish_threshold real default 0.8,
  manual_review_threshold real default 0.5,
  reject_threshold real default 0.3,
  factor_weights jsonb, -- { completeness: 0.2, documentation: 0.15, ... }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- KNOWLEDGE GRAPH
-- ============================================================================

-- Graph nodes (entities)
create table if not exists knowledge_nodes (
  id uuid primary key default gen_random_uuid(),
  node_type text not null, -- project, research_paper, dataset, person, organization, technology, concept, topic
  node_name text not null,
  node_data jsonb default '{}',
  source_content_id uuid,
  source_content_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Graph edges (relationships)
create table if not exists knowledge_edges (
  id uuid primary key default gen_random_uuid(),
  source_node_id uuid not null references knowledge_nodes(id) on delete cascade,
  target_node_id uuid not null references knowledge_nodes(id) on delete cascade,
  edge_type text not null, -- depends_on, implements, cites, uses, similar_to, related_to, authored_by, organized_by
  edge_weight real default 1.0,
  edge_data jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_node_id, target_node_id, edge_type),
  check (source_node_id != target_node_id)
);

-- ============================================================================
-- SEARCH LAYER
-- ============================================================================

-- Content embeddings for semantic search
create table if not exists content_embeddings (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null,
  embedding vector(1536), -- OpenAI embedding dimension
  embedding_model text default 'text-embedding-3-small',
  embedding_version text default '1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(content_id, content_type)
);

-- Search index metadata
create table if not exists search_index_metadata (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null,
  index_fields jsonb, -- { title: "AI Project", description: "...", tags: ["ai", "ml"] }
  indexed_at timestamptz not null default now(),
  needs_reindex boolean default false,
  unique(content_id, content_type)
);

-- ============================================================================
-- RECOMMENDATION ENGINE
-- ============================================================================

-- User interaction tracking
create table if not exists user_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  content_id uuid not null,
  content_type text not null,
  interaction_type text not null, -- view, like, save, share, comment, fork, download
  interaction_value real default 1.0,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  unique(user_id, content_id, content_type, interaction_type, created_at)
);

-- User preferences
create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  preferred_categories text[] default array[]::text[],
  preferred_tags text[] default array[]::text[],
  preferred_content_types text[] default array[]::text[],
  interaction_weights jsonb, -- { view: 1.0, like: 2.0, save: 3.0, ... }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recommendation cache
create table if not exists recommendation_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  content_type text,
  algorithm text not null, -- collaborative, content_based, hybrid, trending
  recommendations jsonb not null, -- Array of content IDs with scores
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  unique(user_id, content_type, algorithm)
);

-- ============================================================================
-- MODERATION LAYER
-- ============================================================================

-- Moderation queues
create table if not exists moderation_queue (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null,
  priority integer default 0,
  assigned_to uuid references profiles(id) on delete set null,
  status text not null default 'pending', -- pending, assigned, in_review, approved, rejected, escalated
  moderation_notes text,
  auto_flags jsonb, -- { spam: 0.1, adult: 0.0, violence: 0.0, ... }
  human_flags jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Moderation policies
create table if not exists moderation_policies (
  id uuid primary key default gen_random_uuid(),
  policy_name text not null unique,
  policy_type text not null, -- spam, adult, violence, copyright, quality
  description text,
  rules jsonb not null, -- { keywords: [...], patterns: [...], thresholds: {...} }
  action text not null, -- auto_reject, flag_for_review, allow
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- Pipeline performance metrics
create table if not exists pipeline_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_type text not null, -- counter, gauge, histogram
  metric_value jsonb not null,
  labels jsonb default '{}',
  timestamp timestamptz not null default now()
);

-- Queue health monitoring
create table if not exists queue_health (
  id uuid primary key default gen_random_uuid(),
  queue_name text not null,
  pending_jobs integer default 0,
  active_jobs integer default 0,
  completed_jobs integer default 0,
  failed_jobs integer default 0,
  delayed_jobs integer default 0,
  avg_processing_time_ms real,
  last_job_completed_at timestamptz,
  recorded_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Content acquisition queue indexes
create index if not exists idx_acquisition_queue_status on content_acquisition_queue(status);
create index if not exists idx_acquisition_queue_content_type on content_acquisition_queue(content_type);
create index if not exists idx_acquisition_queue_provider on content_acquisition_queue(provider);
create index if not exists idx_acquisition_queue_priority on content_acquisition_queue(priority desc);
create index if not exists idx_acquisition_queue_created_at on content_acquisition_queue(created_at desc);
create index if not exists idx_acquisition_queue_content_hash on content_acquisition_queue(content_hash);
create index if not exists idx_acquisition_queue_canonical_url on content_acquisition_queue(canonical_url);
create index if not exists idx_acquisition_queue_repository_id on content_acquisition_queue(repository_id);
create index if not exists idx_acquisition_queue_quality_score on content_acquisition_queue(quality_score);
create index if not exists idx_acquisition_queue_scheduled_for on content_acquisition_queue(scheduled_for);

-- Discovered content indexes
create index if not exists idx_discovered_content_status on discovered_content(status);
create index if not exists idx_discovered_content_source_id on discovered_content(source_id);
create index if not exists idx_discovered_content_content_type on discovered_content(content_type);
create index if not exists idx_discovered_content_discovered_at on discovered_content(discovered_at desc);

-- Acquisition jobs indexes
create index if not exists idx_acquisition_jobs_queue_id on acquisition_jobs(queue_id);
create index if not exists idx_acquisition_jobs_status on acquisition_jobs(status);
create index if not exists idx_acquisition_jobs_job_type on acquisition_jobs(job_type);
create index if not exists idx_acquisition_jobs_created_at on acquisition_jobs(created_at desc);

-- Content hashes indexes
create index if not exists idx_content_hashes_content_hash on content_hashes(content_hash);
create index if not exists idx_content_hashes_content_type on content_hashes(content_type);

-- Content clusters indexes
create index if not exists idx_content_clusters_content_type on content_clusters(content_type);
create index if not exists idx_content_cluster_members_cluster_id on content_cluster_members(cluster_id);
create index if not exists idx_content_cluster_members_content_id on content_cluster_members(content_id);

-- Compliance checks indexes
create index if not exists idx_compliance_checks_content_id on compliance_checks(content_id);
create index if not exists idx_compliance_checks_status on compliance_checks(status);
create index if not exists idx_compliance_checks_check_type on compliance_checks(check_type);

-- AI enrichment tasks indexes
create index if not exists idx_ai_enrichment_tasks_content_id on ai_enrichment_tasks(content_id);
create index if not exists idx_ai_enrichment_tasks_status on ai_enrichment_tasks(status);
create index if not exists idx_ai_enrichment_tasks_task_type on ai_enrichment_tasks(task_type);

-- Extracted entities indexes
create index if not exists idx_extracted_entities_content_id on extracted_entities(content_id);
create index if not exists idx_extracted_entities_entity_type on extracted_entities(entity_type);
create index if not exists idx_extracted_entities_entity_name on extracted_entities(entity_name);

-- AI generated tags indexes
create index if not exists idx_ai_generated_tags_content_id on ai_generated_tags(content_id);
create index if not exists idx_ai_generated_tags_tag on ai_generated_tags(tag);

-- Quality metrics indexes
create index if not exists idx_quality_metrics_content_id on quality_metrics(content_id);
create index if not exists idx_quality_metrics_overall_score on quality_metrics(overall_score);

-- Knowledge graph indexes
create index if not exists idx_knowledge_nodes_type on knowledge_nodes(node_type);
create index if not exists idx_knowledge_nodes_name on knowledge_nodes(node_name);
create index if not exists idx_knowledge_edges_source on knowledge_edges(source_node_id);
create index if not exists idx_knowledge_edges_target on knowledge_edges(target_node_id);
create index if not exists idx_knowledge_edges_type on knowledge_edges(edge_type);

-- Content embeddings indexes (vector similarity)
create index if not exists idx_content_embeddings_content_id on content_embeddings(content_id);
create index if not exists idx_content_embeddings_content_type on content_embeddings(content_type);
create index if not exists idx_content_embeddings_vector on content_embeddings using ivfflat (embedding vector_cosine_ops);

-- Search index metadata indexes
create index if not exists idx_search_index_content_id on search_index_metadata(content_id);
create index if not exists idx_search_index_needs_reindex on search_index_metadata(needs_reindex);

-- User interactions indexes
create index if not exists idx_user_interactions_user_id on user_interactions(user_id);
create index if not exists idx_user_interactions_content_id on user_interactions(content_id);
create index if not exists idx_user_interactions_type on user_interactions(interaction_type);
create index if not exists idx_user_interactions_created_at on user_interactions(created_at desc);

-- Recommendation cache indexes
create index if not exists idx_recommendation_cache_user_id on recommendation_cache(user_id);
create index if not exists idx_recommendation_cache_expires_at on recommendation_cache(expires_at);

-- Moderation queue indexes
create index if not exists idx_moderation_queue_content_id on moderation_queue(content_id);
create index if not exists idx_moderation_queue_status on moderation_queue(status);
create index if not exists idx_moderation_queue_assigned_to on moderation_queue(assigned_to);

-- Pipeline metrics indexes
create index if not exists idx_pipeline_metrics_name on pipeline_metrics(metric_name);
create index if not exists idx_pipeline_metrics_timestamp on pipeline_metrics(timestamp desc);

-- Queue health indexes
create index if not exists idx_queue_health_name on queue_health(queue_name);
create index if not exists idx_queue_health_recorded_at on queue_health(recorded_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table content_sources enable row level security;
alter table discovery_rules enable row level security;
alter table discovered_content enable row level security;
alter table content_acquisition_queue enable row level security;
alter table acquisition_jobs enable row level security;
alter table content_hashes enable row level security;
alter table content_clusters enable row level security;
alter table content_cluster_members enable row level security;
alter table license_registry enable row level security;
alter table compliance_checks enable row level security;
alter table ai_enrichment_tasks enable row level security;
alter table extracted_entities enable row level security;
alter table ai_generated_tags enable row level security;
alter table quality_metrics enable row level security;
alter table quality_thresholds enable row level security;
alter table knowledge_nodes enable row level security;
alter table knowledge_edges enable row level security;
alter table content_embeddings enable row level security;
alter table search_index_metadata enable row level security;
alter table user_interactions enable row level security;
alter table user_preferences enable row level security;
alter table recommendation_cache enable row level security;
alter table moderation_queue enable row level security;
alter table moderation_policies enable row level security;
alter table pipeline_metrics enable row level security;
alter table queue_health enable row level security;

-- Public read policies for published content
create policy "Public can read content sources" on content_sources for select using (true);
create policy "Public can read discovery rules" on discovery_rules for select using (true);
create policy "Public can read discovered content" on discovered_content for select using (true);
create policy "Public can read content hashes" on content_hashes for select using (true);
create policy "Public can read content clusters" on content_clusters for select using (true);
create policy "Public can read cluster members" on content_cluster_members for select using (true);
create policy "Public can read license registry" on license_registry for select using (true);
create policy "Public can read quality thresholds" on quality_thresholds for select using (true);
create policy "Public can read knowledge nodes" on knowledge_nodes for select using (true);
create policy "Public can read knowledge edges" on knowledge_edges for select using (true);
create policy "Public can read search index metadata" on search_index_metadata for select using (true);
create policy "Public can read moderation policies" on moderation_policies for select using (true);
create policy "Public can read pipeline metrics" on pipeline_metrics for select using (true);
create policy "Public can read queue health" on queue_health for select using (true);

-- Admin policies (service role only for administrative operations)
-- These policies allow authenticated admins to manage the acquisition pipeline
create policy "Admins can manage content sources" on content_sources for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovery rules" on discovery_rules for all using (auth.role() = 'authenticated');
create policy "Admins can manage discovered content" on discovered_content for all using (auth.role() = 'authenticated');
create policy "Admins can manage acquisition queue" on content_acquisition_queue for all using (auth.role() = 'authenticated');
create policy "Admins can manage acquisition jobs" on acquisition_jobs for all using (auth.role() = 'authenticated');
create policy "Admins can manage content hashes" on content_hashes for all using (auth.role() = 'authenticated');
create policy "Admins can manage content clusters" on content_clusters for all using (auth.role() = 'authenticated');
create policy "Admins can manage cluster members" on content_cluster_members for all using (auth.role() = 'authenticated');
create policy "Admins can manage license registry" on license_registry for all using (auth.role() = 'authenticated');
create policy "Admins can manage compliance checks" on compliance_checks for all using (auth.role() = 'authenticated');
create policy "Admins can manage AI enrichment tasks" on ai_enrichment_tasks for all using (auth.role() = 'authenticated');
create policy "Admins can manage extracted entities" on extracted_entities for all using (auth.role() = 'authenticated');
create policy "Admins can manage AI generated tags" on ai_generated_tags for all using (auth.role() = 'authenticated');
create policy "Admins can manage quality metrics" on quality_metrics for all using (auth.role() = 'authenticated');
create policy "Admins can manage quality thresholds" on quality_thresholds for all using (auth.role() = 'authenticated');
create policy "Admins can manage knowledge nodes" on knowledge_nodes for all using (auth.role() = 'authenticated');
create policy "Admins can manage knowledge edges" on knowledge_edges for all using (auth.role() = 'authenticated');
create policy "Admins can manage content embeddings" on content_embeddings for all using (auth.role() = 'authenticated');
create policy "Admins can manage search index metadata" on search_index_metadata for all using (auth.role() = 'authenticated');
create policy "Admins can manage user interactions" on user_interactions for all using (auth.role() = 'authenticated');
create policy "Admins can manage user preferences" on user_preferences for all using (auth.role() = 'authenticated');
create policy "Admins can manage recommendation cache" on recommendation_cache for all using (auth.role() = 'authenticated');
create policy "Admins can manage moderation queue" on moderation_queue for all using (auth.role() = 'authenticated');
create policy "Admins can manage moderation policies" on moderation_policies for all using (auth.role() = 'authenticated');
create policy "Admins can manage pipeline metrics" on pipeline_metrics for all using (auth.role() = 'authenticated');
create policy "Admins can manage queue health" on queue_health for all using (auth.role() = 'authenticated');

-- User-specific policies
create policy "Users can read their own interactions" on user_interactions for select using (auth.uid() = user_id);
create policy "Users can insert their own interactions" on user_interactions for insert with check (auth.uid() = user_id);
create policy "Users can read their own preferences" on user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert their own preferences" on user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update their own preferences" on user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read their own recommendations" on recommendation_cache for select using (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update timestamp trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply update triggers to relevant tables
create trigger update_content_sources_updated_at before update on content_sources
  for each row execute function update_updated_at_column();

create trigger update_discovery_rules_updated_at before update on discovery_rules
  for each row execute function update_updated_at_column();

create trigger update_content_acquisition_queue_updated_at before update on content_acquisition_queue
  for each row execute function update_updated_at_column();

create trigger update_acquisition_jobs_updated_at before update on acquisition_jobs
  for each row execute function update_updated_at_column();

create trigger update_content_hashes_updated_at before update on content_hashes
  for each row execute function update_updated_at_column();

create trigger update_content_clusters_updated_at before update on content_clusters
  for each row execute function update_updated_at_column();

create trigger update_license_registry_updated_at before update on license_registry
  for each row execute function update_updated_at_column();

create trigger update_quality_thresholds_updated_at before update on quality_thresholds
  for each row execute function update_updated_at_column();

create trigger update_knowledge_nodes_updated_at before update on knowledge_nodes
  for each row execute function update_updated_at_column();

create trigger update_knowledge_edges_updated_at before update on knowledge_edges
  for each row execute function update_updated_at_column();

create trigger update_content_embeddings_updated_at before update on content_embeddings
  for each row execute function update_updated_at_column();

create trigger update_user_preferences_updated_at before update on user_preferences
  for each row execute function update_updated_at_column();

create trigger update_moderation_queue_updated_at before update on moderation_queue
  for each row execute function update_updated_at_column();

create trigger update_moderation_policies_updated_at before update on moderation_policies
  for each row execute function update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default content sources
insert into content_sources (name, provider_type, base_url, api_endpoint, priority, is_active) values
('GitHub', 'github', 'https://github.com', 'https://api.github.com', 10, true),
('ArXiv', 'arxiv', 'https://arxiv.org', 'https://export.arxiv.org/api/query', 8, true),
('Kaggle', 'kaggle', 'https://kaggle.com', 'https://www.kaggle.com/api/v1', 7, true),
('HuggingFace', 'huggingface', 'https://huggingface.co', 'https://huggingface.co/api', 9, true),
('ProductHunt', 'producthunt', 'https://producthunt.com', 'https://api.producthunt.com/v2', 6, true)
on conflict (name) do nothing;

-- Insert default quality thresholds
insert into quality_thresholds (content_type, min_overall_score, auto_publish_threshold, manual_review_threshold, reject_threshold, factor_weights) values
('project', 0.5, 0.8, 0.5, 0.3, '{"completeness": 0.2, "documentation": 0.15, "activity": 0.2, "popularity": 0.15, "maintenance": 0.15, "originality": 0.1, "relevance": 0.05}'::jsonb),
('research_paper', 0.5, 0.75, 0.5, 0.3, '{"completeness": 0.25, "documentation": 0.2, "activity": 0.15, "popularity": 0.2, "maintenance": 0.0, "originality": 0.15, "relevance": 0.05}'::jsonb),
('dataset', 0.5, 0.75, 0.5, 0.3, '{"completeness": 0.25, "documentation": 0.25, "activity": 0.15, "popularity": 0.15, "maintenance": 0.1, "originality": 0.05, "relevance": 0.05}'::jsonb),
('learning_resource', 0.5, 0.8, 0.5, 0.3, '{"completeness": 0.2, "documentation": 0.2, "activity": 0.15, "popularity": 0.2, "maintenance": 0.1, "originality": 0.1, "relevance": 0.05}'::jsonb)
on conflict (content_type) do nothing;

-- Insert common open source licenses
insert into license_registry (spdx_id, name, is_osi_approved, can_commercially_use, can_modify, can_distribute, can_sublicense, requires_attribution, requires_same_license) values
('MIT', 'MIT License', true, true, true, true, true, true, false),
('Apache-2.0', 'Apache License 2.0', true, true, true, true, true, true, false),
('GPL-3.0', 'GNU General Public License v3.0', true, true, true, true, false, true, true),
('BSD-3-Clause', 'BSD 3-Clause "New" or "Revised" License', true, true, true, true, true, true, false),
('ISC', 'ISC License', true, true, true, true, true, true, false),
('MPL-2.0', 'Mozilla Public License 2.0', true, true, true, true, false, true, false),
('Unlicense', 'The Unlicense', true, true, true, true, true, false, false),
('CC-BY-4.0', 'Creative Commons Attribution 4.0', false, true, true, true, true, true, false),
('CC-BY-SA-4.0', 'Creative Commons Attribution-ShareAlike 4.0', false, true, true, true, false, true, true),
('CC0-1.0', 'Creative Commons Zero v1.0 Universal', false, true, true, true, true, false, false)
on conflict (spdx_id) do nothing;

-- Insert default moderation policies
insert into moderation_policies (policy_name, policy_type, description, rules, action, is_active) values
('spam_detection', 'spam', 'Detect and filter spam content', '{"keywords": ["buy now", "click here", "free money"], "threshold": 0.7}'::jsonb, 'flag_for_review', true),
('adult_content', 'adult', 'Detect adult content', '{"keywords": ["adult", "nsfw"], "threshold": 0.8}'::jsonb, 'auto_reject', true),
('quality_threshold', 'quality', 'Enforce minimum quality standards', '{"min_score": 0.3}'::jsonb, 'flag_for_review', true)
on conflict (policy_name) do nothing;

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table content_sources is 'Configuration for content sources (GitHub, ArXiv, etc.)';
comment on table discovery_rules is 'Rules for discovering content from sources';
comment on table discovered_content is 'Content discovered from sources but not yet queued';
comment on table content_acquisition_queue is 'Main queue for content acquisition pipeline';
comment on table acquisition_jobs is 'Individual jobs within the acquisition pipeline';
comment on table content_hashes is 'Registry of content hashes for duplicate detection';
comment on table content_clusters is 'Clusters of similar content';
comment on table content_cluster_members is 'Membership of content in similarity clusters';
comment on table license_registry is 'Registry of software licenses with compliance info';
comment on table compliance_checks is 'Compliance checks performed on content';
comment on table ai_enrichment_tasks is 'AI-powered enrichment tasks';
comment on table extracted_entities is 'Entities extracted from content by AI';
comment on table ai_generated_tags is 'Tags generated by AI for content';
comment on table quality_metrics is 'Quality scores and factors for content';
comment on table quality_thresholds is 'Quality thresholds by content type';
comment on table knowledge_nodes is 'Nodes in the knowledge graph';
comment on table knowledge_edges is 'Edges (relationships) in the knowledge graph';
comment on table content_embeddings is 'Vector embeddings for semantic search';
comment on table search_index_metadata is 'Metadata for search indexing';
comment on table user_interactions is 'User interactions with content for recommendations';
comment on table user_preferences is 'User preferences for personalized recommendations';
comment on table recommendation_cache is 'Cached recommendations';
comment on table moderation_queue is 'Queue for content moderation';
comment on table moderation_policies is 'Policies for automated moderation';
comment on table pipeline_metrics is 'Performance metrics for the pipeline';
comment on table queue_health is 'Health monitoring for queues';
