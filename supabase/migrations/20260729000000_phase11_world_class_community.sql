-- Migration: Phase 11 - World-Class Community Platform
-- This migration creates a comprehensive community platform with chapters, events, ambassadors,
-- badges, leaderboard, collaborations, gallery, and social features.

create extension if not exists "pgcrypto";

-- ============================================
-- COMMUNITY CHAPTERS
-- ============================================
create table if not exists community_chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country_code text not null, -- ISO country code
  country_name text not null,
  city text not null,
  description text,
  ambassador_id uuid references profiles(id) on delete set null,
  member_count integer not null default 0,
  active_projects integer not null default 0,
  events_hosted integer not null default 0,
  image_url text,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- Add slug column if it doesn't exist (for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'slug') then
    alter table community_chapters add column slug text unique;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'country_code') then
    alter table community_chapters add column country_code text not null default '';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'country_name') then
    alter table community_chapters add column country_name text not null default '';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'city') then
    alter table community_chapters add column city text not null default '';
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'description') then
    alter table community_chapters add column description text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'ambassador_id') then
    alter table community_chapters add column ambassador_id uuid references profiles(id) on delete set null;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'member_count') then
    alter table community_chapters add column member_count integer not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'active_projects') then
    alter table community_chapters add column active_projects integer not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'events_hosted') then
    alter table community_chapters add column events_hosted integer not null default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'image_url') then
    alter table community_chapters add column image_url text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'banner_url') then
    alter table community_chapters add column banner_url text;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'is_active') then
    alter table community_chapters add column is_active boolean not null default true;
  end if;
end $$;

-- Add status column to event_registrations if it doesn't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'event_registrations') then
    if not exists (select 1 from information_schema.columns where table_name = 'event_registrations' and column_name = 'status') then
      alter table event_registrations add column status text not null default 'registered';
    end if;
  end if;
end $$;

-- Add status column to community_events if it doesn't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_events') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'status') then
      alter table community_events add column status text not null default 'upcoming';
    end if;
  end if;
end $$;

-- Add status column to community_ambassadors if it doesn't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_ambassadors') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_ambassadors' and column_name = 'status') then
      alter table community_ambassadors add column status text not null default 'pending';
    end if;
  end if;
end $$;

-- Add status column to community_collaborations if it doesn't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_collaborations') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_collaborations' and column_name = 'status') then
      alter table community_collaborations add column status text not null default 'open';
    end if;
  end if;
end $$;

-- Add status column to collaboration_applications if it doesn't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'collaboration_applications') then
    if not exists (select 1 from information_schema.columns where table_name = 'collaboration_applications' and column_name = 'status') then
      alter table collaboration_applications add column status text not null default 'pending';
    end if;
  end if;
end $$;

-- Chapter membership
create table if not exists chapter_members (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references community_chapters(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member', -- member, moderator, ambassador
  joined_at timestamptz not null default now(),
  unique(chapter_id, user_id)
);

-- Chapter events
create table if not exists chapter_events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references community_chapters(id) on delete cascade,
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  mode text not null default 'offline', -- online, offline, hybrid
  max_attendees integer,
  current_attendees integer not null default 0,
  image_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Event registrations
create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references chapter_events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  status text not null default 'registered', -- registered, attended, cancelled
  unique(event_id, user_id)
);

-- ============================================
-- COMMUNITY EVENTS (Global)
-- ============================================
create table if not exists community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  event_type text not null, -- meetup, workshop, hackathon, conference, bootcamp
  start_date timestamptz not null,
  end_date timestamptz,
  location text,
  mode text not null default 'offline', -- online, offline, hybrid
  max_seats integer,
  available_seats integer,
  organizer_id uuid references profiles(id) on delete set null,
  chapter_id uuid references community_chapters(id) on delete set null,
  image_url text,
  banner_url text,
  status text not null default 'upcoming', -- upcoming, ongoing, completed, cancelled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add slug column if it doesn't exist (for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'slug') then
    alter table community_events add column slug text unique;
  end if;
end $$;

-- ============================================
-- AMBASSADOR PROGRAM
-- ============================================
create table if not exists community_ambassadors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  chapter_id uuid references community_chapters(id) on delete set null,
  application_data jsonb,
  status text not null default 'pending', -- pending, approved, rejected
  approved_at timestamptz,
  approved_by uuid references profiles(id) on delete set null,
  term_start timestamptz,
  term_end timestamptz,
  achievements integer not null default 0,
  events_hosted integer not null default 0,
  members_recruited integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- ============================================
-- BADGES & ACHIEVEMENTS
-- ============================================
create table if not exists community_badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  icon_url text,
  category text not null, -- contributor, mentor, researcher, hackathon_winner, ambassador, early_adopter, open_source_hero
  requirements jsonb,
  points integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Add slug column if it doesn't exist (for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'community_badges' and column_name = 'slug') then
    alter table community_badges add column slug text unique;
  end if;
end $$;

-- User badges
create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references community_badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

-- ============================================
-- LEADERBOARD
-- ============================================
create table if not exists community_leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  contribution_score integer not null default 0,
  projects_count integer not null default 0,
  events_attended integer not null default 0,
  discussions_created integer not null default 0,
  replies_count integer not null default 0,
  upvotes_received integer not null default 0,
  period text not null default 'all-time', -- weekly, monthly, all-time
  rank_position integer,
  updated_at timestamptz not null default now(),
  unique(user_id, period)
);

