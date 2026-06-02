-- Arpit Labs Supabase Schema

create extension if not exists "pgcrypto";

create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  status text not null,
  category text,
  featured boolean default false,
  cover_image text,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lab_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  cover_image text,
  tags text[] default array[]::text[],
  published boolean default false,
  reading_time integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists journey (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  title text not null,
  description text not null,
  icon text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz not null default now()
);

-- Storage buckets prepared for future asset uploads
-- experiments
-- lab-notes
-- uploads
-- future-projects
