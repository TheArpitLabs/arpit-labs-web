-- ============================================================================
-- COMBINED CONTENT DATABASE MIGRATIONS
-- Excludes membership and payment tables as requested
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lxbtuwltzljmnwxbygcl/sql/new
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Phase 8A - Profiles and Saved Content
-- ============================================================================
create extension if not exists "pgcrypto";

-- Profiles
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

-- Saved content
create table if not exists saved_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content_type text not null,
  content_id uuid not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table saved_content enable row level security;

-- Policies for profiles
drop policy if exists "Users can view their profile" on profiles;
create policy "Users can view their profile" on profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert their profile" on profiles;
create policy "Users can insert their profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their profile" on profiles;
create policy "Users can update their profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Policies for saved_content
drop policy if exists "Users can view their saved content" on saved_content;
create policy "Users can view their saved content" on saved_content for select using (auth.uid() = user_id);

drop policy if exists "Users can insert saved content" on saved_content;
create policy "Users can insert saved content" on saved_content for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their saved content" on saved_content;
create policy "Users can delete their saved content" on saved_content for delete using (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION 2: Phase 8B - Community Platform
-- ============================================================================
create extension if not exists "pgcrypto";

-- Community posts
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

-- Community replies
create table if not exists community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Community votes
create table if not exists community_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  vote_type text not null,
  created_at timestamptz not null default now(),
  constraint unique_vote_per_user_per_post unique (post_id, user_id)
);

-- Indexes
create index if not exists idx_community_posts_slug on community_posts(slug);
create index if not exists idx_community_posts_tags on community_posts using gin (tags);

-- Enable RLS
alter table community_posts enable row level security;
alter table community_replies enable row level security;
alter table community_votes enable row level security;

-- Policies
-- Public can read posts
drop policy if exists "public can read community posts" on community_posts;
create policy "public can read community posts"
  on community_posts
  for select
  using (true);

-- Owners can insert posts
drop policy if exists "users can insert community posts" on community_posts;
create policy "users can insert community posts"
  on community_posts
  for insert
  with check (auth.uid() = user_id);

-- Owners or admins can update/delete
drop policy if exists "owners or admins manage community posts" on community_posts;
create policy "owners or admins manage community posts"
  on community_posts
  for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Replies: public can read
drop policy if exists "public can read community replies" on community_replies;
create policy "public can read community replies"
  on community_replies
  for select
  using (true);

-- Replies: authenticated users can insert
drop policy if exists "users can insert community replies" on community_replies;
create policy "users can insert community replies"
  on community_replies
  for insert
  with check (auth.uid() = user_id);

-- Replies: owners or admins can delete
drop policy if exists "owners or admins delete community replies" on community_replies;
create policy "owners or admins delete community replies"
  on community_replies
  for delete
  using (auth.uid() = user_id or public.is_admin());

-- Votes: authenticated users can insert; unique enforced by constraint
drop policy if exists "users can insert community votes" on community_votes;
create policy "users can insert community votes"
  on community_votes
  for insert
  with check (auth.uid() = user_id);

-- Admins can manage votes
drop policy if exists "admins manage community votes" on community_votes;
create policy "admins manage community votes"
  on community_votes
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Helper RPCs to adjust post upvote counters atomically
create or replace function increment_post_upvote_count(p_id uuid)
returns void language sql stable as $$
  update community_posts set upvotes = coalesce(upvotes,0) + 1 where id = p_id;
$$;

create or replace function decrement_post_upvote_count(p_id uuid)
returns void language sql stable as $$
  update community_posts set upvotes = greatest(coalesce(upvotes,0) - 1, 0) where id = p_id;
$$;

-- ============================================================================
-- MIGRATION 3: Phase 9A - Product Suite
-- ============================================================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    overview TEXT,
    category TEXT NOT NULL,
    pricing_type TEXT NOT NULL,
    pricing_details TEXT,
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    demo_url TEXT,
    documentation_url TEXT,
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Features
CREATE TABLE IF NOT EXISTS product_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Product Screenshots
CREATE TABLE IF NOT EXISTS product_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_screenshots ENABLE ROW LEVEL SECURITY;