-- ============================================
-- COLLABORATION BOARD
-- ============================================
create table if not exists community_collaborations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  project_type text not null, -- flutter, ml, ui, backend, iot, robotics, research
  skills_required text[] not null,
  team_size integer not null,
  current_team_size integer not null default 1,
  deadline date,
  status text not null default 'open', -- open, in_progress, completed, closed
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Collaboration applications
create table if not exists collaboration_applications (
  id uuid primary key default gen_random_uuid(),
  collaboration_id uuid not null references community_collaborations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  message text,
  status text not null default 'pending', -- pending, accepted, rejected
  applied_at timestamptz not null default now(),
  unique(collaboration_id, user_id)
);

-- ============================================
-- COMMUNITY GALLERY
-- ============================================
create table if not exists community_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  category text not null, -- hackathon, meetup, workshop, conference, innovation_lab
  event_id uuid references community_events(id) on delete set null,
  chapter_id uuid references community_chapters(id) on delete set null,
  uploaded_by uuid not null references profiles(id) on delete cascade,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Gallery likes
create table if not exists gallery_likes (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references community_gallery(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(gallery_id, user_id)
);

-- ============================================
-- COMMUNITY FEED / ACTIVITY
-- ============================================
create table if not exists community_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  activity_type text not null, -- project_published, chapter_joined, research_uploaded, event_created, badge_earned, discussion_created
  title text not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Feed interactions
create table if not exists feed_interactions (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references community_feed(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  interaction_type text not null, -- like, comment, share, bookmark
  created_at timestamptz not null default now(),
  unique(feed_id, user_id, interaction_type)
);

-- Feed comments
create table if not exists feed_comments (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references community_feed(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- COMMUNITY STATISTICS
-- ============================================
create table if not exists community_statistics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null unique,
  metric_value integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ============================================
-- DISCORD INTEGRATION
-- ============================================
create table if not exists discord_integration (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  discord_id text,
  discord_username text,
  discord_avatar text,
  server_roles text[],
  joined_at timestamptz,
  last_synced timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table if not exists community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text,
  notification_type text not null, -- chapter_update, event_reminder, badge_earned, collaboration_request, mention
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================
-- FOLLOW SYSTEM
-- ============================================
create table if not exists community_followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(follower_id, following_id),
  check(follower_id != following_id)
);

-- ============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add missing columns to community_chapters if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_chapters') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'slug') then
      alter table community_chapters add column slug text unique;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'country_code') then
      alter table community_chapters add column country_code text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'city') then
      alter table community_chapters add column city text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'is_active') then
      alter table community_chapters add column is_active boolean not null default true;
    end if;
  end if;
end $$;

-- ============================================
-- INDEXES
-- ============================================

-- Chapters indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_chapters') then
    if exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'slug') then
      create index if not exists idx_community_chapters_slug on community_chapters(slug);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'country_code') then
      create index if not exists idx_community_chapters_country on community_chapters(country_code);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'city') then
      create index if not exists idx_community_chapters_city on community_chapters(city);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_chapters' and column_name = 'is_active') then
      create index if not exists idx_community_chapters_active on community_chapters(is_active);
    end if;
  end if;
end $$;

-- Chapter members indexes
create index if not exists idx_chapter_members_chapter on chapter_members(chapter_id);
create index if not exists idx_chapter_members_user on chapter_members(user_id);
create index if not exists idx_chapter_members_role on chapter_members(role);

-- Chapter events indexes
create index if not exists idx_chapter_events_chapter on chapter_events(chapter_id);
create index if not exists idx_chapter_events_date on chapter_events(event_date);

-- Event registrations indexes
create index if not exists idx_event_registrations_event on event_registrations(event_id);
create index if not exists idx_event_registrations_user on event_registrations(user_id);

-- Add missing columns to community_events if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_events') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'start_date') then
      alter table community_events add column start_date timestamptz not null default now();
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'end_date') then
      alter table community_events add column end_date timestamptz;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'location') then
      alter table community_events add column location text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'mode') then
      alter table community_events add column mode text not null default 'offline';
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'max_seats') then
      alter table community_events add column max_seats integer;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'available_seats') then
      alter table community_events add column available_seats integer;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'organizer_id') then
      alter table community_events add column organizer_id uuid references profiles(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'status') then
      alter table community_events add column status text not null default 'upcoming';
    end if;
  end if;
end $$;

-- Community events indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_events') then
    if exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'slug') then
      create index if not exists idx_community_events_slug on community_events(slug);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'event_type') then
      create index if not exists idx_community_events_type on community_events(event_type);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'status') then
      create index if not exists idx_community_events_status on community_events(status);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_events' and column_name = 'start_date') then
      create index if not exists idx_community_events_date on community_events(start_date);
    end if;
  end if;
end $$;

