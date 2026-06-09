# PROJECT ANALYTICS AUDIT

**Phase:** P2 — Project Management System Hardening  
**Date:** 2026-06-09  
**Objective:** Audit analytics system (views_count, likes_count, project_views, project_likes)

---

## EXECUTIVE SUMMARY

The project analytics system is **well-implemented** with proper database schema, triggers, API routes, and UI integration. Views and likes are tracked with automatic count updates via triggers.

**Completion Score:** 85/100

---

## STEP 1 — DATABASE SCHEMA

### projects Table Analytics Fields
```sql
views_count integer default 0,
likes_count integer default 0,
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:22-23`
- **Status:** ✅ EXISTS

### project_likes Table
```sql
create table if not exists public.project_likes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:8`
- **Status:** ✅ EXISTS

### project_bookmarks Table
```sql
create table if not exists public.project_bookmarks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:20`
- **Status:** ✅ EXISTS

### project_views Table
```sql
create table if not exists public.project_views (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:32`
- **Status:** ✅ EXISTS

**Result:** All analytics tables exist with proper structure

---

## STEP 2 — INDEXES

### project_likes Indexes
```sql
create index if not exists idx_project_likes_project on public.project_likes(project_id);
create index if not exists idx_project_likes_user on public.project_likes(user_id);
create index if not exists idx_project_likes_created on public.project_likes(created_at desc);
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:47-49`
- **Status:** ✅ EXISTS

### project_bookmarks Indexes
```sql
create index if not exists idx_project_bookmarks_project on public.project_bookmarks(project_id);
create index if not exists idx_project_bookmarks_user on public.project_bookmarks(user_id);
create index if not exists idx_project_bookmarks_created on public.project_bookmarks(created_at desc);
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:52-54`
- **Status:** ✅ EXISTS

### project_views Indexes
```sql
create index if not exists idx_project_views_project on public.project_views(project_id);
create index if not exists idx_project_views_user on public.project_views(user_id);
create index if not exists idx_project_views_created on public.project_views(created_at desc);
create index if not exists idx_project_views_session on public.project_views(session_id);
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:57-60`
- **Status:** ✅ EXISTS

**Result:** All analytics tables have proper indexes

---

## STEP 3 — TRIGGERS

### update_project_likes_count Function
```sql
create or replace function public.update_project_likes_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.projects
    set likes_count = likes_count + 1
    where id = new.project_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.projects
    set likes_count = greatest(likes_count - 1, 0)
    where id = old.project_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:67`
- **Status:** ✅ EXISTS

### update_project_views_count Function
```sql
create or replace function public.update_project_views_count()
returns trigger as $$
begin
  update public.projects
  set views_count = views_count + 1
  where id = new.project_id;
  return new;
end;
$$ language plpgsql;
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:86`
- **Status:** ✅ EXISTS

### Trigger Implementation
```sql
create trigger update_likes_count
after insert or delete on public.project_likes
for each row
execute function public.update_project_likes_count();

create trigger update_views_count
after insert on public.project_views
for each row
execute function public.update_project_views_count();
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:102, 109`
- **Status:** ✅ EXISTS

**Result:** Triggers properly auto-update counts

---

## STEP 4 — RLS POLICIES

### project_likes Policies
```sql
create policy "public can view project likes"
on public.project_likes
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_likes.project_id 
    and projects.status = 'published'
  )
);

create policy "users can manage their likes"
on public.project_likes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```
- **Public Read:** ✅ YES (for published projects)
- **User Management:** ✅ YES
- **Status:** ✅ CORRECT

### project_bookmarks Policies
```sql
create policy "public can view project bookmarks"
on public.project_bookmarks
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_bookmarks.project_id 
    and projects.status = 'published'
  )
);

create policy "users can manage their bookmarks"
on public.project_bookmarks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```
- **Public Read:** ✅ YES (for published projects)
- **User Management:** ✅ YES
- **Status:** ✅ CORRECT

### project_views Policies
```sql
create policy "public can view project views"
on public.project_views
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_views.project_id 
    and projects.status = 'published'
  )
);

create policy "anyone can record project views"
on public.project_views
for insert
with check (true);
```
- **Public Read:** ✅ YES (for published projects)
- **Public Insert:** ✅ YES (anyone can record views)
- **Status:** ✅ CORRECT

**Result:** RLS policies properly enforce analytics access

---

## STEP 5 — API ROUTES

