-- Migration: Phase 8A - Add profiles and saved_content tables

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
create policy "Users can view their profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert their profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Policies for saved_content
create policy "Users can view their saved content" on saved_content for select using (auth.uid() = user_id);
create policy "Users can insert saved content" on saved_content for insert with check (auth.uid() = user_id);
create policy "Users can delete their saved content" on saved_content for delete using (auth.uid() = user_id);
