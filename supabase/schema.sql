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

alter table projects enable row level security;
alter table experiments enable row level security;
alter table lab_notes enable row level security;
alter table journey enable row level security;
alter table contact_messages enable row level security;
alter table newsletter_subscribers enable row level security;

-- Public read access for published items
create policy "Public can view published projects" on projects for select using (published = true);
create policy "Public can view published experiments" on experiments for select using (published = true);
create policy "Public can view published blog posts" on lab_notes for select using (published = true);
create policy "Public can view journey" on journey for select using (true);

-- Admin policies (requires admin role or specific email)
-- Replace 'your-admin-email@example.com' with actual admin email if not using roles
create policy "Admins have full access to projects" on projects for all using (auth.role() = 'authenticated');
create policy "Admins have full access to experiments" on experiments for all using (auth.role() = 'authenticated');
create policy "Admins have full access to lab_notes" on lab_notes for all using (auth.role() = 'authenticated');
create policy "Admins have full access to journey" on journey for all using (auth.role() = 'authenticated');
create policy "Admins have full access to contact_messages" on contact_messages for all using (auth.role() = 'authenticated');
create policy "Admins have full access to newsletter_subscribers" on newsletter_subscribers for all using (auth.role() = 'authenticated');

-- Public insert for contact messages and newsletter
create policy "Anyone can send a message" on contact_messages for insert with check (true);
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
create policy "Users can view their profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert their profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Saved content policies: users can manage their saved items
create policy "Users can view their saved content" on saved_content for select using (auth.uid() = user_id);
create policy "Users can insert saved content" on saved_content for insert with check (auth.uid() = user_id);
create policy "Users can delete their saved content" on saved_content for delete using (auth.uid() = user_id);
