-- Repository Identity Columns Migration
-- Adds repository identity columns for advanced deduplication

-- Add repository identity columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS github_owner TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS github_repo_name TEXT;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS normalized_github_url TEXT;

-- Create unique index for repository ID (primary deduplication method)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_repo_id
ON projects(github_repository_id)
WHERE github_repository_id IS NOT NULL;

-- Create unique index for normalized URL (secondary deduplication method)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_normalized_url
ON projects(normalized_github_url)
WHERE normalized_github_url IS NOT NULL;

-- Create indexes for owner and repo name queries
CREATE INDEX IF NOT EXISTS idx_projects_github_owner
ON projects(github_owner);

CREATE INDEX IF NOT EXISTS idx_projects_github_repo_name
ON projects(github_repo_name);

-- Add comments for documentation
COMMENT ON COLUMN projects.github_owner IS 'GitHub repository owner (username/organization)';
COMMENT ON COLUMN projects.github_repo_name IS 'GitHub repository name';
COMMENT ON COLUMN projects.normalized_github_url IS 'Normalized GitHub URL in format: github.com/owner/repo';
