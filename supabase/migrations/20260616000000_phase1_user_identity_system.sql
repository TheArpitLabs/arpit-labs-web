-- Migration: Phase 1 - User Identity System
-- Add username field and profile visibility settings for public profiles

-- Add username field to profiles table
alter table profiles 
add column if not exists username text unique;

-- Add profile visibility settings
alter table profiles 
add column if not exists profile_visibility text default 'private';

-- Add engineering score fields
alter table profiles 
add column if not exists engineering_score integer default 0;

-- Add resume data fields
alter table profiles 
add column if not exists skills jsonb default '[]'::jsonb;

alter table profiles 
add column if not exists experience jsonb default '[]'::jsonb;

alter table profiles 
add column if not exists education jsonb default '[]'::jsonb;

alter table profiles 
add column if not exists resume_url text;

-- Create index on username for faster lookups
create index if not exists profiles_username_idx on profiles(username);

-- Update RLS policies to allow public profile viewing
create policy "Public profiles are viewable by everyone" 
on profiles for select 
using (profile_visibility = 'public');

-- First, set all existing profiles to private (default)
update profiles 
set profile_visibility = 'private'
where profile_visibility is null;

-- Then update existing profiles to have unique usernames based on email
-- Only set username for profiles that don't have one yet
update profiles 
set username = split_part(email, '@', 1) || '_' || substr(id::text, 1, 8)
where username is null;

-- Note: We're not adding a strict check constraint because:
-- 1. Existing data may have usernames even when private
-- 2. We want to allow users to set usernames before going public
-- 3. Application-level validation will ensure consistency
