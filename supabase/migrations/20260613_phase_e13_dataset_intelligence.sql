-- Phase E13: Dataset Intelligence Engine
-- Additive migration to enable dataset discovery, quality scoring, and recommendations

-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL CHECK (source IN ('kaggle', 'huggingface', 'github', 'other')),
  source_id TEXT NOT NULL,
  url TEXT NOT NULL,
  download_url TEXT,
  license TEXT,
  size BIGINT,
  format TEXT,
  domains TEXT[] NOT NULL DEFAULT '{}',
  technologies TEXT[] NOT NULL DEFAULT '{}',
  quality_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  completeness_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  popularity_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  downloads INTEGER NOT NULL DEFAULT 0,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_datasets_source ON datasets(source);
CREATE INDEX IF NOT EXISTS idx_domains ON datasets USING GIN(domains);
CREATE INDEX IF NOT EXISTS idx_technologies ON datasets USING GIN(technologies);
CREATE INDEX IF NOT EXISTS idx_quality_score ON datasets(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_downloads ON datasets(downloads DESC);

-- Create dataset_quality table
CREATE TABLE IF NOT EXISTS dataset_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  completeness NUMERIC(5, 2) NOT NULL,
  accuracy NUMERIC(5, 2) NOT NULL,
  consistency NUMERIC(5, 2) NOT NULL,
  timeliness NUMERIC(5, 2) NOT NULL,
  relevance NUMERIC(5, 2) NOT NULL,
  overall_score NUMERIC(5, 2) NOT NULL,
  issues TEXT[] NOT NULL DEFAULT '{}',
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dataset_quality_dataset_id ON dataset_quality(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_quality_overall_score ON dataset_quality(overall_score DESC);

-- RPC function to get datasets by domain
CREATE OR REPLACE FUNCTION get_datasets_by_domain(domain_param TEXT, limit_param INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  source TEXT,
  quality_score NUMERIC,
  domains TEXT[],
  technologies TEXT[],
  downloads INTEGER
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.description,
    d.source,
    d.quality_score,
    d.domains,
    d.technologies,
    d.downloads
  FROM datasets d
  WHERE domain_param = ANY(d.domains)
  ORDER BY d.quality_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get datasets by technology
CREATE OR REPLACE FUNCTION get_datasets_by_technology(technology_param TEXT, limit_param INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  source TEXT,
  quality_score NUMERIC,
  domains TEXT[],
  technologies TEXT[],
  downloads INTEGER
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.description,
    d.source,
    d.quality_score,
    d.domains,
    d.technologies,
    d.downloads
  FROM datasets d
  WHERE technology_param = ANY(d.technologies)
  ORDER BY d.quality_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get dataset statistics
CREATE OR REPLACE FUNCTION get_dataset_statistics()
RETURNS TABLE(
  total_datasets INTEGER,
  total_downloads INTEGER,
  avg_quality_score NUMERIC,
  top_domain TEXT,
  top_technology TEXT
)
AS $$
DECLARE
  top_domain_rec RECORD;
  top_tech_rec RECORD;
BEGIN
  SELECT COUNT(*) INTO total_datasets FROM datasets;
  SELECT SUM(downloads) INTO total_downloads FROM datasets;
  SELECT AVG(quality_score) INTO avg_quality_score FROM datasets;
  
  SELECT unnest(domains) AS domain, COUNT(*) INTO top_domain_rec
  FROM datasets
  GROUP BY domain
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  SELECT unnest(technologies) AS technology, COUNT(*) INTO top_tech_rec
  FROM datasets
  GROUP BY technology
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  RETURN QUERY
  SELECT 
    total_datasets,
    COALESCE(total_downloads, 0),
    COALESCE(avg_quality_score, 0),
    COALESCE(top_domain_rec.domain, 'N/A'),
    COALESCE(top_tech_rec.technology, 'N/A');
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE datasets IS 'Stores datasets from multiple sources with quality and popularity metrics';
COMMENT ON TABLE dataset_quality IS 'Stores quality assessments for datasets';
COMMENT ON FUNCTION get_datasets_by_domain IS 'Get datasets filtered by domain';
COMMENT ON FUNCTION get_datasets_by_technology IS 'Get datasets filtered by technology';
COMMENT ON FUNCTION get_dataset_statistics IS 'Get overall dataset statistics';
