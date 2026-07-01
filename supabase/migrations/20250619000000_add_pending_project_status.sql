-- Add pending project status values for discovery engine workflow
-- This allows projects to be fetched as 'pending', then approved or rejected

-- Drop the existing check constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Add a new check constraint with all status values
ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('draft', 'published', 'archived', 'pending', 'approved', 'rejected'));

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Add comment to document the workflow
COMMENT ON COLUMN projects.status IS 'Project status: draft (manual creation), pending (discovered awaiting review), approved (reviewed and published), published (live on website), archived (removed from public view), rejected (discovered but not approved)';
