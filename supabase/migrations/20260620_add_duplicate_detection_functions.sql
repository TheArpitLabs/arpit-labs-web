-- Duplicate Detection Functions Migration
-- Adds RPC functions for finding duplicate repositories and discovery logging

-- Create discovery_logs table for tracking duplicate attempts
CREATE TABLE IF NOT EXISTS discovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'skipped',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add status column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discovery_logs' AND column_name = 'status'
  ) THEN
    ALTER TABLE discovery_logs ADD COLUMN status TEXT NOT NULL DEFAULT 'skipped';
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE discovery_logs IS 'Logs for discovery engine operations including duplicate attempts';

-- Create index on discovery_logs for querying (after table creation)
CREATE INDEX IF NOT EXISTS idx_discovery_logs_created_at
ON discovery_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_logs_status
ON discovery_logs(status);

-- Function to find duplicate repository IDs
CREATE OR REPLACE FUNCTION find_duplicate_repository_ids()
RETURNS TABLE (
  github_repository_id BIGINT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    github_repository_id,
    COUNT(*) as count
  FROM projects
  WHERE github_repository_id IS NOT NULL
  GROUP BY github_repository_id
  HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

-- Function to find duplicate normalized URLs
CREATE OR REPLACE FUNCTION find_duplicate_normalized_urls()
RETURNS TABLE (
  normalized_github_url TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    normalized_github_url,
    COUNT(*) as count
  FROM projects
  WHERE normalized_github_url IS NOT NULL
  GROUP BY normalized_github_url
  HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

-- Function to find duplicate titles
CREATE OR REPLACE FUNCTION find_duplicate_titles()
RETURNS TABLE (
  title TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    title,
    COUNT(*) as count
  FROM projects
  WHERE title IS NOT NULL
  GROUP BY title
  HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get repository identity health statistics
CREATE OR REPLACE FUNCTION get_repository_identity_health()
RETURNS TABLE (
  total_repositories BIGINT,
  repositories_with_id BIGINT,
  repositories_with_normalized_url BIGINT,
  repositories_with_owner BIGINT,
  repositories_with_repo_name BIGINT,
  identity_health_score INTEGER
) AS $$
DECLARE
  total BIGINT;
  with_id BIGINT;
  with_normalized_url BIGINT;
  with_owner BIGINT;
  with_repo_name BIGINT;
  health_score INTEGER;
BEGIN
  SELECT COUNT(*) INTO total FROM projects WHERE github_url IS NOT NULL;
  SELECT COUNT(*) INTO with_id FROM projects WHERE github_repository_id IS NOT NULL;
  SELECT COUNT(*) INTO with_normalized_url FROM projects WHERE normalized_github_url IS NOT NULL;
  SELECT COUNT(*) INTO with_owner FROM projects WHERE github_owner IS NOT NULL;
  SELECT COUNT(*) INTO with_repo_name FROM projects WHERE github_repo_name IS NOT NULL;
  
  IF total > 0 THEN
    health_score := ROUND(
      ((with_id + with_normalized_url + with_owner + with_repo_name)::FLOAT / (total * 4)::FLOAT) * 100
    );
  ELSE
    health_score := 0;
  END IF;
  
  RETURN QUERY
  SELECT 
    total,
    with_id,
    with_normalized_url,
    with_owner,
    with_repo_name,
    health_score;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_duplicate_repository_ids TO authenticated;
GRANT EXECUTE ON FUNCTION find_duplicate_normalized_urls TO authenticated;
GRANT EXECUTE ON FUNCTION find_duplicate_titles TO authenticated;
GRANT EXECUTE ON FUNCTION get_repository_identity_health TO authenticated;
