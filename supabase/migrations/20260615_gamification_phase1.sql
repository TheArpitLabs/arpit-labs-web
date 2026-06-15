-- Gamification System - Phase 1
-- Database migration for points, badges, achievements, and streaks
-- Date: June 15, 2026

-- Enable pgcrypto extension if not already enabled
create extension if not exists "pgcrypto";

-- ============================================
-- USER POINTS TABLE
-- ============================================
create table if not exists user_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  points integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Create indexes for user_points
create index if not exists idx_user_points_user_id on user_points(user_id);
create index if not exists idx_user_points_points on user_points(points desc);
create index if not exists idx_user_points_level on user_points(level);

-- ============================================
-- POINT TRANSACTIONS TABLE
-- ============================================
create table if not exists point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  points integer not null,
  action_type text not null,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Create indexes for point_transactions
create index if not exists idx_point_transactions_user_id on point_transactions(user_id);
create index if not exists idx_point_transactions_created_at on point_transactions(created_at desc);
create index if not exists idx_point_transactions_action_type on point_transactions(action_type);

-- ============================================
-- BADGES TABLE
-- ============================================
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text,
  requirement_type text not null,
  requirement_value integer not null,
  points_reward integer default 0,
  created_at timestamptz not null default now()
);

-- Create indexes for badges
create index if not exists idx_badges_requirement_type on badges(requirement_type);

-- ============================================
-- USER BADGES TABLE
-- ============================================
create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

-- Create indexes for user_badges
create index if not exists idx_user_badges_user_id on user_badges(user_id);
create index if not exists idx_user_badges_badge_id on user_badges(badge_id);
create index if not exists idx_user_badges_earned_at on user_badges(earned_at desc);

-- ============================================
-- USER STREAKS TABLE
-- ============================================
create table if not exists user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Create indexes for user_streaks
create index if not exists idx_user_streaks_user_id on user_streaks(user_id);
create index if not exists idx_user_streaks_current_streak on user_streaks(current_streak desc);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  category text not null,
  difficulty text not null, -- easy, medium, hard, legendary
  points_reward integer not null,
  badge_id uuid references badges(id),
  criteria jsonb not null,
  created_at timestamptz not null default now()
);

-- Create indexes for achievements
create index if not exists idx_achievements_category on achievements(category);
create index if not exists idx_achievements_difficulty on achievements(difficulty);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  progress jsonb not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

-- Create indexes for user_achievements
create index if not exists idx_user_achievements_user_id on user_achievements(user_id);
create index if not exists idx_user_achievements_achievement_id on user_achievements(achievement_id);
create index if not exists idx_user_achievements_completed_at on user_achievements(completed_at desc);

-- ============================================
-- UPDATE PROFILES TABLE
-- ============================================
-- Add gamification columns to profiles table
alter table profiles 
  add column if not exists total_points integer default 0,
  add column if not exists level integer default 1,
  add column if not exists display_badge uuid references badges(id);

-- Create index for display_badge
create index if not exists idx_profiles_display_badge on profiles(display_badge);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all gamification tables
alter table user_points enable row level security;
alter table point_transactions enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table user_streaks enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;

-- USER POINTS RLS POLICIES
create policy "Users can view their own points" on user_points 
  for select using (auth.uid() = user_id);

create policy "Users can insert their own points" on user_points 
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own points" on user_points 
  for update using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

create policy "Public can view points for leaderboard" on user_points 
  for select using (true);

-- POINT TRANSACTIONS RLS POLICIES
create policy "Users can view their own transactions" on point_transactions 
  for select using (auth.uid() = user_id);

create policy "System can insert transactions" on point_transactions 
  for insert with check (true);

create policy "Public can view transactions for leaderboard" on point_transactions 
  for select using (true);

-- BADGES RLS POLICIES
create policy "Public can view badges" on badges 
  for select using (true);

create policy "Admins can manage badges" on badges 
  for all using (auth.role() = 'authenticated');

-- USER BADGES RLS POLICIES
create policy "Users can view their own badges" on user_badges 
  for select using (auth.uid() = user_id);

create policy "System can insert user badges" on user_badges 
  for insert with check (true);

create policy "Public can view user badges" on user_badges 
  for select using (true);

-- USER STREAKS RLS POLICIES
create policy "Users can view their own streaks" on user_streaks 
  for select using (auth.uid() = user_id);

