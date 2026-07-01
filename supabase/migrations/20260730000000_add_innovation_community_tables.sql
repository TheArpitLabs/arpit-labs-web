-- ============================================================================
-- AXIORA PRODUCTION SCHEMA MIGRATION
-- Phase 9: Complete Innovation & Community Module Tables
-- ============================================================================

-- This migration adds all missing tables for the Innovation and Community modules
-- including proper indexes, RLS policies, and helper functions

-- ============================================================================
-- PRE-MIGRATION CHECKS
-- ============================================================================

-- Ensure profiles table exists
do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    create table profiles (
      id uuid primary key,
      email text unique not null,
      full_name text,
      avatar_url text,
      role text default 'user' not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
end $$;

-- Ensure community_posts has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_posts') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_posts' and column_name = 'user_id') then
      alter table community_posts add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_gallery has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_gallery') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_gallery' and column_name = 'user_id') then
      alter table community_gallery add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_collaboration_members has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_collaboration_members') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaboration_members' and column_name = 'user_id') then
      alter table community_collaboration_members add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_event_registrations has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_event_registrations') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_event_registrations' and column_name = 'user_id') then
      alter table community_event_registrations add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_ambassadors has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_ambassadors') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_ambassadors' and column_name = 'user_id') then
      alter table community_ambassadors add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_gallery_likes has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_gallery_likes') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_gallery_likes' and column_name = 'user_id') then
      alter table community_gallery_likes add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_leaderboard has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_leaderboard') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_leaderboard' and column_name = 'user_id') then
      alter table community_leaderboard add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_notifications has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_notifications') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_notifications' and column_name = 'user_id') then
      alter table community_notifications add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_bookmarks has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_bookmarks') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_bookmarks' and column_name = 'user_id') then
      alter table community_bookmarks add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_collaborations has created_by column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_collaborations') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'created_by') then
      alter table community_collaborations add column created_by uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_events has organizer_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_events') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_events' and column_name = 'organizer_id') then
      alter table community_events add column organizer_id uuid references profiles(id) on delete set null;
    end if;
  end if;
end $$;

-- Ensure community_chapters has ambassador_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_chapters') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_chapters' and column_name = 'ambassador_id') then
      alter table community_chapters add column ambassador_id uuid references profiles(id) on delete set null;
    end if;
  end if;
end $$;

-- Ensure startups has founder_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'startups') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'startups' and column_name = 'founder_id') then
      alter table startups add column founder_id uuid references profiles(id) on delete set null;
    end if;
  end if;
end $$;

-- Ensure research_datasets has creator_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'research_datasets') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'research_datasets' and column_name = 'creator_id') then
      alter table research_datasets add column creator_id uuid references profiles(id) on delete set null;
    end if;
  end if;
end $$;

-- Ensure challenge_submissions has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'challenge_submissions') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'challenge_submissions' and column_name = 'user_id') then
      alter table challenge_submissions add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure incubation_applications has founder_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'incubation_applications') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'incubation_applications' and column_name = 'founder_id') then
      alter table incubation_applications add column founder_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure mentorship_requests has mentee_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mentorship_requests') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mentorship_requests' and column_name = 'mentee_id') then
      alter table mentorship_requests add column mentee_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure user_certification_progress has user_id column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_certification_progress') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_certification_progress' and column_name = 'user_id') then
      alter table user_certification_progress add column user_id uuid references profiles(id) on delete cascade;
    end if;
  end if;
end $$;

-- Ensure community_gallery has featured column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_gallery') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_gallery' and column_name = 'featured') then
      alter table community_gallery add column featured boolean not null default false;
    end if;
  end if;
end $$;

-- Ensure innovation_challenges has featured column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'innovation_challenges') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_challenges' and column_name = 'featured') then
      alter table innovation_challenges add column featured boolean not null default false;
    end if;
  end if;
end $$;

