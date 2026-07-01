-- Arpit Labs Supabase Schema (Production CMS)

-- Extensions
create extension if not exists "pgcrypto";

-- PROJECTS TABLE
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  overview text,
  problem_statement text,
  architecture text,
  tech_stack text[] default array[]::text[],
  github_url text,
  demo_url text,
  cover_image text,
  screenshots text[] default array[]::text[],
  lessons_learned text,
  tags text[] default array[]::text[],
  featured boolean default false,
  published boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EXPERIMENTS TABLE
create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  content text,
  category text,
  difficulty text, -- beginner, intermediate, advanced
  tech_stack text[] default array[]::text[],
  status text not null default 'draft', -- draft, completed, in-progress
  featured boolean default false,
  published boolean default false,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- BLOG TABLE (formerly lab_notes)
create table if not exists lab_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  category text,
  cover_image text,
  tags text[] default array[]::text[],
  published boolean default false,
  reading_time integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- JOURNEY TABLE
create table if not exists journey (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  title text not null,
  description text not null,
  entry_type text not null default 'work', -- work, education, achievement, milestone
  organization text,
  location text,
  icon text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CONTACT MESSAGES TABLE
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz not null default now()
);

-- NEWSLETTER SUBSCRIBERS TABLE
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz not null default now()
);

-- RLS (Row Level Security)
-- Note: Admin access should be handled via Supabase Auth and appropriate policies.
-- These are basic policies assuming public read for published content and admin-only write.

-- Ensure published column exists in existing tables
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'projects' and column_name = 'published'
  ) then
    alter table projects add column published boolean default false;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'experiments' and column_name = 'published'
  ) then
    alter table experiments add column published boolean default false;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'lab_notes' and column_name = 'published'
  ) then
    alter table lab_notes add column published boolean default false;
  end if;
end $$;

alter table projects enable row level security;
alter table experiments enable row level security;
alter table lab_notes enable row level security;
alter table journey enable row level security;
alter table contact_messages enable row level security;
alter table newsletter_subscribers enable row level security;

-- Public read access for published items
drop policy if exists "Public can view published projects" on projects;
create policy "Public can view published projects" on projects for select using (published = true);
drop policy if exists "Public can view published experiments" on experiments;
create policy "Public can view published experiments" on experiments for select using (published = true);
drop policy if exists "Public can view published blog posts" on lab_notes;
create policy "Public can view published blog posts" on lab_notes for select using (published = true);
drop policy if exists "Public can view journey" on journey;
create policy "Public can view journey" on journey for select using (true);

-- Admin policies (requires admin role or specific email)
-- Replace 'your-admin-email@example.com' with actual admin email if not using roles
drop policy if exists "Admins have full access to projects" on projects;
create policy "Admins have full access to projects" on projects for all using (auth.role() = 'authenticated');
drop policy if exists "Admins have full access to experiments" on experiments;
create policy "Admins have full access to experiments" on experiments for all using (auth.role() = 'authenticated');
drop policy if exists "Admins have full access to lab_notes" on lab_notes;
create policy "Admins have full access to lab_notes" on lab_notes for all using (auth.role() = 'authenticated');
drop policy if exists "Admins have full access to journey" on journey;
create policy "Admins have full access to journey" on journey for all using (auth.role() = 'authenticated');
drop policy if exists "Admins have full access to contact_messages" on contact_messages;
create policy "Admins have full access to contact_messages" on contact_messages for all using (auth.role() = 'authenticated');
drop policy if exists "Admins have full access to newsletter_subscribers" on newsletter_subscribers;
create policy "Admins have full access to newsletter_subscribers" on newsletter_subscribers for all using (auth.role() = 'authenticated');

-- Public insert for contact messages and newsletter
drop policy if exists "Anyone can send a message" on contact_messages;
create policy "Anyone can send a message" on contact_messages for insert with check (true);
drop policy if exists "Anyone can subscribe to newsletter" on newsletter_subscribers;
create policy "Anyone can subscribe to newsletter" on newsletter_subscribers for insert with check (true);

-- PROFILES TABLE
create table if not exists profiles (
  id uuid primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  github_url text,
  linkedin_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SAVED CONTENT TABLE
create table if not exists saved_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content_type text not null,
  content_id uuid not null,
  created_at timestamptz not null default now()
);

-- Enable RLS and policies for profiles and saved_content
alter table profiles enable row level security;
alter table saved_content enable row level security;

-- Profiles policies: users can manage their own profile
drop policy if exists "Users can view their profile" on profiles;
create policy "Users can view their profile" on profiles for select using (auth.uid() = id);
drop policy if exists "Users can insert their profile" on profiles;
create policy "Users can insert their profile" on profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update their profile" on profiles;
create policy "Users can update their profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- Service role bypass for profile operations
drop policy if exists "Service role can manage profiles" on profiles;
create policy "Service role can manage profiles" on profiles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Saved content policies: users can manage their saved items
drop policy if exists "Users can view their saved content" on saved_content;
create policy "Users can view their saved content" on saved_content for select using (auth.uid() = user_id);
drop policy if exists "Users can insert saved content" on saved_content;
create policy "Users can insert saved content" on saved_content for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete their saved content" on saved_content;
create policy "Users can delete their saved content" on saved_content for delete using (auth.uid() = user_id);