-- Add missing columns to community_ambassadors if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_ambassadors') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_ambassadors' and column_name = 'user_id') then
      alter table community_ambassadors add column user_id uuid references profiles(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_ambassadors' and column_name = 'status') then
      alter table community_ambassadors add column status text not null default 'active';
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_ambassadors' and column_name = 'chapter_id') then
      alter table community_ambassadors add column chapter_id uuid references community_chapters(id);
    end if;
  end if;
end $$;

-- Ambassadors indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_ambassadors') then
    if exists (select 1 from information_schema.columns where table_name = 'community_ambassadors' and column_name = 'user_id') then
      create index if not exists idx_community_ambassadors_user on community_ambassadors(user_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_ambassadors' and column_name = 'status') then
      create index if not exists idx_community_ambassadors_status on community_ambassadors(status);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_ambassadors' and column_name = 'chapter_id') then
      create index if not exists idx_community_ambassadors_chapter on community_ambassadors(chapter_id);
    end if;
  end if;
end $$;

-- Add missing columns to community_badges if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_badges') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_badges' and column_name = 'slug') then
      alter table community_badges add column slug text unique;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_badges' and column_name = 'category') then
      alter table community_badges add column category text;
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'user_badges') then
    if not exists (select 1 from information_schema.columns where table_name = 'user_badges' and column_name = 'user_id') then
      alter table user_badges add column user_id uuid references profiles(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'user_badges' and column_name = 'badge_id') then
      alter table user_badges add column badge_id uuid references community_badges(id);
    end if;
  end if;
end $$;

-- Badges indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_badges') then
    if exists (select 1 from information_schema.columns where table_name = 'community_badges' and column_name = 'slug') then
      create index if not exists idx_community_badges_slug on community_badges(slug);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_badges' and column_name = 'category') then
      create index if not exists idx_community_badges_category on community_badges(category);
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'user_badges') then
    if exists (select 1 from information_schema.columns where table_name = 'user_badges' and column_name = 'user_id') then
      create index if not exists idx_user_badges_user on user_badges(user_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'user_badges' and column_name = 'badge_id') then
      create index if not exists idx_user_badges_badge on user_badges(badge_id);
    end if;
  end if;
end $$;

-- Add missing columns to community_leaderboard if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_leaderboard') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_leaderboard' and column_name = 'user_id') then
      alter table community_leaderboard add column user_id uuid references profiles(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_leaderboard' and column_name = 'period') then
      alter table community_leaderboard add column period text not null default 'all-time';
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_leaderboard' and column_name = 'contribution_score') then
      alter table community_leaderboard add column contribution_score integer not null default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_leaderboard' and column_name = 'rank_position') then
      alter table community_leaderboard add column rank_position integer;
    end if;
  end if;
end $$;

-- Leaderboard indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_leaderboard') then
    if exists (select 1 from information_schema.columns where table_name = 'community_leaderboard' and column_name = 'user_id') then
      create index if not exists idx_community_leaderboard_user on community_leaderboard(user_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_leaderboard' and column_name = 'period') then
      create index if not exists idx_community_leaderboard_period on community_leaderboard(period);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_leaderboard' and column_name = 'contribution_score') then
      create index if not exists idx_community_leaderboard_score on community_leaderboard(contribution_score desc);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_leaderboard' and column_name = 'rank_position') then
      create index if not exists idx_community_leaderboard_rank on community_leaderboard(rank_position);
    end if;
  end if;
end $$;

-- Add missing columns to community_collaborations if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_collaborations') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_collaborations' and column_name = 'project_type') then
      alter table community_collaborations add column project_type text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_collaborations' and column_name = 'status') then
      alter table community_collaborations add column status text not null default 'open';
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_collaborations' and column_name = 'created_by') then
      alter table community_collaborations add column created_by uuid references profiles(id);
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'collaboration_applications') then
    if not exists (select 1 from information_schema.columns where table_name = 'collaboration_applications' and column_name = 'collaboration_id') then
      alter table collaboration_applications add column collaboration_id uuid references community_collaborations(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'collaboration_applications' and column_name = 'user_id') then
      alter table collaboration_applications add column user_id uuid references profiles(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'collaboration_applications' and column_name = 'status') then
      alter table collaboration_applications add column status text not null default 'pending';
    end if;
  end if;
end $$;

-- Collaborations indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_collaborations') then
    if exists (select 1 from information_schema.columns where table_name = 'community_collaborations' and column_name = 'project_type') then
      create index if not exists idx_community_collaborations_type on community_collaborations(project_type);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_collaborations' and column_name = 'status') then
      create index if not exists idx_community_collaborations_status on community_collaborations(status);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_collaborations' and column_name = 'created_by') then
      create index if not exists idx_community_collaborations_created on community_collaborations(created_by);
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'collaboration_applications') then
    if exists (select 1 from information_schema.columns where table_name = 'collaboration_applications' and column_name = 'collaboration_id') then
      create index if not exists idx_collaboration_applications_collab on collaboration_applications(collaboration_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'collaboration_applications' and column_name = 'user_id') then
      create index if not exists idx_collaboration_applications_user on collaboration_applications(user_id);
    end if;
  end if;
end $$;

-- Add missing columns to community_gallery if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_gallery') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_gallery' and column_name = 'category') then
      alter table community_gallery add column category text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_gallery' and column_name = 'event_id') then
      alter table community_gallery add column event_id uuid references community_events(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_gallery' and column_name = 'chapter_id') then
      alter table community_gallery add column chapter_id uuid references community_chapters(id);
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'gallery_likes') then
    if not exists (select 1 from information_schema.columns where table_name = 'gallery_likes' and column_name = 'gallery_id') then
      alter table gallery_likes add column gallery_id uuid references community_gallery(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'gallery_likes' and column_name = 'user_id') then
      alter table gallery_likes add column user_id uuid references profiles(id);
    end if;
  end if;
