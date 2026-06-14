-- E12 — RESEARCH INTELLIGENCE ENGINE
-- Additive migration - never modifies existing tables destructively

-- ============================================
-- RESEARCH PAPERS TABLE
-- ============================================
create table if not exists research_papers (
  id uuid primary key default gen_random_uuid(),
  external_id text, -- arXiv ID, DOI, etc.
  source text not null, -- arxiv, semantic_scholar, pubmed, etc.
  
  -- Basic Info
  title text not null,
  abstract text,
  authors text[] default array[]::text[],
  affiliations text[] default array[]::text[],
  
  -- Publication
  venue text, -- Journal, Conference, etc.
  year integer,
  volume text,
  issue text,
  pages text,
  doi text,
  isbn text,
  
  -- Content
  full_text text,
  pdf_url text,
  code_url text,
  data_url text,
  supplementary_materials text[] default array[]::text[],
  
  -- Metrics
  citation_count integer not null default 0,
  reference_count integer not null default 0,
  view_count integer not null default 0,
  download_count integer not null default 0,
  h_index integer not null default 0,
  i10_index integer not null default 0,
  
  -- Classification
  categories text[] default array[]::text[],
  keywords text[] default array[]::text[],
  research_fields text[] default array[]::text[],
  topics text[] default array[]::text[],
  
  -- Dates
  published_date timestamptz,
  updated_date timestamptz,
  indexed_at timestamptz not null default now(),
  
  -- Processing
  processing_status text not null default 'pending', -- pending, processing, completed, failed
  processed_at timestamptz,
  
  -- Quality
  quality_score numeric, -- 0-100
  impact_score numeric, -- 0-100
  novelty_score numeric, -- 0-100
  
  -- Metadata
  paper_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(source, external_id)
);

-- ============================================
-- RESEARCH CITATIONS TABLE
-- ============================================
create table if not exists research_citations (
  id uuid primary key default gen_random_uuid(),
  citing_paper_id uuid not null references research_papers(id) on delete cascade,
  cited_paper_id uuid not null references research_papers(id) on delete cascade,
  citation_context text,
  citation_type text, -- background, method, result, comparison
  citation_strength numeric, -- 0-1
  created_at timestamptz not null default now(),
  unique(citing_paper_id, cited_paper_id)
);

