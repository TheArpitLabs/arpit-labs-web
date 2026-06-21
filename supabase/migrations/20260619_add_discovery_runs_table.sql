-- Add discovery_runs table for tracking GitHub Discovery Engine execution
-- This table tracks individual discovery runs for audit and debugging purposes

CREATE TABLE IF NOT EXISTS discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Run identification
  run_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Configuration
  categories TEXT[] NOT NULL,
  max_results_per_category INTEGER NOT NULL,
  min_stars INTEGER NOT NULL,
  min_forks INTEGER NOT NULL,
  
  -- Statistics
  total_fetched INTEGER NOT NULL DEFAULT 0,
  total_inserted INTEGER NOT NULL DEFAULT 0,
  total_skipped INTEGER NOT NULL DEFAULT 0,
  total_duplicates INTEGER NOT NULL DEFAULT 0,
  total_failed INTEGER NOT NULL DEFAULT 0,
  new_projects INTEGER NOT NULL DEFAULT 0,
  duplicate_projects INTEGER NOT NULL DEFAULT 0,
  failed_imports INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'stopped')),
  
  -- Error tracking
  error_message TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  categories_processed TEXT[] DEFAULT array[]::text[],
  config JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_discovery_runs_run_id ON discovery_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_started_at ON discovery_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_status ON discovery_runs(status);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_completed_at ON discovery_runs(completed_at DESC);

-- Enable RLS
ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can view discovery runs" ON discovery_runs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert discovery runs" ON discovery_runs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update discovery runs" ON discovery_runs FOR UPDATE USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_discovery_runs_updated_at 
  BEFORE UPDATE ON discovery_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE discovery_runs IS 'Tracks individual GitHub Discovery Engine execution runs';
COMMENT ON COLUMN discovery_runs.run_id IS 'Unique identifier for the discovery run';
COMMENT ON COLUMN discovery_runs.status IS 'Current status of the discovery run';
COMMENT ON COLUMN discovery_runs.total_fetched IS 'Total repositories fetched from GitHub';
COMMENT ON COLUMN discovery_runs.total_inserted IS 'Total new projects inserted into database';
COMMENT ON COLUMN discovery_runs.total_duplicates IS 'Total duplicate projects found and skipped';
COMMENT ON COLUMN discovery_runs.total_failed IS 'Total projects that failed to import';
