-- Migration: Phase 3 - Advanced Profile Features & Verification System
-- Add profile verification, badges, achievements, and endorsements

-- ============================================
-- PROFILE VERIFICATION FIELDS
-- ============================================

-- Add verification status to profiles
alter table profiles 
add column if not exists is_verified boolean default false;

alter table profiles 
add column if not exists verification_date timestamptz;

alter table profiles 
add column if not exists verification_method text; -- email, social, manual

-- Add profile visibility field (if not exists from Phase 2)
alter table profiles 
add column if not exists profile_visibility text default 'private'; -- private, public, limited

-- Add username field for public profiles (if not exists from Phase 2)
alter table profiles 
add column if not exists username text unique;

-- Add engineering score
alter table profiles 
add column if not exists engineering_score integer default 0;

-- ============================================
-- PROFILE BADGES TABLE
-- ============================================

create table if not exists profile_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  badge_type text not null, -- verified, contributor, expert, mentor, top_contributor, early_adopter
  badge_name text not null,
  badge_description text,
  badge_icon text,
  badge_color text default '#8B5CF6',
  earned_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean default true,
  unique(profile_id, badge_type)
);

-- ============================================
-- PROFILE ACHIEVEMENTS TABLE
-- ============================================

create table if not exists profile_achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  achievement_type text not null, -- first_project, ten_projects, hundred_likes, mentor, etc.
  achievement_name text not null,
  achievement_description text,
  achievement_icon text,
  progress integer default 0,
  target integer default 1,
  completed_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  unique(profile_id, achievement_type)
);

-- ============================================
-- PROFILE ENDORSEMENTS TABLE
-- ============================================

create table if not exists profile_endorsements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endorser_id uuid not null references profiles(id) on delete cascade,
  skill text not null,
  endorsement_text text,
  rating integer check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  unique(endorser_id, profile_id, skill),
  check (endorser_id != profile_id)
);

-- ============================================
-- VERIFICATION REQUESTS TABLE
-- ============================================

create table if not exists verification_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  verification_type text not null, -- email, social, identity
  verification_data jsonb not null default '{}'::jsonb,
  status text not null default 'pending', -- pending, approved, rejected
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  rejection_reason text,
  notes text
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

create index if not exists profile_badges_profile_idx on profile_badges(profile_id);
create index if not exists profile_badges_type_idx on profile_badges(badge_type);
create index if not exists profile_achievements_profile_idx on profile_achievements(profile_id);
create index if not exists profile_achievements_type_idx on profile_achievements(achievement_type);
create index if not exists profile_endorsements_profile_idx on profile_endorsements(profile_id);
create index if not exists profile_endorsements_endorser_idx on profile_endorsements(endorser_id);
create index if not exists profile_endorsements_skill_idx on profile_endorsements(skill);
create index if not exists verification_requests_profile_idx on verification_requests(profile_id);
create index if not exists verification_requests_status_idx on verification_requests(status);
create index if not exists profiles_username_idx on profiles(username);
create index if not exists profiles_visibility_idx on profiles(profile_visibility);
create index if not exists profiles_verified_idx on profiles(is_verified);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS
alter table profile_badges enable row level security;
alter table profile_achievements enable row level security;
alter table profile_endorsements enable row level security;
alter table verification_requests enable row level security;

-- Profile Badges Policies
drop policy if exists "Users can view badges" on profile_badges;
drop policy if exists "Users can view their badges" on profile_badges;
drop policy if exists "System can manage badges" on profile_badges;
create policy "Users can view badges" on profile_badges for select using (true);
create policy "Users can view their badges" on profile_badges for select using (auth.uid() = profile_id);
create policy "System can manage badges" on profile_badges for all using (auth.role() = 'service_role');

-- Profile Achievements Policies
drop policy if exists "Users can view achievements" on profile_achievements;
drop policy if exists "Users can view their achievements" on profile_achievements;
drop policy if exists "System can manage achievements" on profile_achievements;
create policy "Users can view achievements" on profile_achievements for select using (true);
create policy "Users can view their achievements" on profile_achievements for select using (auth.uid() = profile_id);
create policy "System can manage achievements" on profile_achievements for all using (auth.role() = 'service_role');

-- Profile Endorsements Policies
drop policy if exists "Users can view endorsements" on profile_endorsements;
drop policy if exists "Users can create endorsements" on profile_endorsements;
drop policy if exists "Users can delete their endorsements" on profile_endorsements;
create policy "Users can view endorsements" on profile_endorsements for select using (true);
create policy "Users can create endorsements" on profile_endorsements for insert with check (auth.uid() = endorser_id);
create policy "Users can delete their endorsements" on profile_endorsements for delete using (auth.uid() = endorser_id);