-- Policies using existing public.is_admin() function
DROP POLICY IF EXISTS "Public read for published products" ON products;
CREATE POLICY "Public read for published products" 
ON products FOR SELECT 
USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on products" ON products;
CREATE POLICY "Admin full access on products" 
ON products FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read for features of published products" ON product_features;
CREATE POLICY "Public read for features of published products" 
ON product_features FOR SELECT 
USING (EXISTS (SELECT 1 FROM products WHERE id = product_features.product_id AND published = true) OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on product_features" ON product_features;
CREATE POLICY "Admin full access on product_features" 
ON product_features FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read for screenshots of published products" ON product_screenshots;
CREATE POLICY "Public read for screenshots of published products" 
ON product_screenshots FOR SELECT 
USING (EXISTS (SELECT 1 FROM products WHERE id = product_screenshots.product_id AND published = true) OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on product_screenshots" ON product_screenshots;
CREATE POLICY "Admin full access on product_screenshots" 
ON product_screenshots FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- MIGRATION 4: Phase 9C - Marketplace
-- ============================================================================

-- Marketplace Categories
CREATE TABLE IF NOT EXISTS marketplace_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Items
CREATE TABLE IF NOT EXISTS marketplace_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id UUID REFERENCES marketplace_categories(id),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    seller_id UUID REFERENCES auth.users(id) NOT NULL,
    preview_image TEXT,
    download_url TEXT,
    views_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    revenue DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    item_id UUID REFERENCES marketplace_items(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Categories: Public read
DROP POLICY IF EXISTS "Public categories read" ON marketplace_categories;
CREATE POLICY "Public categories read" ON marketplace_categories
    FOR SELECT USING (true);

-- Items: Public read for published items
DROP POLICY IF EXISTS "Public items read" ON marketplace_items;
CREATE POLICY "Public items read" ON marketplace_items
    FOR SELECT USING (published = true);

-- Items: Sellers can manage their own items
DROP POLICY IF EXISTS "Sellers manage own items" ON marketplace_items;
CREATE POLICY "Sellers manage own items" ON marketplace_items
    FOR ALL USING (auth.uid() = seller_id);

-- Items: Admins can manage all items
DROP POLICY IF EXISTS "Admins manage all items" ON marketplace_items;
CREATE POLICY "Admins manage all items" ON marketplace_items
    FOR ALL USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND email = 'arpitkumar0211@gmail.com'
        )
    );

-- Orders: Users can read their own orders
DROP POLICY IF EXISTS "Users read own orders" ON marketplace_orders;
CREATE POLICY "Users read own orders" ON marketplace_orders
    FOR SELECT USING (auth.uid() = user_id);

-- Orders: Sellers can read orders for their items
DROP POLICY IF EXISTS "Sellers read own item orders" ON marketplace_orders;
CREATE POLICY "Sellers read own item orders" ON marketplace_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM marketplace_items
            WHERE id = marketplace_orders.item_id AND seller_id = auth.uid()
        )
    );

-- Orders: Admins can read all orders
DROP POLICY IF EXISTS "Admins read all orders" ON marketplace_orders;
CREATE POLICY "Admins read all orders" ON marketplace_orders
    FOR SELECT USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND email = 'arpitkumar0211@gmail.com'
        )
    );

-- RPC for updating stats
CREATE OR REPLACE FUNCTION increment_marketplace_sales(item_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_items
  SET sales_count = sales_count + 1,
      revenue = revenue + amount
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_marketplace_views(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_items
  SET views_count = views_count + 1
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial Categories
INSERT INTO marketplace_categories (name, slug) VALUES
('Templates', 'templates'),
('UI Kits', 'ui-kits'),
('E-books', 'e-books'),
('Software', 'software'),
('Icons', 'icons')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- MIGRATION 5: Phase 10 - Ecosystem (Research, University, Innovation, etc.)
-- ============================================================================

-- 1. RESEARCH LABS
create table if not exists research_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  abstract text not null,
  content text,
  authors text[] default array[]::text[],
  division text not null,
  tags text[] default array[]::text[],
  published_at timestamptz,
  is_featured boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research_datasets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  download_url text,
  size text,
  format text,
  license text,
  created_at timestamptz not null default now()
);

create table if not exists research_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  status text default 'active',
  division text not null,
  created_at timestamptz not null default now()
);

