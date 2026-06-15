-- Engineering Domain Ecosystem V1
-- Implements hierarchical domain architecture for Arpit Labs
-- Supports: AI classification, domain-specific search, analytics, and future expansion

-- 1. ENGINEERING DOMAINS TABLE
create table if not exists engineering_domains (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  icon text,
  color text,
  created_at timestamptz not null default now()
);

-- 2. ENGINEERING SUBDOMAINS TABLE
create table if not exists engineering_subdomains (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references engineering_domains(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz not null default now()
);

-- 3. CONTENT DOMAIN MAPPING TABLE
create table if not exists content_domain_mapping (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null,
  content_type text not null, -- 'project', 'research_paper', 'dataset', 'learning_resource', 'hackathon', 'contributor'
  domain_id uuid references engineering_domains(id) on delete cascade,
  subdomain_id uuid references engineering_subdomains(id) on delete cascade,
  confidence_score numeric check (confidence_score >= 0 and confidence_score <= 1),
  created_at timestamptz not null default now()
);

-- 4. CREATE INDEXES FOR PERFORMANCE
create index if not exists idx_content_domain_mapping_content on content_domain_mapping(content_id, content_type);
create index if not exists idx_content_domain_mapping_domain on content_domain_mapping(domain_id);
create index if not exists idx_content_domain_mapping_subdomain on content_domain_mapping(subdomain_id);
create index if not exists idx_content_domain_mapping_confidence on content_domain_mapping(confidence_score);
create index if not exists idx_engineering_subdomains_domain on engineering_subdomains(domain_id);
create index if not exists idx_engineering_domains_slug on engineering_domains(slug);

-- 5. INSERT THE 6 CORE ENGINEERING DOMAINS
insert into engineering_domains (name, slug, description, icon, color) values
('AI & Machine Learning', 'ai-machine-learning', 'Artificial Intelligence, Machine Learning, Deep Learning, Computer Vision, NLP, and Agentic AI systems', '🤖', '#8B5CF6'),
('Cybersecurity', 'cybersecurity', 'Ethical Hacking, Penetration Testing, Network Security, Cloud Security, and Digital Forensics', '🔒', '#EF4444'),
('IoT & Embedded Systems', 'iot-embedded-systems', 'Arduino, ESP32, Raspberry Pi, Embedded Linux, Smart Cities, and Industrial IoT', '🌐', '#10B981'),
('Robotics', 'robotics', 'ROS, Drones, Autonomous Systems, Industrial Robotics, SLAM, and Computer Vision Robotics', '🦾', '#F59E0B'),
('Software Development', 'software-development', 'Frontend, Backend, Full Stack, Mobile Development, DevOps, Cloud Engineering, and API Development', '💻', '#3B82F6'),
('Data Science', 'data-science', 'Data Analytics, Data Engineering, Visualization, Big Data, Business Intelligence, and Predictive Analytics', '📊', '#EC4899')
on conflict (name) do nothing;

-- 6. INSERT SUBDOMAINS FOR EACH DOMAIN

-- AI & Machine Learning Subdomains
insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Machine Learning',
  'machine-learning',
  'ML algorithms, supervised learning, unsupervised learning, and model optimization'
from engineering_domains where slug = 'ai-machine-learning'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Deep Learning',
  'deep-learning',
  'Neural networks, CNNs, RNNs, transformers, and deep learning frameworks'
from engineering_domains where slug = 'ai-machine-learning'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Computer Vision',
  'computer-vision',
  'Image processing, object detection, image segmentation, and visual recognition'
from engineering_domains where slug = 'ai-machine-learning'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'NLP',
  'natural-language-processing',
  'Text processing, sentiment analysis, language models, and text generation'
from engineering_domains where slug = 'ai-machine-learning'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Generative AI',
  'generative-ai',
  'GANs, diffusion models, image generation, and creative AI systems'
from engineering_domains where slug = 'ai-machine-learning'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Agentic AI',
  'agentic-ai',
  'Autonomous agents, multi-agent systems, and AI decision-making'
from engineering_domains where slug = 'ai-machine-learning'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Reinforcement Learning',
  'reinforcement-learning',
  'Q-learning, policy gradients, and reward-based learning systems'
from engineering_domains where slug = 'ai-machine-learning'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'MLOps',
  'mlops',
  'ML model deployment, monitoring, and production ML systems'
from engineering_domains where slug = 'ai-machine-learning'
on conflict (slug) do nothing;

-- Cybersecurity Subdomains
insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Ethical Hacking',
  'ethical-hacking',
  'Penetration testing, vulnerability assessment, and security auditing'
from engineering_domains where slug = 'cybersecurity'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Penetration Testing',
  'penetration-testing',
  'Security testing, exploit development, and attack simulation'
from engineering_domains where slug = 'cybersecurity'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Network Security',
  'network-security',
  'Firewall configuration, intrusion detection, and network protection'
from engineering_domains where slug = 'cybersecurity'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Cloud Security',
  'cloud-security',
  'AWS/Azure/GCP security, cloud infrastructure protection, and DevSecOps'
from engineering_domains where slug = 'cybersecurity'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Malware Analysis',
  'malware-analysis',
  'Reverse engineering, threat analysis, and malware detection'
from engineering_domains where slug = 'cybersecurity'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'SOC Operations',
  'soc-operations',
  'Security operations center, incident response, and threat monitoring'
from engineering_domains where slug = 'cybersecurity'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Digital Forensics',
  'digital-forensics',
  'Investigation, evidence collection, and forensic analysis'
from engineering_domains where slug = 'cybersecurity'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Secure Coding',
  'secure-coding',
  'Secure development practices, code review, and vulnerability prevention'
from engineering_domains where slug = 'cybersecurity'
on conflict (slug) do nothing;

-- IoT & Embedded Systems Subdomains
insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Arduino',
  'arduino',
  'Arduino development, sensor integration, and microcontroller programming'
from engineering_domains where slug = 'iot-embedded-systems'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'ESP32',
  'esp32',
  'ESP32 development, WiFi/Bluetooth integration, and IoT connectivity'
from engineering_domains where slug = 'iot-embedded-systems'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Raspberry Pi',
  'raspberry-pi',
  'Raspberry Pi projects, Linux embedded systems, and single-board computing'
from engineering_domains where slug = 'iot-embedded-systems'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'STM32',
  'stm32',
  'STM32 microcontrollers, ARM Cortex, and embedded development'
from engineering_domains where slug = 'iot-embedded-systems'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Embedded Linux',
  'embedded-linux',
  'Linux kernel, device drivers, and embedded Linux systems'
from engineering_domains where slug = 'iot-embedded-systems'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Smart Cities',
  'smart-cities',
  'Urban IoT, smart infrastructure, and city-scale sensor networks'
from engineering_domains where slug = 'iot-embedded-systems'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Industrial IoT',
  'industrial-iot',
  'IIoT, industrial automation, and manufacturing IoT systems'
from engineering_domains where slug = 'iot-embedded-systems'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Edge AI',
  'edge-ai',
  'Edge computing, on-device ML, and distributed AI systems'
from engineering_domains where slug = 'iot-embedded-systems'
on conflict (slug) do nothing;

-- Robotics Subdomains
insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'ROS',
  'ros',
  'Robot Operating System, ROS2, and robot software development'
from engineering_domains where slug = 'robotics'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Drones',
  'drones',
  'UAV development, flight control, and autonomous aerial systems'
from engineering_domains where slug = 'robotics'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Autonomous Systems',
  'autonomous-systems',
  'Self-driving systems, autonomous navigation, and decision-making'
from engineering_domains where slug = 'robotics'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Industrial Robotics',
  'industrial-robotics',
  'Manufacturing robots, robotic arms, and automation systems'
from engineering_domains where slug = 'robotics'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'SLAM',
  'slam',
  'Simultaneous Localization and Mapping, robot navigation, and mapping'
from engineering_domains where slug = 'robotics'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Computer Vision Robotics',
  'computer-vision-robotics',
  'Visual servoing, robot vision, and perception systems'
from engineering_domains where slug = 'robotics'
on conflict (slug) do nothing;

-- Software Development Subdomains
insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Frontend',
  'frontend',
  'React, Vue, Angular, UI/UX, and client-side development'
from engineering_domains where slug = 'software-development'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Backend',
  'backend',
  'Node.js, Python, Java, server-side development, and APIs'
from engineering_domains where slug = 'software-development'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Full Stack',
  'full-stack',
  'End-to-end development, MEAN/MERN stack, and full-stack frameworks'
from engineering_domains where slug = 'software-development'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Mobile Development',
  'mobile-development',
  'React Native, Flutter, iOS, Android, and cross-platform development'
from engineering_domains where slug = 'software-development'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'DevOps',
  'devops',
  'CI/CD, infrastructure, automation, and deployment pipelines'
from engineering_domains where slug = 'software-development'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Cloud Engineering',
  'cloud-engineering',
  'AWS, Azure, GCP, cloud architecture, and serverless computing'
from engineering_domains where slug = 'software-development'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'API Development',
  'api-development',
  'REST, GraphQL, API design, and API management'
from engineering_domains where slug = 'software-development'
on conflict (slug) do nothing;

-- Data Science Subdomains
insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Data Analytics',
  'data-analytics',
  'Statistical analysis, data exploration, and business analytics'
from engineering_domains where slug = 'data-science'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Data Engineering',
  'data-engineering',
  'ETL pipelines, data warehouses, and data infrastructure'
from engineering_domains where slug = 'data-science'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Visualization',
  'data-visualization',
  'Dashboards, charts, data storytelling, and visual analytics'
from engineering_domains where slug = 'data-science'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Big Data',
  'big-data',
  'Hadoop, Spark, distributed computing, and large-scale data processing'
from engineering_domains where slug = 'data-science'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Business Intelligence',
  'business-intelligence',
  'BI tools, reporting, and data-driven decision making'
from engineering_domains where slug = 'data-science'
on conflict (slug) do nothing;

insert into engineering_subdomains (domain_id, name, slug, description)
select 
  id,
  'Predictive Analytics',
  'predictive-analytics',
  'Forecasting, predictive modeling, and advanced analytics'
from engineering_domains where slug = 'data-science'
on conflict (slug) do nothing;

-- 7. ENABLE RLS ON NEW TABLES (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_tables 
    where tablename = 'engineering_domains' 
    and rowsecurity = true
  ) then
    alter table engineering_domains enable row level security;
  end if;
  
  if not exists (
    select 1 from pg_tables 
    where tablename = 'engineering_subdomains' 
    and rowsecurity = true
  ) then
    alter table engineering_subdomains enable row level security;
  end if;
  
  if not exists (
    select 1 from pg_tables 
    where tablename = 'content_domain_mapping' 
    and rowsecurity = true
  ) then
    alter table content_domain_mapping enable row level security;
  end if;
end $$;

-- 8. RLS POLICIES
-- Engineering Domains
drop policy if exists "Public can view engineering domains" on engineering_domains;
drop policy if exists "Admins can manage engineering domains" on engineering_domains;
create policy "Public can view engineering domains" on engineering_domains for select using (true);
create policy "Admins can manage engineering domains" on engineering_domains for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);

