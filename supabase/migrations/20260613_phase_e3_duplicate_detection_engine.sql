-- Phase E3: Duplicate Detection Engine
-- Additive migration to enhance duplicate detection capabilities

-- Add canonical_url and repository_id to content_acquisition_queue
ALTER TABLE content_acquisition_queue 
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS repository_id TEXT,
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES content_acquisition_queue(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ;

-- Create indexes for duplicate detection
CREATE INDEX IF NOT EXISTS idx_acquisition_canonical_url ON content_acquisition_queue(canonical_url);
CREATE INDEX IF NOT EXISTS idx_acquisition_repository_id ON content_acquisition_queue(repository_id);
CREATE INDEX IF NOT EXISTS idx_acquisition_content_hash ON content_acquisition_queue(content_hash);
CREATE INDEX IF NOT EXISTS idx_acquisition_merged_into ON content_acquisition_queue(merged_into);

-- Create duplicate_checks table
CREATE TABLE IF NOT EXISTS duplicate_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES content_acquisition_queue(id) ON DELETE CASCADE,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
  duplicate_type TEXT CHECK (duplicate_type IN ('exact', 'high_similarity', 'potential', 'none')),
  matched_entity_id UUID,
  matched_entity_type TEXT CHECK (matched_entity_type IN ('queue', 'project')),
  signals JSONB NOT NULL DEFAULT '[]'::JSONB,
  similarity_score NUMERIC(5,4),
  recommendation TEXT CHECK (recommendation IN ('auto_reject', 'manual_review', 'proceed')),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duplicate_checks_queue_item ON duplicate_checks(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_duplicate_checks_is_duplicate ON duplicate_checks(is_duplicate);
CREATE INDEX IF NOT EXISTS idx_duplicate_checks_confidence ON duplicate_checks(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_duplicate_checks_checked_at ON duplicate_checks(checked_at DESC);

-- Create project_sources table for cross-source resolution
CREATE TABLE IF NOT EXISTS project_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES content_acquisition_queue(id) ON DELETE CASCADE,
  source_ids TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  providers TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  canonical_url TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_sources_queue_item ON project_sources(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_project_sources_canonical_url ON project_sources(canonical_url);
CREATE INDEX IF NOT EXISTS idx_project_sources_providers ON project_sources USING GIN(providers);

-- Create similarity_results table for detailed similarity tracking
CREATE TABLE IF NOT EXISTS similarity_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES content_acquisition_queue(id) ON DELETE CASCADE,
  compared_with_id UUID NOT NULL,
  compared_with_type TEXT CHECK (compared_with_type IN ('queue', 'project')),
  overall_similarity NUMERIC(5,4) NOT NULL,
  title_similarity NUMERIC(5,4),
  description_similarity NUMERIC(5,4),
  readme_similarity NUMERIC(5,4),
  architecture_similarity NUMERIC(5,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_similarity_queue_item ON similarity_results(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_similarity_compared_with ON similarity_results(compared_with_id);
CREATE INDEX IF NOT EXISTS idx_similarity_overall ON similarity_results(overall_similarity DESC);

-- Add content_hash to projects table for duplicate detection against published projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS repository_id TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_content_hash ON projects(content_hash);
CREATE INDEX IF NOT EXISTS idx_projects_repository_id ON projects(repository_id);
CREATE INDEX IF NOT EXISTS idx_projects_canonical_url ON projects(canonical_url);

-- Add comments for documentation
COMMENT ON COLUMN content_acquisition_queue.canonical_url IS 'Normalized URL for duplicate detection';
COMMENT ON COLUMN content_acquisition_queue.repository_id IS 'Provider-specific repository ID for tracking renamed/moved repos';
COMMENT ON COLUMN content_acquisition_queue.content_hash IS 'Hash of title, description, and content for exact duplicate detection';
COMMENT ON COLUMN content_acquisition_queue.merged_into IS 'References the primary queue item if this was merged as a duplicate';
COMMENT ON COLUMN content_acquisition_queue.merged_at IS 'Timestamp when this item was merged into another';

COMMENT ON TABLE duplicate_checks IS 'Stores duplicate check results for queue items';
COMMENT ON TABLE project_sources IS 'Tracks cross-source project resolutions (same project on multiple platforms)';
COMMENT ON TABLE similarity_results IS 'Detailed similarity scores between items for analysis';

COMMENT ON COLUMN projects.content_hash IS 'Hash for duplicate detection against queue items';
COMMENT ON COLUMN projects.repository_id IS 'Repository ID for tracking renamed/moved repos';
COMMENT ON COLUMN projects.canonical_url IS 'Normalized URL for duplicate detection';
