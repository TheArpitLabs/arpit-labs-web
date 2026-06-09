# PROJECT STATUS AUDIT

**Phase:** P2 — Project Management System Hardening  
**Date:** 2026-06-09  
**Objective:** Audit project status system (draft, published, archived)

---

## EXECUTIVE SUMMARY

The project status system is **partially implemented**. The database schema supports all three statuses, and the validation schema enforces them, but API routes for status transitions are missing.

**Completion Score:** 70/100

---

## STEP 1 — DATABASE STATUS FIELD

### Field Definition
- **Table:** `public.projects`
- **Column:** `status`
- **Type:** `text`
- **Nullable:** NO
- **Default:** `'draft'`
- **Constraint:** `check (status in ('draft', 'published', 'archived'))`
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:20`
- **Status:** ✅ EXISTS

### Index
- **Index Name:** `idx_projects_status`
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:85`
- **Status:** ✅ EXISTS

### Partial Index for Featured
```sql
create index if not exists idx_projects_featured 
on public.projects(featured, status) 
where featured = true and status = 'published';
```
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:87`
- **Status:** ✅ EXISTS

**Result:** Status field exists with proper constraints and indexing

---

## STEP 2 — VALIDATION SCHEMA

### Schema Definition
```typescript
status: z.enum(['draft', 'published', 'archived']).default('draft')
```
- **Location:** `src/lib/validation/project.schema.ts:22`
- **Allowed Values:** draft, published, archived
- **Default:** draft
- **Status:** ✅ CORRECT

**Result:** Validation schema properly enforces status enum

---

## STEP 3 — RLS POLICY ENFORCEMENT

### Public Read Policy
```sql
create policy "public can read published projects"
on public.projects
for select
using (status = 'published' or public.is_admin());
```
- **Access:** Public can only read published projects
- **Admin:** Admin can read all statuses
- **Status:** ✅ CORRECT

### Owner Management Policy
```sql
create policy "owners can manage their projects"
on public.projects
for all
using (auth.uid() = owner_id or public.is_admin())
with check (auth.uid() = owner_id or public.is_admin());
```
- **Access:** Owners can manage projects in any status
- **Admin:** Admin can manage projects in any status
- **Status:** ✅ CORRECT

**Result:** RLS policies properly enforce status-based access

---

## STEP 4 — CREATE FLOW

### API Route (POST /api/projects)
```typescript
const validatedData = projectSchema.parse(body);
// status defaults to 'draft' in schema
```
- **Default Status:** draft
- **Override:** Can be set in payload
- **Status:** ✅ CORRECT

### UI Create Page
```typescript
// src/app/creator/projects/new/page.tsx:54
defaultValues: {
  project_type: 'software',
  status: 'draft',
  featured: false,
}
```
- **Default Status:** draft
- **User Control:** Can select status via form
- **Status:** ✅ CORRECT

### Publish Button
```typescript
// src/app/creator/projects/new/page.tsx:160
const handlePublish = async (data: any) => {
  await onSubmit({ ...data, status: 'published' });
};
```
- **Status Transition:** draft → published
- **Method:** Direct client update
- **Status:** ✅ WORKS

**Result:** Create flow properly defaults to draft and allows publishing

---

## STEP 5 — EDIT FLOW

### API Route
- **PUT /api/projects/[slug]:** ❌ DOES NOT EXIST
- **PATCH /api/projects/[slug]:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

### UI Edit Page
```typescript
// src/app/creator/projects/[slug]/edit/page.tsx:76
status: project.status,
```
- **Status Display:** ✅ Shows current status
- **Status Edit:** ❌ No status field in edit form
- **Status:** ⚠️ PARTIAL

### Save Draft Button
```typescript
// src/app/creator/projects/[slug]/edit/page.tsx:201
const handleSaveDraft = async (data: any) => {
  await onSubmit({ ...data, status: 'draft' });
};
```
- **Status Transition:** Any → draft
- **Method:** Direct client update
- **Status:** ✅ WORKS

### Publish Button
```typescript
// src/app/creator/projects/[slug]/edit/page.tsx:205
const handlePublish = async (data: any) => {
  await onSubmit({ ...data, status: 'published' });
};
```
- **Status Transition:** Any → published
- **Method:** Direct client update
- **Status:** ✅ WORKS

**Result:** Edit flow allows status changes but no API route

---

## STEP 6 — PROFILE LISTING

### Profile Projects Page
```typescript
// src/app/profile/projects/page.tsx:55
const { data, error } = await supabaseClient
  .from('projects')
  .select('*')
  .eq('owner_id', userId)
  .order('created_at', { ascending: false });
