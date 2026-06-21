-- Add safety columns to discovery_runs table for better tracking and monitoring
-- This migration adds columns to track duration, failure reasons, and categories

-- Add duration_ms column to track how long each discovery run takes
ALTER TABLE discovery_runs
ADD COLUMN IF NOT EXISTS duration_ms BIGINT;

-- Add failure_reason column to track why a discovery run failed
ALTER TABLE discovery_runs
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add category column to track which category was being processed
ALTER TABLE discovery_runs
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add comments for documentation
COMMENT ON COLUMN discovery_runs.duration_ms IS 'Duration of the discovery run in milliseconds';
COMMENT ON COLUMN discovery_runs.failure_reason IS 'Reason for discovery run failure, if applicable';
COMMENT ON COLUMN discovery_runs.category IS 'Category being processed during this discovery run';

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_discovery_runs_category ON discovery_runs(category);

-- Create index on duration_ms for performance analysis
CREATE INDEX IF NOT EXISTS idx_discovery_runs_duration_ms ON discovery_runs(duration_ms);

-- Create index on failure_reason for debugging
CREATE INDEX IF NOT EXISTS idx_discovery_runs_failure_reason ON discovery_runs(failure_reason) WHERE failure_reason IS NOT NULL;
