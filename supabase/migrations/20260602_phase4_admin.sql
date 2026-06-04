-- Phase 4: Admin dashboard support, CMS fields, storage buckets, and RLS.

alter table if exists public.projects
  add column if not exists overview text,
  add column if not exists problem_statement text,
  add column if not exists architecture text,
  add column if not exists tech_stack text[] default '{}',
  add column if not exists screenshots text[] default '{}',
  add column if not exists lessons_learned text[] default '{}',
  add column if not exists published boolean not null default false;

alter table if exists public.lab_notes
  add column if not exists category text;

alter table if exists public.experiments
  add column if not exists difficulty text,
  add column if not exists tech_stack text[] default '{}';

alter table if exists public.journey_entries
  add column if not exists entry_type text default 'milestone',
  add column if not exists organization text,
  add column if not exists location text;

do $$
begin
  insert into storage.buckets (id, name, public)
  values
    ('projects', 'projects', true),
    ('blog', 'blog', true),
    ('experiments', 'experiments', true),
    ('uploads', 'uploads', true)
  on conflict (id) do nothing;
exception
  when undefined_table then
    null;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
$$;

alter table if exists public.projects enable row level security;
alter table if exists public.lab_notes enable row level security;
alter table if exists public.experiments enable row level security;
alter table if exists public.journey_entries enable row level security;
alter table if exists public.contact_messages enable row level security;
alter table if exists public.newsletter_subscribers enable row level security;

drop policy if exists "public can read published projects" on public.projects;
create policy "public can read published projects"
on public.projects
for select
using (coalesce(published, true) = true or public.is_admin());

drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects"
on public.projects
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read published lab notes" on public.lab_notes;
create policy "public can read published lab notes"
on public.lab_notes
for select
using (published = true or public.is_admin());

drop policy if exists "admins manage lab notes" on public.lab_notes;
create policy "admins manage lab notes"
on public.lab_notes
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read experiments" on public.experiments;
create policy "public can read experiments"
on public.experiments
for select
using (true);

drop policy if exists "admins manage experiments" on public.experiments;
create policy "admins manage experiments"
on public.experiments
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read journey entries" on public.journey_entries;
create policy "public can read journey entries"
on public.journey_entries
for select
using (true);

drop policy if exists "admins manage journey entries" on public.journey_entries;
create policy "admins manage journey entries"
on public.journey_entries
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins view contact messages" on public.contact_messages;
create policy "admins view contact messages"
on public.contact_messages
for select
using (public.is_admin());

drop policy if exists "public inserts contact messages" on public.contact_messages;
create policy "public inserts contact messages"
on public.contact_messages
for insert
with check (true);

drop policy if exists "admins delete contact messages" on public.contact_messages;
create policy "admins delete contact messages"
on public.contact_messages
for delete
using (public.is_admin());

drop policy if exists "admins manage newsletter subscribers" on public.newsletter_subscribers;
create policy "admins manage newsletter subscribers"
on public.newsletter_subscribers
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public inserts newsletter subscribers" on public.newsletter_subscribers;
create policy "public inserts newsletter subscribers"
on public.newsletter_subscribers
for insert
with check (true);
