-- Repository Validation Columns Migration
-- Adds validation scoring and status tracking to projects table
-- Phase 5: Data Validation Layer

-- Add validation-related columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS validation_score INTEGER DEFAULT 0;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS validation_errors JSONB DEFAULT '[]';

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS validation_metadata JSONB DEFAULT '{}';

-- Create indexes for validation queries
CREATE INDEX IF NOT EXISTS idx_projects_validation_score
ON projects(validation_score);

CREATE INDEX IF NOT EXISTS idx_projects_validation_status
ON projects(validation_status);

CREATE INDEX IF NOT EXISTS idx_projects_validated_at
ON projects(validated_at DESC);

-- Add check constraint for validation status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_validation_status'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT check_validation_status
    CHECK (validation_status IN ('pending', 'passed', 'failed', 'skipped'));
  END IF;
END $$;

-- Add check constraint for validation score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_validation_score'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT check_validation_score
    CHECK (validation_score >= 0 AND validation_score <= 100);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN projects.validation_score IS 'Validation score (0-100) based on completeness and quality rules';
COMMENT ON COLUMN projects.validation_status IS 'Validation status: pending, passed, failed, skipped';
COMMENT ON COLUMN projects.validation_errors IS 'Array of validation error messages';
COMMENT ON COLUMN projects.validated_at IS 'Timestamp when validation was performed';
COMMENT ON COLUMN projects.validation_metadata IS 'Additional validation details and rule checks';
