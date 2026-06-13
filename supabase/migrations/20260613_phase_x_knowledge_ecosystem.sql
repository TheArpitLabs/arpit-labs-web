-- Phase X: AI-Powered Engineering Knowledge Ecosystem
-- Additive migration only. Existing auth, project, creator, admin, marketplace,
-- research, community, analytics, contributor, and tag tables are left intact.

CREATE TABLE IF NOT EXISTS content_acquisition_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('github','gitlab','devpost','kaggle','huggingface','arxiv','research_paper')),
  external_id TEXT,
  source_url TEXT NOT NULL,
  repository_url TEXT,
  screenshot_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  raw_content TEXT,
  content_hash TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','analyzing','approved','rejected','imported','duplicate','failed')),
  duplicate_signals JSONB NOT NULL DEFAULT '[]'::JSONB,
  analysis JSONB NOT NULL DEFAULT '{}'::JSONB,
  quality_score INT CHECK (quality_score BETWEEN 0 AND 100),
  trust_score INT CHECK (trust_score BETWEEN 0 AND 100),
  scheduled_for TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  imported_entity_type TEXT,
  imported_entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acquisition_provider_status ON content_acquisition_queue(provider, status);
CREATE INDEX IF NOT EXISTS idx_acquisition_repository_url ON content_acquisition_queue(repository_url);
CREATE INDEX IF NOT EXISTS idx_acquisition_external_id ON content_acquisition_queue(provider, external_id);
CREATE INDEX IF NOT EXISTS idx_acquisition_content_hash ON content_acquisition_queue(content_hash);
CREATE INDEX IF NOT EXISTS idx_acquisition_created_at ON content_acquisition_queue(created_at DESC);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project','research','dataset','api','contributor','organization')),
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_type TEXT NOT NULL,
  from_id UUID NOT NULL,
  to_type TEXT NOT NULL,
  to_id UUID NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('uses_paper','uses_dataset','built_by','uses_api','belongs_to','related_to')),
  weight NUMERIC(6,5) NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_type, from_id, to_type, to_id, relationship)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_edges_from ON knowledge_edges(from_type, from_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_to ON knowledge_edges(to_type, to_id);

CREATE TABLE IF NOT EXISTS recommendation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  score NUMERIC(6,5) NOT NULL DEFAULT 0,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_links_source ON recommendation_links(source_type, source_id, score DESC);

CREATE TABLE IF NOT EXISTS semantic_search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('keyword','vector','hybrid')),
  result_count INT NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trend_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL CHECK (topic IN ('AI Agents','MCP','Robotics','IoT','Cybersecurity','Edge AI')),
  growth NUMERIC(8,4) NOT NULL DEFAULT 0,
  velocity NUMERIC(8,4) NOT NULL DEFAULT 0,
  popularity NUMERIC(8,4) NOT NULL DEFAULT 0,
  signal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic, signal_date)
);

CREATE TABLE IF NOT EXISTS ai_review_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('broken_link','spam','plagiarism','missing_docs','low_quality')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','ignored','resolved')),
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS generated_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('project_banner','social_card','cover_image','preview_asset')),
  asset_url TEXT,
  prompt TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','generated','approved','rejected','failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hackathon_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT,
  title TEXT NOT NULL,
  organizer TEXT,
  themes TEXT[] NOT NULL DEFAULT '{}',
  winning_projects JSONB NOT NULL DEFAULT '[]'::JSONB,
  teams JSONB NOT NULL DEFAULT '[]'::JSONB,
  event_date DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contributor_identity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID,
  provider TEXT NOT NULL CHECK (provider IN ('github','devpost','linkedin','kaggle','huggingface')),
  provider_user_id TEXT,
  profile_url TEXT NOT NULL,
  confidence NUMERIC(6,5) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, profile_url)
);

CREATE TABLE IF NOT EXISTS collaboration_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL CHECK (audience IN ('students','researchers','startups','companies')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','closed')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_observability_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug','info','warning','error','critical')),
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  duration_ms INT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_observability_service_created ON platform_observability_events(service, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_review_status ON ai_review_findings(status, severity);
CREATE INDEX IF NOT EXISTS idx_collaboration_status ON collaboration_opportunities(status, audience);

ALTER TABLE content_acquisition_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_review_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributor_identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_observability_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published knowledge nodes" ON knowledge_nodes FOR SELECT USING (true);
CREATE POLICY "Public can read knowledge edges" ON knowledge_edges FOR SELECT USING (true);
CREATE POLICY "Public can read recommendations" ON recommendation_links FOR SELECT USING (true);
CREATE POLICY "Public can read trend signals" ON trend_signals FOR SELECT USING (true);
CREATE POLICY "Public can read learning paths" ON learning_paths FOR SELECT USING (true);
CREATE POLICY "Public can read hackathon intelligence" ON hackathon_intelligence FOR SELECT USING (true);
CREATE POLICY "Public can read open collaboration opportunities" ON collaboration_opportunities FOR SELECT USING (status = 'open');

-- Mutations are performed by server-side service-role clients and existing admin auth checks.
