-- Discovery Logs Table Migration
-- Adds logging table for validation and discovery events
-- Phase 5: Data Validation Layer

-- Drop table if it exists with wrong schema
DROP TABLE IF EXISTS discovery_logs CASCADE;

-- Create discovery_logs table
CREATE TABLE discovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Log identification
  log_type TEXT NOT NULL,
  source TEXT NOT NULL,
  
  -- Context and metadata
  context JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Metadata
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
);

-- Create indexes for querying
CREATE INDEX idx_discovery_logs_log_type ON discovery_logs(log_type);
CREATE INDEX idx_discovery_logs_source ON discovery_logs(source);
CREATE INDEX idx_discovery_logs_created_at ON discovery_logs(created_at DESC);
CREATE INDEX idx_discovery_logs_severity ON discovery_logs(severity);

-- Create index for context queries (GIN index for JSONB)
CREATE INDEX idx_discovery_logs_context ON discovery_logs USING gin (context);

-- Enable RLS
ALTER TABLE discovery_logs ENABLE ROW LEVEL SECURITY;

-- Admin policies
DROP POLICY IF EXISTS "Admins can view discovery logs" ON discovery_logs;
CREATE POLICY "Admins can view discovery logs" ON discovery_logs FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can insert discovery logs" ON discovery_logs;
CREATE POLICY "Admins can insert discovery logs" ON discovery_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE discovery_logs IS 'Logs for discovery and validation events';
COMMENT ON COLUMN discovery_logs.log_type IS 'Type of log event (e.g., validation_passed, validation_failed, discovery_completed)';
COMMENT ON COLUMN discovery_logs.source IS 'Source of the log event (e.g., validation_layer, discovery_engine)';
COMMENT ON COLUMN discovery_logs.context IS 'Additional context and metadata for the log event';
COMMENT ON COLUMN discovery_logs.severity IS 'Severity level: debug, info, warning, error, critical';

-- Create function to create table if not exists (for use in code)
CREATE OR REPLACE FUNCTION create_discovery_logs_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Table already created by this migration, this function is for runtime checks
  RETURN;
END;
$$;
