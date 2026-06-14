-- Phase E11: Autonomous Discovery Engine
-- Additive migration to enable autonomous discovery from multiple sources

-- Create discovery_sources table
CREATE TABLE IF NOT EXISTS discovery_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL UNIQUE CHECK (source IN ('github', 'gitlab', 'arxiv', 'kaggle', 'huggingface', 'devpost', 'hack2skill', 'unstop')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_synced TIMESTAMPTZ,
  sync_interval TEXT NOT NULL DEFAULT '1h',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_sources_source ON discovery_sources(source);
CREATE INDEX IF NOT EXISTS idx_discovery_sources_enabled ON discovery_sources(enabled);

-- Create discovery_items table
CREATE TABLE IF NOT EXISTS discovery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('github', 'gitlab', 'arxiv', 'kaggle', 'huggingface', 'devpost', 'hack2skill', 'unstop')),
  source_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('project', 'research', 'dataset', 'hackathon')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('discovered', 'analyzed', 'deduplicated', 'scored', 'queued', 'approved', 'published', 'rejected')),
  score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  metadata JSONB DEFAULT '{}'::JSONB,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  analyzed_at TIMESTAMPTZ,
  deduplicated_at TIMESTAMPTZ,
  scored_at TIMESTAMPTZ,
  queued_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_discovery_items_source ON discovery_items(source);
CREATE INDEX IF NOT EXISTS idx_discovery_items_source_id ON discovery_items(source_id);
CREATE INDEX IF NOT EXISTS idx_discovery_items_type ON discovery_items(type);
CREATE INDEX IF NOT EXISTS idx_discovery_items_status ON discovery_items(status);
CREATE INDEX IF NOT EXISTS idx_discovery_items_score ON discovery_items(score DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_items_discovered_at ON discovery_items(discovered_at DESC);

-- Create discovery_pipelines table
CREATE TABLE IF NOT EXISTS discovery_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('github', 'gitlab', 'arxiv', 'kaggle', 'huggingface', 'devpost', 'hack2skill', 'unstop')),
  pipeline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  items_discovered INTEGER NOT NULL DEFAULT 0,
  items_processed INTEGER NOT NULL DEFAULT 0,
  items_published INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source, pipeline)
);

CREATE INDEX IF NOT EXISTS idx_discovery_pipelines_source ON discovery_pipelines(source);
CREATE INDEX IF NOT EXISTS idx_discovery_pipelines_status ON discovery_pipelines(status);