-- Ensure innovation_success_stories has featured column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'innovation_success_stories') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_success_stories' and column_name = 'featured') then
      alter table innovation_success_stories add column featured boolean not null default false;
    end if;
  end if;
end $$;

-- Ensure startups has featured column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'startups') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'startups' and column_name = 'featured') then
      alter table startups add column featured boolean not null default false;
    end if;
  end if;
end $$;

-- Ensure startups has public column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'startups') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'startups' and column_name = 'public') then
      alter table startups add column public boolean not null default true;
    end if;
  end if;
end $$;

-- Ensure startups has funding_amount column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'startups') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'startups' and column_name = 'funding_amount') then
      alter table startups add column funding_amount numeric;
    end if;
  end if;
end $$;

-- Ensure innovation_resources has published column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'innovation_resources') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_resources' and column_name = 'published') then
      alter table innovation_resources add column published boolean not null default true;
    end if;
  end if;
end $$;

-- Ensure innovation_success_stories has published column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'innovation_success_stories') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_success_stories' and column_name = 'published') then
      alter table innovation_success_stories add column published boolean not null default true;
    end if;
  end if;
end $$;

-- Ensure research_papers has published column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'research_papers') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'research_papers' and column_name = 'published') then
      alter table research_papers add column published boolean not null default false;
    end if;
  end if;
end $$;

-- Ensure certifications has published column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'certifications') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'certifications' and column_name = 'published') then
      alter table certifications add column published boolean not null default false;
    end if;
  end if;
end $$;

-- Ensure community_chapters has is_active column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_chapters') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_chapters' and column_name = 'is_active') then
      alter table community_chapters add column is_active boolean not null default true;
    end if;
  end if;
end $$;

-- Ensure community_events has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_events') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_events' and column_name = 'status') then
      alter table community_events add column status text not null default 'upcoming';
    end if;
  end if;
end $$;

-- Ensure innovation_incubation_programs has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'innovation_incubation_programs') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_incubation_programs' and column_name = 'status') then
      alter table innovation_incubation_programs add column status text not null default 'open';
    end if;
  end if;
end $$;

-- Ensure innovation_challenges has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'innovation_challenges') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_challenges' and column_name = 'status') then
      alter table innovation_challenges add column status text not null default 'open';
    end if;
  end if;
end $$;

-- Ensure challenge_submissions has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'challenge_submissions') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'challenge_submissions' and column_name = 'status') then
      alter table challenge_submissions add column status text not null default 'submitted';
    end if;
  end if;
end $$;

-- Ensure community_ambassadors has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_ambassadors') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_ambassadors' and column_name = 'status') then
      alter table community_ambassadors add column status text not null default 'pending';
    end if;
  end if;
end $$;

-- Ensure community_collaborations has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_collaborations') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'status') then
      alter table community_collaborations add column status text not null default 'open';
    end if;
  end if;
end $$;

-- Ensure community_collaborations has visibility column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_collaborations') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'visibility') then
      alter table community_collaborations add column visibility text not null default 'public';
    end if;
  end if;
end $$;

-- Ensure community_collaborations has current feature columns
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_collaborations') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'team_size_min') then
      alter table community_collaborations add column team_size_min integer not null default 1;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'team_size_max') then
      alter table community_collaborations add column team_size_max integer not null default 10;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'members_count') then
      alter table community_collaborations add column members_count integer not null default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'deadline_date') then
      alter table community_collaborations add column deadline_date date;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'cover_image') then
      alter table community_collaborations add column cover_image text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'repository_url') then
      alter table community_collaborations add column repository_url text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'project_url') then
      alter table community_collaborations add column project_url text;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'difficulty') then
      alter table community_collaborations add column difficulty text not null default 'intermediate';
    end if;
  end if;
end $$;

-- Ensure community_collaboration_members has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_collaboration_members') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaboration_members' and column_name = 'status') then
      alter table community_collaboration_members add column status text not null default 'active';
    end if;
  end if;
