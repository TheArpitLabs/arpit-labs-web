-- Migration: Phase 2 - Enhanced Profile Customization & Social Features
-- Add enhanced profile fields and social features tables

-- ============================================
-- ENHANCED PROFILE FIELDS
-- ============================================

-- Add location field to profiles
alter table profiles 
add column if not exists location text;

-- Add more social link fields
alter table profiles 
add column if not exists twitter_url text;

alter table profiles 
add column if not exists youtube_url text;

alter table profiles 
add column if not exists instagram_url text;

alter table profiles 
add column if not exists stackoverflow_url text;

-- Add portfolio customization fields
alter table profiles 
add column if not exists portfolio_theme text default 'default';

alter table profiles 
add column if not exists custom_css text;

alter table profiles 
add column if not exists featured_project_id uuid references projects(id) on delete set null;

-- Add professional fields
alter table profiles 
add column if not exists job_title text;

alter table profiles 
add column if not exists company text;

alter table profiles 
add column if not exists availability text default 'open'; -- open, busy, closed

-- ============================================
-- SOCIAL FEATURES TABLES
-- ============================================

-- PROFILE FOLLOWS TABLE
create table if not exists profile_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

-- PROFILE LIKES TABLE
create table if not exists profile_likes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(profile_id, user_id),
  check (profile_id != user_id)
);

-- PROFILE COMMENTS TABLE
create table if not exists profile_comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  parent_id uuid references profile_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PROFILE SHARES TABLE
create table if not exists profile_shares (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  platform text not null, -- twitter, linkedin, facebook, copy_link
  created_at timestamptz not null default now()
);

-- ============================================
-- PROFILE ANALYTICS TABLE
-- ============================================

create table if not exists profile_analytics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  view_count integer not null default 0,
  follower_count integer not null default 0,
  following_count integer not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  share_count integer not null default 0,
  last_viewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

create index if not exists profile_follows_follower_idx on profile_follows(follower_id);
create index if not exists profile_follows_following_idx on profile_follows(following_id);
create index if not exists profile_likes_profile_idx on profile_likes(profile_id);
create index if not exists profile_likes_user_idx on profile_likes(user_id);
create index if not exists profile_comments_profile_idx on profile_comments(profile_id);
create index if not exists profile_comments_user_idx on profile_comments(user_id);
create index if not exists profile_comments_parent_idx on profile_comments(parent_id);
create index if not exists profile_shares_profile_idx on profile_shares(profile_id);
create index if not exists profile_analytics_profile_idx on profile_analytics(profile_id);

-- ============================================
-- RLS POLICIES FOR SOCIAL FEATURES
-- ============================================

-- Enable RLS
alter table profile_follows enable row level security;
alter table profile_likes enable row level security;
alter table profile_comments enable row level security;
alter table profile_shares enable row level security;
alter table profile_analytics enable row level security;

-- Profile Follows Policies
create policy "Users can view follows" on profile_follows for select using (true);
create policy "Users can manage their follows" on profile_follows for all using (auth.uid() = follower_id);

-- Profile Likes Policies
create policy "Users can view likes" on profile_likes for select using (true);
create policy "Users can manage their likes" on profile_likes for all using (auth.uid() = user_id);

-- Profile Comments Policies
create policy "Users can view comments" on profile_comments for select using (true);
create policy "Users can insert comments" on profile_comments for insert with check (auth.uid() = user_id);
create policy "Users can update their comments" on profile_comments for update using (auth.uid() = user_id);
create policy "Users can delete their comments" on profile_comments for delete using (auth.uid() = user_id);

-- Profile Shares Policies
create policy "Users can view shares" on profile_shares for select using (true);
create policy "Users can insert shares" on profile_shares for insert with check (auth.uid() = user_id);

-- Profile Analytics Policies
create policy "Users can view their analytics" on profile_analytics for select using (auth.uid() = profile_id);
create policy "Users can update their analytics" on profile_analytics for update using (auth.uid() = profile_id);
create policy "Public can view basic analytics" on profile_analytics for select using (
  profile_id in (select id from profiles where profile_visibility = 'public')
);

-- ============================================
-- TRIGGER TO UPDATE PROFILE ANALYTICS
-- ============================================

-- Function to update profile analytics
create or replace function update_profile_analytics()
returns trigger as $$
begin
  insert into profile_analytics (profile_id, view_count, follower_count, following_count, like_count, comment_count, share_count)
  values (
    NEW.profile_id,
    0,
    (select count(*) from profile_follows where following_id = NEW.profile_id),
    (select count(*) from profile_follows where follower_id = NEW.profile_id),
    (select count(*) from profile_likes where profile_id = NEW.profile_id),
    (select count(*) from profile_comments where profile_id = NEW.profile_id),
    (select count(*) from profile_shares where profile_id = NEW.profile_id)
  )
  on conflict (profile_id) do update set
    follower_count = excluded.follower_count,
    following_count = excluded.following_count,
    like_count = excluded.like_count,
    comment_count = excluded.comment_count,
    share_count = excluded.share_count,
    updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Triggers for analytics updates
create trigger profile_follows_analytics_trigger
after insert or delete on profile_follows
for each row execute function update_profile_analytics();

create trigger profile_likes_analytics_trigger
after insert or delete on profile_likes
for each row execute function update_profile_analytics();

create trigger profile_comments_analytics_trigger
after insert or delete on profile_comments
for each row execute function update_profile_analytics();

create trigger profile_shares_analytics_trigger
after insert on profile_shares
for each row execute function update_profile_analytics();

-- ============================================
-- INITIALIZE ANALYTICS FOR EXISTING PROFILES
-- ============================================

insert into profile_analytics (profile_id, view_count, follower_count, following_count, like_count, comment_count, share_count)
select 
  id,
  0,
  (select count(*) from profile_follows where following_id = profiles.id),
  (select count(*) from profile_follows where follower_id = profiles.id),
  (select count(*) from profile_likes where profile_id = profiles.id),
  (select count(*) from profile_comments where profile_id = profiles.id),
  (select count(*) from profile_shares where profile_id = profiles.id)
from profiles
on conflict (profile_id) do nothing;