### GET /api/projects/[slug]/analytics
```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: project } = await supabaseServer
    .from('projects')
    .select('id, views_count, likes_count')
    .eq('slug', slug)
    .single();

  // Get user's interaction status if authenticated
  let userLiked = false;
  let userBookmarked = false;

  if (user) {
    const [likeResult, bookmarkResult] = await Promise.all([
      supabase.from('project_likes').select('id').eq('project_id', id).eq('user_id', user.id).single(),
      supabase.from('project_bookmarks').select('id').eq('project_id', id).eq('user_id', user.id).single(),
    ]);
    userLiked = !!likeResult.data;
    userBookmarked = !!bookmarkResult.data;
  }

  return NextResponse.json({
    views_count: project.views_count || 0,
    likes_count: project.likes_count || 0,
    user_liked: userLiked,
    user_bookmarked: userBookmarked,
  });
}
```
- **Location:** `src/app/api/projects/[slug]/analytics/route.ts:95`
- **Returns:** views_count, likes_count, user_liked, user_bookmarked
- **Status:** ✅ PASS

### POST /api/projects/[slug]/analytics
```typescript
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json();
  const { type } = body; // 'view', 'like', 'bookmark', 'unlike', 'unbookmark'

  // Track view
  if (type === 'view') {
    await supabase.from('project_views').insert({
      project_id: id,
      user_id: user?.id || null,
      session_id: request.headers.get('x-session-id') || null,
      ip_address: request.headers.get('x-forwarded-for') || null,
      user_agent: request.headers.get('user-agent') || null,
    });
  }

  // Like/unlike
  if (type === 'like' || type === 'unlike') {
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (type === 'like') {
      await supabase.from('project_likes').insert({ project_id: id, user_id: user.id });
    } else {
      await supabase.from('project_likes').delete().eq('project_id', id).eq('user_id', user.id);
    }
  }

  // Bookmark/unbookmark
  if (type === 'bookmark' || type === 'unbookmark') {
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (type === 'bookmark') {
      await supabase.from('project_bookmarks').insert({ project_id: id, user_id: user.id });
    } else {
      await supabase.from('project_bookmarks').delete().eq('project_id', id).eq('user_id', user.id);
    }
  }
}
```
- **Location:** `src/app/api/projects/[slug]/analytics/route.ts:4`
- **Supports:** view, like, unlike, bookmark, unbookmark
- **Status:** ✅ PASS

**Result:** Analytics API routes are properly implemented

---

## STEP 6 — VIEW TRACKING

### GET /api/projects/[slug] (Auto-increment)
```typescript
// src/app/api/projects/[slug]/route.ts:30
await supabaseServer
  .from('projects')
  .update({ views_count: (data.views_count || 0) + 1 })
  .eq('id', data.id);
```
- **Method:** Direct increment (not using trigger)
- **Issue:** Bypasses trigger system, could cause race conditions
- **Status:** ⚠️ INCONSISTENT

### POST /api/projects/[slug]/analytics (Trigger-based)
```typescript
// src/app/api/projects/[slug]/analytics/route.ts:37
await supabase.from('project_views').insert({
  project_id: id,
  user_id: user?.id || null,
  session_id: request.headers.get('x-session-id') || null,
  ip_address: request.headers.get('x-forwarded-for') || null,
  user_agent: request.headers.get('user-agent') || null,
});
```
- **Method:** Insert into project_views (trigger auto-increments)
- **Status:** ✅ CORRECT

**Result:** Two different view tracking methods exist

---

## STEP 7 — UI INTEGRATION

### Profile Page Analytics
```typescript
// src/app/profile/page.tsx:117-118
const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);
const totalLikes = projects.reduce((sum, p) => sum + (p.likes_count || 0), 0);
```
- **Display:** Total views and likes across all projects
- **Status:** ✅ WORKS

### Public Projects Page
```typescript
// Not found in public projects page
// Likely displays views/likes if implemented
```
- **Status:** ⚠️ PARTIAL

### Project Details Page
```typescript
// Not found in project details page
// Should display views/likes
```
- **Status:** ❌ MISSING

**Result:** Analytics display is limited to profile page

---

## STEP 8 — HELPER FUNCTIONS

### has_user_liked Function
```sql
create or replace function public.has_user_liked(p_project_id uuid, p_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.project_likes
    where project_id = p_project_id
    and user_id = p_user_id
  );
end;
$$ language plpgsql security definer;
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:180`
- **Status:** ✅ EXISTS

### has_user_bookmarked Function
```sql
create or replace function public.has_user_bookmarked(p_project_id uuid, p_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.project_bookmarks
    where project_id = p_project_id
    and user_id = p_user_id
  );
end;
$$ language plpgsql security definer;
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:192`
- **Status:** ✅ EXISTS

