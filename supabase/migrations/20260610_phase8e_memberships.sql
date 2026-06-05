-- ============================================================================
-- PHASE 8E: MEMBERSHIP AND SUBSCRIPTION SCHEMA
-- ============================================================================

-- MEMBERSHIP PLANS TABLE
create table if not exists membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  monthly_price numeric not null default 0,
  yearly_price numeric not null default 0,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- USER SUBSCRIPTIONS TABLE
create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid not null references membership_plans(id) on delete restrict,
  status text not null default 'active',
  billing_cycle text not null default 'monthly',
  start_date timestamptz not null default now(),
  end_date timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

-- FEATURE ACCESS TABLE
create table if not exists feature_access (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references membership_plans(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false
);

create index if not exists idx_membership_plans_slug on membership_plans(slug);
create index if not exists idx_user_subscriptions_user_id on user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_status on user_subscriptions(status);
create index if not exists idx_feature_access_plan_id on feature_access(plan_id);
create unique index if not exists idx_feature_access_plan_feature on feature_access(plan_id, feature_key);

alter table membership_plans enable row level security;
alter table user_subscriptions enable row level security;
alter table feature_access enable row level security;

drop policy if exists "Public can view membership plans" on membership_plans;
drop policy if exists "Authenticated users can manage membership plans" on membership_plans;
create policy "Public can view membership plans"
  on membership_plans for select
  using (active = true or public.is_admin());

drop policy if exists "Admins can manage membership plans" on membership_plans;
create policy "Admins can manage membership plans"
  on membership_plans for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users can view their own subscriptions" on user_subscriptions;
drop policy if exists "Users can insert their subscriptions" on user_subscriptions;
drop policy if exists "Users can update their own subscriptions" on user_subscriptions;
create policy "Users can view their own subscriptions"
  on user_subscriptions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can manage user subscriptions" on user_subscriptions;
create policy "Admins can manage user subscriptions"
  on user_subscriptions for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can view feature access" on feature_access;
drop policy if exists "Authenticated users can manage feature access" on feature_access;
create policy "Public can view feature access"
  on feature_access for select
  using (true);

drop policy if exists "Admins can manage feature access" on feature_access;
create policy "Admins can manage feature access"
  on feature_access for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed initial plans
insert into membership_plans (slug, name, description, monthly_price, yearly_price, features, active)
values
  ('free', 'Free', 'Access the community, public learning resources, and essential AI support.', 0, 0, '["community_access", "public_projects", "public_blog", "limited_ai", "public_courses"]', true),
  ('student', 'Student', 'Unlock premium courses, roadmap guidance, hackathon resources, and more AI credits.', 19, 190, '["community_access", "public_projects", "public_blog", "limited_ai", "public_courses", "premium_courses", "learning_roadmaps", "hackathon_resources", "higher_ai_limits", "saved_learning_progress"]', true),
  ('premium', 'Premium', 'Everything in Student plus unlimited AI, recruiter assistant, premium labs, and analytics.', 39, 390, '["community_access", "public_projects", "public_blog", "limited_ai", "public_courses", "premium_courses", "learning_roadmaps", "hackathon_resources", "higher_ai_limits", "saved_learning_progress", "unlimited_ai", "recruiter_assistant", "ai_project_generator", "premium_labs", "exclusive_content", "advanced_analytics"]', true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price = excluded.monthly_price,
  yearly_price = excluded.yearly_price,
  features = excluded.features,
  active = excluded.active;

-- Seed feature access mapping for each plan
insert into feature_access (plan_id, feature_key, enabled)
select id, 'community_access', true from membership_plans where slug in ('free', 'student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'public_projects', true from membership_plans where slug in ('free', 'student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'public_blog', true from membership_plans where slug in ('free', 'student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'limited_ai', true from membership_plans where slug in ('free', 'student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'public_courses', true from membership_plans where slug in ('free', 'student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'premium_courses', true from membership_plans where slug in ('student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'learning_roadmaps', true from membership_plans where slug in ('student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'hackathon_resources', true from membership_plans where slug in ('student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'higher_ai_limits', true from membership_plans where slug in ('student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'saved_learning_progress', true from membership_plans where slug in ('student', 'premium')
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'unlimited_ai', true from membership_plans where slug = 'premium'
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'recruiter_assistant', true from membership_plans where slug = 'premium'
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'ai_project_generator', true from membership_plans where slug = 'premium'
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'premium_labs', true from membership_plans where slug = 'premium'
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'exclusive_content', true from membership_plans where slug = 'premium'
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into feature_access (plan_id, feature_key, enabled)
select id, 'advanced_analytics', true from membership_plans where slug = 'premium'
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;