-- Engineering Subdomains
drop policy if exists "Public can view engineering subdomains" on engineering_subdomains;
drop policy if exists "Admins can manage engineering subdomains" on engineering_subdomains;
create policy "Public can view engineering subdomains" on engineering_subdomains for select using (true);
create policy "Admins can manage engineering subdomains" on engineering_subdomains for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);

-- Content Domain Mapping
drop policy if exists "Public can view content domain mappings" on content_domain_mapping;
drop policy if exists "Admins can manage content domain mappings" on content_domain_mapping;
drop policy if exists "System can insert domain mappings" on content_domain_mapping;
create policy "Public can view content domain mappings" on content_domain_mapping for select using (true);
create policy "Admins can manage content domain mappings" on content_domain_mapping for all using (
  auth.jwt() ->> 'role' = 'service_role' or 
  exists (select 1 from profiles where id = auth.uid() and email = 'arpit@arpitlabs.com')
);
create policy "System can insert domain mappings" on content_domain_mapping for insert with check (
  auth.jwt() ->> 'role' = 'service_role'
);

-- 9. CREATE VIEWS FOR DOMAIN ANALYTICS
create or replace view domain_content_statistics as
select 
  ed.id as domain_id,
  ed.name as domain_name,
  ed.slug as domain_slug,
  ed.icon as domain_icon,
  ed.color as domain_color,
  ed.description as domain_description,
  count(case when cdm.content_type = 'project' then 1 end) as total_projects,
  count(case when cdm.content_type = 'research_paper' then 1 end) as total_research_papers,
  count(case when cdm.content_type = 'dataset' then 1 end) as total_datasets,
  count(case when cdm.content_type = 'learning_resource' then 1 end) as total_learning_resources,
  count(case when cdm.content_type = 'hackathon' then 1 end) as total_hackathons,
  count(case when cdm.content_type = 'contributor' then 1 end) as total_contributors,
  count(cdm.id) as total_content,
  avg(cdm.confidence_score) as avg_confidence_score