end $$;

-- Ensure mentorship_requests has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mentorship_requests') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'mentorship_requests' and column_name = 'status') then
      alter table mentorship_requests add column status text not null default 'pending';
    end if;
  end if;
end $$;

-- Ensure user_certification_progress has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_certification_progress') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_certification_progress' and column_name = 'status') then
      alter table user_certification_progress add column status text not null default 'enrolled';
    end if;
  end if;
end $$;

-- Ensure exams has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'exams') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'exams' and column_name = 'status') then
      alter table exams add column status text not null default 'active';
    end if;
  end if;
end $$;

-- Ensure incubation_applications has status column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'incubation_applications') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'incubation_applications' and column_name = 'status') then
      alter table incubation_applications add column status text not null default 'submitted';
    end if;
  end if;
end $$;

-- Ensure community_chapters has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_chapters') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_chapters' and column_name = 'tags') then
      alter table community_chapters add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure community_events has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_events') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_events' and column_name = 'tags') then
      alter table community_events add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure community_collaborations has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_collaborations') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_collaborations' and column_name = 'tags') then
      alter table community_collaborations add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure community_gallery has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_gallery') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_gallery' and column_name = 'tags') then
      alter table community_gallery add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure startups has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'startups') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'startups' and column_name = 'tags') then
      alter table startups add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure innovation_challenges has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'innovation_challenges') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_challenges' and column_name = 'tags') then
      alter table innovation_challenges add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure innovation_resources has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'innovation_resources') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'innovation_resources' and column_name = 'tags') then
      alter table innovation_resources add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure research_papers has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'research_papers') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'research_papers' and column_name = 'tags') then
      alter table research_papers add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure research_datasets has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'research_datasets') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'research_datasets' and column_name = 'tags') then
      alter table research_datasets add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure certifications has skills_covered column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'certifications') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'certifications' and column_name = 'skills_covered') then
      alter table certifications add column skills_covered text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure community_posts has tags column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_posts') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_posts' and column_name = 'tags') then
      alter table community_posts add column tags text[] default '{}'::text[];
    end if;
  end if;
end $$;

-- Ensure community_notifications has read column
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'community_notifications') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_notifications' and column_name = 'read') then
      alter table community_notifications add column "read" boolean not null default false;
    end if;
  end if;
end $$;

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
  active_projects integer not null default 0,
  events_hosted integer not null default 0,
  established_date timestamptz not null default now(),
  is_active boolean not null default true,
  image_url text,
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
  organizer_id uuid references profiles(id) on delete set null,
  description text not null,
  event_type text not null, -- 'meetup', 'webinar', 'workshop', 'conference', 'hackathon'
  status text not null default 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  start_date timestamptz not null,
  end_date timestamptz,
  location text,
  mode text not null default 'offline', -- 'online', 'offline', 'hybrid'
  is_online boolean not null default false,
  online_url text,
  max_attendees integer,
  current_attendees integer not null default 0,
  image_url text,
  cover_image text,
  agenda text,
  speakers text[], -- JSON array of speaker info
  registrations_open boolean not null default true,
  tags text[] default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table community_events
  add column if not exists mode text not null default 'offline',
  add column if not exists is_online boolean not null default false,
  add column if not exists online_url text,
  add column if not exists max_attendees integer,
  add column if not exists current_attendees integer not null default 0,
  add column if not exists image_url text,
  add column if not exists cover_image text,
  add column if not exists agenda text,
  add column if not exists speakers text[],
  add column if not exists registrations_open boolean not null default true,
  add column if not exists tags text[] default '{}'::text[],
  add column if not exists updated_at timestamptz not null default now();