-- ============================================
-- RESEARCH REFERENCES TABLE
-- ============================================
create table if not exists research_references (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references research_papers(id) on delete cascade,
  reference_text text not null,
  reference_doi text,
  reference_title text,
  reference_authors text[] default array[]::text[],
  reference_year integer,
  reference_venue text,
  is_linked boolean not null default false,
  linked_paper_id uuid references research_papers(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- RESEARCH SUMMARIES TABLE
-- ============================================
create table if not exists research_summaries (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references research_papers(id) on delete cascade,
  summary_type text not null, -- abstract, executive, technical, simplified
  summary_text text not null,
  key_points text[] default array[]::text[],
  methodology_summary text,
  results_summary text,
  conclusions_summary text,
  limitations text,
  future_work text,
  
  -- Generation
  generated_by text not null, -- ai, human, hybrid
  generated_at timestamptz not null default now(),
  model_version text,
  
  -- Quality
  quality_score numeric, -- 0-100
  accuracy_score numeric, -- 0-100
  completeness_score numeric, -- 0-100
  
  -- Review
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_status text not null default 'pending', -- pending, approved, rejected
  review_comments text,
  
  -- Metadata
  summary_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(paper_id, summary_type)
);

-- ============================================
-- RESEARCH SIMILARITY TABLE
-- ============================================
create table if not exists research_similarity (
  id uuid primary key default gen_random_uuid(),
  paper1_id uuid not null references research_papers(id) on delete cascade,
  paper2_id uuid not null references research_papers(id) on delete cascade,
  
  -- Similarity Scores
  title_similarity numeric not null default 0, -- 0-1
  abstract_similarity numeric not null default 0, -- 0-1
  content_similarity numeric not null default 0, -- 0-1
  citation_similarity numeric not null default 0, -- 0-1
  author_similarity numeric not null default 0, -- 0-1
  topic_similarity numeric not null default 0, -- 0-1
  overall_similarity numeric not null default 0, -- 0-1
  
  -- Similarity Type
  similarity_type text not null, -- semantic, citation, author, topic, hybrid
  
  -- Metadata
  similarity_data jsonb,
  
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  
  -- Ensure uniqueness and prevent self-similarity
  check (paper1_id < paper2_id),
  unique(paper1_id, paper2_id, similarity_type)
);

-- ============================================
-- RESEARCH RECOMMENDATIONS TABLE
-- ============================================
create table if not exists research_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- References profiles.id
  paper_id uuid not null references research_papers(id) on delete cascade,
  recommendation_type text not null, -- similar, trending, cited_by, cites, author, topic
  recommendation_score numeric not null, -- 0-100
  recommendation_reason text,
  
  -- Context
  context jsonb,
  
  -- Interaction
  viewed_at timestamptz,
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
-- RESEARCH GRAPHS TABLE
-- ============================================
create table if not exists research_graphs (
  id uuid primary key default gen_random_uuid(),
  graph_type text not null, -- citation, collaboration, topic, keyword, hybrid
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
-- RESEARCH TOPICS TABLE
-- ============================================
create table if not exists research_topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  parent_topic_id uuid references research_topics(id) on delete cascade,
  
  -- Topic Metrics
  paper_count integer not null default 0,
  citation_count integer not null default 0,
  author_count integer not null default 0,
  
  -- Topic Evolution
  emergence_date timestamptz,
  peak_date timestamptz,
  decline_date timestamptz,
  trend_score numeric, -- 0-100
  
  -- Classification
  category text,
  subcategories text[] default array[]::text[],
  related_topics text[] default array[]::text[],
  keywords text[] default array[]::text[],
  
  -- Metadata
  topic_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- RESEARCH AUTHORS TABLE
-- ============================================
create table if not exists research_authors (
  id uuid primary key default gen_random_uuid(),
  external_id text, -- ORCID, etc.
  source text not null,
  
  -- Basic Info
  name text not null,
  affiliation text,
  email text,
  website_url text,
  
  -- Metrics
  h_index integer not null default 0,
  i10_index integer not null default 0,
  total_citations integer not null default 0,
  total_papers integer not null default 0,
  
  -- Research Areas
  research_interests text[] default array[]::text[],
  topics text[] default array[]::text[],
  
  -- Collaboration
  co_authors text[] default array[]::text[],
  institutions text[] default array[]::text[],
  
  -- Metadata
  author_data jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(source, external_id)
);

-- ============================================
-- RESEARCH PAPER AUTHORS TABLE
-- ============================================
create table if not exists research_paper_authors (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references research_papers(id) on delete cascade,
  author_id uuid references research_authors(id) on delete cascade,
  author_name text not null,
  author_order integer not null,
  is_corresponding boolean not null default false,
  affiliation text,
  created_at timestamptz not null default now(),
  unique(paper_id, author_order)
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_research_papers_source on research_papers(source);
create index if not exists idx_research_papers_external on research_papers(external_id);
create index if not exists idx_research_papers_status on research_papers(processing_status);
create index if not exists idx_research_papers_year on research_papers(year);
create index if not exists idx_research_papers_quality on research_papers(quality_score desc);
create index if not exists idx_research_papers_impact on research_papers(impact_score desc);
create index if not exists idx_research_papers_categories on research_papers using gin(categories);
create index if not exists idx_research_papers_keywords on research_papers using gin(keywords);

create index if not exists idx_research_citations_citing on research_citations(citing_paper_id);
create index if not exists idx_research_citations_cited on research_citations(cited_paper_id);

create index if not exists idx_research_references_paper on research_references(paper_id);
create index if not exists idx_research_references_linked on research_references(linked_paper_id);

create index if not exists idx_research_summaries_paper on research_summaries(paper_id);
create index if not exists idx_research_summaries_type on research_summaries(summary_type);
create index if not exists idx_research_summaries_status on research_summaries(review_status);

create index if not exists idx_research_similarity_paper1 on research_similarity(paper1_id);
create index if not exists idx_research_similarity_paper2 on research_similarity(paper2_id);
create index if not exists idx_research_similarity_overall on research_similarity(overall_similarity desc);

create index if not exists idx_research_recommendations_user on research_recommendations(user_id);
create index if not exists idx_research_recommendations_paper on research_recommendations(paper_id);
create index if not exists idx_research_recommendations_score on research_recommendations(recommendation_score desc);
create index if not exists idx_research_recommendations_type on research_recommendations(recommendation_type);

create index if not exists idx_research_graphs_type on research_graphs(graph_type);

create index if not exists idx_research_topics_parent on research_topics(parent_topic_id);
create index if not exists idx_research_topics_trend on research_topics(trend_score desc);

create index if not exists idx_research_authors_source on research_authors(source);
create index if not exists idx_research_authors_external on research_authors(external_id);
create index if not exists idx_research_authors_hindex on research_authors(h_index desc);

create index if not exists idx_research_paper_authors_paper on research_paper_authors(paper_id);
create index if not exists idx_research_paper_authors_author on research_paper_authors(author_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
alter table research_papers enable row level security;
alter table research_citations enable row level security;
alter table research_references enable row level security;
alter table research_summaries enable row level security;
alter table research_similarity enable row level security;
alter table research_recommendations enable row level security;
alter table research_graphs enable row level security;
alter table research_topics enable row level security;
alter table research_authors enable row level security;
alter table research_paper_authors enable row level security;

-- Public read access
create policy "Public can view research papers" on research_papers for select using (processing_status = 'completed');
create policy "Public can view research summaries" on research_summaries for select using (review_status = 'approved');
create policy "Public can view research graphs" on research_graphs for select using (true);
create policy "Public can view research topics" on research_topics for select using (true);
create policy "Public can view research authors" on research_authors for select using (true);

-- Admin full access
create policy "Admins can manage research papers" on research_papers for all using (auth.role() = 'authenticated');
create policy "Admins can manage research citations" on research_citations for all using (auth.role() = 'authenticated');
create policy "Admins can manage research references" on research_references for all using (auth.role() = 'authenticated');
create policy "Admins can manage research summaries" on research_summaries for all using (auth.role() = 'authenticated');
create policy "Admins can manage research similarity" on research_similarity for all using (auth.role() = 'authenticated');
create policy "Admins can manage research recommendations" on research_recommendations for all using (auth.role() = 'authenticated');
create policy "Admins can manage research graphs" on research_graphs for all using (auth.role() = 'authenticated');
create policy "Admins can manage research topics" on research_topics for all using (auth.role() = 'authenticated');
create policy "Admins can manage research authors" on research_authors for all using (auth.role() = 'authenticated');
create policy "Admins can manage research paper authors" on research_paper_authors for all using (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
create trigger update_research_papers_updated_at before update on research_papers
  for each row execute function update_updated_at_column();

create trigger update_research_summaries_updated_at before update on research_summaries
  for each row execute function update_updated_at_column();

create trigger update_research_graphs_updated_at before update on research_graphs
  for each row execute function update_updated_at_column();

create trigger update_research_topics_updated_at before update on research_topics
  for each row execute function update_updated_at_column();

create trigger update_research_authors_updated_at before update on research_authors
  for each row execute function update_updated_at_column();
