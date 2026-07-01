-- Phase 2B: Universal Project System MVP
-- This migration creates the enhanced project system with all required tables, fields, and policies

-- =====================================================
-- STEP 1: ENHANCE PROJECTS TABLE
-- =====================================================

-- Add new columns to existing projects table
alter table if exists public.projects
  add column if not exists project_type text check (project_type in ('software', 'hardware', 'research', 'opensource', 'hackathon', 'hybrid')),
  add column if not exists branch text,
  add column if not exists domain text,
  add column if not exists category text,
  add column if not exists technologies jsonb default '{}',
  add column if not exists languages jsonb default '{}',
  add column if not exists frameworks jsonb default '{}',
  add column if not exists tools jsonb default '{}',
  add column if not exists owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists organization_id uuid,
  add column if not exists status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  add column if not exists featured boolean default false,
  add column if not exists views_count integer default 0,
  add column if not exists likes_count integer default 0,
  add column if not exists updated_at timestamptz not null default now();

-- Update existing records to have default values
update public.projects
set 
  project_type = 'software',
  status = case when published = true then 'published' else 'draft' end,
  updated_at = now()
where project_type is null;

-- =====================================================
-- STEP 2: CREATE PROJECT_MEDIA TABLE
-- =====================================================

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'document', 'video')),
  file_url text not null,
  file_name text,
  file_size integer,
  mime_type text,
  alt_text text,
  caption text,
  order_index integer default 0,
  created_at timestamptz not null default now()
);

-- =====================================================
-- STEP 3: CREATE PROJECT_CONTRIBUTORS TABLE
-- =====================================================

create table if not exists public.project_contributors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'contributor' check (role in ('owner', 'maintainer', 'contributor', 'collaborator')),
  contribution_type text[] default '{}',
  joined_at timestamptz not null default now(),
  unique(project_id, user_id)
);

-- =====================================================
-- STEP 4: CREATE PROJECT_TAGS TABLE
-- =====================================================

create table if not exists public.project_tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(project_id, tag)
);

-- =====================================================
-- STEP 5: CREATE INDEXES
-- =====================================================

-- Projects table indexes
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_type on public.projects(project_type);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_projects_featured on public.projects(featured, status) where featured = true and status = 'published';
create index if not exists idx_projects_created on public.projects(created_at desc);
create index if not exists idx_projects_domain on public.projects(domain);
create index if not exists idx_projects_category on public.projects(category);

-- JSONB indexes for projects
create index if not exists idx_projects_technologies on public.projects using gin(technologies);
create index if not exists idx_projects_languages on public.projects using gin(languages);
create index if not exists idx_projects_frameworks on public.projects using gin(frameworks);
create index if not exists idx_projects_tools on public.projects using gin(tools);

-- Project media indexes
create index if not exists idx_project_media_project on public.project_media(project_id);
create index if not exists idx_project_media_type on public.project_media(media_type);

-- Project contributors indexes
create index if not exists idx_project_contributors_project on public.project_contributors(project_id);
create index if not exists idx_project_contributors_user on public.project_contributors(user_id);

-- Project tags indexes
create index if not exists idx_project_tags_project on public.project_tags(project_id);
create index if not exists idx_project_tags_tag on public.project_tags(tag);

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Function to update updated_at column
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for projects table
drop trigger if exists update_projects_updated_at on public.projects;
create trigger update_projects_updated_at
  before update on public.projects
  for each row
  execute function public.update_updated_at_column();

-- =====================================================
-- STEP 7: UPDATE RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
alter table if exists public.project_media enable row level security;
alter table if exists public.project_contributors enable row level security;
alter table if exists public.project_tags enable row level security;

-- Drop existing policies if they exist
drop policy if exists "public can read published projects" on public.projects;
drop policy if exists "admins manage projects" on public.projects;

-- Projects policies
create policy "public can read published projects"
on public.projects
for select
using (status = 'published' or public.is_admin());