-- RPC function to get discovery items by status
CREATE OR REPLACE FUNCTION get_discovery_items_by_status(status_param TEXT DEFAULT 'discovered', limit_param INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  source TEXT,
  source_id TEXT,
  type TEXT,
  title TEXT,
  description TEXT,
  url TEXT,
  status TEXT,
  score NUMERIC,
  discovered_at TIMESTAMPTZ
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    di.id,
    di.source,
    di.source_id,
    di.type,
    di.title,
    di.description,
    di.url,
    di.status,
    di.score,
    di.discovered_at
  FROM discovery_items di
  WHERE di.status = status_param
  ORDER BY di.discovered_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get discovery items by source
CREATE OR REPLACE FUNCTION get_discovery_items_by_source(source_param TEXT, limit_param INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  source TEXT,
  source_id TEXT,
  type TEXT,
  title TEXT,
  description TEXT,
  url TEXT,
  status TEXT,
  score NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    di.id,
    di.source,
    di.source_id,
    di.type,
    di.title,
    di.description,
    di.url,
    di.status,
    di.score
  FROM discovery_items di
  WHERE di.source = source_param
  ORDER BY di.discovered_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get discovery statistics
CREATE OR REPLACE FUNCTION get_discovery_statistics()
RETURNS TABLE(
  total_discovered INTEGER,
  total_analyzed INTEGER,
  total_deduplicated INTEGER,
  total_scored INTEGER,
  total_queued INTEGER,
  total_approved INTEGER,
  total_published INTEGER,
  total_rejected INTEGER,
  avg_score NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'discovered') AS total_discovered,
    COUNT(*) FILTER (WHERE status = 'analyzed') AS total_analyzed,
    COUNT(*) FILTER (WHERE status = 'deduplicated') AS total_deduplicated,
    COUNT(*) FILTER (WHERE status = 'scored') AS total_scored,
    COUNT(*) FILTER (WHERE status = 'queued') AS total_queued,
    COUNT(*) FILTER (WHERE status = 'approved') AS total_approved,
    COUNT(*) FILTER (WHERE status = 'published') AS total_published,
    COUNT(*) FILTER (WHERE status = 'rejected') AS total_rejected,
    AVG(score) AS avg_score
  FROM discovery_items;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get pipeline statistics
CREATE OR REPLACE FUNCTION get_pipeline_statistics(source_param TEXT DEFAULT NULL)
RETURNS TABLE(
  source TEXT,
  pipeline TEXT,
  status TEXT,
  items_discovered INTEGER,
  items_processed INTEGER,
  items_published INTEGER,
  error_count INTEGER,
  success_rate NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.source,
    dp.pipeline,
    dp.status,
    dp.items_discovered,
    dp.items_processed,
    dp.items_published,
    dp.error_count,
    CASE 
      WHEN dp.items_discovered > 0 
      THEN (dp.items_published::NUMERIC / dp.items_discovered::NUMERIC) * 100 
      ELSE 0 
    END AS success_rate
  FROM discovery_pipelines dp
  WHERE (source_param IS NULL OR dp.source = source_param)
  ORDER BY dp.items_discovered DESC;
END;
$$ LANGUAGE plpgsql;

-- RPC function to initialize discovery sources
CREATE OR REPLACE FUNCTION initialize_discovery_sources()
RETURNS VOID
AS $$
BEGIN
  INSERT INTO discovery_sources (source, name, url, enabled, sync_interval)
  VALUES 
    ('github', 'GitHub', 'https://github.com', true, '1h'),
    ('gitlab', 'GitLab', 'https://gitlab.com', true, '1h'),
    ('arxiv', 'arXiv', 'https://arxiv.org', true, '1d'),
    ('kaggle', 'Kaggle', 'https://kaggle.com', true, '1d'),
    ('huggingface', 'Hugging Face', 'https://huggingface.co', true, '1d'),
    ('devpost', 'Devpost', 'https://devpost.com', true, '1d'),
    ('hack2skill', 'Hack2Skill', 'https://hack2skill.com', true, '1d'),
    ('unstop', 'Unstop', 'https://unstop.com', true, '1d')
  ON CONFLICT (source) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- RPC function to update discovery pipeline
CREATE OR REPLACE FUNCTION update_discovery_pipeline(
  source_param TEXT,
  pipeline_param TEXT,
  items_discovered_param INTEGER DEFAULT 0,
  items_processed_param INTEGER DEFAULT 0,
  items_published_param INTEGER DEFAULT 0,
  error_count_param INTEGER DEFAULT 0
)
RETURNS VOID
AS $$
BEGIN
  INSERT INTO discovery_pipelines (
    source,
    pipeline,
    status,
    last_run,
    next_run,
    items_discovered,
    items_processed,
    items_published,
    error_count
  )
  VALUES (
    source_param,
    pipeline_param,
    'active',
    now(),
    now() + INTERVAL '1 hour',
    items_discovered_param,
    items_processed_param,
    items_published_param,
    error_count_param
  )
  ON CONFLICT (source, pipeline) 
  DO UPDATE SET
    last_run = now(),
    next_run = now() + INTERVAL '1 hour',
    items_discovered = discovery_pipelines.items_discovered + items_discovered_param,
    items_processed = discovery_pipelines.items_processed + items_processed_param,
    items_published = discovery_pipelines.items_published + items_published_param,
    error_count = discovery_pipelines.error_count + error_count_param,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE discovery_sources IS 'Stores configuration for autonomous discovery sources';
COMMENT ON TABLE discovery_items IS 'Stores items discovered from various sources through the discovery pipeline';
COMMENT ON TABLE discovery_pipelines IS 'Stores pipeline statistics for each discovery source';
COMMENT ON FUNCTION get_discovery_items_by_status IS 'Get discovery items filtered by status';
COMMENT ON FUNCTION get_discovery_items_by_source IS 'Get discovery items filtered by source';
COMMENT ON FUNCTION get_discovery_statistics IS 'Get overall discovery statistics';
COMMENT ON FUNCTION get_pipeline_statistics IS 'Get pipeline statistics for discovery sources';
COMMENT ON FUNCTION initialize_discovery_sources IS 'Initialize default discovery sources';
COMMENT ON FUNCTION update_discovery_pipeline IS 'Update discovery pipeline statistics';
