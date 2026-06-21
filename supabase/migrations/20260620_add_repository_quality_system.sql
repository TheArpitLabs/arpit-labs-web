-- Repository Quality System Migration
-- Adds quality scoring and metadata to projects table

-- Add quality-related columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS github_repository_id BIGINT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS repository_score INTEGER DEFAULT 0;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS quality_grade TEXT DEFAULT 'Unknown';

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS contributors_count INTEGER DEFAULT 0;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS last_commit_at TIMESTAMPTZ;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS repository_topics TEXT[];

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS quality_metadata JSONB DEFAULT '{}';

-- Create indexes for quality queries
CREATE INDEX IF NOT EXISTS idx_projects_repository_score
ON projects(repository_score);

CREATE INDEX IF NOT EXISTS idx_projects_quality_grade
ON projects(quality_grade);

-- Create index for GitHub repository ID lookups
CREATE INDEX IF NOT EXISTS idx_projects_github_repository_id
ON projects(github_repository_id);

-- Add comments for documentation
COMMENT ON COLUMN projects.github_repository_id IS 'GitHub repository ID from API';
COMMENT ON COLUMN projects.repository_score IS 'Quality score (0-100) calculated from repository metrics';
COMMENT ON COLUMN projects.quality_grade IS 'Quality grade: Excellent, High Quality, Good, Average, Reject';
COMMENT ON COLUMN projects.contributors_count IS 'Number of contributors to the repository';
COMMENT ON COLUMN projects.last_commit_at IS 'Timestamp of the last commit to the repository';
COMMENT ON COLUMN projects.repository_topics IS 'Repository topics/tags from GitHub';
COMMENT ON COLUMN projects.quality_metadata IS 'Additional quality metrics and scoring details';