create policy "owners can manage their projects"
on public.projects
for all
using (auth.uid() = owner_id or public.is_admin())
with check (auth.uid() = owner_id or public.is_admin());

create policy "authenticated can insert projects"
on public.projects
for insert
with check (auth.uid() is not null);

-- Project media policies
create policy "public can read media from published projects"
on public.project_media
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_media.project_id 
    and projects.status = 'published'
  ) or public.is_admin()
);

create policy "owners can manage project media"
on public.project_media
for all
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_media.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.projects 
    where projects.id = project_media.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
);

-- Project contributors policies
create policy "public can read contributors from published projects"
on public.project_contributors
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_contributors.project_id 
    and projects.status = 'published'
  ) or public.is_admin()
);

create policy "owners can manage project contributors"
on public.project_contributors
for all
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_contributors.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.projects 
    where projects.id = project_contributors.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
);

-- Project tags policies
create policy "public can read tags from published projects"
on public.project_tags
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_tags.project_id 
    and projects.status = 'published'
  ) or public.is_admin()
);

create policy "owners can manage project tags"
on public.project_tags
for all
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_tags.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.projects 
    where projects.id = project_tags.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
);

-- =====================================================
-- STEP 8: CREATE STORAGE BUCKETS
-- =====================================================

-- Create storage buckets for project media
do $$
begin
  insert into storage.buckets (id, name, public)
  values
    ('project-images', 'project-images', true),
    ('project-documents', 'project-documents', true),
    ('project-videos', 'project-videos', true)
  on conflict (id) do nothing;
exception
  when undefined_table then
    null;
end $$;

-- Storage policies for project-images bucket
create policy if not exists "public can view project images"
on storage.objects for select
using (bucket_id = 'project-images');

create policy if not exists "authenticated can upload project images"
on storage.objects for insert
with check (
  bucket_id = 'project-images' and 
  auth.uid() is not null
);

create policy if not exists "owners can delete project images"
on storage.objects for delete
using (
  bucket_id = 'project-images' and
  (
    auth.uid() is not null or
    public.is_admin()
  )
);

-- Storage policies for project-documents bucket
create policy if not exists "public can view project documents"
on storage.objects for select
using (bucket_id = 'project-documents');

create policy if not exists "authenticated can upload project documents"
on storage.objects for insert
with check (
  bucket_id = 'project-documents' and 
  auth.uid() is not null
);

create policy if not exists "owners can delete project documents"
on storage.objects for delete
using (
  bucket_id = 'project-documents' and
  (
    auth.uid() is not null or
    public.is_admin()
  )
);

-- Storage policies for project-videos bucket
create policy if not exists "public can view project videos"
on storage.objects for select
using (bucket_id = 'project-videos');

create policy if not exists "authenticated can upload project videos"
on storage.objects for insert
with check (
  bucket_id = 'project-videos' and 
  auth.uid() is not null
);

create policy if not exists "owners can delete project videos"
on storage.objects for delete
using (
  bucket_id = 'project-videos' and
  (
    auth.uid() is not null or
    public.is_admin()
  )
);

-- =====================================================
-- STEP 9: MIGRATE EXISTING DATA
-- =====================================================

-- Migrate existing tech_stack to technologies jsonb
update public.projects
set technologies = jsonb_build_object(
  'stack', tech_stack
)
where technologies = '{}' and tech_stack is not null and array_length(tech_stack, 1) > 0;

-- Migrate existing screenshots to project_media
insert into public.project_media (project_id, media_type, file_url, file_name, order_index, created_at)
select 
  id as project_id,
  'image' as media_type,
  unnest(screenshots) as file_url,
  split_part(unnest(screenshots), '/', -1) as file_name,
  generate_subscripts(screenshots, 1) as order_index,
  now() as created_at
from public.projects
where screenshots is not null and array_length(screenshots, 1) > 0
on conflict do nothing;