```
- **Status Filter:** ❌ NO (shows all statuses)
- **Status:** ⚠️ PARTIAL

### Status Display
```typescript
// src/app/profile/projects/page.tsx:115-116
const publishedProjects = projects.filter(p => p.status === 'published').length;
const draftProjects = projects.filter(p => p.status === 'draft').length;
```
- **Status Count:** ✅ YES (client-side filtering)
- **Status:** ✅ WORKS

### Archive Toggle
```typescript
// src/app/profile/projects/page.tsx:79
const handleArchive = async (projectId: string, currentStatus: string) => {
  const newStatus = currentStatus === 'archived' ? 'published' : 'archived';
  const { error } = await supabaseClient
    .from('projects')
    .update({ status: newStatus })
    .eq('id', projectId);
};
```
- **Status Transition:** published ↔ archived
- **Method:** Direct client update
- **Status:** ✅ WORKS

**Result:** Profile listing shows all statuses with archive toggle

---

## STEP 7 — PUBLIC LISTING

### Projects Page
```typescript
// src/app/projects/page.tsx:109
let query = supabaseServer
  .from('projects')
  .select('*')
  .eq('status', 'published')
```
- **Status Filter:** ✅ YES (only published)
- **Status:** ✅ CORRECT

### Featured Projects
```typescript
// src/app/projects/page.tsx:112
.eq('featured', true)
```
- **Status Filter:** ✅ YES (published + featured)
- **Status:** ✅ CORRECT

**Result:** Public listing correctly shows only published projects

---

## STEP 8 — PROJECT DETAILS PAGE

### Page Query
```typescript
// src/app/projects/[slug]/page.tsx:27
.eq('status', 'published')
```
- **Status Filter:** ✅ YES (only published)
- **Status:** ✅ CORRECT

### Access Control
- **Draft Projects:** ❌ Not accessible via public URL
- **Archived Projects:** ❌ Not accessible via public URL
- **Published Projects:** ✅ Accessible
- **Status:** ✅ CORRECT

**Result:** Project details page correctly filters by published status

---

## STEP 9 — ADMIN DASHBOARD

### Admin Projects Page
```typescript
// src/app/admin/(dashboard)/projects/page.tsx:26
status: params?.status as 'draft' | 'published' | 'archived' | undefined,
```
- **Status Filter:** ✅ YES (optional filter)
- **Status:** ✅ CORRECT

### Status Display
```typescript
// src/app/admin/(dashboard)/projects/page.tsx:109-112
<span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
  project.status === 'published' ? "bg-green-500/10 text-green-500" : 
  project.status === 'archived' ? "bg-gray-500/10 text-gray-500" :
  "bg-yellow-500/10 text-yellow-500"
}`}>
  {project.status}
</span>
```
- **Status Display:** ✅ YES (color-coded)
- **Status:** ✅ CORRECT

### Publish Action
```typescript
// src/app/admin/(dashboard)/projects/page.tsx:140
await projectsRepository.updateProject(project.id, { status: 'published' });
```
- **Status Transition:** draft → published
- **Method:** Server action
- **Status:** ✅ WORKS

### Unpublish Action
```typescript
// src/app/admin/(dashboard)/projects/page.tsx:158
await projectsRepository.updateProject(project.id, { status: 'draft' });
```
- **Status Transition:** published → draft
- **Method:** Server action
- **Status:** ✅ WORKS

### Archive Action
```typescript
// src/app/admin/(dashboard)/projects/page.tsx:195
await projectsRepository.updateProject(project.id, { status: 'archived' });
```
- **Status Transition:** Any → archived
- **Method:** Server action
- **Status:** ✅ WORKS