from engineering_domains ed
left join content_domain_mapping cdm on ed.id = cdm.domain_id
group by ed.id, ed.name, ed.slug, ed.icon, ed.color, ed.description
order by ed.name;

create or replace view subdomain_content_statistics as
select 
  es.id as subdomain_id,
  es.name as subdomain_name,
  es.slug as subdomain_slug,
  es.description as subdomain_description,
  ed.id as domain_id,
  ed.name as domain_name,
  ed.slug as domain_slug,
  ed.icon as domain_icon,
  ed.color as domain_color,
  count(cdm.id) as total_content,
  avg(cdm.confidence_score) as avg_confidence_score
from engineering_subdomains es
join engineering_domains ed on es.domain_id = ed.id
left join content_domain_mapping cdm on es.id = cdm.subdomain_id
group by es.id, es.name, es.slug, es.description, ed.id, ed.name, ed.slug, ed.icon, ed.color
order by ed.name, es.name;

-- 10. CREATE HELPER FUNCTIONS
create or replace function classify_content_for_domain(
  p_content_id uuid,
  p_content_type text,
  p_domain_id uuid,
  p_subdomain_id uuid default null,
  p_confidence_score numeric default 0.8
) returns uuid as $$
declare
  mapping_id uuid;
begin
  insert into content_domain_mapping (content_id, content_type, domain_id, subdomain_id, confidence_score)
  values (p_content_id, p_content_type, p_domain_id, p_subdomain_id, p_confidence_score)
  returning id into mapping_id;
  
  return mapping_id;
