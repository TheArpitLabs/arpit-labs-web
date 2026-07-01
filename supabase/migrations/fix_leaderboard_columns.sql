-- Fix missing columns in community_leaderboard table
-- Run this in Supabase Dashboard SQL Editor

-- First ensure profiles table exists
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

-- Drop and recreate the table with correct schema
drop table if exists community_leaderboard cascade;

create table community_leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references profiles(id) on delete cascade,
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

-- Create indexes for performance
create index idx_community_leaderboard_points on community_leaderboard(points desc);
create index idx_community_leaderboard_rank on community_leaderboard(rank);
create index idx_community_leaderboard_contribution_score on community_leaderboard(contribution_score desc);
create index idx_community_leaderboard_rank_position on community_leaderboard(rank_position);

-- Enable RLS
alter table community_leaderboard enable row level security;

-- Create policies
create policy "Public can view leaderboard" on community_leaderboard for select using (true);
create policy "Authenticated can insert leaderboard" on community_leaderboard for insert with check (auth.uid() = user_id);
create policy "Users can update own leaderboard" on community_leaderboard for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