-- 2. LEARNING UNIVERSITY (Extended)
create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  topic text not null,
  level text default 'intermediate',
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  certification_id uuid references certifications(id) on delete cascade,
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  passing_score integer default 70,
  duration_minutes integer default 60,
  created_at timestamptz not null default now()
);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  exam_id uuid references exams(id) on delete cascade,
  score integer not null,
  passed boolean not null,
  completed_at timestamptz not null default now()
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  icon_url text,
  criteria text,
  created_at timestamptz not null default now()
);

create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  awarded_at timestamptz not null default now()
);

-- 3. INNOVATION HUB
create table if not exists startups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  logo_url text,
  website_url text,
  founder_id uuid references auth.users(id),
  stage text default 'ideation',
  created_at timestamptz not null default now()
);

create table if not exists innovation_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  challenge_id uuid,
  team_members uuid[] default array[]::uuid[],
  created_at timestamptz not null default now()
);

create table if not exists mentorship_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  mentor_id uuid references auth.users(id),
  max_mentees integer default 5,
  created_at timestamptz not null default now()
);

-- 4. VENTURE STUDIO
create table if not exists founders (
  id uuid primary key references auth.users(id) on delete cascade,
  bio text,
  expertise text[] default array[]::text[],
  linked_in text,
  created_at timestamptz not null default now()
);

create table if not exists investors (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_name text,
  investment_focus text[] default array[]::text[],
  ticket_size_min numeric,
  ticket_size_max numeric,
  created_at timestamptz not null default now()
);

create table if not exists pitch_decks (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete cascade,
  file_url text not null,
  version text,
  created_at timestamptz not null default now()
);

create table if not exists funding_rounds (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete cascade,
  round_type text not null,
  amount numeric,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. GLOBAL COMMUNITY
create table if not exists community_chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  city text,
  lead_id uuid references auth.users(id),
  member_count integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists community_events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references community_chapters(id) on delete cascade,
  title text not null,
  description text not null,
  event_type text default 'meetup',
  location text,
  start_time timestamptz not null,
  end_time timestamptz,
  max_attendees integer,
  created_at timestamptz not null default now()
);

-- 6. DATA & AI PLATFORM
create table if not exists user_behavior (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  action_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  user_id uuid references auth.users(id),
  session_id text,
  created_at timestamptz not null default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  recommended_entity_type text not null,
  recommended_entity_id uuid not null,
  score numeric,
  reason text,
  created_at timestamptz not null default now()
);

-- RLS POLICIES

-- Research
alter table research_papers enable row level security;
drop policy if exists "Public can view published research" on research_papers;
create policy "Public can view published research" on research_papers for select using (published_at <= now());
drop policy if exists "Admins can manage research_papers" on research_papers;
create policy "Admins can manage research_papers" on research_papers for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

alter table research_datasets enable row level security;
drop policy if exists "Public can view research_datasets" on research_datasets;
create policy "Public can view research_datasets" on research_datasets for select using (true);

-- University
alter table certifications enable row level security;
drop policy if exists "Public can view certifications" on certifications;
create policy "Public can view certifications" on certifications for select using (true);

alter table exams enable row level security;
drop policy if exists "Authenticated users can see exams" on exams;
create policy "Authenticated users can see exams" on exams for select using (auth.role() = 'authenticated');

alter table assessments enable row level security;
drop policy if exists "Users can view their own assessments" on assessments;
create policy "Users can view their own assessments" on assessments for select using (auth.uid() = user_id);

-- Innovation & Venture (Private mostly)
alter table startups enable row level security;
drop policy if exists "Founders can manage their startups" on startups;
create policy "Founders can manage their startups" on startups for all using (auth.uid() = founder_id);
drop policy if exists "Public can view active startups" on startups;
create policy "Public can view active startups" on startups for select using (true);

-- Community
alter table community_chapters enable row level security;
drop policy if exists "Public can view chapters" on community_chapters;
create policy "Public can view chapters" on community_chapters for select using (true);

