-- Populate content_domain_mapping with existing projects
-- This migration maps existing projects to appropriate engineering domains
-- Date: June 15, 2026

-- Map Smart Traffic Management System to IoT & Embedded Systems
INSERT INTO content_domain_mapping (content_id, content_type, domain_id, subdomain_id, confidence_score)
SELECT 
  p.id,
  'project',
  (SELECT id FROM engineering_domains WHERE slug = 'iot-embedded-systems'),
  (SELECT id FROM engineering_subdomains WHERE slug = 'smart-cities'),
  0.9
FROM projects p
WHERE p.slug = 'smart-traffic-management-system'
ON CONFLICT DO NOTHING;

-- Map Hospital Attendance System to Software Development
INSERT INTO content_domain_mapping (content_id, content_type, domain_id, subdomain_id, confidence_score)
SELECT 
  p.id,
  'project',
  (SELECT id FROM engineering_domains WHERE slug = 'software-development'),
  (SELECT id FROM engineering_subdomains WHERE slug = 'full-stack'),
  0.85
FROM projects p
WHERE p.slug = 'hospital-attendance-system'
ON CONFLICT DO NOTHING;

-- Map NCC Buddy to Software Development (Mobile Development)
INSERT INTO content_domain_mapping (content_id, content_type, domain_id, subdomain_id, confidence_score)
SELECT 
  p.id,
  'project',
  (SELECT id FROM engineering_domains WHERE slug = 'software-development'),
  (SELECT id FROM engineering_subdomains WHERE slug = 'mobile-development'),
  0.9
FROM projects p
WHERE p.slug = 'ncc-buddy'
ON CONFLICT DO NOTHING;

-- Map Ship Bridge Collision Prevention to Robotics
INSERT INTO content_domain_mapping (content_id, content_type, domain_id, subdomain_id, confidence_score)
SELECT 
  p.id,
  'project',
  (SELECT id FROM engineering_domains WHERE slug = 'robotics'),
  (SELECT id FROM engineering_subdomains WHERE slug = 'autonomous-systems'),
  0.85
FROM projects p
WHERE p.slug = 'ship-bridge-collision-prevention'
ON CONFLICT DO NOTHING;

-- Map Accident Detection System to IoT & Embedded Systems
INSERT INTO content_domain_mapping (content_id, content_type, domain_id, subdomain_id, confidence_score)
SELECT 
  p.id,
  'project',
  (SELECT id FROM engineering_domains WHERE slug = 'iot-embedded-systems'),
  (SELECT id FROM engineering_subdomains WHERE slug = 'arduino'),
  0.9
FROM projects p
WHERE p.slug = 'accident-detection-system'
ON CONFLICT DO NOTHING;

-- Update engineering_domains with total counts
UPDATE engineering_domains
SET total_projects = (
  SELECT COUNT(DISTINCT cdm.content_id)
  FROM content_domain_mapping cdm
  WHERE cdm.content_type = 'project' 
  AND cdm.domain_id = engineering_domains.id
)
WHERE EXISTS (
  SELECT 1 FROM content_domain_mapping cdm
  WHERE cdm.content_type = 'project'
  AND cdm.domain_id = engineering_domains.id
);

-- Verify the mappings
SELECT 
  ed.name as domain_name,
  ed.slug as domain_slug,
  COUNT(cdm.content_id) as project_count
FROM engineering_domains ed
LEFT JOIN content_domain_mapping cdm ON ed.id = cdm.domain_id AND cdm.content_type = 'project'
GROUP BY ed.id, ed.name, ed.slug
ORDER BY ed.name;