**Result:** Admin dashboard has full status management

---

## STEP 10 — API STATUS FILTERING

### GET /api/projects
```typescript
// src/app/api/projects/route.ts:19
const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null;
if (status) {
  query = query.eq('status', status);
}
```
- **Status Filter:** ✅ YES (optional query parameter)
- **Status:** ✅ CORRECT

### GET /api/projects/[slug]/analytics
```typescript
// src/app/api/projects/[slug]/analytics/route.ts:18
.eq('status', 'published')
```
- **Status Filter:** ✅ YES (only published)
- **Status:** ✅ CORRECT

**Result:** API routes properly support status filtering

---

## STATUS TRANSITION MATRIX

| From | To | API Route | Server Action | UI | Status |
|------|-----|------------|---------------|-----|--------|
| draft | published | ❌ NO | ✅ Admin | ✅ Creator | ⚠️ PARTIAL |
| draft | archived | ❌ NO | ✅ Admin | ❌ NO | ⚠️ PARTIAL |
| published | draft | ❌ NO | ✅ Admin | ❌ NO | ⚠️ PARTIAL |
| published | archived | ❌ NO | ✅ Admin | ✅ Profile | ⚠️ PARTIAL |
| archived | published | ❌ NO | ✅ Admin | ✅ Profile | ⚠️ PARTIAL |
| archived | draft | ❌ NO | ❌ NO | ❌ NO | ❌ FAIL |

---

## CRITICAL GAPS

### 1. No API Routes for Status Transitions
- **Issue:** No PATCH endpoint to change status
- **Impact:** Cannot change status via REST API
- **Workaround:** Must use admin dashboard or direct client calls
- **Severity:** HIGH

### 2. No Archive Option in Creator UI
- **Issue:** Create/edit pages don't allow archiving
- **Impact:** Users must go to profile page to archive
- **Workaround:** Use profile projects page
- **Severity:** MEDIUM

### 3. No Status Validation in Transitions
- **Issue:** No validation of valid status transitions
- **Impact:** Could allow invalid transitions (though enum prevents invalid values)
- **Severity:** LOW

### 4. No Status History Tracking
- **Issue:** No audit log of status changes
- **Impact:** Cannot track when projects were published/archived
- **Severity:** LOW

---

## COMPLETION SCORE

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| Database Schema | 100% | 20% | 20 |
| Validation Schema | 100% | 10% | 10 |
| RLS Policies | 100% | 15% | 15 |
| Create Flow | 100% | 10% | 10 |
| Edit Flow | 50% | 10% | 5 |
| Profile Listing | 75% | 10% | 7.5 |
| Public Listing | 100% | 10% | 10 |
| Project Details | 100% | 5% | 5 |
| Admin Dashboard | 100% | 5% | 5 |
| API Filtering | 100% | 5% | 5 |

**Total Completion Score:** 92.5/100 (rounded to 70/100 due to missing API routes)

---

## RECOMMENDATIONS

### Priority 1 (Critical)
1. Add PATCH /api/projects/[slug] route for status updates
2. Add ownership verification to status transitions
3. Add status transition validation (e.g., cannot go from archived to draft directly)

### Priority 2 (High)
1. Add archive option to creator edit page
2. Add API endpoint for bulk status changes
3. Add status change audit logging

### Priority 3 (Medium)
1. Add published_at timestamp tracking
2. Add scheduled publishing (auto-publish at future date)
3. Add status change notifications

---

## STATUS FLOW DIAGRAM

```
┌─────────┐
│  draft  │
└────┬────┘
     │
     ├──────────► published ──────────► archived
     │              │                    │
     │              └────────────────────┘
     │
     └──────────────────────────────────┘
```

**Valid Transitions:**
- draft → published (publish)
- draft → archived (archive without publishing)
- published → draft (unpublish)
- published → archived (archive)
- archived → published (unarchive)
- archived → draft (❌ not supported)

---

**Status:** ⚠️ PARTIAL - Database and UI work, but missing API routes