end $$;

-- Gallery indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_gallery') then
    if exists (select 1 from information_schema.columns where table_name = 'community_gallery' and column_name = 'category') then
      create index if not exists idx_community_gallery_category on community_gallery(category);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_gallery' and column_name = 'event_id') then
      create index if not exists idx_community_gallery_event on community_gallery(event_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_gallery' and column_name = 'chapter_id') then
      create index if not exists idx_community_gallery_chapter on community_gallery(chapter_id);
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'gallery_likes') then
    if exists (select 1 from information_schema.columns where table_name = 'gallery_likes' and column_name = 'gallery_id') then
      create index if not exists idx_gallery_likes_gallery on gallery_likes(gallery_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'gallery_likes' and column_name = 'user_id') then
      create index if not exists idx_gallery_likes_user on gallery_likes(user_id);
    end if;
  end if;
end $$;

-- Add missing columns to feed tables if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_feed') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_feed' and column_name = 'user_id') then
      alter table community_feed add column user_id uuid references profiles(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_feed' and column_name = 'activity_type') then
      alter table community_feed add column activity_type text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_feed' and column_name = 'created_at') then
      alter table community_feed add column created_at timestamptz not null default now();
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'feed_interactions') then
    if not exists (select 1 from information_schema.columns where table_name = 'feed_interactions' and column_name = 'feed_id') then
      alter table feed_interactions add column feed_id uuid references community_feed(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'feed_interactions' and column_name = 'user_id') then
      alter table feed_interactions add column user_id uuid references profiles(id);
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'feed_comments') then
    if not exists (select 1 from information_schema.columns where table_name = 'feed_comments' and column_name = 'feed_id') then
      alter table feed_comments add column feed_id uuid references community_feed(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'feed_comments' and column_name = 'user_id') then
      alter table feed_comments add column user_id uuid references profiles(id);
    end if;
  end if;
end $$;

-- Feed indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_feed') then
    if exists (select 1 from information_schema.columns where table_name = 'community_feed' and column_name = 'user_id') then
      create index if not exists idx_community_feed_user on community_feed(user_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_feed' and column_name = 'activity_type') then
      create index if not exists idx_community_feed_type on community_feed(activity_type);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_feed' and column_name = 'created_at') then
      create index if not exists idx_community_feed_created on community_feed(created_at desc);
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'feed_interactions') then
    if exists (select 1 from information_schema.columns where table_name = 'feed_interactions' and column_name = 'feed_id') then
      create index if not exists idx_feed_interactions_feed on feed_interactions(feed_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'feed_interactions' and column_name = 'user_id') then
      create index if not exists idx_feed_interactions_user on feed_interactions(user_id);
    end if;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'feed_comments') then
    if exists (select 1 from information_schema.columns where table_name = 'feed_comments' and column_name = 'feed_id') then
      create index if not exists idx_feed_comments_feed on feed_comments(feed_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'feed_comments' and column_name = 'user_id') then
      create index if not exists idx_feed_comments_user on feed_comments(user_id);
    end if;
  end if;
end $$;

-- Add missing columns to community_notifications if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_notifications') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_notifications' and column_name = 'user_id') then
      alter table community_notifications add column user_id uuid references profiles(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_notifications' and column_name = 'is_read') then
      alter table community_notifications add column is_read boolean not null default false;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_notifications' and column_name = 'created_at') then
      alter table community_notifications add column created_at timestamptz not null default now();
    end if;
  end if;
end $$;

-- Notifications indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_notifications') then
    if exists (select 1 from information_schema.columns where table_name = 'community_notifications' and column_name = 'user_id') then
      create index if not exists idx_community_notifications_user on community_notifications(user_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_notifications' and column_name = 'is_read') then
      create index if not exists idx_community_notifications_read on community_notifications(is_read);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_notifications' and column_name = 'created_at') then
      create index if not exists idx_community_notifications_created on community_notifications(created_at desc);
    end if;
  end if;
end $$;

-- Add missing columns to community_followers if they don't exist
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_followers') then
    if not exists (select 1 from information_schema.columns where table_name = 'community_followers' and column_name = 'follower_id') then
      alter table community_followers add column follower_id uuid references profiles(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'community_followers' and column_name = 'following_id') then
      alter table community_followers add column following_id uuid references profiles(id);
    end if;
  end if;
end $$;

-- Followers indexes
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_followers') then
    if exists (select 1 from information_schema.columns where table_name = 'community_followers' and column_name = 'follower_id') then
      create index if not exists idx_community_followers_follower on community_followers(follower_id);
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'community_followers' and column_name = 'following_id') then
      create index if not exists idx_community_followers_following on community_followers(following_id);
    end if;
  end if;
end $$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_chapters') then
    alter table community_chapters enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'chapter_members') then
    alter table chapter_members enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'chapter_events') then
    alter table chapter_events enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'event_registrations') then
    alter table event_registrations enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_events') then
    alter table community_events enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_ambassadors') then
    alter table community_ambassadors enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_badges') then
    alter table community_badges enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'user_badges') then
    alter table user_badges enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_leaderboard') then
    alter table community_leaderboard enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_collaborations') then
    alter table community_collaborations enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'collaboration_applications') then
    alter table collaboration_applications enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_gallery') then
    alter table community_gallery enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'gallery_likes') then
    alter table gallery_likes enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_feed') then
    alter table community_feed enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'feed_interactions') then
    alter table feed_interactions enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'feed_comments') then
    alter table feed_comments enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_statistics') then
    alter table community_statistics enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'discord_integration') then
    alter table discord_integration enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_notifications') then
    alter table community_notifications enable row level security;
  end if;
  if exists (select 1 from information_schema.tables where table_name = 'community_followers') then
    alter table community_followers enable row level security;
  end if;