-- COMMUNITY EVENT REGISTRATIONS TABLE
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    create table if not exists community_event_registrations (
      id uuid primary key default gen_random_uuid(),
      event_id uuid not null references community_events(id) on delete cascade,
      user_id uuid not null references profiles(id) on delete cascade,
      registered_at timestamptz not null default now(),
      attended boolean not null default false,
      unique(event_id, user_id)
    );
  else
    create table if not exists community_event_registrations (
      id uuid primary key default gen_random_uuid(),
      event_id uuid not null references community_events(id) on delete cascade,
      user_id uuid not null,
      registered_at timestamptz not null default now(),
      attended boolean not null default false,
      unique(event_id, user_id)
    );
  end if;
end $$;

-- COMMUNITY AMBASSADORS TABLE
create table if not exists community_ambassadors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  chapter_id uuid references community_chapters(id) on delete set null,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected', 'inactive'
  title text, -- Ambassador title/role
  bio text,
  achievements integer not null default 0,
  posts_count integer not null default 0,
  events_organized integer not null default 0,
  reputation_score integer not null default 0,
  badge_level text default 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  members_recruited integer not null default 0,
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
  uploaded_by uuid not null references profiles(id) on delete cascade,
  chapter_id uuid references community_chapters(id) on delete set null,
  event_id uuid references community_events(id) on delete set null,
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
  last_updated timestamptz not null default now(),
  contribution_score integer not null default 0,
  projects_count integer not null default 0,
  discussions_created integer not null default 0,
  rank_position integer
);

-- Add missing columns if they don't exist (for existing tables)
do $$
begin
  if to_regclass('public.community_leaderboard') is not null then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_leaderboard' and column_name = 'contribution_score') then
      alter table community_leaderboard add column contribution_score integer not null default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_leaderboard' and column_name = 'projects_count') then
      alter table community_leaderboard add column projects_count integer not null default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_leaderboard' and column_name = 'discussions_created') then
      alter table community_leaderboard add column discussions_created integer not null default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_leaderboard' and column_name = 'rank_position') then
      alter table community_leaderboard add column rank_position integer;
    end if;
  end if;
end $$;

-- COMMUNITY NOTIFICATIONS TABLE
create table if not exists community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  notification_type text not null, -- 'reply', 'mention', 'like', 'follow', 'event', 'collaboration'
  related_post_id uuid,
  related_event_id uuid,
  related_collaboration_id uuid,
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
  post_id uuid not null,
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
  mentor_id uuid not null references community_mentors(mentor_id) on delete cascade,
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

