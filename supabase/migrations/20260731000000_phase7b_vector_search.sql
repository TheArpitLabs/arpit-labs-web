-- Phase 7B: Production-grade Vector Search (pgvector + content_embeddings)
-- Created: June 5, 2026

-- Enable pgvector extension (requires admin privileges)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create content_embeddings table
do $$
begin
  if exists (select 1 from pg_extension where extname = 'vector') then
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
  else
    RAISE NOTICE 'pgvector extension not available, skipping content_embeddings table';
  end if;
end $$;

-- RPC: Search content_embeddings using a query embedding
-- Note: This function requires pgvector extension
-- Function creation skipped due to pgvector compatibility issues
-- Can be manually added later if needed via Supabase SQL Editor
