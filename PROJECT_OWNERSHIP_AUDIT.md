# PROJECT OWNERSHIP AUDIT

**Phase:** P2 — Project Management System Hardening  
**Date:** 2026-06-09  
**Objective:** Validate project ownership enforcement (owner_id, RLS, API)

---

## EXECUTIVE SUMMARY

Project ownership enforcement has **strong RLS policies** but **weak API-level enforcement**. The database layer properly enforces ownership, but the API layer lacks ownership verification.

**Completion Score:** 60/100

---

## STEP 1 — DATABASE owner_id FIELD

### Field Definition
- **Table:** `public.projects`
- **Column:** `owner_id`
- **Type:** `uuid`
- **Nullable:** YES
- **Foreign Key:** `references public.profiles(id) on delete set null`
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:18`
- **Status:** ✅ EXISTS

### Index
- **Index Name:** `idx_projects_owner`
- **Location:** `supabase/migrations/20260708_phase2b_universal_project_system.sql:86`
- **Status:** ✅ EXISTS

**Result:** owner_id field exists with proper constraints and indexing

---

## STEP 2 — RLS POLICY ENFORCEMENT

### Projects Table Policies

#### Policy 1: Public Read Access
```sql
create policy "public can read published projects"
on public.projects
for select
using (status = 'published' or public.is_admin());
```
- **Operation:** SELECT
- **Access:** Public for published projects, admin for all
- **Owner Check:** ❌ NO (bypasses ownership for published content)
- **Status:** ✅ CORRECT (intended behavior)

#### Policy 2: Owner Management
```sql
create policy "owners can manage their projects"
on public.projects
for all
using (auth.uid() = owner_id or public.is_admin())
with check (auth.uid() = owner_id or public.is_admin());
```
- **Operation:** ALL (SELECT, INSERT, UPDATE, DELETE)
- **Access:** Owner or admin
- **Owner Check:** ✅ YES (`auth.uid() = owner_id`)
- **Status:** ✅ CORRECT

#### Policy 3: Authenticated Insert
```sql
create policy "authenticated can insert projects"
on public.projects
for insert
with check (auth.uid() is not null);
```
- **Operation:** INSERT
- **Access:** Any authenticated user
- **Owner Check:** ❌ NO (allows any authenticated user to insert)
- **Status:** ⚠️ PERMISSIVE (relies on application to set owner_id)

**Result:** RLS policies exist but INSERT policy is permissive

---

## STEP 3 — API-LEVEL ENFORCEMENT

### POST /api/projects (Create)
```typescript
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const body = await request.json();
  const validatedData = projectSchema.parse(body);
  // No owner_id assignment or verification
  const { data, error } = await supabaseServer
    .from('projects')
    .insert(validatedData)
    .select()
    .single();
}
```
- **Auth Check:** ✅ YES
- **Owner Assignment:** ❌ NO (not auto-assigned)
- **Owner Verification:** ❌ NO
- **Status:** ❌ FAIL

### GET /api/projects (List)
```typescript
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  // Filters by owner_id if provided in query params
  const owner_id = searchParams.get('owner_id');
  if (owner_id) {
    query = query.eq('owner_id', owner_id);
  }
}
```
- **Auth Check:** ✅ YES
- **Owner Filter:** ⚠️ OPTIONAL (query parameter)
- **Owner Verification:** ❌ NO
- **Status:** ⚠️ PARTIAL

### GET /api/projects/[slug] (Single)
```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();
  // No auth check, no owner verification
}
```
- **Auth Check:** ❌ NO
- **Owner Verification:** ❌ NO
- **Status:** ❌ FAIL

### PUT /api/projects/[slug] (Update)
- **Route:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

### PATCH /api/projects/[slug] (Update)
- **Route:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

### DELETE /api/projects/[slug] (Delete)
- **Route:** ❌ DOES NOT EXIST
- **Status:** ❌ FAIL

**Result:** API-level ownership enforcement is weak or missing

---

## STEP 4 — REPOSITORY-LEVEL ENFORCEMENT

### updateProject Function
```typescript
async updateProject(id: string, payload: Partial<ProjectInput>) {
  const { data, error } = await supabaseServer
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
}
```
- **Owner Check:** ❌ NO
- **Status:** ❌ FAIL

### deleteProject Function
```typescript
async deleteProject(id: string) {
  const { error } = await supabaseServer.from("projects").delete().eq("id", id);
}
```
- **Owner Check:** ❌ NO
- **Status:** ❌ FAIL

**Result:** Repository functions lack ownership verification

---

## STEP 5 — SERVER-ACTION ENFORCEMENT

### saveProjectAction (Admin)
```typescript
export async function saveProjectAction(formData: FormData) {
  await requireAdmin();
  // ... project save logic
}
```
- **Auth Check:** ✅ YES (requireAdmin)
- **Owner Check:** ❌ NO (admin can edit any project)
- **Status:** ✅ CORRECT (admin bypass is intended)

### deleteProjectAction (Admin)
```typescript
export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  const id = asString(formData.get("id"));
  await projectsRepository.deleteProject(id);
}
```
- **Auth Check:** ✅ YES (requireAdmin)
- **Owner Check:** ❌ NO (admin can delete any project)
- **Status:** ✅ CORRECT (admin bypass is intended)

**Result:** Admin actions properly enforce admin role

---

## STEP 6 — UI-LEVEL ENFORCEMENT

### Create Project Page
```typescript
// src/app/creator/projects/new/page.tsx:120
const payload = {
  ...data,
  cover_image: coverImage || null,
  technologies: technologies,
  languages: languages,
  frameworks: frameworks,
  tools: tools,
  owner_id: user.id,  // ✅ Auto-assigns owner_id
};
```
- **Owner Assignment:** ✅ YES
- **Auth Check:** ✅ YES (client-side)
- **Status:** ✅ PASS

### Edit Project Page
```typescript
// src/app/creator/projects/[slug]/edit/page.tsx:145
if (!user) {
  alert('You must be logged in to edit a project.');
  return;
}
// No ownership verification before update
const { data: projectData, error } = await supabaseClient
  .from('projects')
  .update(payload)
  .eq('slug', projectSlug)
  .select()
  .single();
