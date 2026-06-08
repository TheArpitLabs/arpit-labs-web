-- Phase 2C: Project Analytics & Engagement Tracking
-- This migration adds tables for tracking individual user interactions with projects

-- =====================================================
-- STEP 1: CREATE PROJECT LIKES TABLE
-- =====================================================

create table if not exists public.project_likes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

-- =====================================================
-- STEP 2: CREATE PROJECT BOOKMARKS TABLE
-- =====================================================

create table if not exists public.project_bookmarks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

-- =====================================================
-- STEP 3: CREATE PROJECT VIEWS TABLE
-- =====================================================

create table if not exists public.project_views (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- STEP 4: CREATE INDEXES
-- =====================================================

-- Project likes indexes
create index if not exists idx_project_likes_project on public.project_likes(project_id);
create index if not exists idx_project_likes_user on public.project_likes(user_id);
create index if not exists idx_project_likes_created on public.project_likes(created_at desc);

-- Project bookmarks indexes
create index if not exists idx_project_bookmarks_project on public.project_bookmarks(project_id);
create index if not exists idx_project_bookmarks_user on public.project_bookmarks(user_id);
create index if not exists idx_project_bookmarks_created on public.project_bookmarks(created_at desc);

-- Project views indexes
create index if not exists idx_project_views_project on public.project_views(project_id);
create index if not exists idx_project_views_user on public.project_views(user_id);
create index if not exists idx_project_views_created on public.project_views(created_at desc);
create index if not exists idx_project_views_session on public.project_views(session_id);

-- =====================================================
-- STEP 5: CREATE FUNCTIONS FOR UPDATING COUNTS
-- =====================================================

-- Function to update likes count when a like is added/removed
create or replace function public.update_project_likes_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.projects
    set likes_count = likes_count + 1
    where id = new.project_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.projects
    set likes_count = greatest(likes_count - 1, 0)
    where id = old.project_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

-- Function to update views count when a view is recorded
create or replace function public.update_project_views_count()
returns trigger as $$
begin
  update public.projects
  set views_count = views_count + 1
  where id = new.project_id;
  return new;
end;
$$ language plpgsql;

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Trigger for project likes
drop trigger if exists update_likes_count on public.project_likes;
create trigger update_likes_count
  after insert or delete on public.project_likes
  for each row
  execute function public.update_project_likes_count();

-- Trigger for project views
drop trigger if exists update_views_count on public.project_views;
create trigger update_views_count
  after insert on public.project_views
  for each row
  execute function public.update_project_views_count();

-- =====================================================
-- STEP 7: ENABLE RLS AND CREATE POLICIES
-- =====================================================

alter table if exists public.project_likes enable row level security;
alter table if exists public.project_bookmarks enable row level security;
alter table if exists public.project_views enable row level security;

-- Project likes policies
create policy "public can view project likes"
on public.project_likes
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_likes.project_id 
    and projects.status = 'published'
  )
);

create policy "users can manage their likes"
on public.project_likes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Project bookmarks policies
create policy "public can view project bookmarks"
on public.project_bookmarks
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_bookmarks.project_id 
    and projects.status = 'published'
  )
);

create policy "users can manage their bookmarks"
on public.project_bookmarks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Project views policies
create policy "public can view project views"
on public.project_views
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_views.project_id 
    and projects.status = 'published'
  )
);

create policy "anyone can record project views"
on public.project_views
for insert
with check (true);

-- =====================================================
-- STEP 8: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has liked a project
create or replace function public.has_user_liked(p_project_id uuid, p_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.project_likes
    where project_id = p_project_id
    and user_id = p_user_id
  );
end;
$$ language plpgsql security definer;

-- Function to check if user has bookmarked a project
create or replace function public.has_user_bookmarked(p_project_id uuid, p_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.project_bookmarks
    where project_id = p_project_id
    and user_id = p_user_id
  );
end;
$$ language plpgsql security definer;

-- Function to get trending projects (based on recent engagement)
create or replace function public.get_trending_projects(p_limit integer default 6)
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  cover_image text,
  project_type text,
  branch text,
  views_count integer,
  likes_count integer,
  created_at timestamptz,
  trending_score float
) as $$
begin
  return query
  select 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.cover_image,
    p.project_type,
    p.branch,
    p.views_count,
    p.likes_count,
    p.created_at,
    (
      -- Calculate trending score: recent views + recent likes * 2
      (select count(*) from public.project_views pv where pv.project_id = p.id and pv.created_at > now() - interval '7 days') +
      (select count(*) from public.project_likes pl where pl.project_id = p.id and pl.created_at > now() - interval '7 days') * 2
    ) as trending_score
  from public.projects p
  where p.status = 'published'
  order by trending_score desc, p.created_at desc
  limit p_limit;
end;
$$ language plpgsql security definer;