-- INNOVATION RESOURCES TABLE
create table if not exists innovation_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  resource_type text not null, -- 'document', 'video', 'external-link'
  url text not null,
  thumbnail_url text,
  tags text[] default '{}'::text[],
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- INNOVATION SUCCESS STORIES TABLE
create table if not exists innovation_success_stories (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid references startups(id) on delete set null,
  title text not null,
  slug text unique not null,
  excerpt text,
  story text not null,
  founder_name text,
  profile_url text,
  image_url text,
  funding_amount numeric,
  impact_metrics jsonb default '{}'::jsonb,
  featured boolean not null default false,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
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

do $$
begin
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
end $$;

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
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_notifications' and column_name = 'read') then
    execute 'create index if not exists idx_notifications_read on community_notifications("read")';
  end if;
end $$;
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

-- INNOVATION CONTENT INDEXES
create index if not exists idx_innovation_resources_published on innovation_resources(published);
create index if not exists idx_innovation_resources_type on innovation_resources(resource_type);
create index if not exists idx_innovation_resources_tags on innovation_resources using gin(tags);
create index if not exists idx_success_stories_published on innovation_success_stories(published);
create index if not exists idx_success_stories_startup on innovation_success_stories(startup_id);
create index if not exists idx_success_stories_featured on innovation_success_stories(featured);

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
alter table innovation_resources enable row level security;
alter table innovation_success_stories enable row level security;

alter table research_papers enable row level security;
alter table research_datasets enable row level security;
alter table certifications enable row level security;
alter table exams enable row level security;
alter table user_certification_progress enable row level security;

-- COMMUNITY CHAPTERS POLICIES
drop policy if exists "public can view active chapters" on community_chapters;
create policy "public can view active chapters" on community_chapters for select using (is_active = true);
drop policy if exists "authenticated can manage chapters" on community_chapters;
drop policy if exists "chapter ambassadors can update own chapters" on community_chapters;
create policy "chapter ambassadors can update own chapters" on community_chapters for update using (auth.uid() = ambassador_id) with check (auth.uid() = ambassador_id);

-- COMMUNITY EVENTS POLICIES
drop policy if exists "public can view events" on community_events;
create policy "public can view events" on community_events for select using (true);
drop policy if exists "authenticated can insert events" on community_events;
drop policy if exists "chapter ambassadors can insert events" on community_events;
create policy "chapter ambassadors can insert events" on community_events for insert with check (
  exists (
    select 1 from community_chapters
    where community_chapters.id = community_events.chapter_id
      and community_chapters.ambassador_id = auth.uid()
  )
);

-- COMMUNITY EVENT REGISTRATION POLICIES
drop policy if exists "users can view own event registrations" on community_event_registrations;
create policy "users can view own event registrations" on community_event_registrations for select using (auth.uid() = user_id);
drop policy if exists "users can insert own event registrations" on community_event_registrations;
create policy "users can insert own event registrations" on community_event_registrations for insert with check (auth.uid() = user_id);

-- COMMUNITY AMBASSADORS POLICIES
drop policy if exists "public can view approved ambassadors" on community_ambassadors;
create policy "public can view approved ambassadors" on community_ambassadors for select using (status = 'approved');
drop policy if exists "users can manage own ambassador profile" on community_ambassadors;
drop policy if exists "users can view own ambassador applications" on community_ambassadors;
create policy "users can view own ambassador applications" on community_ambassadors for select using (auth.uid() = user_id);
drop policy if exists "users can insert own ambassador applications" on community_ambassadors;
create policy "users can insert own ambassador applications" on community_ambassadors for insert with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "users can update own ambassador profile" on community_ambassadors;
create policy "users can update own ambassador profile" on community_ambassadors for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- COMMUNITY COLLABORATIONS POLICIES
drop policy if exists "public can view public collaborations" on community_collaborations;
create policy "public can view public collaborations" on community_collaborations for select using (visibility = 'public');
drop policy if exists "creators can manage collaborations" on community_collaborations;
create policy "creators can manage collaborations" on community_collaborations for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- COMMUNITY COLLABORATION MEMBER POLICIES
drop policy if exists "users can view collaboration memberships" on community_collaboration_members;
create policy "users can view collaboration memberships" on community_collaboration_members for select using (auth.uid() = user_id);
drop policy if exists "users can apply to collaborations" on community_collaboration_members;
create policy "users can apply to collaborations" on community_collaboration_members for insert with check (auth.uid() = user_id);
drop policy if exists "users can update own collaboration membership" on community_collaboration_members;
create policy "users can update own collaboration membership" on community_collaboration_members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
drop policy if exists "users can insert own bookmarks" on community_bookmarks;
create policy "users can insert own bookmarks" on community_bookmarks for insert with check (auth.uid() = user_id);
drop policy if exists "users can delete own bookmarks" on community_bookmarks;
create policy "users can delete own bookmarks" on community_bookmarks for delete using (auth.uid() = user_id);

-- STARTUPS POLICIES
drop policy if exists "public can view public startups" on startups;
create policy "public can view public startups" on startups for select using (public = true);

-- INCUBATION APPLICATION POLICIES
drop policy if exists "users can insert own incubation applications" on incubation_applications;
create policy "users can insert own incubation applications" on incubation_applications for insert with check (auth.uid() = founder_id);
drop policy if exists "users can view own incubation applications" on incubation_applications;
create policy "users can view own incubation applications" on incubation_applications for select using (auth.uid() = founder_id);

-- INNOVATION CHALLENGES POLICIES
drop policy if exists "public can view challenges" on innovation_challenges;
create policy "public can view challenges" on innovation_challenges for select using (status in ('open', 'in-progress', 'judging'));

-- CHALLENGE SUBMISSION POLICIES
drop policy if exists "users can insert own challenge submissions" on challenge_submissions;
create policy "users can insert own challenge submissions" on challenge_submissions for insert with check (auth.uid() = user_id);
drop policy if exists "users can view own challenge submissions" on challenge_submissions;
create policy "users can view own challenge submissions" on challenge_submissions for select using (auth.uid() = user_id);

-- INNOVATION RESOURCE POLICIES
drop policy if exists "public can view published innovation resources" on innovation_resources;
create policy "public can view published innovation resources" on innovation_resources for select using (published = true);

-- INNOVATION SUCCESS STORY POLICIES
drop policy if exists "public can view published success stories" on innovation_success_stories;
create policy "public can view published success stories" on innovation_success_stories for select using (published = true);

-- RESEARCH PAPERS POLICIES
drop policy if exists "public can view published papers" on research_papers;
create policy "public can view published papers" on research_papers for select using (published = true);

-- CERTIFICATIONS POLICIES
drop policy if exists "public can view certifications" on certifications;
create policy "public can view certifications" on certifications for select using (published = true);

-- ============================================================================
-- PART 6: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Ensure community_posts has user_id column before creating functions
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'community_posts'
  )
  and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_posts'
      and column_name = 'user_id'
  ) then
    alter table public.community_posts
      add column user_id uuid references public.profiles(id) on delete cascade;
  end if;