-- ============================================================================
-- PHASE 8: LEARNING PLATFORM & COMMUNITY
-- ============================================================================

-- COURSES TABLE
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  content text,
  category text not null,
  difficulty text not null,
  duration integer not null,
  thumbnail text,
  published boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure published column exists (for existing tables)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'courses' and column_name = 'published'
  ) then
    alter table courses add column published boolean default false;
  end if;
end $$;

-- COURSE MODULES TABLE
create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  content text not null,
  order_index integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LABS TABLE
create table if not exists labs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  instructions text not null,
  difficulty text not null,
  category text not null,
  published boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure published column exists (for existing tables)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'labs' and column_name = 'published'
  ) then
    alter table labs add column published boolean default false;
  end if;
end $$;

-- ROADMAPS TABLE
create table if not exists roadmaps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  category text not null,
  content text not null,
  published boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure published column exists (for existing tables)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'roadmaps' and column_name = 'published'
  ) then
    alter table roadmaps add column published boolean default false;
  end if;
end $$;

-- USER COURSE PROGRESS TABLE
create table if not exists user_course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  progress_percentage integer not null default 0,
  completed boolean default false,
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

-- COMMUNITY POSTS TABLE
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  content text not null,
  category text,
  tags text[] default '{}',
  views integer not null default 0,
  upvotes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COMMUNITY REPLIES TABLE
create table if not exists community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- COMMUNITY VOTES TABLE
create table if not exists community_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  vote_type text not null,
  created_at timestamptz not null default now(),
  constraint unique_vote_per_user_per_post unique (post_id, user_id)
);

-- MEMBERSHIP PLANS TABLE
create table if not exists membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  monthly_price numeric not null default 0,
  yearly_price numeric not null default 0,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- USER SUBSCRIPTIONS TABLE
create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid not null references membership_plans(id) on delete restrict,
  status text not null default 'active',
  billing_cycle text not null default 'monthly',
  start_date timestamptz not null default now(),
  end_date timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

-- FEATURE ACCESS TABLE
create table if not exists feature_access (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references membership_plans(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false
);

-- ============================================================================
-- PHASE 8: INDEXES
-- ============================================================================

do $$
begin
  if to_regclass('public.courses') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'courses' and column_name = 'slug') then
      alter table courses add column slug text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'courses' and column_name = 'published') then
      alter table courses add column published boolean default false;
    end if;
  end if;

  if to_regclass('public.labs') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'labs' and column_name = 'slug') then
      alter table labs add column slug text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'labs' and column_name = 'published') then
      alter table labs add column published boolean default false;
    end if;
  end if;

  if to_regclass('public.roadmaps') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'roadmaps' and column_name = 'slug') then
      alter table roadmaps add column slug text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'roadmaps' and column_name = 'published') then
      alter table roadmaps add column published boolean default false;
    end if;
  end if;

  if to_regclass('public.community_posts') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_posts' and column_name = 'slug') then
      alter table community_posts add column slug text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_posts' and column_name = 'tags') then
      alter table community_posts add column tags text[] default '{}'::text[];
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_posts' and column_name = 'views') then
      alter table community_posts add column views integer not null default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_posts' and column_name = 'upvotes') then
      alter table community_posts add column upvotes integer not null default 0;
    end if;
  end if;

  if to_regclass('public.membership_plans') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'membership_plans' and column_name = 'slug') then
      alter table membership_plans add column slug text;
    end if;
  end if;

  if to_regclass('public.community_chapters') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_chapters' and column_name = 'slug') then
      alter table community_chapters add column slug text;
    end if;
  end if;

  if to_regclass('public.community_collaborations') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'collaboration_type') then
      alter table community_collaborations add column collaboration_type text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'slug') then
      alter table community_collaborations add column slug text;
    end if;
  end if;

  if to_regclass('public.community_gallery') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_gallery' and column_name = 'slug') then
      alter table community_gallery add column slug text;
    end if;
  end if;

  if to_regclass('public.startups') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'startups' and column_name = 'slug') then
      alter table startups add column slug text;
    end if;
  end if;

  if to_regclass('public.innovation_challenges') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_challenges' and column_name = 'slug') then
      alter table innovation_challenges add column slug text;
    end if;
  end if;

  if to_regclass('public.certifications') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'certifications' and column_name = 'slug') then
      alter table certifications add column slug text;
    end if;
  end if;

  if to_regclass('public.innovation_resources') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_resources' and column_name = 'slug') then
      alter table innovation_resources add column slug text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_resources' and column_name = 'published') then
      alter table innovation_resources add column published boolean default true;
    end if;
  end if;

  if to_regclass('public.innovation_success_stories') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_success_stories' and column_name = 'slug') then
      alter table innovation_success_stories add column slug text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_success_stories' and column_name = 'published') then
      alter table innovation_success_stories add column published boolean default true;
    end if;
  end if;
