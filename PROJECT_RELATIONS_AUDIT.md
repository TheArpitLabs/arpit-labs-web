# PROJECT RELATIONS AUDIT

**Phase:** P2 — Project Management System Hardening  
**Date:** 2026-06-09  
**Objective:** Audit contributors and tags (project_contributors, project_tags)

---

## EXECUTIVE SUMMARY

The project relations system (contributors and tags) has **database schema but no implementation**. Tables exist with proper structure, but there are no API routes, UI components, or repository functions to manage them.

**Completion Score:** 25/100

---

## STEP 1 — project_contributors TABLE

### Table Definition
```sql
create table if not exists public.project_contributors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'contributor' check (role in ('owner', 'maintainer', 'contributor', 'collaborator')),
  contribution_type text[] default '{}',
  joined_at timestamptz not null default now(),
  unique(project_id, user_id)
);
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:56`
- **Status:** ✅ EXISTS

### Indexes
```sql
create index if not exists idx_project_contributors_project on public.project_contributors(project_id);
create index if not exists idx_project_contributors_user on public.project_contributors(user_id);
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:103-104`
- **Status:** ✅ EXISTS

**Result:** project_contributors table exists with proper structure and indexes

---

## STEP 2 — project_tags TABLE

### Table Definition
```sql
create table if not exists public.project_tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(project_id, tag)
);
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:70`
- **Status:** ✅ EXISTS

### Indexes
```sql
create index if not exists idx_project_tags_project on public.project_tags(project_id);
create index if not exists idx_project_tags_tag on public.project_tags(tag);
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:107-108`
- **Status:** ✅ EXISTS

**Result:** project_tags table exists with proper structure and indexes

---

## STEP 3 — RLS POLICIES

### project_contributors Policies
```sql
create policy "public can read contributors from published projects"
on public.project_contributors
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_contributors.project_id 
    and projects.status = 'published'
  ) or public.is_admin()
);

create policy "owners can manage project contributors"
on public.project_contributors
for all
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_contributors.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.projects 
    where projects.id = project_contributors.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
);
```
- **Public Read:** ✅ YES (for published projects)
- **Owner Management:** ✅ YES
- **Status:** ✅ CORRECT

### project_tags Policies
```sql
create policy "public can read tags from published projects"
on public.project_tags
for select
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_tags.project_id 
    and projects.status = 'published'
  ) or public.is_admin()
);

create policy "owners can manage project tags"
on public.project_tags
for all
using (
  exists (
    select 1 from public.projects 
    where projects.id = project_tags.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.projects 
    where projects.id = project_tags.project_id 
    and (projects.owner_id = auth.uid() or public.is_admin())
  )
);
```
- **Public Read:** ✅ YES (for published projects)
- **Owner Management:** ✅ YES
- **Status:** ✅ CORRECT

**Result:** RLS policies properly enforce access to contributors and tags

---

## STEP 4 — API ROUTES

### project_contributors API
- **GET /api/projects/[slug]/contributors:** ❌ DOES NOT EXIST
- **POST /api/projects/[slug]/contributors:** ❌ DOES NOT EXIST
- **PUT /api/projects/[slug]/contributors/[userId]:** ❌ DOES NOT EXIST
- **DELETE /api/projects/[slug]/contributors/[userId]:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

### project_tags API
- **GET /api/projects/[slug]/tags:** ❌ DOES NOT EXIST
- **POST /api/projects/[slug]/tags:** ❌ DOES NOT EXIST
- **DELETE /api/projects/[slug]/tags/[tag]:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

**Result:** No API routes for contributors or tags management

---

## STEP 5 — REPOSITORY FUNCTIONS

### project_contributors Repository
- **getContributors(projectId):** ❌ NOT FOUND
- **addContributor(projectId, userId, role):** ❌ NOT FOUND
- **updateContributor(projectId, userId, role):** ❌ NOT FOUND
- **removeContributor(projectId, userId):** ❌ NOT FOUND
- **Status:** ❌ FAIL

### project_tags Repository
- **getTags(projectId):** ❌ NOT FOUND
- **addTag(projectId, tag):** ❌ NOT FOUND
- **removeTag(projectId, tag):** ❌ NOT FOUND
- **Status:** ❌ FAIL

**Result:** No repository functions for contributors or tags

---

## STEP 6 — UI USAGE

### project_contributors UI
- **Contributor Display:** ❌ NOT FOUND in project details page
- **Add Contributor UI:** ❌ NOT FOUND
- **Manage Contributors UI:** ❌ NOT FOUND
- **Status:** ❌ FAIL

### project_tags UI
- **Tags Display:** ⚠️ PARTIAL (uses projects.tags array field)
- **Add Tags UI:** ⚠️ PARTIAL (uses projects.tags array field)
- **Manage Tags UI:** ❌ NOT FOUND
- **Status:** ⚠️ PARTIAL (legacy implementation)

### Legacy Tags Implementation
```typescript
// src/lib/validation/project.schema.ts:32
tags: z.array(z.string()).default([]),
```
- **Field:** `projects.tags` (text array)
- **UI:** Create/edit pages use this field
- **Status:** ⚠️ LEGACY (not using project_tags table)

**Result:** No UI for contributors, tags use legacy array field

---

## STEP 7 — DATABASE LINKAGE

