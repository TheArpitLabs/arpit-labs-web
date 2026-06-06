-- Consolidated Critical Database Schema Fixes
-- This migration consolidates all missing tables required for the application to function
-- Created: June 6, 2026
-- Purpose: Fix HTTP 500 errors on /research and /marketplace routes

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================================
-- CRITICAL: RESEARCH TABLES (Required for /research route)
-- ============================================================================

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

-- ============================================================================
-- CRITICAL: MARKETPLACE TABLES (Required for /marketplace route)
-- ============================================================================

create table if not exists marketplace_categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    created_at timestamptz default now()
);

create table if not exists marketplace_items (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    slug text not null unique,
    description text,
    category_id uuid references marketplace_categories(id),
    price decimal(10, 2) not null default 0.00,
    currency text not null default 'USD',
    featured boolean default false,
    published boolean default false,
    seller_id uuid references auth.users(id) not null,
    preview_image text,
    download_url text,
    views_count integer default 0,
    downloads_count integer default 0,
    sales_count integer default 0,
    revenue decimal(15, 2) default 0.00,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists marketplace_orders (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) not null,
    item_id uuid references marketplace_items(id) not null,
    status text not null default 'pending',
    amount decimal(10, 2) not null,
    currency text not null default 'USD',
    created_at timestamptz default now()
);

-- Insert initial marketplace categories
insert into marketplace_categories (name, slug) values
('Templates', 'templates'),
('UI Kits', 'ui-kits'),
('E-books', 'e-books'),
('Software', 'software'),
('Icons', 'icons')
on conflict (slug) do nothing;

-- ============================================================================
-- IMPORTANT: COMMUNITY TABLES (Required for /community route)
-- ============================================================================

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

create table if not exists community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists community_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  vote_type text not null,
  created_at timestamptz not null default now(),
  constraint unique_vote_per_user_per_post unique (post_id, user_id)
);

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

-- ============================================================================
-- IMPORTANT: PRODUCT TABLES (Required for /products route)
-- ============================================================================