end $$;

drop index if exists idx_courses_category;
create index idx_courses_category on courses(category);
drop index if exists idx_courses_published;
create index idx_courses_published on courses(published);
drop index if exists idx_courses_slug;
create index idx_courses_slug on courses(slug);
drop index if exists idx_course_modules_course_id;
create index idx_course_modules_course_id on course_modules(course_id);
drop index if exists idx_course_modules_order;
create index idx_course_modules_order on course_modules(order_index);
drop index if exists idx_labs_category;
create index idx_labs_category on labs(category);
drop index if exists idx_labs_published;
create index idx_labs_published on labs(published);
drop index if exists idx_labs_slug;
create index idx_labs_slug on labs(slug);
drop index if exists idx_roadmaps_category;
create index idx_roadmaps_category on roadmaps(category);
drop index if exists idx_roadmaps_published;
create index idx_roadmaps_published on roadmaps(published);
drop index if exists idx_roadmaps_slug;
create index idx_roadmaps_slug on roadmaps(slug);
drop index if exists idx_user_course_progress_user_id;
create index idx_user_course_progress_user_id on user_course_progress(user_id);
drop index if exists idx_user_course_progress_course_id;
create index idx_user_course_progress_course_id on user_course_progress(course_id);
drop index if exists idx_community_posts_slug;
create index idx_community_posts_slug on community_posts(slug);
drop index if exists idx_community_posts_tags;
create index idx_community_posts_tags on community_posts using gin (tags);
drop index if exists idx_membership_plans_slug;
create index idx_membership_plans_slug on membership_plans(slug);
drop index if exists idx_user_subscriptions_user_id;
create index idx_user_subscriptions_user_id on user_subscriptions(user_id);
drop index if exists idx_user_subscriptions_status;
create index idx_user_subscriptions_status on user_subscriptions(status);
drop index if exists idx_feature_access_plan_id;
create index idx_feature_access_plan_id on feature_access(plan_id);
drop index if exists idx_feature_access_plan_feature;
create unique index idx_feature_access_plan_feature on feature_access(plan_id, feature_key);

-- ============================================================================
-- PHASE 8: RLS POLICIES
-- ============================================================================

-- Enable RLS for Phase 8 tables
alter table courses enable row level security;
alter table course_modules enable row level security;
alter table labs enable row level security;
alter table roadmaps enable row level security;
alter table user_course_progress enable row level security;
alter table community_posts enable row level security;
alter table community_replies enable row level security;
alter table community_votes enable row level security;
alter table membership_plans enable row level security;
alter table user_subscriptions enable row level security;
alter table feature_access enable row level security;

-- COURSES POLICIES
drop policy if exists "Public can view published courses" on courses;
create policy "Public can view published courses" on courses for select using (published = true);
drop policy if exists "Authenticated users can manage courses" on courses;
create policy "Authenticated users can manage courses" on courses for all using (auth.role() = 'authenticated');

-- COURSE MODULES POLICIES
drop policy if exists "Public can view modules of published courses" on course_modules;
create policy "Public can view modules of published courses" on course_modules 
  for select using (
    exists(select 1 from courses where courses.id = course_modules.course_id and courses.published = true)
  );
drop policy if exists "Authenticated users can manage modules" on course_modules;
create policy "Authenticated users can manage modules" on course_modules for all using (auth.role() = 'authenticated');

-- LABS POLICIES
drop policy if exists "Public can view published labs" on labs;
create policy "Public can view published labs" on labs for select using (published = true);
drop policy if exists "Authenticated users can manage labs" on labs;
create policy "Authenticated users can manage labs" on labs for all using (auth.role() = 'authenticated');

-- ROADMAPS POLICIES
drop policy if exists "Public can view published roadmaps" on roadmaps;
create policy "Public can view published roadmaps" on roadmaps for select using (published = true);
drop policy if exists "Authenticated users can manage roadmaps" on roadmaps;
create policy "Authenticated users can manage roadmaps" on roadmaps for all using (auth.role() = 'authenticated');

-- USER COURSE PROGRESS POLICIES
drop policy if exists "Users can view their own progress" on user_course_progress;
create policy "Users can view their own progress" on user_course_progress 
  for select using (auth.uid() = user_id);
drop policy if exists "Users can update their own progress" on user_course_progress;
create policy "Users can update their own progress" on user_course_progress 
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can insert their progress" on user_course_progress;
create policy "Users can insert their progress" on user_course_progress 
  for insert with check (auth.uid() = user_id);