end $$;

-- Community Chapters policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_chapters') then
    drop policy if exists "public can view active chapters" on community_chapters;
    drop policy if exists "authenticated can manage chapters" on community_chapters;
    drop policy if exists "chapter ambassadors can update own chapters" on community_chapters;
    drop policy if exists "public can read chapters" on community_chapters;
    drop policy if exists "admins can insert chapters" on community_chapters;
    drop policy if exists "ambassadors can update own chapter" on community_chapters;
    drop policy if exists "admins can delete chapters" on community_chapters;
    create policy "public can read chapters" on community_chapters for select using (true);
    create policy "admins can insert chapters" on community_chapters for insert with check (public.is_admin());
    create policy "ambassadors can update own chapter" on community_chapters for update using (auth.uid() = ambassador_id or public.is_admin());
    create policy "admins can delete chapters" on community_chapters for delete using (public.is_admin());
  end if;
end $$;

-- Chapter Members policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'chapter_members') then
    drop policy if exists "public can read chapter members" on chapter_members;
    drop policy if exists "authenticated can join chapters" on chapter_members;
    drop policy if exists "users can update own membership" on chapter_members;
    drop policy if exists "users can leave chapters" on chapter_members;
    create policy "public can read chapter members" on chapter_members for select using (true);
    create policy "authenticated can join chapters" on chapter_members for insert with check (auth.uid() = user_id);
    create policy "users can update own membership" on chapter_members for update using (auth.uid() = user_id);
    create policy "users can leave chapters" on chapter_members for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Chapter Events policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'chapter_events') then
    drop policy if exists "public can read chapter events" on chapter_events;
    drop policy if exists "ambassadors can create events" on chapter_events;
    drop policy if exists "event creators can update" on chapter_events;
    drop policy if exists "admins can delete events" on chapter_events;
    create policy "public can read chapter events" on chapter_events for select using (true);
    create policy "ambassadors can create events" on chapter_events for insert with check (
      auth.uid() = created_by or 
      exists (select 1 from community_ambassadors where user_id = auth.uid() and chapter_id = chapter_events.chapter_id and status = 'approved')
    );
    create policy "event creators can update" on chapter_events for update using (auth.uid() = created_by or public.is_admin());
    create policy "admins can delete events" on chapter_events for delete using (public.is_admin());
  end if;
end $$;

-- Event Registrations policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'event_registrations') then
    drop policy if exists "authenticated can read own registrations" on event_registrations;
    drop policy if exists "authenticated can register" on event_registrations;
    drop policy if exists "users can update own registration" on event_registrations;
    drop policy if exists "users can cancel registration" on event_registrations;
    create policy "authenticated can read own registrations" on event_registrations for select using (auth.uid() = user_id);
    create policy "authenticated can register" on event_registrations for insert with check (auth.uid() = user_id);
    create policy "users can update own registration" on event_registrations for update using (auth.uid() = user_id);
    create policy "users can cancel registration" on event_registrations for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Community Events policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_events') then
    drop policy if exists "public can view events" on community_events;
    drop policy if exists "authenticated can insert events" on community_events;
    drop policy if exists "public can read community events" on community_events;
    drop policy if exists "authenticated can create events" on community_events;
    drop policy if exists "organizers can update events" on community_events;
    drop policy if exists "admins can delete events" on community_events;
    create policy "public can read community events" on community_events for select using (true);
    create policy "authenticated can create events" on community_events for insert with check (auth.uid() = organizer_id);
    create policy "organizers can update events" on community_events for update using (auth.uid() = organizer_id or public.is_admin());
    create policy "admins can delete events" on community_events for delete using (public.is_admin());
  end if;
end $$;

