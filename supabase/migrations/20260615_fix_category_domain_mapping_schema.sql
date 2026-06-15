-- Fix Category Domain Mapping Schema
-- This migration fixes the schema mismatch between frontend expectations and database structure
-- The frontend expects category_domain_mapping to have a 'category' (text) column
-- The previous migration incorrectly tried to use 'category_id' referencing non-existent engineering_categories table
-- Date: June 15, 2026

-- 1. DROP THE INCORRECT TABLE IF IT EXISTS
drop table if exists category_domain_mapping cascade;

-- 2. CREATE THE CORRECT SCHEMA MATCHING FRONTEND EXPECTATIONS
create table category_domain_mapping (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- This matches projects.category (text field)
  domain_id uuid not null references engineering_domains(id) on delete cascade,
  confidence_score numeric default 1.0 check (confidence_score >= 0 and confidence_score <= 1),
  created_at timestamptz not null default now(),
  unique(category, domain_id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
create index idx_category_domain_mapping_category on category_domain_mapping(category);
create index idx_category_domain_mapping_domain on category_domain_mapping(domain_id);

-- 4. MAP PROJECTS.CATEGORY VALUES TO ENGINEERING_DOMAINS
-- This maps the actual category values in projects.category to the appropriate engineering domains
insert into category_domain_mapping (category, domain_id, confidence_score)
select 
  distinct p.category,
  ed.id,
  1.0
from projects p
cross join engineering_domains ed
where p.category is not null
and p.status = 'published'
and (
  -- AI & Machine Learning
  (p.category in ('NLP', 'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'Computer Vision') and ed.slug = 'ai-machine-learning') or
  
  -- Cybersecurity
  (p.category in ('Network Security', 'Cryptography', 'Penetration Testing', 'Application Security', 'Incident Response', 'Cybersecurity') and ed.slug = 'cybersecurity') or
  
  -- Software Development
  (p.category in ('Cloud Computing', 'Web Development', 'DevOps', 'API Development', 'Mobile Development', 'Mobile App') and ed.slug = 'software-development') or
  
  -- IoT & Embedded Systems
  (p.category in ('IoT Systems', 'IoT', 'Automotive', 'Maritime', 'Healthcare') and ed.slug = 'iot-embedded-systems') or
  
  -- Robotics
  (p.category in ('Robotics') and ed.slug = 'robotics')
)
on conflict (category, domain_id) do nothing;

-- 5. ENABLE RLS
alter table category_domain_mapping enable row level security;

-- 6. RLS POLICIES
create policy "Public can view category domain mappings" on category_domain_mapping for select using (true);
create policy "Admins can manage category domain mappings" on category_domain_mapping for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);

-- 7. VERIFY THE MAPPINGS
select 
  ed.name as domain_name,
  ed.slug as domain_slug,
  count(distinct cdm.category) as category_count,
  array_agg(distinct cdm.category) as categories,
  (select count(*) from projects p where p.status = 'published' and p.category in (select cdm2.category from category_domain_mapping cdm2 where cdm2.domain_id = ed.id)) as project_count
from engineering_domains ed
left join category_domain_mapping cdm on ed.id = cdm.domain_id
group by ed.id, ed.name, ed.slug
order by ed.name;

-- 8. ADD MISSING COLUMNS TO PROJECTS TABLE
alter table projects 
add column if not exists stars integer default 0,
add column if not exists forks integer default 0,
add column if not exists language text default 'Unknown',
add column if not exists trending_score numeric,
add column if not exists github_stars integer default 0,
add column if not exists category text,
add column if not exists status text default 'draft' check (status in ('draft', 'published', 'archived'));

-- 9. SET ALL EXISTING PROJECTS TO PUBLISHED STATUS
update projects set status = 'published' where status is null or status = 'draft';

-- 10. DEBUG: CHECK ACTUAL CATEGORIES IN PROJECTS TABLE
select 
  category,
  count(*) as project_count
from projects 
where status = 'published' 
  and category is not null
group by category
order by project_count desc;

-- Migration complete