-- COMMUNITY POSTS POLICIES
drop policy if exists "public can read community posts" on community_posts;
create policy "public can read community posts" on community_posts for select using (true);
drop policy if exists "users can insert community posts" on community_posts;
create policy "users can insert community posts" on community_posts for insert with check (auth.uid() = user_id);
drop policy if exists "owners or admins manage community posts" on community_posts;
create policy "owners or admins manage community posts" on community_posts for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- COMMUNITY REPLIES POLICIES
drop policy if exists "public can read community replies" on community_replies;
create policy "public can read community replies" on community_replies for select using (true);
drop policy if exists "users can insert community replies" on community_replies;
create policy "users can insert community replies" on community_replies for insert with check (auth.uid() = user_id);
drop policy if exists "owners or admins delete community replies" on community_replies;
create policy "owners or admins delete community replies" on community_replies for delete
  using (auth.uid() = user_id or public.is_admin());

-- COMMUNITY VOTES POLICIES
drop policy if exists "users can insert community votes" on community_votes;
create policy "users can insert community votes" on community_votes for insert with check (auth.uid() = user_id);
drop policy if exists "admins manage community votes" on community_votes;
create policy "admins manage community votes" on community_votes for all using (public.is_admin()) with check (public.is_admin());

-- MEMBERSHIP PLANS POLICIES
drop policy if exists "Public can view membership plans" on membership_plans;
create policy "Public can view membership plans" on membership_plans for select using (active = true or public.is_admin());
drop policy if exists "Admins can manage membership plans" on membership_plans;
create policy "Admins can manage membership plans" on membership_plans for all using (public.is_admin()) with check (public.is_admin());

-- USER SUBSCRIPTIONS POLICIES
drop policy if exists "Users can view their own subscriptions" on user_subscriptions;
create policy "Users can view their own subscriptions" on user_subscriptions for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "Admins can manage user subscriptions" on user_subscriptions;
create policy "Admins can manage user subscriptions" on user_subscriptions for all using (public.is_admin()) with check (public.is_admin());

-- FEATURE ACCESS POLICIES
drop policy if exists "Public can view feature access" on feature_access;
create policy "Public can view feature access" on feature_access for select using (true);
drop policy if exists "Admins can manage feature access" on feature_access;
create policy "Admins can manage feature access" on feature_access for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- PHASE 8: HELPER FUNCTIONS
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
$$;

create or replace function increment_post_upvote_count(p_id uuid)
returns void language sql stable as $$
  update community_posts set upvotes = coalesce(upvotes,0) + 1 where id = p_id;
$$;

create or replace function decrement_post_upvote_count(p_id uuid)
returns void language sql stable as $$
  update community_posts set upvotes = greatest(coalesce(upvotes,0) - 1, 0) where id = p_id;
$$;
-- ============================================================================
-- AXIORA PRODUCTION SCHEMA MIGRATION
-- Phase 9: Complete Innovation & Community Module Tables
-- ============================================================================

-- This migration adds all missing tables for the Innovation and Community modules
-- including proper indexes, RLS policies, and helper functions

-- ============================================================================
-- PART 1: COMMUNITY MODULE TABLES
-- ============================================================================

-- COMMUNITY CHAPTERS TABLE
create table if not exists community_chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country_name text not null,
  city text not null,
  description text,
  ambassador_id uuid references profiles(id) on delete set null,
  member_count integer not null default 0,
  established_date timestamptz not null default now(),
  is_active boolean not null default true,
  logo_url text,
  website_url text,
  social_media jsonb default '{}'::jsonb,
  tags text[] default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COMMUNITY EVENTS TABLE
create table if not exists community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  chapter_id uuid not null references community_chapters(id) on delete cascade,
  description text not null,
  event_type text not null, -- 'meetup', 'webinar', 'workshop', 'conference', 'hackathon'
  status text not null default 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text,
  is_online boolean not null default false,
  online_url text,
  max_attendees integer,
  current_attendees integer not null default 0,
  cover_image text,
  agenda text,
  speakers text[], -- JSON array of speaker info
  registrations_open boolean not null default true,
  tags text[] default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COMMUNITY EVENT REGISTRATIONS TABLE
create table if not exists community_event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references community_events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  attended boolean not null default false,
  unique(event_id, user_id)
);

