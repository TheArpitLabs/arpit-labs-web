-- Phase E5: Recommendation Engine
-- Additive migration to enable AI-powered recommendations

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL,
  source_entity_type TEXT NOT NULL CHECK (source_entity_type IN ('project', 'research', 'resource', 'dataset', 'contributor', 'organization')),
  target_entity_id UUID NOT NULL,
  target_entity_type TEXT NOT NULL CHECK (target_entity_type IN ('project', 'research', 'resource', 'dataset', 'contributor', 'organization')),
  relevance_score NUMERIC(5,2) NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
  factors JSONB DEFAULT '{}'::JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_source ON recommendations(source_entity_id, source_entity_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_target ON recommendations(target_entity_id, target_entity_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON recommendations(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_generated_at ON recommendations(generated_at DESC);

-- Create recommendation_scores table for detailed scoring
CREATE TABLE IF NOT EXISTS recommendation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL,
  target_entity_id UUID NOT NULL,
  semantic_similarity NUMERIC(5,4),
  shared_technologies NUMERIC(5,4),
  shared_domains NUMERIC(5,4),
  shared_contributors NUMERIC(5,4),
  shared_datasets NUMERIC(5,4),
  overall_score NUMERIC(5,2),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_scores_source ON recommendation_scores(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_target ON recommendation_scores(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_overall ON recommendation_scores(overall_score DESC);

-- Create recommendation_cache table for caching recommendations
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'research', 'resource', 'dataset', 'contributor', 'organization')),
  recommendations JSONB NOT NULL DEFAULT '[]'::JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_cache_entity ON recommendation_cache(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expires_at ON recommendation_cache(expires_at);

-- RPC function to get project recommendations
CREATE OR REPLACE FUNCTION get_project_recommendations(
  project_id UUID,
  limit_count INTEGER DEFAULT 5,
  min_score NUMERIC DEFAULT 30
)
RETURNS TABLE(
  id UUID,
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  description TEXT,
  url TEXT,
  relevance_score NUMERIC,
  factors JSONB
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.target_entity_type as entity_type,
    r.target_entity_id as entity_id,
    COALESCE(p.title, res.title, d.title, c.name, o.name) as title,
    COALESCE(p.description, res.description, d.description, c.description, o.description) as description,
    COALESCE('/projects/' || p.slug, '/research/' || res.slug, '/resources/' || res.slug, '/datasets/' || d.slug, '/contributors/' || c.name, '/organizations/' || o.slug) as url,
    r.relevance_score,
    r.factors
  FROM recommendations r
  LEFT JOIN projects p ON r.target_entity_id = p.id AND r.target_entity_type = 'project'
  LEFT JOIN research res ON r.target_entity_id = res.id AND r.target_entity_type = 'research'
  LEFT JOIN resources res2 ON r.target_entity_id = res2.id AND r.target_entity_type = 'resource'
  LEFT JOIN datasets d ON r.target_entity_id = d.id AND r.target_entity_type = 'dataset'
  LEFT JOIN contributors c ON r.target_entity_id = c.id AND r.target_entity_type = 'contributor'
  LEFT JOIN organizations o ON r.target_entity_id = o.id AND r.target_entity_type = 'organization'
  WHERE r.source_entity_id = project_id
    AND r.source_entity_type = 'project'
    AND r.relevance_score >= min_score
  ORDER BY r.relevance_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- RPC function to refresh recommendations for a project
CREATE OR REPLACE FUNCTION refresh_project_recommendations(project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  refreshed_count INTEGER;
BEGIN
  -- Delete existing recommendations
  DELETE FROM recommendations WHERE source_entity_id = project_id AND source_entity_type = 'project';
  
  -- Get refreshed count (this would be called by the application logic)
  refreshed_count := 0;
  
  RETURN refreshed_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE recommendations IS 'Stores AI-powered recommendations between entities';
COMMENT ON TABLE recommendation_scores IS 'Stores detailed scoring factors for recommendations';
COMMENT ON TABLE recommendation_cache IS 'Caches recommendation results to improve performance';

COMMENT ON FUNCTION get_project_recommendations IS 'Get recommendations for a project with scoring';
COMMENT ON FUNCTION refresh_project_recommendations IS 'Refresh recommendations for a project';
