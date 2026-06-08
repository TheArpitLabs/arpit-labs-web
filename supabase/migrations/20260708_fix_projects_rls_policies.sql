-- Fix RLS Policies for Projects Table
-- This migration ensures users can view their own projects regardless of status

-- Drop existing policies that might conflict
drop policy if exists "public can read published projects" on public.projects;
drop policy if exists "admins manage projects" on public.projects;
drop policy if exists "owners can manage their projects" on public.projects;
drop policy if exists "authenticated can insert projects" on public.projects;
drop policy if exists "Public can view published projects" on public.projects;
drop policy if exists "Admins have full access to projects" on public.projects;

-- Create new policies with proper owner-based access

-- Policy 1: Public can read published projects
create policy "public can read published projects"
on public.projects
for select
using (status = 'published' or public.is_admin());

-- Policy 2: Users can read their own projects (regardless of status)
create policy "users can read own projects"
on public.projects
for select
using (auth.uid() = owner_id);

-- Policy 3: Users can insert their own projects
create policy "users can insert own projects"
on public.projects
for insert
with check (auth.uid() = owner_id);

-- Policy 4: Users can update their own projects
create policy "users can update own projects"
on public.projects
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

-- Policy 5: Users can delete their own projects
create policy "users can delete own projects"
on public.projects
for delete
using (auth.uid() = owner_id);

-- Policy 6: Admins have full access
create policy "admins have full access to projects"
on public.projects
for all
using (public.is_admin())
with check (public.is_admin());