-- COMMUNITY AMBASSADORS TABLE
create table if not exists community_ambassadors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  chapter_id uuid not null references community_chapters(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected', 'inactive'
  title text, -- Ambassador title/role
  bio text,
  achievements integer not null default 0,
  posts_count integer not null default 0,
  events_organized integer not null default 0,
  reputation_score integer not null default 0,
  badge_level text default 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  applied_at timestamptz not null default now(),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COMMUNITY COLLABORATIONS TABLE
create table if not exists community_collaborations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  created_by uuid not null references profiles(id) on delete cascade,
  collaboration_type text not null, -- 'open-source', 'research', 'product', 'startup', 'learning'
  status text not null default 'open', -- 'open', 'in-progress', 'completed', 'archived'
  skills_required text[] default '{}'::text[],
  team_size_min integer not null default 1,
  team_size_max integer not null default 10,
  members_count integer not null default 0,
  deadline_date timestamptz,
  cover_image text,
  repository_url text,
  project_url text,
  tags text[] default '{}'::text[],
  visibility text not null default 'public', -- 'public', 'private'
  difficulty text default 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COMMUNITY COLLABORATION MEMBERS TABLE
create table if not exists community_collaboration_members (
  id uuid primary key default gen_random_uuid(),
  collaboration_id uuid not null references community_collaborations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'contributor', -- 'lead', 'contributor'
  joined_at timestamptz not null default now(),
  status text not null default 'active', -- 'active', 'inactive'
  contribution_score integer not null default 0,
  unique(collaboration_id, user_id)
);

-- COMMUNITY GALLERY TABLE
create table if not exists community_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null, -- 'project', 'presentation', 'article', 'design', 'tool'
  image_url text,
  content_url text,
  tags text[] default '{}'::text[],
  likes_count integer not null default 0,
  views_count integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COMMUNITY GALLERY LIKES TABLE
create table if not exists community_gallery_likes (
  id uuid primary key default gen_random_uuid(),
  gallery_item_id uuid not null references community_gallery(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(gallery_item_id, user_id)
);

-- COMMUNITY LEADERBOARD TABLE (denormalized for performance)
create table if not exists community_leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  points integer not null default 0,
  rank integer,
  badges text[] default '{}'::text[],
  posts_count integer not null default 0,
  replies_count integer not null default 0,
  upvotes_received integer not null default 0,
  events_attended integer not null default 0,
  collaborations_joined integer not null default 0,
  achievements jsonb default '[]'::jsonb,
  last_updated timestamptz not null default now()
);

-- COMMUNITY NOTIFICATIONS TABLE
create table if not exists community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  notification_type text not null, -- 'reply', 'mention', 'like', 'follow', 'event', 'collaboration'
  related_post_id uuid references community_posts(id) on delete cascade,
  related_event_id uuid references community_events(id) on delete cascade,
  related_collaboration_id uuid references community_collaborations(id) on delete cascade,
  title text not null,
  message text,
  read boolean not null default false,
  action_url text,
  created_at timestamptz not null default now()
);

-- COMMUNITY BOOKMARKS TABLE
create table if not exists community_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, post_id)
);

