-- Migration: Phase 8B - Community platform (posts, replies, votes)

create extension if not exists "pgcrypto";

-- Community posts
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  content text not null,
  category text,
  tags text[] default '{}',
  views integer not null default 0,
  upvotes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Community replies
create table if not exists community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Community votes
create table if not exists community_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  vote_type text not null,
  created_at timestamptz not null default now(),
  constraint unique_vote_per_user_per_post unique (post_id, user_id)
);

-- Indexes
create index if not exists idx_community_posts_slug on community_posts(slug);
create index if not exists idx_community_posts_tags on community_posts using gin (tags);

-- Enable RLS
alter table community_posts enable row level security;
alter table community_replies enable row level security;
alter table community_votes enable row level security;

-- Policies
-- Public can read posts
drop policy if exists "public can read community posts" on community_posts;
create policy "public can read community posts"
  on community_posts
  for select
  using (true);

-- Owners can insert posts
drop policy if exists "users can insert community posts" on community_posts;
create policy "users can insert community posts"
  on community_posts
  for insert
  with check (auth.uid() = user_id);

-- Owners or admins can update/delete
drop policy if exists "owners or admins manage community posts" on community_posts;
create policy "owners or admins manage community posts"
  on community_posts
  for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Replies: public can read
drop policy if exists "public can read community replies" on community_replies;
create policy "public can read community replies"
  on community_replies
  for select
  using (true);

-- Replies: authenticated users can insert
drop policy if exists "users can insert community replies" on community_replies;
create policy "users can insert community replies"
  on community_replies
  for insert
  with check (auth.uid() = user_id);

-- Replies: owners or admins can delete
drop policy if exists "owners or admins delete community replies" on community_replies;
create policy "owners or admins delete community replies"
  on community_replies
  for delete
  using (auth.uid() = user_id or public.is_admin());

-- Votes: authenticated users can insert; unique enforced by constraint
drop policy if exists "users can insert community votes" on community_votes;
create policy "users can insert community votes"
  on community_votes
  for insert
  with check (auth.uid() = user_id);

-- Admins can manage votes
drop policy if exists "admins manage community votes" on community_votes;
create policy "admins manage community votes"
  on community_votes
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Helper RPCs to adjust post upvote counters atomically
create or replace function increment_post_upvote_count(p_id uuid)
returns void language sql stable as $$
  update community_posts set upvotes = coalesce(upvotes,0) + 1 where id = p_id;
$$;

create or replace function decrement_post_upvote_count(p_id uuid)
returns void language sql stable as $$
  update community_posts set upvotes = greatest(coalesce(upvotes,0) - 1, 0) where id = p_id;
$$;
