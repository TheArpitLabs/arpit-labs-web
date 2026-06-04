-- Phase 7B: Production-grade Vector Search (pgvector + content_embeddings)
-- Created: June 5, 2026

-- Enable pgvector extension (requires admin privileges)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create content_embeddings table
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(100) NOT NULL,
  content_id UUID,
  title TEXT,
  chunk TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast similarity filtering
CREATE INDEX IF NOT EXISTS idx_content_embeddings_content_type ON content_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_created_at ON content_embeddings(created_at);

-- RPC: Search content_embeddings using a query embedding
CREATE OR REPLACE FUNCTION search_content_embeddings(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE(
  id UUID,
  content_type VARCHAR,
  content_id UUID,
  title TEXT,
  chunk TEXT,
  similarity FLOAT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.content_type,
    ce.content_id,
    ce.title,
    ce.chunk,
    1 - (ce.embedding <#> query_embedding) AS similarity,
    ce.metadata,
    ce.created_at
  FROM content_embeddings ce
  WHERE (1 - (ce.embedding <#> query_embedding)) > similarity_threshold
  ORDER BY ce.embedding <#> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