-- COMMUNITY MENTORS TABLE
create table if not exists community_mentors (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null unique references profiles(id) on delete cascade,
  expertise_areas text[] not null,
  bio text,
  hourly_rate numeric,
  availability_status text not null default 'available', -- 'available', 'busy', 'unavailable'
  mentees_count integer not null default 0,
  rating numeric(3, 2) default 5.0,
  reviews_count integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MENTORSHIP REQUESTS TABLE
create table if not exists mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references profiles(id) on delete cascade,
  mentor_id uuid not null references community_mentors(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'accepted', 'rejected', 'active', 'completed'
  topic text not null,
  description text,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  session_count integer not null default 0
);

-- ============================================================================
-- PART 2: INNOVATION MODULE TABLES
-- ============================================================================

-- STARTUPS TABLE
create table if not exists startups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique not null,
  description text not null,
  long_description text,
  founder_id uuid references profiles(id) on delete set null,
  founded_date date,
  stage text not null, -- 'idea', 'mvp', 'funded', 'growth', 'acquired'
  industry text,
  subindustry text,
  tech_stack text[] default '{}'::text[],
  team_size integer,
  website_url text,
  github_url text,
  demo_url text,
  logo_url text,
  cover_image text,
  gallery_images text[] default '{}'::text[],
  social_media jsonb default '{}'::jsonb,
  funding_amount numeric,
  funding_stage text, -- 'seed', 'series-a', 'series-b', etc
  funding_date date,
  investors text[] default '{}'::text[],
  tags text[] default '{}'::text[],
  featured boolean not null default false,
  public boolean not null default true,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- INNOVATION INCUBATION PROGRAMS TABLE
create table if not exists innovation_incubation_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  content text,
  program_type text not null, -- 'accelerator', 'incubator', 'bootcamp'
  status text not null default 'open', -- 'open', 'closed', 'archived'
  batch_number integer not null,
  start_date date not null,
  end_date date not null,
  max_startups integer not null default 10,
  accepted_startups integer not null default 0,
  requirements text,
  benefits jsonb default '[]'::jsonb,
  mentors_assigned text[] default '{}'::text[],
  cover_image text,
  difficulty_level text default 'beginner', -- 'beginner', 'intermediate', 'advanced'
  investment_amount numeric,
  equity_stake numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- INCUBATION APPLICATIONS TABLE
create table if not exists incubation_applications (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references innovation_incubation_programs(id) on delete cascade,
  startup_id uuid references startups(id) on delete set null,
  founder_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'submitted', -- 'submitted', 'under-review', 'accepted', 'rejected', 'withdrawn'
  company_name text not null,
  company_description text not null,
  problem_statement text not null,
  solution_description text not null,
  target_market text,
  pitch_deck_url text,
  video_url text,
  team_members jsonb default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_feedback text,
  decision_date timestamptz
);

-- INNOVATION CHALLENGES TABLE
create table if not exists innovation_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  challenge_type text not null, -- 'coding', 'design', 'business', 'ml', 'sustainability'
  difficulty_level text not null, -- 'beginner', 'intermediate', 'advanced'
  status text not null default 'open', -- 'open', 'in-progress', 'judging', 'completed', 'archived'
  start_date timestamptz not null,
  end_date timestamptz not null,
  problem_statement text not null,
  requirements text,
  prize_pool numeric,
  total_prize_money numeric,
  prizes jsonb default '[]'::jsonb, -- [{place: 1, amount: 5000, title: "First Prize"}]
  max_participants integer,
  current_participants integer not null default 0,
  submissions_count integer not null default 0,
  tags text[] default '{}'::text[],
  cover_image text,
  resources jsonb default '[]'::jsonb, -- [{title, url, type}]
  featured boolean not null default false,
  judging_criteria jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CHALLENGE SUBMISSIONS TABLE
create table if not exists challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references innovation_challenges(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  team_id uuid,
  title text not null,
  description text,
  submission_url text not null,
  github_url text,
  demo_url text,
  documentation_url text,
  screenshot_url text,
  submission_date timestamptz not null default now(),
  score numeric(5, 2),
  ranking integer,
  status text not null default 'submitted', -- 'submitted', 'under-review', 'disqualified', 'winner'
  feedback text,
  reviewed_at timestamptz
);

-- INNOVATION METRICS TABLE
create table if not exists innovation_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null unique,
  active_startups integer not null default 0,
  incubated_projects integer not null default 0,
  total_funding numeric not null default 0,
  mentors_active integer not null default 0,
  challenges_active integer not null default 0,
  community_members_innovation integer not null default 0,
  applications_received integer not null default 0,
  projects_deployed integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- PART 3: RESEARCH & EDUCATION TABLES
-- ============================================================================

-- RESEARCH PAPERS TABLE
create table if not exists research_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  authors text[] not null,
  abstract text not null,
  content text,
  division text, -- 'ai', 'ml', 'iot', 'cybersecurity', 'blockchain'
  published_date date,
  doi text unique,
  pdf_url text,
  dataset_id uuid,
  tags text[] default '{}'::text[],
  citations_count integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RESEARCH DATASETS TABLE
create table if not exists research_datasets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  creator_id uuid references profiles(id) on delete set null,
  data_type text, -- 'csv', 'json', 'sql', 'images', 'audio', 'video'
  file_size integer, -- in bytes
  download_url text,
  license text,
  tags text[] default '{}'::text[],
  downloads_count integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CERTIFICATIONS TABLE
create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  provider text,
  level text not null, -- 'beginner', 'intermediate', 'advanced', 'expert'
  duration_hours integer,
  price numeric,
  prerequisites text,
  skills_covered text[] default '{}'::text[],
  industry text,
  badge_url text,
  official_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CERTIFICATION EXAMS TABLE
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid not null references certifications(id) on delete cascade,
  title text not null,
  description text,
  duration_minutes integer not null,
  passing_score numeric not null,
  total_questions integer not null,
  question_types text[] default '{}'::text[],
  status text not null default 'active', -- 'active', 'archived', 'draft'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- USER CERTIFICATION PROGRESS TABLE
create table if not exists user_certification_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  certification_id uuid not null references certifications(id) on delete cascade,
  status text not null default 'enrolled', -- 'enrolled', 'in-progress', 'completed', 'failed'
  progress_percentage integer not null default 0,
  enrolled_date timestamptz not null default now(),
  completed_date timestamptz,
  certificate_url text,
  score numeric(5, 2),
  unique(user_id, certification_id)
);

-- ============================================================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ============================================================================

-- COMMUNITY CHAPTERS INDEXES
create index if not exists idx_chapters_country on community_chapters(country_name);
create index if not exists idx_chapters_city on community_chapters(city);
create index if not exists idx_chapters_slug on community_chapters(slug);
create index if not exists idx_chapters_active on community_chapters(is_active);
create index if not exists idx_chapters_ambassador on community_chapters(ambassador_id);

-- COMMUNITY EVENTS INDEXES
alter table community_events
  add column if not exists mode text not null default 'offline',
  add column if not exists is_online boolean not null default false,
  add column if not exists online_url text,
  add column if not exists max_attendees integer,
  add column if not exists current_attendees integer not null default 0,
  add column if not exists cover_image text,
  add column if not exists agenda text,
  add column if not exists speakers text[],
  add column if not exists registrations_open boolean not null default true,
  add column if not exists tags text[] default '{}'::text[],
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_events_chapter on community_events(chapter_id);
create index if not exists idx_events_status on community_events(status);
create index if not exists idx_events_date on community_events(start_date);
create index if not exists idx_events_slug on community_events(slug);
create index if not exists idx_events_online on community_events(is_online);