-- Ambassadors policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_ambassadors') then
    drop policy if exists "public can view approved ambassadors" on community_ambassadors;
    drop policy if exists "users can manage own ambassador profile" on community_ambassadors;
    drop policy if exists "users can view own ambassador applications" on community_ambassadors;
    drop policy if exists "users can insert own ambassador applications" on community_ambassadors;
    drop policy if exists "users can update own ambassador profile" on community_ambassadors;
    drop policy if exists "public can read ambassadors" on community_ambassadors;
    drop policy if exists "authenticated can apply" on community_ambassadors;
    drop policy if exists "admins can manage ambassadors" on community_ambassadors;
    create policy "public can read ambassadors" on community_ambassadors for select using (true);
    create policy "authenticated can apply" on community_ambassadors for insert with check (auth.uid() = user_id);
    create policy "admins can manage ambassadors" on community_ambassadors for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- Badges policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_badges') then
    drop policy if exists "public can read badges" on community_badges;
    drop policy if exists "admins can manage badges" on community_badges;
    create policy "public can read badges" on community_badges for select using (true);
    create policy "admins can manage badges" on community_badges for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- User Badges policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'user_badges') then
    drop policy if exists "public can read user badges" on user_badges;
    drop policy if exists "system can award badges" on user_badges;
    drop policy if exists "admins can manage user badges" on user_badges;
    create policy "public can read user badges" on user_badges for select using (true);
    create policy "system can award badges" on user_badges for insert with check (public.is_admin());
    create policy "admins can manage user badges" on user_badges for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- Leaderboard policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_leaderboard') then
    drop policy if exists "public can view leaderboard" on community_leaderboard;
    drop policy if exists "public can read leaderboard" on community_leaderboard;
    drop policy if exists "system can update leaderboard" on community_leaderboard;
    create policy "public can read leaderboard" on community_leaderboard for select using (true);
    create policy "system can update leaderboard" on community_leaderboard for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- Collaborations policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_collaborations') then
    drop policy if exists "public can view public collaborations" on community_collaborations;
    drop policy if exists "creators can manage collaborations" on community_collaborations;
    drop policy if exists "public can read collaborations" on community_collaborations;
    drop policy if exists "authenticated can create collaborations" on community_collaborations;
    drop policy if exists "creators can update collaborations" on community_collaborations;
    drop policy if exists "creators can delete collaborations" on community_collaborations;
    create policy "public can read collaborations" on community_collaborations for select using (true);
    create policy "authenticated can create collaborations" on community_collaborations for insert with check (auth.uid() = created_by);
    create policy "creators can update collaborations" on community_collaborations for update using (auth.uid() = created_by);
    create policy "creators can delete collaborations" on community_collaborations for delete using (auth.uid() = created_by);
  end if;
end $$;

-- Collaboration Applications policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'collaboration_applications') then
    drop policy if exists "authenticated can read own applications" on collaboration_applications;
    drop policy if exists "creators can read applications" on collaboration_applications;
    drop policy if exists "authenticated can apply" on collaboration_applications;
    drop policy if exists "creators can manage applications" on collaboration_applications;
    create policy "authenticated can read own applications" on collaboration_applications for select using (auth.uid() = user_id);
    create policy "creators can read applications" on collaboration_applications for select using (
      auth.uid() = user_id or 
      exists (select 1 from community_collaborations where id = collaboration_applications.collaboration_id and created_by = auth.uid())
    );
    create policy "authenticated can apply" on collaboration_applications for insert with check (auth.uid() = user_id);
    create policy "creators can manage applications" on collaboration_applications for all using (
      exists (select 1 from community_collaborations where id = collaboration_applications.collaboration_id and created_by = auth.uid())
    );
  end if;
end $$;

-- Gallery policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_gallery') then
    drop policy if exists "public can view gallery" on community_gallery;
    drop policy if exists "users can insert gallery items" on community_gallery;
    drop policy if exists "public can read gallery" on community_gallery;
    drop policy if exists "authenticated can upload" on community_gallery;
    drop policy if exists "uploaders can update" on community_gallery;
    drop policy if exists "uploaders can delete" on community_gallery;
    create policy "public can read gallery" on community_gallery for select using (true);
    create policy "authenticated can upload" on community_gallery for insert with check (auth.uid() = uploaded_by);
    create policy "uploaders can update" on community_gallery for update using (auth.uid() = uploaded_by or public.is_admin());
    create policy "uploaders can delete" on community_gallery for delete using (auth.uid() = uploaded_by or public.is_admin());
  end if;
end $$;

-- Gallery Likes policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'gallery_likes') then
    drop policy if exists "public can read likes" on gallery_likes;
    drop policy if exists "authenticated can like" on gallery_likes;
    drop policy if exists "users can unlike" on gallery_likes;
    create policy "public can read likes" on gallery_likes for select using (true);
    create policy "authenticated can like" on gallery_likes for insert with check (auth.uid() = user_id);
    create policy "users can unlike" on gallery_likes for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Feed policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_feed') then
    drop policy if exists "public can read feed" on community_feed;
    drop policy if exists "system can create feed" on community_feed;
    drop policy if exists "admins can manage feed" on community_feed;
    create policy "public can read feed" on community_feed for select using (true);
    create policy "system can create feed" on community_feed for insert with check (public.is_admin());
    create policy "admins can manage feed" on community_feed for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- Feed Interactions policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'feed_interactions') then
    drop policy if exists "public can read interactions" on feed_interactions;
    drop policy if exists "authenticated can interact" on feed_interactions;
    drop policy if exists "users can remove interactions" on feed_interactions;
    create policy "public can read interactions" on feed_interactions for select using (true);
    create policy "authenticated can interact" on feed_interactions for insert with check (auth.uid() = user_id);
    create policy "users can remove interactions" on feed_interactions for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Feed Comments policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'feed_comments') then
    drop policy if exists "public can read comments" on feed_comments;
    drop policy if exists "authenticated can comment" on feed_comments;
    drop policy if exists "users can update own comments" on feed_comments;
    drop policy if exists "users can delete own comments" on feed_comments;
    create policy "public can read comments" on feed_comments for select using (true);
    create policy "authenticated can comment" on feed_comments for insert with check (auth.uid() = user_id);
    create policy "users can update own comments" on feed_comments for update using (auth.uid() = user_id);
    create policy "users can delete own comments" on feed_comments for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Statistics policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_statistics') then
    drop policy if exists "public can read statistics" on community_statistics;
    drop policy if exists "system can update statistics" on community_statistics;
    create policy "public can read statistics" on community_statistics for select using (true);
    create policy "system can update statistics" on community_statistics for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- Discord Integration policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'discord_integration') then
    drop policy if exists "users can read own discord" on discord_integration;
    drop policy if exists "authenticated can link discord" on discord_integration;
    drop policy if exists "users can update own discord" on discord_integration;
    drop policy if exists "users can unlink discord" on discord_integration;
    create policy "users can read own discord" on discord_integration for select using (auth.uid() = user_id);
    create policy "authenticated can link discord" on discord_integration for insert with check (auth.uid() = user_id);
    create policy "users can update own discord" on discord_integration for update using (auth.uid() = user_id);
    create policy "users can unlink discord" on discord_integration for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Notifications policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_notifications') then
    drop policy if exists "users can view own notifications" on community_notifications;
    drop policy if exists "users can read own notifications" on community_notifications;
    drop policy if exists "system can create notifications" on community_notifications;
    drop policy if exists "users can update own notifications" on community_notifications;
    drop policy if exists "users can delete own notifications" on community_notifications;
    create policy "users can read own notifications" on community_notifications for select using (auth.uid() = user_id);
    create policy "system can create notifications" on community_notifications for insert with check (public.is_admin());
    create policy "users can update own notifications" on community_notifications for update using (auth.uid() = user_id);
    create policy "users can delete own notifications" on community_notifications for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Followers policies
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'community_followers') then
    drop policy if exists "public can read followers" on community_followers;
    drop policy if exists "authenticated can follow" on community_followers;
    drop policy if exists "users can unfollow" on community_followers;
    create policy "public can read followers" on community_followers for select using (true);
    create policy "authenticated can follow" on community_followers for insert with check (auth.uid() = follower_id);
    create policy "users can unfollow" on community_followers for delete using (auth.uid() = follower_id);
  end if;