end;
$$ language plpgsql security definer;

create or replace function get_content_by_domain(p_domain_slug text)
returns table (
  content_id uuid,
  content_type text,
  domain_id uuid,
  domain_name text,
  subdomain_id uuid,
  subdomain_name text,
  confidence_score numeric
) as $$
begin
  return query
  select 
    cdm.content_id,
    cdm.content_type,
    cdm.domain_id,
    ed.name as domain_name,
    cdm.subdomain_id,
    es.name as subdomain_name,
    cdm.confidence_score
  from content_domain_mapping cdm
  join engineering_domains ed on cdm.domain_id = ed.id
  left join engineering_subdomains es on cdm.subdomain_id = es.id
  where ed.slug = p_domain_slug
  order by cdm.confidence_score desc;
end;
$$ language plpgsql;

-- 11. ADD COMMENTS FOR DOCUMENTATION
comment on table engineering_domains is 'Core engineering domains for Arpit Labs hierarchical classification system';
comment on table engineering_subdomains is 'Hierarchical subdomains within each engineering domain';
comment on table content_domain_mapping is 'AI-powered classification mapping content to domains and subdomains';

comment on column content_domain_mapping.confidence_score is 'AI classification confidence (0.0 to 1.0)';
comment on column content_domain_mapping.content_type is 'Type of content: project, research_paper, dataset, learning_resource, hackathon, contributor';

-- Migration complete