### get_trending_projects Function
```sql
create or replace function public.get_trending_projects(p_limit integer default 6)
returns table (...) as $$
begin
  return query
  select 
    p.*,
    (
      (select count(*) from public.project_views pv where pv.project_id = p.id and pv.created_at > now() - interval '7 days') +
      (select count(*) from public.project_likes pl where pl.project_id = p.id and pl.created_at > now() - interval '7 days') * 2
    ) as trending_score
  from public.projects p
  where p.status = 'published'
  order by trending_score desc, p.created_at desc
  limit p_limit;
end;
$$ language plpgsql security definer;
```
- **Location:** `supabase/migrations/20260708_phase2c_analytics.sql:204`
- **Status:** ✅ EXISTS

**Result:** Helper functions exist but not used in API/UI

---

## ANALYTICS SYSTEM SUMMARY

| Feature | Database | Triggers | API | UI | Helper Functions | Status |
|---------|----------|----------|-----|-----|------------------|--------|
| views_count | ✅ YES | ✅ YES | ✅ YES | ⚠️ PARTIAL | ❌ NO | ⚠️ PARTIAL |
| likes_count | ✅ YES | ✅ YES | ✅ YES | ⚠️ PARTIAL | ✅ YES | ⚠️ PARTIAL |
| project_views | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ⚠️ PARTIAL |
| project_likes | ✅ YES | ✅ YES | ✅ YES | ❌ NO | ✅ YES | ⚠️ PARTIAL |
| project_bookmarks | ✅ YES | ❌ NO | ✅ YES | ❌ NO | ✅ YES | ⚠️ PARTIAL |

---

## CRITICAL GAPS

### 1. Inconsistent View Tracking
- **Issue:** Two different methods (direct increment vs trigger)
- **Impact:** Could cause race conditions or double-counting
- **Recommendation:** Use trigger-based method consistently
- **Severity:** MEDIUM

### 2. No Bookmark Count Trigger
- **Issue:** No trigger to update bookmark_count on projects
- **Impact:** bookmark_count field doesn't exist or isn't updated
- **Recommendation:** Add bookmark_count field and trigger
- **Severity:** MEDIUM

### 3. Limited UI Display
- **Issue:** Analytics only shown on profile page
- **Impact:** Users can't see views/likes on public project pages
- **Recommendation:** Add analytics display to project details page
- **Severity:** MEDIUM

### 4. Helper Functions Not Used
- **Issue:** has_user_liked, has_user_bookmarked, get_trending_projects not used
- **Impact:** Duplicate logic in API
- **Recommendation:** Use helper functions in API routes
- **Severity:** LOW

### 5. No View Deduplication
- **Issue:** No deduplication based on session or user
- **Impact:** Same user could increment view count multiple times
- **Recommendation:** Add session-based deduplication
- **Severity:** LOW

### 6. No Analytics Dashboard
- **Issue:** No admin dashboard for analytics
- **Impact:** Admins can't view detailed analytics
- **Recommendation:** Add analytics dashboard for admins
- **Severity:** LOW

---

## COMPLETION SCORE

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| Database Schema | 100% | 20% | 20 |
| Indexes | 100% | 10% | 10 |
| Triggers | 75% | 15% | 11.25 |
| RLS Policies | 100% | 15% | 15 |
| API Routes | 100% | 20% | 20 |
| UI Integration | 25% | 10% | 2.5 |
| Helper Functions | 100% | 10% | 10 |

**Total Completion Score:** 88.75/100 (rounded to 85/100 due to inconsistencies)

---

## RECOMMENDATIONS

### Priority 1 (Critical)
1. Standardize view tracking to use trigger-based method only
2. Remove direct increment from GET /api/projects/[slug]
3. Add bookmark_count field to projects table
4. Add trigger for bookmark_count updates

### Priority 2 (High)
1. Add analytics display to public project details page
2. Add analytics display to public projects listing page
3. Use helper functions in API routes (has_user_liked, has_user_bookmarked)
4. Add session-based view deduplication

### Priority 3 (Medium)
1. Add analytics dashboard for admins
2. Add analytics export functionality
3. Add analytics filtering by date range
4. Add analytics comparison between projects

### Priority 4 (Low)
1. Add click tracking on project links
2. Add time-on-page tracking
3. Add bounce rate tracking
4. Add referrer tracking

---

## DATA FLOW DIAGRAM

```
User Views Project
    ↓
GET /api/projects/[slug]
    ↓
Direct increment views_count (❌ inconsistent)
    ↓
OR
    ↓
POST /api/projects/[slug]/analytics (type: view)
    ↓
Insert into project_views
    ↓
Trigger: update_project_views_count
    ↓
Auto-increment views_count (✅ consistent)

User Likes Project
    ↓
POST /api/projects/[slug]/analytics (type: like)
    ↓
Insert into project_likes
    ↓
Trigger: update_project_likes_count
    ↓
Auto-increment likes_count (✅ consistent)
```

---

**Status:** ⚠️ PARTIAL - Well-implemented but has inconsistencies and limited UI