end $$;

-- Function to update leaderboard points
drop function if exists update_leaderboard_points(uuid, integer);
create or replace function update_leaderboard_points(p_user_id uuid, p_points_delta integer)
returns void language sql as $$
  insert into community_leaderboard (user_id, points)
  values (p_user_id, p_points_delta)
  on conflict (user_id) do update
  set points = community_leaderboard.points + p_points_delta;
$$;

-- Function to get innovation metrics for a period
drop function if exists get_innovation_metrics_for_date(date);
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
drop function if exists get_community_statistics();
create or replace function get_community_statistics()
returns table(
  total_members bigint,
  total_countries bigint,
  active_chapters bigint,
  events_hosted bigint,
  projects_collaborated bigint,
  active_contributors bigint
) language plpgsql as $$
declare
  has_user_id boolean;
  has_posts_table boolean;
  total_members_val bigint;
  active_contributors_val bigint;
begin
  -- Check if community_posts table exists
  select exists(
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'community_posts'
  ) into has_posts_table;

  -- Check if user_id column exists (only if table exists)
  if has_posts_table then
    select exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'community_posts' and column_name = 'user_id'
    ) into has_user_id;
  else
    has_user_id := false;
  end if;

  -- Get total members
  if has_posts_table and has_user_id then
    begin
      execute 'select count(distinct user_id) from community_posts' into total_members_val;
    exception when others then
      total_members_val := 0;
    end;
  else
    total_members_val := 0;
  end if;

  -- Get active contributors
  if has_posts_table and has_user_id then
    begin
      execute 'select count(distinct user_id) from community_posts where created_at > now() - interval ''30 days''' into active_contributors_val;
    exception when others then
      active_contributors_val := 0;
    end;
  else
    active_contributors_val := 0;
  end if;

  return query
  select
    total_members_val,
    (select count(distinct country_name) from community_chapters where is_active = true)::bigint,
    (select count(*) from community_chapters where is_active = true)::bigint,
    (select count(*) from community_events where status = 'completed')::bigint,
    (select count(distinct collaboration_id) from community_collaboration_members)::bigint,
    active_contributors_val;
end;
$$;
