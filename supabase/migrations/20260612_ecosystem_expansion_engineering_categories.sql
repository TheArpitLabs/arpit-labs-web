-- Phase ECOSYSTEM-EXPANSION: Engineering Categories and Verified Projects
-- This migration adds support for 16 engineering domains and 160+ verified open-source projects

-- 1. ENGINEERING CATEGORIES TABLE
create table if not exists engineering_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique not null,
  description text,
  icon text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. UPDATE PROJECTS TABLE WITH ENGINEERING-SPECIFIC FIELDS
alter table projects 
add column if not exists engineering_category_id uuid references engineering_categories(id) on delete set null,
add column if not exists project_type text default 'original', -- original, opensource_showcase
add column if not exists repository_url text,
add column if not exists github_stars integer,
add column if not exists license text,
add column if not exists original_author text,
add column if not exists architecture_summary text,
add column if not exists learning_outcomes text,
add column if not exists features text,
add column if not exists industry_applications text,
add column if not exists challenges_solved text,
add column if not exists future_possibilities text,
add column if not exists contributors text[],
add column if not exists verified_repository boolean default false,
add column if not exists verification_date timestamptz;

-- 3. CREATE INDEXES FOR PERFORMANCE
create index if not exists idx_projects_engineering_category on projects(engineering_category_id);
create index if not exists idx_projects_project_type on projects(project_type);
create index if not exists idx_projects_verified on projects(verified_repository);
create index if not exists idx_projects_github_stars on projects(github_stars);
create index if not exists idx_engineering_categories_active on engineering_categories(is_active);
create index if not exists idx_engineering_categories_order on engineering_categories(display_order);

-- 4. INSERT THE 16 ENGINEERING CATEGORIES
insert into engineering_categories (name, slug, description, icon, display_order) values
('Artificial Intelligence', 'artificial-intelligence', 'AI algorithms, neural networks, deep learning, NLP, computer vision, and intelligent systems', '🤖', 1),
('Machine Learning', 'machine-learning', 'ML algorithms, data preprocessing, model training, evaluation metrics, and ML operations', '🧠', 2),
('Data Science', 'data-science', 'Data analysis, visualization, statistical methods, data engineering, and analytics platforms', '📊', 3),
('Internet of Things', 'iot', 'IoT platforms, sensor networks, edge computing, smart devices, and IoT protocols', '🌐', 4),
('Robotics', 'robotics', 'Robot control systems, simulation, computer vision for robotics, and autonomous systems', '🦾', 5),
('Cybersecurity', 'cybersecurity', 'Security tools, penetration testing, cryptography, network security, and threat detection', '🔒', 6),
('Web Development', 'web-development', 'Frontend frameworks, backend systems, full-stack frameworks, web APIs, and web performance', '💻', 7),
('Mobile Development', 'mobile-development', 'Mobile frameworks, cross-platform development, mobile UI, and mobile app architecture', '📱', 8),
('Cloud Computing', 'cloud-computing', 'Cloud platforms, containerization, orchestration, serverless computing, and cloud-native tools', '☁️', 9),
('DevOps', 'devops', 'CI/CD pipelines, infrastructure as code, configuration management, monitoring, and automation', '⚙️', 10),
('Electronics', 'electronics', 'Electronic design automation, circuit simulation, PCB design, and embedded electronics', '🔌', 11),
('Embedded Systems', 'embedded-systems', 'Embedded software, real-time operating systems, firmware development, and microcontroller programming', '💾', 12),
('Research & Innovation', 'research-innovation', 'Academic research tools, scientific computing, research frameworks, and innovation platforms', '🔬', 13),
('Blockchain', 'blockchain', 'Blockchain platforms, smart contracts, decentralized applications, and cryptocurrency tools', '⛓️', 14),
('Open Source Tools', 'open-source-tools', 'Developer tools, productivity tools, system utilities, and general-purpose open-source software', '🛠️', 15),
('Engineering Education', 'engineering-education', 'Learning platforms, tutorials, interactive courses, and educational resources for engineers', '🎓', 16)
on conflict (name) do nothing;

-- 5. CREATE PROJECT VIEWS FOR EASY ACCESS
create or replace view verified_opensource_projects as
select 
  p.id,
  p.title,
  p.slug,
  p.description,
  p.overview,
  p.problem_statement,
  p.architecture,
  p.tech_stack,
  p.repository_url,
  p.github_url,
  p.demo_url,
  p.cover_image,
  p.screenshots,
  p.lessons_learned,
  p.tags,
  p.featured,
  p.published,
  p.project_type,
  p.github_stars,
  p.license,
  p.original_author,
  p.architecture_summary,
  p.learning_outcomes,
  p.features,
  p.industry_applications,
  p.challenges_solved,
  p.future_possibilities,
  p.contributors,
  p.verified_repository,
  p.verification_date,
  p.created_at,
  p.updated_at,
  ec.name as category_name,
  ec.slug as category_slug,
  ec.icon as category_icon