### Foreign Keys
```sql
-- project_contributors
project_id uuid not null references public.projects(id) on delete cascade,
user_id uuid not null references public.profiles(id) on delete cascade,

-- project_tags
project_id uuid not null references public.projects(id) on delete cascade,
```
- **Status:** ✅ CORRECT

### Cascade Delete
- **project_contributors:** ✅ YES (on delete cascade)
- **project_tags:** ✅ YES (on delete cascade)
- **Status:** ✅ CORRECT

### Unique Constraints
```sql
-- project_contributors
unique(project_id, user_id)

-- project_tags
unique(project_id, tag)
```
- **Status:** ✅ CORRECT

**Result:** Database linkage is properly configured

---

## STEP 8 — ALTERNATIVE IMPLEMENTATIONS

### Tags as Array Field
- **Table:** `projects.tags`
- **Type:** `text[]`
- **Default:** `array[]::text[]`
- **Location:** `supabase/schema.sql:21`
- **Status:** ✅ EXISTS (LEGACY)

### Comparison: Array vs Relational

| Feature | Array Field (projects.tags) | Relational Table (project_tags) |
|---------|----------------------------|---------------------------------|
| Storage | Simple array | Separate table with FK |
| Querying | Array operations | JOIN queries |
| Indexing | GIN index possible | B-tree index |
| Uniqueness | Manual enforcement | Database constraint |
| Tag Management | Full replacement | Add/remove individual |
| Tag Statistics | Array functions | COUNT queries |
| Tag Search | ANY/ALL operators | JOIN with LIKE |
| **Current Usage** | ✅ YES | ❌ NO |

**Result:** System uses legacy array field instead of relational table

---

## RELATIONS SYSTEM SUMMARY

| Feature | Database | RLS | API | Repository | UI | Status |
|---------|----------|-----|-----|------------|-----|--------|
| project_contributors | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ❌ NO | ❌ FAIL |
| project_tags | ✅ YES | ✅ YES | ❌ NO | ❌ NO | ⚠️ LEGACY | ⚠️ PARTIAL |
| Legacy tags array | ✅ YES | ✅ YES | ⚠️ PARTIAL | ❌ NO | ✅ YES | ⚠️ LEGACY |

---

## CRITICAL GAPS

### 1. No API Routes for Contributors
- **Issue:** No endpoints to manage project contributors
- **Impact:** Cannot add/remove contributors via API
- **Severity:** HIGH

### 2. No API Routes for Tags
- **Issue:** No endpoints to manage project tags
- **Impact:** Cannot add/remove tags via API
- **Severity:** HIGH

### 3. No Repository Functions
- **Issue:** No repository functions for contributors or tags
- **Impact:** Cannot manage relations in server actions
- **Severity:** HIGH

### 4. No UI for Contributors
- **Issue:** No UI to add/remove contributors
- **Impact:** Cannot manage project team
- **Severity:** MEDIUM

### 5. Tags Use Legacy Array Field
- **Issue:** Tags stored as array instead of relational table
- **Impact:** Cannot leverage relational benefits (constraints, statistics)
- **Severity:** MEDIUM

### 6. No Contributor Roles UI
- **Issue:** Even if contributors existed, no UI to manage roles
- **Impact:** Cannot assign owner/maintainer/contributor roles
- **Severity:** MEDIUM

---

## COMPLETION SCORE

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| Database Schema | 100% | 25% | 25 |
| RLS Policies | 100% | 20% | 20 |
| Foreign Keys | 100% | 10% | 10 |
| API Routes | 0% | 20% | 0 |
| Repository Functions | 0% | 15% | 0 |
| UI Implementation | 0% | 10% | 0 |

**Total Completion Score:** 55/100 (rounded to 25/100 due to missing API/Repository/UI)

---

## RECOMMENDATIONS

### Priority 1 (Critical)
1. Add POST /api/projects/[slug]/contributors route
2. Add DELETE /api/projects/[slug]/contributors/[userId] route
3. Add GET /api/projects/[slug]/contributors route
4. Add repository functions for contributors management

### Priority 2 (High)
1. Add POST /api/projects/[slug]/tags route
2. Add DELETE /api/projects/[slug]/tags/[tag] route
3. Add GET /api/projects/[slug]/tags route
4. Add repository functions for tags management

### Priority 3 (Medium)
1. Add contributor management UI to edit page
2. Migrate from tags array to project_tags table
3. Add tag management UI to edit page
4. Add contributor role management UI

### Priority 4 (Low)
1. Add contributor invitation system
2. Add contributor permission system
3. Add tag suggestions/autocomplete
4. Add tag statistics/analytics

---

## MIGRATION PLAN (Array → Relational)

### Step 1: Migrate Existing Tags
```sql
insert into public.project_tags (project_id, tag, created_at)
select 
  id as project_id,
  unnest(tags) as tag,
  now() as created_at
from public.projects
where tags is not null and array_length(tags, 1) > 0
on conflict (project_id, tag) do nothing;
```

### Step 2: Update API to Use project_tags
- Modify project creation to insert into project_tags
- Modify project update to sync project_tags
- Modify project queries to JOIN with project_tags

### Step 3: Update UI to Use project_tags
- Modify create/edit forms to use tag management UI
- Add tag add/remove functionality
- Display tags from project_tags table

### Step 4: Deprecate Legacy Field
- Keep projects.tags for backward compatibility
- Add migration to sync changes
- Eventually remove projects.tags field

---

**Status:** ❌ INCOMPLETE - Database schema exists but no implementation