alter table community_events enable row level security;
drop policy if exists "Public can view events" on community_events;
create policy "Public can view events" on community_events for select using (true);

-- Analytics (Private)
alter table user_behavior enable row level security;
drop policy if exists "Only system/admins can view behavior" on user_behavior;
create policy "Only system/admins can view behavior" on user_behavior for select using (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS for all new tables
alter table research_projects enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table innovation_projects enable row level security;
alter table mentorship_programs enable row level security;
alter table founders enable row level security;
alter table investors enable row level security;
alter table pitch_decks enable row level security;
alter table funding_rounds enable row level security;
alter table analytics_events enable row level security;
alter table recommendations enable row level security;

-- Add missing RLS policies for new tables
drop policy if exists "Public can view research_projects" on research_projects;
create policy "Public can view research_projects" on research_projects for select using (true);
drop policy if exists "Admins can manage research_projects" on research_projects;
create policy "Admins can manage research_projects" on research_projects for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

drop policy if exists "Public can view badges" on badges;
create policy "Public can view badges" on badges for select using (true);
drop policy if exists "Admins can manage badges" on badges;
create policy "Admins can manage badges" on badges for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

drop policy if exists "Users can view their own badges" on user_badges;
create policy "Users can view their own badges" on user_badges for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own badges" on user_badges;
create policy "Users can insert their own badges" on user_badges for insert with check (auth.uid() = user_id);
drop policy if exists "Admins can manage user_badges" on user_badges;
create policy "Admins can manage user_badges" on user_badges for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

drop policy if exists "Public can view innovation_projects" on innovation_projects;
create policy "Public can view innovation_projects" on innovation_projects for select using (true);
drop policy if exists "Admins can manage innovation_projects" on innovation_projects;
create policy "Admins can manage innovation_projects" on innovation_projects for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

drop policy if exists "Public can view mentorship_programs" on mentorship_programs;
create policy "Public can view mentorship_programs" on mentorship_programs for select using (true);
drop policy if exists "Admins can manage mentorship_programs" on mentorship_programs;
create policy "Admins can manage mentorship_programs" on mentorship_programs for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

drop policy if exists "Founders can manage their profile" on founders;
create policy "Founders can manage their profile" on founders for all using (auth.uid() = id);
drop policy if exists "Public can view founders" on founders;
create policy "Public can view founders" on founders for select using (true);

drop policy if exists "Investors can manage their profile" on investors;
create policy "Investors can manage their profile" on investors for all using (auth.uid() = id);
drop policy if exists "Public can view investors" on investors;
create policy "Public can view investors" on investors for select using (true);

drop policy if exists "Founders can manage their pitch_decks" on pitch_decks;
create policy "Founders can manage their pitch_decks" on pitch_decks for all using (auth.uid() = (select founder_id from startups where id = pitch_decks.startup_id));
drop policy if exists "Admins can manage pitch_decks" on pitch_decks;
create policy "Admins can manage pitch_decks" on pitch_decks for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

drop policy if exists "Public can view funding_rounds" on funding_rounds;
create policy "Public can view funding_rounds" on funding_rounds for select using (true);
drop policy if exists "Admins can manage funding_rounds" on funding_rounds;
create policy "Admins can manage funding_rounds" on funding_rounds for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

drop policy if exists "Only system/admins can view analytics_events" on analytics_events;
create policy "Only system/admins can view analytics_events" on analytics_events for select using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));
drop policy if exists "Only system/admins can manage analytics_events" on analytics_events;
create policy "Only system/admins can manage analytics_events" on analytics_events for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

drop policy if exists "Users can view their own recommendations" on recommendations;
create policy "Users can view their own recommendations" on recommendations for select using (auth.uid() = user_id);
drop policy if exists "Admins can manage recommendations" on recommendations;
create policy "Admins can manage recommendations" on recommendations for all using (auth.jwt() ->> 'role' = 'service_role' or exists (select 1 from profiles where id = auth.uid() and email = 'arpitkumar0211@gmail.com'));

-- ============================================================================
-- END OF COMBINED MIGRATIONS
-- ============================================================================