```
- **Auth Check:** ✅ YES (client-side)
- **Owner Verification:** ❌ NO
- **Status:** ❌ FAIL

### Profile Projects Page
```typescript
// src/app/profile/projects/page.tsx:79
const handleArchive = async (projectId: string, currentStatus: string) => {
  const newStatus = currentStatus === 'archived' ? 'published' : 'archived';
  const { error } = await supabaseClient
    .from('projects')
    .update({ status: newStatus })
    .eq('id', projectId);
  // No ownership verification
}
```
- **Auth Check:** ✅ YES (client-side)
- **Owner Verification:** ❌ NO
- **Status:** ❌ FAIL

**Result:** UI pages have client-side auth but no ownership verification

---

## STEP 7 — is_admin() FUNCTION

### Function Definition
```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from auth.users 
    where id = auth.uid() 
    and email = 'arpit@arpitlabs.com'
  );
$$;
```
- **Location:** `supabase/migrations/20260602_phase4_admin.sql:38`
- **Hardcoded Email:** `arpit@arpitlabs.com`
- **Status:** ✅ EXISTS

**Issue:** Admin email is hardcoded, not configurable

---

## OWNERSHIP ENFORCEMENT SUMMARY

| Layer | Edit Check | Delete Check | Archive Check | Status |
|-------|------------|--------------|---------------|--------|
| **Database (RLS)** | ✅ auth.uid() = owner_id | ✅ auth.uid() = owner_id | ✅ auth.uid() = owner_id | ✅ PASS |
| **API Routes** | ❌ No routes | ❌ No routes | ❌ No routes | ❌ FAIL |
| **Repository** | ❌ No check | ❌ No check | ❌ No check | ❌ FAIL |
| **Server Actions** | ✅ requireAdmin() | ✅ requireAdmin() | ✅ requireAdmin() | ✅ PASS |
| **UI Pages** | ❌ Client only | ❌ Client only | ❌ Client only | ❌ FAIL |

---

## CRITICAL GAPS

### 1. No API-Level Ownership Verification
- **Issue:** API routes don't verify `auth.uid() == owner_id` before operations
- **Impact:** Users could potentially modify requests to edit others' projects
- **Mitigation:** RLS policies provide database-level protection
- **Severity:** HIGH

### 2. Missing API Routes for Update/Delete
- **Issue:** PUT/PATCH/DELETE routes don't exist
- **Impact:** Cannot enforce ownership at API level
- **Workaround:** Users must use direct client calls or admin dashboard
- **Severity:** HIGH

### 3. Repository Functions Lack Ownership Checks
- **Issue:** updateProject and deleteProject don't verify ownership
- **Impact:** If called directly, could bypass ownership
- **Mitigation:** RLS policies provide database-level protection
- **Severity:** MEDIUM

### 4. UI Pages Have Client-Side Only Checks
- **Issue:** Edit/delete pages check auth client-side only
- **Impact:** Users could modify requests to edit others' projects
- **Mitigation:** RLS policies should prevent this
- **Severity:** MEDIUM

### 5. INSERT Policy is Permissive
- **Issue:** RLS INSERT policy allows any authenticated user to insert
- **Impact:** Relies on application to set owner_id correctly
- **Mitigation:** Application should auto-assign owner_id
- **Severity:** MEDIUM

---

## SECURITY ANALYSIS

### Attack Vector: Unauthorized Project Edit

**Scenario:** User A tries to edit User B's project

**Layer 1 - UI:**
- User A loads edit page for User B's project
- Client-side auth check passes (User A is logged in)
- User A submits update request
- **Result:** ❌ FAIL - No ownership check

**Layer 2 - API:**
- No API route exists for update
- User must use direct client call
- **Result:** ❌ FAIL - No API route to check

**Layer 3 - Repository:**
- updateProject function called
- No ownership check
- **Result:** ❌ FAIL - No ownership check

**Layer 4 - Database (RLS):**
- UPDATE operation on projects table
- RLS policy: `using (auth.uid() = owner_id or public.is_admin())`
- Check: `auth.uid() = User A's ID` vs `owner_id = User B's ID`
- Result: FALSE
- **Result:** ✅ PASS - RLS blocks the operation

**Conclusion:** Database RLS provides effective protection, but earlier layers should also enforce ownership for defense in depth.

---

## COMPLETION SCORE

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| Database Schema (owner_id field) | 100% | 15% | 15 |
| Database Indexes | 100% | 5% | 5 |
| RLS Policies | 100% | 30% | 30 |
| API-Level Enforcement | 0% | 20% | 0 |
| Repository-Level Enforcement | 0% | 15% | 0 |
| UI-Level Enforcement | 50% | 10% | 5 |
| Server-Action Enforcement | 100% | 5% | 5 |

**Total Completion Score:** 60/100

---

## RECOMMENDATIONS

### Priority 1 (Critical)
1. Add PUT /api/projects/[slug] route with `auth.uid() == owner_id` check
2. Add PATCH /api/projects/[slug] route with `auth.uid() == owner_id` check
3. Add DELETE /api/projects/[slug] route with `auth.uid() == owner_id` check
4. Add ownership verification to repository functions

### Priority 2 (High)
1. Add server-side ownership verification in edit page
2. Add server-side ownership verification in delete/archive operations
3. Auto-assign owner_id in POST /api/projects from authenticated user
4. Tighten INSERT RLS policy to require owner_id = auth.uid()

### Priority 3 (Medium)
1. Make is_admin() function configurable (not hardcoded email)
2. Add ownership audit logging
3. Add ownership transfer functionality
4. Add collaborative ownership (multiple owners)

---

**Status:** ⚠️ PARTIAL - Strong RLS but weak API/UI enforcement
