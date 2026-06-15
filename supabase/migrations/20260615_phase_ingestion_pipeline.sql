-- Phase Ingestion Pipeline: Enhanced Multi-Source Tracking and Raw Ingestion
-- Additive migration to support 5-layer deduplication and compliance checking

-- Add missing fields to content_acquisition_queue for the ingestion pipeline
ALTER TABLE content_acquisition_queue 
ADD COLUMN IF NOT EXISTS target_domain TEXT CHECK (target_domain IN ('ai', 'ml', 'iot', 'cybersecurity', 'robotics', 'cloud', 'devops', 'web', 'mobile', 'research', 'data_science')),
ADD COLUMN IF NOT EXISTS similarity_score NUMERIC(5,4),
ADD COLUMN IF NOT EXISTS detected_license TEXT,
ADD COLUMN IF NOT EXISTS licensing_status TEXT CHECK (licensing_status IN ('permissive', 'weak_copyleft', 'restrictive', 'unknown', 'not_detected')),
ADD COLUMN IF NOT EXISTS raw_payload JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS error_log TEXT,
ADD COLUMN IF NOT EXISTS processing_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_processing_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vector_embedding VECTOR(768);

-- Create optimized indexes for the ingestion pipeline
CREATE INDEX IF NOT EXISTS idx_acquisition_target_domain ON content_acquisition_queue(target_domain);
CREATE INDEX IF NOT EXISTS idx_acquisition_similarity_score ON content_acquisition_queue(similarity_score);
CREATE INDEX IF NOT EXISTS idx_acquisition_licensing_status ON content_acquisition_queue(licensing_status);
CREATE INDEX IF NOT EXISTS idx_acquisition_next_processing ON content_acquisition_queue(next_processing_at) WHERE next_processing_at IS NOT NULL;

-- Create HNSW index for vector similarity search with cosine distance
CREATE INDEX IF NOT EXISTS idx_acquisition_vector_cosine ON content_acquisition_queue 
USING hnsw (vector_embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- Ensure project_sources table has all required fields
ALTER TABLE project_sources 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL CHECK (provider IN ('github','gitlab','devpost','kaggle','huggingface','arxiv','research_paper')),
ADD COLUMN IF NOT EXISTS source_url TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,4) DEFAULT 1.0;

-- Create optimized indexes for project_sources
CREATE INDEX IF NOT EXISTS idx_project_sources_project_id ON project_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sources_external_id ON project_sources(external_id);
CREATE INDEX IF NOT EXISTS idx_project_sources_provider ON project_sources(provider);
CREATE INDEX IF NOT EXISTS idx_project_sources_primary ON project_sources(project_id, is_primary) WHERE is_primary = true;

-- Add comments for documentation
COMMENT ON COLUMN content_acquisition_queue.target_domain IS 'Classified engineering branch for the project';
COMMENT ON COLUMN content_acquisition_queue.similarity_score IS 'Cosine similarity score from vector comparison (0-1)';
COMMENT ON COLUMN content_acquisition_queue.detected_license IS 'SPDX license identifier detected from repository';
COMMENT ON COLUMN content_acquisition_queue.licensing_status IS 'Categorized license risk profile';
COMMENT ON COLUMN content_acquisition_queue.raw_payload IS 'Raw incoming data from source platform';
COMMENT ON COLUMN content_acquisition_queue.error_log IS 'Processing error details for debugging';
COMMENT ON COLUMN content_acquisition_queue.processing_attempts IS 'Number of processing retry attempts';
COMMENT ON COLUMN content_acquisition_queue.next_processing_at IS 'Scheduled time for next processing attempt';
COMMENT ON COLUMN content_acquisition_queue.vector_embedding IS '768-dimensional vector embedding from nomic-embed-text-v1.5';

COMMENT ON COLUMN project_sources.project_id IS 'References the canonical project in projects table';
COMMENT ON COLUMN project_sources.external_id IS 'Platform-specific repository identifier';
COMMENT ON COLUMN project_sources.provider IS 'Source platform (github, gitlab, etc.)';
COMMENT ON COLUMN project_sources.source_url IS 'Original source URL from the platform';
COMMENT ON COLUMN project_sources.is_primary IS 'Indicates if this is the primary source for the project';
COMMENT ON COLUMN project_sources.confidence_score IS 'Confidence score for source matching (0-1)';

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a function for cosine distance calculation
CREATE OR REPLACE FUNCTION cosine_distance(v1 VECTOR(768), v2 VECTOR(768))
RETURNS FLOAT AS $$
BEGIN
  RETURN (v1 <=> v2);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_acquisition_queue_updated_at BEFORE UPDATE ON content_acquisition_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_sources_updated_at BEFORE UPDATE ON project_sources
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
