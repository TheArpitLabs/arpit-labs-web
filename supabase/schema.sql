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