create policy "System can insert user streaks" on user_streaks 
  for insert with check (true);

create policy "Users can update their own streaks" on user_streaks 
  for update using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

create policy "Public can view streaks for leaderboard" on user_streaks 
  for select using (true);

-- ACHIEVEMENTS RLS POLICIES
create policy "Public can view achievements" on achievements 
  for select using (true);

create policy "Admins can manage achievements" on achievements 
  for all using (auth.role() = 'authenticated');

-- USER ACHIEVEMENTS RLS POLICIES
create policy "Users can view their own achievements" on user_achievements 
  for select using (auth.uid() = user_id);

create policy "System can insert user achievements" on user_achievements 
  for insert with check (true);

create policy "Users can update their own achievements" on user_achievements 
  for update using (auth.uid() = user_id) 
  with check (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_user_points_updated_at before update on user_points
  for each row execute function update_updated_at_column();

create trigger update_user_streaks_updated_at before update on user_streaks
  for each row execute function update_updated_at_column();

create trigger update_user_achievements_updated_at before update on user_achievements
  for each row execute function update_updated_at_column();

-- Function to calculate level from points
create or replace function calculate_level(points integer)
returns integer as $$
begin
  if points < 100 then
    return 1;
  elsif points < 500 then
    return 2;
  elsif points < 1000 then
    return 3;
  elsif points < 2500 then
    return 4;
  elsif points < 5000 then
    return 5;
  else
    return 6;
  end if;
end;
$$ language plpgsql;

-- Function to award points to user
create or replace function award_points(
  p_user_id uuid,
  p_points integer,
  p_action_type text,
  p_description text,
  p_metadata jsonb default '{}'
)
returns uuid as $$
declare
  v_transaction_id uuid;
  v_user_points record;
begin
  -- Insert point transaction
  insert into point_transactions (user_id, points, action_type, description, metadata)
  values (p_user_id, p_points, p_action_type, p_description, p_metadata)
  returning id into v_transaction_id;
  
  -- Update or insert user points
  insert into user_points (user_id, points, level)
  values (p_user_id, p_points, calculate_level(p_points))
  on conflict (user_id) do update set
    points = user_points.points + p_points,
    level = calculate_level(user_points.points + p_points),
    updated_at = now();
  
  -- Update profiles table
  update profiles
  set total_points = total_points + p_points,
      level = calculate_level(total_points + p_points)
  where id = p_user_id;
  
  return v_transaction_id;
end;
$$ language plpgsql;

-- Function to update user streak
create or replace function update_user_streak(p_user_id uuid)
returns void as $$
declare
  v_current_streak integer;
  v_longest_streak integer;
  v_last_activity_date date;
  v_today date := current_date;
begin
  -- Get current streak data
  select current_streak, longest_streak, last_activity_date
  into v_current_streak, v_longest_streak, v_last_activity_date
  from user_streaks
  where user_id = p_user_id;
  
  -- Check if user has existing streak
  if not found then
    -- Create new streak
    insert into user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    values (p_user_id, 1, 1, v_today);
  elsif v_last_activity_date = v_today - interval '1 day' then
    -- Increment streak (consecutive day)
    update user_streaks
    set current_streak = current_streak + 1,
        longest_streak = greatest(longest_streak, current_streak + 1),
        last_activity_date = v_today,
        updated_at = now()
    where user_id = p_user_id;
  elsif v_last_activity_date = v_today then
    -- Already logged in today, no change
    return;
  else
    -- Streak broken, reset to 1
    update user_streaks
    set current_streak = 1,
        last_activity_date = v_today,
        updated_at = now()
    where user_id = p_user_id;
  end if;
end;
$$ language plpgsql;

-- ============================================
-- INITIAL BADGE DATA
-- ============================================

-- Insert initial badges
insert into badges (name, description, icon, requirement_type, requirement_value, points_reward) values
  ('Explorer', 'View 10 different projects', '🔍', 'content_views', 10, 50),
  ('Collector', 'Save 5 items', '💾', 'content_saves', 5, 25),
  ('Contributor', 'Submit a contact form', '📝', 'contact_forms', 1, 15),
  ('Subscriber', 'Subscribe to newsletter', '📧', 'newsletter_subscription', 1, 25),
  ('Scholar', 'Complete 3 experiments', '🎓', 'experiments_completed', 3, 75),
  ('Creator', 'Complete a project', '🚀', 'projects_completed', 1, 100),
  ('Streak Master', '7-day login streak', '🔥', 'login_streak', 7, 50),
  ('Community Builder', 'Refer 5 users', '👥', 'referrals', 5, 100)
on conflict (name) do nothing;

-- ============================================
-- INITIAL ACHIEVEMENT DATA
-- ============================================

-- Insert initial achievements
insert into achievements (name, description, category, difficulty, points_reward, badge_id, criteria) values
  ('First Steps', 'View your first project', 'content', 'easy', 5, 
   (select id from badges where name = 'Explorer'), 
   '{"type": "content_views", "target": 1}'::jsonb),
  
  ('Content Explorer', 'View 10 different projects', 'content', 'easy', 50,
   (select id from badges where name = 'Explorer'),
   '{"type": "content_views", "target": 10}'::jsonb),
  
  ('Content Scholar', 'View 50 different projects', 'content', 'medium', 200,
   null,
   '{"type": "content_views", "target": 50}'::jsonb),
  
  ('First Save', 'Save your first item', 'content', 'easy', 10,
   (select id from badges where name = 'Collector'),
   '{"type": "content_saves", "target": 1}'::jsonb),
  
  ('Collector', 'Save 5 items', 'content', 'easy', 25,
   (select id from badges where name = 'Collector'),
   '{"type": "content_saves", "target": 5}'::jsonb),
  
  ('Hoarder', 'Save 50 items', 'content', 'medium', 100,
   null,
   '{"type": "content_saves", "target": 50}'::jsonb),
  
  ('First Contact', 'Submit your first contact form', 'community', 'easy', 15,
   (select id from badges where name = 'Contributor'),
   '{"type": "contact_forms", "target": 1}'::jsonb),
  
  ('Newsletter Subscriber', 'Subscribe to the newsletter', 'community', 'easy', 25,
   (select id from badges where name = 'Subscriber'),
   '{"type": "newsletter_subscription", "target": 1}'::jsonb),
  
  ('First Experiment', 'Complete your first experiment', 'learning', 'easy', 25,
   null,
   '{"type": "experiments_completed", "target": 1}'::jsonb),
  
  ('Experiment Scholar', 'Complete 3 experiments', 'learning', 'medium', 75,
   (select id from badges where name = 'Scholar'),
   '{"type": "experiments_completed", "target": 3}'::jsonb),
  
  ('First Project', 'Complete your first project', 'learning', 'easy', 100,
   (select id from badges where name = 'Creator'),
   '{"type": "projects_completed", "target": 1}'::jsonb),
  
  ('3-Day Streak', 'Login for 3 consecutive days', 'engagement', 'easy', 15,
   null,
   '{"type": "login_streak", "target": 3}'::jsonb),
  
  ('7-Day Streak', 'Login for 7 consecutive days', 'engagement', 'medium', 50,
   (select id from badges where name = 'Streak Master'),
   '{"type": "login_streak", "target": 7}'::jsonb),
  
  ('30-Day Streak', 'Login for 30 consecutive days', 'engagement', 'hard', 200,
   null,
   '{"type": "login_streak", "target": 30}'::jsonb)
on conflict (name) do nothing;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for user gamification summary
create or replace view user_gamification_summary as
select 
  p.id as user_id,
  p.email,
  p.full_name,
  coalesce(up.points, 0) as points,
  coalesce(up.level, 1) as level,
  coalesce(us.current_streak, 0) as current_streak,
  coalesce(us.longest_streak, 0) as longest_streak,
  (select count(*) from user_badges where user_id = p.id) as badges_earned,
  (select count(*) from user_achievements where user_id = p.id and completed_at is not null) as achievements_completed
from profiles p
left join user_points up on p.id = up.user_id
left join user_streaks us on p.id = us.user_id;

-- View for leaderboard
create or replace view gamification_leaderboard as
select 
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  coalesce(up.points, 0) as points,
  coalesce(up.level, 1) as level,
  coalesce(us.current_streak, 0) as current_streak,
  (select count(*) from user_badges where user_id = p.id) as badges_earned,
  (select count(*) from user_achievements where user_id = p.id and completed_at is not null) as achievements_completed,
  row_number() over (order by coalesce(up.points, 0) desc) as rank
from profiles p
left join user_points up on p.id = up.user_id
left join user_streaks us on p.id = us.user_id
order by points desc;