create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text not null unique,
    description text not null,
    overview text,
    category text not null,
    pricing_type text not null,
    pricing_details text,
    featured boolean default false,
    published boolean default false,
    demo_url text,
    documentation_url text,
    cover_image text,
    screenshots text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists product_features (
    id uuid primary key default gen_random_uuid(),
    product_id uuid references products(id) on delete cascade,
    title text not null,
    description text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists product_screenshots (
    id uuid primary key default gen_random_uuid(),
    product_id uuid references products(id) on delete cascade,
    image_url text not null,
    sort_order integer default 0,
    created_at timestamptz not null default now()
);

-- ============================================================================
-- IMPORTANT: LEARNING PLATFORM TABLES
-- ============================================================================

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

create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  content text not null,
  order_index integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists user_course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  progress_percentage integer not null default 0,
  completed boolean default false,
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

-- ============================================================================
-- IMPORTANT: CERTIFICATIONS & BADGES
-- ============================================================================

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

-- ============================================================================
-- IMPORTANT: STARTUPS & INNOVATION
-- ============================================================================

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

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Research indexes
create index if not exists idx_research_papers_division on research_papers(division);
create index if not exists idx_research_papers_published_at on research_papers(published_at);
create index if not exists idx_research_datasets_created_at on research_datasets(created_at);

-- Marketplace indexes
create index if not exists idx_marketplace_items_category on marketplace_items(category_id);
create index if not exists idx_marketplace_items_published on marketplace_items(published);
create index if not exists idx_marketplace_items_slug on marketplace_items(slug);
create index if not exists idx_marketplace_categories_slug on marketplace_categories(slug);

-- Community indexes
create index if not exists idx_community_posts_slug on community_posts(slug);
create index if not exists idx_community_posts_tags on community_posts using gin (tags);
create index if not exists idx_community_events_chapter on community_events(chapter_id);
create index if not exists idx_community_events_start on community_events(start_time);

-- Product indexes
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_published on products(published);

-- Learning platform indexes
create index if not exists idx_courses_category on courses(category);
create index if not exists idx_courses_published on courses(published);
create index if not exists idx_courses_slug on courses(slug);
create index if not exists idx_labs_category on labs(category);
create index if not exists idx_labs_published on labs(published);
create index if not exists idx_labs_slug on labs(slug);
create index if not exists idx_roadmaps_category on roadmaps(category);
create index if not exists idx_roadmaps_published on roadmaps(published);
create index if not exists idx_roadmaps_slug on roadmaps(slug);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all new tables
alter table research_papers enable row level security;
alter table research_datasets enable row level security;
alter table research_projects enable row level security;
alter table marketplace_categories enable row level security;
alter table marketplace_items enable row level security;
alter table marketplace_orders enable row level security;
alter table community_posts enable row level security;
alter table community_replies enable row level security;
alter table community_votes enable row level security;
alter table community_chapters enable row level security;
alter table community_events enable row level security;
alter table products enable row level security;
alter table product_features enable row level security;
alter table product_screenshots enable row level security;
alter table courses enable row level security;
alter table course_modules enable row level security;
alter table labs enable row level security;
alter table roadmaps enable row level security;
alter table user_course_progress enable row level security;
alter table certifications enable row level security;
alter table exams enable row level security;
alter table assessments enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table startups enable row level security;
alter table innovation_projects enable row level security;

-- Research policies
create policy "Public can view published research" on research_papers for select using (published_at <= now());
create policy "Public can view research_datasets" on research_datasets for select using (true);
create policy "Public can view research_projects" on research_projects for select using (true);

-- Marketplace policies
create policy "Public categories read" on marketplace_categories for select using (true);
create policy "Public items read" on marketplace_items for select using (published = true);
create policy "Sellers manage own items" on marketplace_items for all using (auth.uid() = seller_id);
create policy "Users read own orders" on marketplace_orders for select using (auth.uid() = user_id);

-- Community policies
create policy "Public can read community posts" on community_posts for select using (true);
create policy "Users can insert community posts" on community_posts for insert with check (auth.uid() = user_id);
create policy "Public can read community replies" on community_replies for select using (true);
create policy "Users can insert community replies" on community_replies for insert with check (auth.uid() = user_id);
create policy "Users can insert community votes" on community_votes for insert with check (auth.uid() = user_id);
create policy "Public can view chapters" on community_chapters for select using (true);
create policy "Public can view events" on community_events for select using (true);

-- Product policies
create policy "Public select published products" on products for select using (published = true);
create policy "Public select features for published products" on product_features for select using (exists (select 1 from products p where p.id = product_features.product_id and p.published = true));
create policy "Public select screenshots for published products" on product_screenshots for select using (exists (select 1 from products p where p.id = product_screenshots.product_id and p.published = true));

-- Learning platform policies
create policy "Public can view published courses" on courses for select using (published = true);
create policy "Public can view modules of published courses" on course_modules for select using (exists(select 1 from courses where courses.id = course_modules.course_id and courses.published = true));
create policy "Public can view published labs" on labs for select using (published = true);
create policy "Public can view published roadmaps" on roadmaps for select using (published = true);
create policy "Users can view their own progress" on user_course_progress for select using (auth.uid() = user_id);
create policy "Users can update their own progress" on user_course_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can insert their progress" on user_course_progress for insert with check (auth.uid() = user_id);
create policy "Public can view certifications" on certifications for select using (true);
create policy "Users can view their own assessments" on assessments for select using (auth.uid() = user_id);
create policy "Public can view badges" on badges for select using (true);
create policy "Users can view their own badges" on user_badges for select using (auth.uid() = user_id);

-- Startup policies
create policy "Founders can manage their startups" on startups for all using (auth.uid() = founder_id);
create policy "Public can view active startups" on startups for select using (true);
create policy "Public can view innovation_projects" on innovation_projects for select using (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Marketplace functions
create or replace function increment_marketplace_sales(item_id uuid, amount decimal)
returns void as $$
begin
  update marketplace_items
  set sales_count = sales_count + 1,
      revenue = revenue + amount
  where id = item_id;
end;
$$ language plpgsql security definer;

create or replace function increment_marketplace_views(item_id uuid)
returns void as $$
begin
  update marketplace_items
  set views_count = views_count + 1
  where id = item_id;
end;
$$ language plpgsql security definer;

-- Community voting functions
create or replace function increment_post_upvote_count(p_id uuid)
returns void language sql stable as $$
  update community_posts set upvotes = coalesce(upvotes,0) + 1 where id = p_id;
$$;

create or replace function decrement_post_upvote_count(p_id uuid)
returns void language sql stable as $$
  update community_posts set upvotes = greatest(coalesce(upvotes,0) - 1, 0) where id = p_id;
$$;

-- Updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

create trigger update_marketplace_items_updated_at
    before update on marketplace_items
    for each row
    execute procedure update_updated_at_column();

create trigger update_products_updated_at
    before update on products
    for each row
    execute procedure update_updated_at_column();

create trigger update_community_posts_updated_at
    before update on community_posts
    for each row
    execute procedure update_updated_at_column();

create trigger update_courses_updated_at
    before update on courses
    for each row
    execute procedure update_updated_at_column();

create trigger update_labs_updated_at
    before update on labs
    for each row
    execute procedure update_updated_at_column();

create trigger update_roadmaps_updated_at
    before update on roadmaps
    for each row
    execute procedure update_updated_at_column();