-- COMMUNITY AMBASSADORS INDEXES
alter table community_ambassadors
  add column if not exists reputation_score integer not null default 0;

create index if not exists idx_ambassadors_user on community_ambassadors(user_id);
create index if not exists idx_ambassadors_chapter on community_ambassadors(chapter_id);
create index if not exists idx_ambassadors_status on community_ambassadors(status);
create index if not exists idx_ambassadors_reputation on community_ambassadors(reputation_score);

-- COMMUNITY COLLABORATIONS INDEXES
create index if not exists idx_collaborations_creator on community_collaborations(created_by);
create index if not exists idx_collaborations_status on community_collaborations(status);

if to_regclass('public.community_collaborations') is not null then
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'slug') then
    execute 'create index if not exists idx_collaborations_slug on public.community_collaborations(slug)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'collaboration_type') then
    execute 'create index if not exists idx_collaborations_type on public.community_collaborations(collaboration_type)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'tags') then
    execute 'create index if not exists idx_collaborations_tags on public.community_collaborations using gin(tags)';
  end if;
end if;

-- COMMUNITY GALLERY INDEXES
create index if not exists idx_gallery_user on community_gallery(user_id);
create index if not exists idx_gallery_category on community_gallery(category);
create index if not exists idx_gallery_featured on community_gallery(featured);
create index if not exists idx_gallery_tags on community_gallery using gin(tags);

-- COMMUNITY LEADERBOARD INDEXES
create index if not exists idx_leaderboard_points on community_leaderboard(points desc);
create index if not exists idx_leaderboard_rank on community_leaderboard(rank);

-- COMMUNITY NOTIFICATIONS INDEXES
create index if not exists idx_notifications_user on community_notifications(user_id);
create index if not exists idx_notifications_read on community_notifications(read);
create index if not exists idx_notifications_type on community_notifications(notification_type);
create index if not exists idx_notifications_created on community_notifications(created_at desc);

-- COMMUNITY BOOKMARKS INDEXES
create index if not exists idx_bookmarks_user on community_bookmarks(user_id);
create index if not exists idx_bookmarks_post on community_bookmarks(post_id);

-- COMMUNITY MENTORS INDEXES
create index if not exists idx_mentors_availability on community_mentors(availability_status);
create index if not exists idx_mentors_verified on community_mentors(verified);
create index if not exists idx_mentors_rating on community_mentors(rating desc);

-- STARTUPS INDEXES
create index if not exists idx_startups_slug on startups(slug);
create index if not exists idx_startups_stage on startups(stage);
create index if not exists idx_startups_founder on startups(founder_id);
create index if not exists idx_startups_featured on startups(featured);
create index if not exists idx_startups_tags on startups using gin(tags);

-- INNOVATION CHALLENGES INDEXES
create index if not exists idx_challenges_status on innovation_challenges(status);
create index if not exists idx_challenges_type on innovation_challenges(challenge_type);
create index if not exists idx_challenges_slug on innovation_challenges(slug);
create index if not exists idx_challenges_featured on innovation_challenges(featured);
create index if not exists idx_challenges_end_date on innovation_challenges(end_date);

-- CHALLENGE SUBMISSIONS INDEXES
create index if not exists idx_submissions_challenge on challenge_submissions(challenge_id);
create index if not exists idx_submissions_user on challenge_submissions(user_id);
create index if not exists idx_submissions_status on challenge_submissions(status);

-- CERTIFICATIONS INDEXES
create index if not exists idx_certifications_slug on certifications(slug);
create index if not exists idx_certifications_level on certifications(level);

-- ============================================================================
-- PART 5: ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- Enable RLS on all new tables
alter table community_chapters enable row level security;
alter table community_events enable row level security;
alter table community_event_registrations enable row level security;
alter table community_ambassadors enable row level security;
alter table community_collaborations enable row level security;
alter table community_collaboration_members enable row level security;
alter table community_gallery enable row level security;
alter table community_gallery_likes enable row level security;
alter table community_leaderboard enable row level security;
alter table community_notifications enable row level security;
alter table community_bookmarks enable row level security;
alter table community_mentors enable row level security;
alter table mentorship_requests enable row level security;

alter table startups enable row level security;
alter table innovation_incubation_programs enable row level security;
alter table incubation_applications enable row level security;
alter table innovation_challenges enable row level security;
alter table challenge_submissions enable row level security;
alter table innovation_metrics enable row level security;

alter table research_papers enable row level security;
alter table research_datasets enable row level security;
alter table certifications enable row level security;
alter table exams enable row level security;
alter table user_certification_progress enable row level security;

