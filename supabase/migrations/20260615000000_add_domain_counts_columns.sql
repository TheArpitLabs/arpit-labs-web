-- Add missing count columns to engineering_domains table
-- These columns are expected by the domain landing page

ALTER TABLE engineering_domains 
ADD COLUMN IF NOT EXISTS total_projects integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_research_papers integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_datasets integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_contributors integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_learning_resources integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_hackathons integer DEFAULT 0;

-- Update the counts based on actual content mappings
UPDATE engineering_domains 
SET 
  total_projects = (
    SELECT COUNT(DISTINCT content_id) 
    FROM content_domain_mapping 
    WHERE content_type = 'project' 
    AND domain_id = engineering_domains.id
  ),
  total_research_papers = (
    SELECT COUNT(DISTINCT content_id) 
    FROM content_domain_mapping 
    WHERE content_type = 'research_paper' 
    AND domain_id = engineering_domains.id
  ),
  total_datasets = (
    SELECT COUNT(DISTINCT content_id) 
    FROM content_domain_mapping 
    WHERE content_type = 'dataset' 
    AND domain_id = engineering_domains.id
  ),
  total_contributors = (
    SELECT COUNT(DISTINCT content_id) 
    FROM content_domain_mapping 
    WHERE content_type = 'contributor' 
    AND domain_id = engineering_domains.id
  ),
  total_learning_resources = (
    SELECT COUNT(DISTINCT content_id) 
    FROM content_domain_mapping 
    WHERE content_type = 'learning_resource' 
    AND domain_id = engineering_domains.id
  ),
  total_hackathons = (
    SELECT COUNT(DISTINCT content_id) 
    FROM content_domain_mapping 
    WHERE content_type = 'hackathon' 
    AND domain_id = engineering_domains.id
  );

-- Verify the updates
SELECT 
  name,
  slug,
  total_projects,
  total_research_papers,
  total_datasets,
  total_contributors,
  total_learning_resources,
  total_hackathons
FROM engineering_domains
ORDER BY name;
