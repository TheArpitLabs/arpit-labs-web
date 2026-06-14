-- Phase E4: Semantic Search Engine
-- Additive migration to enhance search capabilities with pgvector

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create search_queries table for analytics
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('keyword', 'vector', 'fulltext', 'hybrid')),
  result_count INTEGER NOT NULL DEFAULT 0,
  avg_score NUMERIC(5,4),
  execution_time INTEGER NOT NULL, -- in milliseconds
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  filters JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_search_queries_timestamp ON search_queries(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_mode ON search_queries(mode);

-- Create search_clicks table for tracking user interactions
CREATE TABLE IF NOT EXISTS search_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID REFERENCES search_queries(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  position INTEGER NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID
);

CREATE INDEX IF NOT EXISTS idx_search_clicks_query_id ON search_clicks(query_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_entity ON search_clicks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_clicks_user_id ON search_clicks(user_id);

-- Create search_history table for user search history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::JSONB,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history USING GIN(to_tsvector('english', query));

-- Create project_embeddings table for vector search
CREATE TABLE IF NOT EXISTS project_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL,
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  content_type TEXT NOT NULL, -- 'title', 'description', 'overview', 'architecture'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_embeddings_project_id ON project_embeddings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_embeddings_content_type ON project_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_project_embeddings_embedding ON project_embeddings USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Create research_embeddings table for research papers
CREATE TABLE IF NOT EXISTS research_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL REFERENCES research(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL,
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  content_type TEXT NOT NULL, -- 'title', 'abstract', 'content', 'keywords'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_embeddings_research_id ON research_embeddings(research_id);
CREATE INDEX IF NOT EXISTS idx_research_embeddings_content_type ON research_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_research_embeddings_embedding ON research_embeddings USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Create resource_embeddings table for resources
CREATE TABLE IF NOT EXISTS resource_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  embedding VECTOR(1536) NOT NULL,
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  content_type TEXT NOT NULL, -- 'title', 'description', 'content'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_embeddings_resource_id ON resource_embeddings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_embeddings_content_type ON resource_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_resource_embeddings_embedding ON resource_embeddings USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- RPC function for hybrid project search
CREATE OR REPLACE FUNCTION search_projects_hybrid(
  search_query TEXT,
  search_mode TEXT DEFAULT 'hybrid',
  search_limit INTEGER DEFAULT 10,
  search_offset INTEGER DEFAULT 0,
  filter_technology TEXT[] DEFAULT NULL,
  filter_domain TEXT[] DEFAULT NULL,
  filter_difficulty TEXT[] DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  score NUMERIC,
  relevance_score NUMERIC,
  popularity_score NUMERIC,
  quality_score NUMERIC,
  domain TEXT[],
  difficulty TEXT,
  tech_stack TEXT[]
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    0.7::NUMERIC as score, -- Placeholder for actual hybrid scoring
    0.7::NUMERIC as relevance_score,
    LEAST(p.stars::NUMERIC / 1000, 1.0) as popularity_score,
    0.5::NUMERIC as quality_score,
    ARRAY[p.domain] as domain,
    p.difficulty,
    p.tech_stack
  FROM projects p
  WHERE 
    p.published = true
    AND (filter_technology IS NULL OR p.tech_stack && filter_technology)
    AND (filter_domain IS NULL OR p.domain = ANY(filter_domain))
    AND (filter_difficulty IS NULL OR p.difficulty = ANY(filter_difficulty))
  ORDER BY p.stars DESC
  LIMIT search_limit OFFSET search_offset;
END;
$$ LANGUAGE plpgsql;

-- RPC function for vector similarity search on projects
CREATE OR REPLACE FUNCTION search_projects_vector(
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT DEFAULT 0.3,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  similarity FLOAT,
  domain TEXT[],
  difficulty TEXT,
  tech_stack TEXT[]
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    1 - (pe.embedding <#> query_embedding) AS similarity,
    ARRAY[p.domain] as domain,
    p.difficulty,
    p.tech_stack
  FROM projects p
  INNER JOIN project_embeddings pe ON p.id = pe.project_id
  WHERE pe.content_type = 'overview'
    AND (1 - (pe.embedding <#> query_embedding)) > similarity_threshold
  ORDER BY pe.embedding <#> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- RPC function for full text search on projects
CREATE OR REPLACE FUNCTION search_projects_fulltext(
  search_query TEXT,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  rank REAL,
  domain TEXT[],
  difficulty TEXT,
  tech_stack TEXT[]
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    ts_rank(p.title_search_vector, to_tsquery('english', search_query)) as rank,
    ARRAY[p.domain] as domain,
    p.difficulty,
    p.tech_stack
  FROM projects p
  WHERE 
    p.published = true
    AND (p.title_search_vector @@ to_tsquery('english', search_query)
         OR p.description_search_vector @@ to_tsquery('english', search_query))
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Add search vector columns to projects table if they don't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS title_search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED,
ADD COLUMN IF NOT EXISTS description_search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(description, ''))) STORED;

-- Create GIN indexes for full text search
CREATE INDEX IF NOT EXISTS idx_projects_title_search ON projects USING GIN(title_search_vector);
CREATE INDEX IF NOT EXISTS idx_projects_description_search ON projects USING GIN(description_search_vector);

-- Add comments for documentation
COMMENT ON TABLE search_queries IS 'Stores search query analytics and performance metrics';
COMMENT ON TABLE search_clicks IS 'Tracks user click interactions with search results';
COMMENT ON TABLE search_history IS 'Stores user search history for autocomplete and recent searches';
COMMENT ON TABLE project_embeddings IS 'Stores vector embeddings for project content for semantic search';
COMMENT ON TABLE research_embeddings IS 'Stores vector embeddings for research papers for semantic search';
COMMENT ON TABLE resource_embeddings IS 'Stores vector embeddings for resources for semantic search';

COMMENT ON FUNCTION search_projects_hybrid IS 'Hybrid search combining keyword, vector, and full-text search';
COMMENT ON FUNCTION search_projects_vector IS 'Vector similarity search using pgvector';
COMMENT ON FUNCTION search_projects_fulltext IS 'PostgreSQL full-text search on projects';