from projects p
left join engineering_categories ec on p.engineering_category_id = ec.id
where p.project_type = 'opensource_showcase' 
  and p.verified_repository = true
  and p.published = true;

create or replace view engineering_projects_by_category as
select 
  ec.id as category_id,
  ec.name as category_name,
  ec.slug as category_slug,
  ec.icon as category_icon,
  ec.description as category_description,
  count(p.id) as project_count,
  coalesce(avg(p.github_stars), 0) as avg_stars,
  max(p.github_stars) as max_stars
from engineering_categories ec
left join projects p on ec.id = p.engineering_category_id and p.published = true
group by ec.id, ec.name, ec.slug, ec.icon, ec.description
order by ec.display_order;

-- 6. ENABLE RLS ON NEW TABLE
alter table engineering_categories enable row level security;

-- 7. RLS POLICIES FOR ENGINEERING CATEGORIES
create policy "Public can view engineering categories" on engineering_categories for select using (is_active = true);
create policy "Admins can manage engineering categories" on engineering_categories for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);

-- 8. UPDATE EXISTING PROJECTS RLS POLICIES TO HANDLE NEW FIELDS
drop policy if exists "Public can view published projects" on projects;
create policy "Public can view published projects" on projects for select using (published = true);
create policy "Admins have full access to projects" on projects for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);

-- 9. CREATE TRIGGER FOR UPDATED_AT
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_engineering_categories_updated_at
  before update on engineering_categories
  for each row
  execute function update_updated_at_column();

-- 10. ADD HELPER FUNCTIONS FOR PROJECT MANAGEMENT
create or replace function verify_project_repository(project_id uuid, repo_url text)
returns boolean as $$
declare
  category_id uuid;
begin
  -- Extract category from repository URL or assign based on project tags
  -- This is a placeholder - actual verification would involve API calls to GitHub
  
  update projects 
  set 
    verified_repository = true,
    verification_date = now(),
    repository_url = repo_url
  where id = project_id;
  
  return true;
end;
$$ language plpgsql security definer;

create or replace function get_projects_by_category(category_slug text)
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  github_stars integer,
  license text,
  original_author text,
  repository_url text
) as $$
begin
  return query
  select 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.github_stars,
    p.license,
    p.original_author,
    p.repository_url
  from projects p
  join engineering_categories ec on p.engineering_category_id = ec.id
  where ec.slug = category_slug 
    and p.published = true
    and p.project_type = 'opensource_showcase'
  order by p.github_stars desc nulls last;
end;
$$ language plpgsql;

-- 11. CREATE STATISTICS VIEW
create or replace view ecosystem_statistics as
select 
  (select count(*) from engineering_categories where is_active = true) as total_categories,
  (select count(*) from projects where project_type = 'opensource_showcase' and verified_repository = true) as verified_projects,
  (select count(*) from projects where project_type = 'opensource_showcase' and published = true) as published_projects,
  (select coalesce(sum(github_stars), 0) from projects where project_type = 'opensource_showcase' and verified_repository = true) as total_stars,
  (select count(distinct license) from projects where project_type = 'opensource_showcase' and license is not null) as unique_licenses;

-- 12. ADD COMMENTS FOR DOCUMENTATION
comment on table engineering_categories is 'Engineering domains for the Arpit Labs ecosystem expansion';
comment on column engineering_categories.name is 'Display name of the engineering category';
comment on column engineering_categories.slug is 'URL-friendly identifier for the category';
comment on column engineering_categories.icon is 'Emoji or icon representing the category';
comment on column engineering_categories.display_order is 'Order for displaying categories in UI';

comment on column projects.project_type is 'Type of project: original (created by Arpit) or opensource_showcase (verified open source)';
comment on column projects.repository_url is 'URL to the repository (GitHub, GitLab, etc.)';
comment on column projects.github_stars is 'Number of stars on GitHub';
comment on column projects.license is 'Open source license type';
comment on column projects.original_author is 'Original author/maintainer of the open source project';
comment on column projects.architecture_summary is 'Summary of the project architecture';
comment on column projects.learning_outcomes is 'Educational value and learning outcomes';
comment on column projects.verified_repository is 'Whether the repository has been verified as active and accessible';
comment on column projects.verification_date is 'When the repository was last verified';

-- Migration complete