-- Verification Requests Policies
drop policy if exists "Users can view their requests" on verification_requests;
drop policy if exists "Users can create requests" on verification_requests;
drop policy if exists "Admins can manage requests" on verification_requests;
create policy "Users can view their requests" on verification_requests for select using (auth.uid() = profile_id);
create policy "Users can create requests" on verification_requests for insert with check (auth.uid() = profile_id);
create policy "Admins can manage requests" on verification_requests for all using (auth.role() = 'service_role');

-- Update profiles policies for new fields
drop policy if exists "Public can view public profiles" on profiles;
create policy "Public can view public profiles" on profiles for select using (profile_visibility = 'public');

drop policy if exists "Users can update their profile" on profiles;
create policy "Users can update their profile" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================
-- TRIGGER FOR ENGINEERING SCORE CALCULATION
-- ============================================

-- Function to calculate engineering score
create or replace function calculate_engineering_score()
returns trigger as $$
declare
  new_score integer;
begin
  -- Calculate score based on various factors
  select 
    (select count(*) * 10 from projects where owner_id = NEW.id and published = true) + -- 10 points per published project
    (select count(*) * 5 from profile_follows where following_id = NEW.id) + -- 5 points per follower
    (select count(*) * 2 from profile_likes where profile_id = NEW.id) + -- 2 points per like
    (select count(*) * 3 from profile_endorsements where profile_id = NEW.id) + -- 3 points per endorsement
    (select count(*) * 15 from profile_badges where profile_id = NEW.id and is_active = true) + -- 15 points per badge
    (select count(*) * 20 from profile_achievements where profile_id = NEW.id and completed_at is not null) -- 20 points per achievement
  into new_score;
  
  -- Update the profile score
  update profiles 
  set engineering_score = coalesce(new_score, 0)
  where id = NEW.id;
  
  return NEW;
end;
$$ language plpgsql;

-- Triggers for score updates
create trigger engineering_score_projects_trigger
after insert or update or delete on projects
for each row execute function calculate_engineering_score();

create trigger engineering_score_follows_trigger
after insert or delete on profile_follows
for each row execute function calculate_engineering_score();

create trigger engineering_score_likes_trigger
after insert or delete on profile_likes
for each row execute function calculate_engineering_score();

create trigger engineering_score_endorsements_trigger
after insert or delete on profile_endorsements
for each row execute function calculate_engineering_score();

create trigger engineering_score_badges_trigger
after insert or update or delete on profile_badges
for each row execute function calculate_engineering_score();

create trigger engineering_score_achievements_trigger
after insert or update on profile_achievements
for each row execute function calculate_engineering_score();

-- ============================================
-- AUTOMATIC ACHIEVEMENT TRACKING
-- ============================================

-- Function to check and award achievements
create or replace function check_achievements()
returns trigger as $$
begin
  -- Check for first project achievement
  if (select count(*) from projects where owner_id = NEW.id and published = true) = 1 then
    insert into profile_achievements (profile_id, achievement_type, achievement_name, achievement_description, achievement_icon, progress, target, completed_at)
    values (NEW.id, 'first_project', 'First Project', 'Published your first project', '🚀', 1, 1, now())
    on conflict (profile_id, achievement_type) do nothing;
  end if;
  
  -- Check for 10 projects achievement
  if (select count(*) from projects where owner_id = NEW.id and published = true) >= 10 then
    insert into profile_achievements (profile_id, achievement_type, achievement_name, achievement_description, achievement_icon, progress, target, completed_at)
    values (NEW.id, 'ten_projects', 'Prolific Creator', 'Published 10 projects', '🏆', 10, 10, now())
    on conflict (profile_id, achievement_type) do nothing;
  end if;
  
  -- Check for 100 likes achievement
  if (select count(*) from profile_likes where profile_id = NEW.id) >= 100 then
    insert into profile_achievements (profile_id, achievement_type, achievement_name, achievement_description, achievement_icon, progress, target, completed_at)
    values (NEW.id, 'hundred_likes', 'Popular Creator', 'Received 100 likes on your profile', '❤️', 100, 100, now())
    on conflict (profile_id, achievement_type) do nothing;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- Trigger for automatic achievement checking
create trigger achievement_check_trigger
after insert on projects
for each row execute function check_achievements();

create trigger achievement_check_likes_trigger
after insert on profile_likes
for each row execute function check_achievements();

-- ============================================
-- INITIALIZE ENGINEERING SCORES FOR EXISTING PROFILES
-- ============================================

-- This will be handled by the triggers when data changes
-- For existing data, we can manually trigger:
-- update profiles set engineering_score = 0 where engineering_score is null;