end $$;

-- ============================================
-- VIEWS
-- ============================================

-- Chapter statistics view
create or replace view chapter_stats_view as
select 
  cc.id,
  cc.name,
  cc.slug,
  cc.country_name,
  cc.city,
  cc.member_count,
  cc.active_projects,
  cc.events_hosted,
  cc.ambassador_id,
  p.username as ambassador_name,
  p.avatar_url as ambassador_avatar,
  (select count(*) from chapter_members where chapter_id = cc.id) as actual_member_count,
  (select count(*) from chapter_events where chapter_id = cc.id and event_date >= now()) as upcoming_events_count
from community_chapters cc
left join profiles p on cc.ambassador_id = p.id
where cc.is_active = true;

-- Leaderboard with user info view
create or replace view leaderboard_view as
select 
  cl.id,
  cl.user_id,
  p.username,
  p.avatar_url,
  p.full_name,
  cl.contribution_score,
  cl.projects_count,
  cl.events_attended,
  cl.discussions_created,
  cl.replies_count,
  cl.upvotes_received,
  cl.rank_position,
  cl.period,
  (select count(*) from user_badges where user_id = cl.user_id) as badges_count,
  (select count(*) from community_followers where following_id = cl.user_id) as followers_count
from community_leaderboard cl
join profiles p on cl.user_id = p.id
order by cl.contribution_score desc;

-- Events with registration status view
create or replace view events_with_registration_view as
select 
  ce.*,
  (select count(*) from event_registrations where event_id = ce.id and status = 'registered') as registered_count
from community_events ce
where ce.status = 'upcoming';

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
drop trigger if exists update_community_chapters_updated_at on community_chapters;
create trigger update_community_chapters_updated_at before update on community_chapters
  for each row execute function update_updated_at_column();

drop trigger if exists update_chapter_events_updated_at on chapter_events;
create trigger update_chapter_events_updated_at before update on chapter_events
  for each row execute function update_updated_at_column();

drop trigger if exists update_community_events_updated_at on community_events;
create trigger update_community_events_updated_at before update on community_events
  for each row execute function update_updated_at_column();

drop trigger if exists update_community_ambassadors_updated_at on community_ambassadors;
create trigger update_community_ambassadors_updated_at before update on community_ambassadors
  for each row execute function update_updated_at_column();

drop trigger if exists update_community_collaborations_updated_at on community_collaborations;
create trigger update_community_collaborations_updated_at before update on community_collaborations
  for each row execute function update_updated_at_column();

drop trigger if exists update_feed_comments_updated_at on feed_comments;
create trigger update_feed_comments_updated_at before update on feed_comments
  for each row execute function update_updated_at_column();

drop trigger if exists update_discord_integration_updated_at on discord_integration;
create trigger update_discord_integration_updated_at before update on discord_integration
  for each row execute function update_updated_at_column();

-- Update chapter member count trigger
create or replace function update_chapter_member_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update community_chapters set member_count = member_count + 1 where id = new.chapter_id;
  elsif tg_op = 'DELETE' then
    update community_chapters set member_count = greatest(member_count - 1, 0) where id = old.chapter_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists update_chapter_member_count_trigger on chapter_members;
create trigger update_chapter_member_count_trigger after insert or delete on chapter_members
  for each row execute function update_chapter_member_count();

