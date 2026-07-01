-- ============================================================================
-- PHASE 8C: LEARNING PLATFORM SCHEMA
-- Tables: courses, course_modules, labs, roadmaps, user_course_progress
-- ============================================================================

-- COURSES TABLE
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  content text,
  category text not null, -- IoT, AI, Cybersecurity, Web Development
  difficulty text not null, -- beginner, intermediate, advanced
  duration integer not null, -- duration in minutes
  thumbnail text,
  published boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COURSE MODULES TABLE
create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  content text not null,
  order_index integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LABS TABLE
create table if not exists labs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  instructions text not null,
  difficulty text not null, -- beginner, intermediate, advanced
  category text not null, -- IoT, AI, Cybersecurity, Web Development
  published boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ROADMAPS TABLE
create table if not exists roadmaps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  category text not null, -- IoT, AI, Cybersecurity, Web Development
  content text not null,
  published boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- USER COURSE PROGRESS TABLE
create table if not exists user_course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  progress_percentage integer not null default 0,
  completed boolean default false,
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

-- CREATE INDEXES FOR PERFORMANCE
create index idx_courses_category on courses(category);
create index idx_courses_published on courses(published);
create index idx_courses_slug on courses(slug);

create index idx_course_modules_course_id on course_modules(course_id);
create index idx_course_modules_order on course_modules(order_index);

create index idx_labs_category on labs(category);
create index idx_labs_published on labs(published);
create index idx_labs_slug on labs(slug);

create index idx_roadmaps_category on roadmaps(category);
create index idx_roadmaps_published on roadmaps(published);
create index idx_roadmaps_slug on roadmaps(slug);

create index idx_user_course_progress_user_id on user_course_progress(user_id);
create index idx_user_course_progress_course_id on user_course_progress(course_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
alter table courses enable row level security;
alter table course_modules enable row level security;
alter table labs enable row level security;
alter table roadmaps enable row level security;
alter table user_course_progress enable row level security;

-- COURSES POLICIES
-- Public can view published courses
create policy "Public can view published courses" on courses for select using (published = true);
-- Authenticated users (admins) can manage all courses
create policy "Authenticated users can manage courses" on courses for all using (auth.role() = 'authenticated');

-- COURSE MODULES POLICIES
-- Public can view modules of published courses
create policy "Public can view modules of published courses" on course_modules 
  for select using (
    exists(select 1 from courses where courses.id = course_modules.course_id and courses.published = true)
  );
-- Authenticated users can manage modules
create policy "Authenticated users can manage modules" on course_modules for all using (auth.role() = 'authenticated');

-- LABS POLICIES
-- Public can view published labs
create policy "Public can view published labs" on labs for select using (published = true);
-- Authenticated users can manage labs
create policy "Authenticated users can manage labs" on labs for all using (auth.role() = 'authenticated');

-- ROADMAPS POLICIES
-- Public can view published roadmaps
create policy "Public can view published roadmaps" on roadmaps for select using (published = true);
-- Authenticated users can manage roadmaps
create policy "Authenticated users can manage roadmaps" on roadmaps for all using (auth.role() = 'authenticated');

-- USER COURSE PROGRESS POLICIES
-- Users can view their own progress
create policy "Users can view their own progress" on user_course_progress 
  for select using (auth.uid() = user_id);
-- Users can update their own progress
create policy "Users can update their own progress" on user_course_progress 
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Users can insert their progress
create policy "Users can insert their progress" on user_course_progress 
  for insert with check (auth.uid() = user_id);