-- COMMUNITY CHAPTERS POLICIES
drop policy if exists "public can view active chapters" on community_chapters;
create policy "public can view active chapters" on community_chapters for select using (is_active = true);
drop policy if exists "authenticated can manage chapters" on community_chapters;
create policy "authenticated can manage chapters" on community_chapters for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- COMMUNITY EVENTS POLICIES
drop policy if exists "public can view events" on community_events;
create policy "public can view events" on community_events for select using (true);
drop policy if exists "authenticated can insert events" on community_events;
create policy "authenticated can insert events" on community_events for insert with check (auth.role() = 'authenticated');

-- COMMUNITY AMBASSADORS POLICIES
drop policy if exists "public can view approved ambassadors" on community_ambassadors;
create policy "public can view approved ambassadors" on community_ambassadors for select using (status = 'approved');
drop policy if exists "users can manage own ambassador profile" on community_ambassadors;
create policy "users can manage own ambassador profile" on community_ambassadors for all using (auth.uid() = user_id or auth.role() = 'authenticated') with check (auth.uid() = user_id or auth.role() = 'authenticated');

-- COMMUNITY COLLABORATIONS POLICIES
drop policy if exists "public can view public collaborations" on community_collaborations;
create policy "public can view public collaborations" on community_collaborations for select using (visibility = 'public');
drop policy if exists "creators can manage collaborations" on community_collaborations;
create policy "creators can manage collaborations" on community_collaborations for all using (auth.uid() = created_by or auth.role() = 'authenticated') with check (auth.uid() = created_by or auth.role() = 'authenticated');

-- COMMUNITY GALLERY POLICIES
drop policy if exists "public can view gallery" on community_gallery;
create policy "public can view gallery" on community_gallery for select using (true);
drop policy if exists "users can insert gallery items" on community_gallery;
create policy "users can insert gallery items" on community_gallery for insert with check (auth.uid() = user_id);

-- COMMUNITY LEADERBOARD POLICIES
drop policy if exists "public can view leaderboard" on community_leaderboard;
create policy "public can view leaderboard" on community_leaderboard for select using (true);

-- COMMUNITY NOTIFICATIONS POLICIES
drop policy if exists "users can view own notifications" on community_notifications;
create policy "users can view own notifications" on community_notifications for select using (auth.uid() = user_id);

-- COMMUNITY BOOKMARKS POLICIES
drop policy if exists "users can view own bookmarks" on community_bookmarks;
create policy "users can view own bookmarks" on community_bookmarks for select using (auth.uid() = user_id);

-- STARTUPS POLICIES
drop policy if exists "public can view public startups" on startups;
create policy "public can view public startups" on startups for select using (public = true);

-- INNOVATION CHALLENGES POLICIES
drop policy if exists "public can view challenges" on innovation_challenges;
create policy "public can view challenges" on innovation_challenges for select using (status in ('open', 'in-progress', 'judging'));

-- RESEARCH PAPERS POLICIES
drop policy if exists "public can view published papers" on research_papers;
create policy "public can view published papers" on research_papers for select using (published = true);

-- CERTIFICATIONS POLICIES
drop policy if exists "public can view certifications" on certifications;
create policy "public can view certifications" on certifications for select using (published = true);

-- ============================================================================
-- PART 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update leaderboard points
create or replace function update_leaderboard_points(p_user_id uuid, p_points_delta integer)
returns void language sql as $$
  insert into community_leaderboard (user_id, points)
  values (p_user_id, p_points_delta)
  on conflict (user_id) do update
  set points = community_leaderboard.points + p_points_delta;
$$;

-- Function to get innovation metrics for a period
create or replace function get_innovation_metrics_for_date(p_date date)
returns table(
  active_startups bigint,
  active_programs bigint,
  open_challenges bigint,
  total_funding numeric
) language sql as $$
  select
    (select count(*) from startups where public = true)::bigint,
    (select count(*) from innovation_incubation_programs where status = 'open')::bigint,
    (select count(*) from innovation_challenges where status in ('open', 'in-progress'))::bigint,
    (select coalesce(sum(funding_amount), 0) from startups)::numeric;
$$;

-- Function to get community statistics
create or replace function get_community_statistics()
returns table(
  total_members bigint,
  total_countries bigint,
  active_chapters bigint,
  events_hosted bigint,
  projects_collaborated bigint,
  active_contributors bigint
) language sql as $$
  select
    (select count(distinct user_id) from community_posts)::bigint,
    (select count(distinct country_name) from community_chapters where is_active = true)::bigint,
    (select count(*) from community_chapters where is_active = true)::bigint,
    (select count(*) from community_events where status = 'completed')::bigint,
    (select count(distinct collaboration_id) from community_collaboration_members)::bigint,
    (select count(distinct user_id) from community_posts where created_at > now() - interval '30 days')::bigint;
$$;

-- All tables, indexes, RLS policies, and helper functions created successfully.