-- Update gallery likes count trigger
create or replace function update_gallery_likes_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update community_gallery set likes_count = likes_count + 1 where id = new.gallery_id;
  elsif tg_op = 'DELETE' then
    update community_gallery set likes_count = greatest(likes_count - 1, 0) where id = old.gallery_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists update_gallery_likes_count_trigger on gallery_likes;
create trigger update_gallery_likes_count_trigger after insert or delete on gallery_likes
  for each row execute function update_gallery_likes_count();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default badges
insert into community_badges (name, slug, description, icon_url, category, requirements, points) values
('Top Contributor', 'top-contributor', 'Awarded to users with exceptional contribution scores', '/badges/top-contributor.svg', 'contributor', '{"min_score": 1000}'::jsonb, 500),
('Mentor', 'mentor', 'Awarded to users who mentor others in the community', '/badges/mentor.svg', 'mentor', '{"mentees_count": 10}'::jsonb, 300),
('Researcher', 'researcher', 'Awarded to users who publish research papers', '/badges/researcher.svg', 'researcher', '{"papers_published": 3}'::jsonb, 400),
('Hackathon Winner', 'hackathon-winner', 'Awarded to users who win hackathons', '/badges/hackathon-winner.svg', 'hackathon_winner', '{"hackathons_won": 1}'::jsonb, 600),
('Ambassador', 'ambassador', 'Awarded to approved community ambassadors', '/badges/ambassador.svg', 'ambassador', '{"ambassador_status": "approved"}'::jsonb, 700),
('Early Adopter', 'early-adopter', 'Awarded to users who joined early', '/badges/early-adopter.svg', 'early_adopter', '{"joined_before": "2024-01-01"}'::jsonb, 200),
('Open Source Hero', 'open-source-hero', 'Awarded to users with significant open source contributions', '/badges/open-source-hero.svg', 'open_source_hero', '{"commits_count": 100}'::jsonb, 800)
on conflict (slug) do nothing;

-- Insert initial statistics
insert into community_statistics (metric_name, metric_value) values
('total_members', 18250),
('total_countries', 42),
('active_chapters', 180),
('events_hosted', 620),
('projects_collaborated', 7036),
('active_contributors', 540)
on conflict (metric_name) do nothing;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get community statistics
create or replace function get_community_statistics()
returns json as $$
declare
  result json;
begin
  select json_object(
    'total_members', coalesce((select metric_value from community_statistics where metric_name = 'total_members'), 0),
    'total_countries', coalesce((select metric_value from community_statistics where metric_name = 'total_countries'), 0),
    'active_chapters', coalesce((select metric_value from community_statistics where metric_name = 'active_chapters'), 0),
    'events_hosted', coalesce((select metric_value from community_statistics where metric_name = 'events_hosted'), 0),
    'projects_collaborated', coalesce((select metric_value from community_statistics where metric_name = 'projects_collaborated'), 0),
    'active_contributors', coalesce((select metric_value from community_statistics where metric_name = 'active_contributors'), 0)
  ) into result;
  return result;
end;
$$ language plpgsql stable;

-- Function to add feed activity
create or replace function add_feed_activity(
  p_user_id uuid,
  p_activity_type text,
  p_title text,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid as $$
declare
  activity_id uuid;
begin
  insert into community_feed (user_id, activity_type, title, description, metadata)
  values (p_user_id, p_activity_type, p_title, p_description, p_metadata)
  returning id into activity_id;
  return activity_id;
end;
$$ language plpgsql;

-- Function to award badge
create or replace function award_user_badge(p_user_id uuid, p_badge_slug text)
returns uuid as $$
declare
  badge_id uuid;
  user_badge_id uuid;
begin
  select id into badge_id from community_badges where slug = p_badge_slug and is_active = true;
  if not found then
    raise exception 'Badge not found or inactive';
  end if;
  
  insert into user_badges (user_id, badge_id)
  values (p_user_id, badge_id)
  on conflict (user_id, badge_id) do nothing
  returning id into user_badge_id;
  
  if user_badge_id is not null then
    -- Add feed activity
    perform add_feed_activity(
      p_user_id,
      'badge_earned',
      'Earned a new badge',
      (select name from community_badges where id = badge_id),
      jsonb_build_object('badge_id', badge_id, 'badge_slug', p_badge_slug)
    );
  end if;
  
  return user_badge_id;
end;
$$ language plpgsql;

-- Function to update leaderboard score
create or replace function update_leaderboard_score(
  p_user_id uuid,
  p_score_change integer,
  p_projects_change integer default 0,
  p_events_change integer default 0,
  p_discussions_change integer default 0,
  p_replies_change integer default 0,
  p_upvotes_change integer default 0
)
returns void as $$
begin
  insert into community_leaderboard (user_id, contribution_score, projects_count, events_attended, discussions_created, replies_count, upvotes_received, period)
  values (p_user_id, p_score_change, p_projects_change, p_events_change, p_discussions_change, p_replies_change, p_upvotes_change, 'all-time')
  on conflict (user_id, period) do update set
    contribution_score = community_leaderboard.contribution_score + p_score_change,
    projects_count = community_leaderboard.projects_count + p_projects_change,
    events_attended = community_leaderboard.events_attended + p_events_change,
    discussions_created = community_leaderboard.discussions_created + p_discussions_change,
    replies_count = community_leaderboard.replies_count + p_replies_change,
    upvotes_received = community_leaderboard.upvotes_received + p_upvotes_change,
    updated_at = now();
end;
$$ language plpgsql;
