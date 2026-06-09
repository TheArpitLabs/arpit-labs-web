# PROJECT CRUD REPORT

**Phase:** P2 — Project Management System Hardening  
**Date:** 2026-06-09  
**Objective:** Verify CRUD operations for projects

---

## EXECUTIVE SUMMARY

Project CRUD operations have **partial implementation**. Create and Read operations work via API, but Update and Delete are only available through admin server actions.

**Completion Score:** 50/100

---

## STEP 1 — CREATE PROJECT

### Route
- **API Route:** `POST /api/projects`
- **Location:** `src/app/api/projects/route.ts:67`
- **Status:** ✅ PASS

### Handler
```typescript
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const validatedData = projectSchema.parse(body);
  const { data, error } = await supabaseServer
    .from('projects')
    .insert(validatedData)
    .select()
    .single();
}
```

### Validation
- **Schema:** `projectSchema` (Zod)
- **Location:** `src/lib/validation/project.schema.ts:3`
- **Required Fields:** title, slug, description
- **Optional Fields:** project_type, branch, domain, category, technologies, languages, frameworks, tools, github_url, demo_url, documentation_url, video_url, cover_image, owner_id, organization_id, status, featured
- **Status:** ✅ PASS

### Auth Protection
- **Check:** `getUserFromRequest(request)`
- **Requirement:** Authentication required
- **Owner Assignment:** owner_id must be set in payload (not auto-assigned)
- **Status:** ⚠️ PARTIAL - Auth required but owner_id not automatically set from user

### UI Usage
- **Create Page:** `src/app/creator/projects/new/page.tsx:104`
- **Method:** Direct Supabase client insert (not API route)
- **Owner Assignment:** Sets `owner_id: user.id` automatically
- **Status:** ✅ PASS

**Result:** CREATE operation works but has two different implementations (API vs direct client)

---

## STEP 2 — READ PROJECT

### Route (List)
- **API Route:** `GET /api/projects`
- **Location:** `src/app/api/projects/route.ts:8`
- **Status:** ✅ PASS

### Handler (List)
```typescript
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const project_type = searchParams.get('project_type');
  const featured = searchParams.get('featured');
  const search = searchParams.get('search');
  const owner_id = searchParams.get('owner_id');
  // ... query building
}
```

### Route (Single)
- **API Route:** `GET /api/projects/[slug]`
- **Location:** `src/app/api/projects/[slug]/route.ts:6`
- **Status:** ✅ PASS

### Handler (Single)
```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();
  // Increments view_count
}
```

### Validation
- **List:** No validation (query parameters optional)
- **Single:** Slug validation via database query
- **Status:** ✅ PASS

### Auth Protection
- **List:** ✅ Authentication required
- **Single:** ❌ NO authentication required (public access)
- **Status:** ⚠️ INCONSISTENT

### UI Usage
- **Public Listing:** `src/app/projects/page.tsx:109` - Uses repository
- **Profile Listing:** `src/app/profile/projects/page.tsx:55` - Uses direct client
- **Project Details:** `src/app/projects/[slug]/page.tsx:24` - Uses repository
- **Status:** ✅ PASS

**Result:** READ operation works via API and repository

---

## STEP 3 — UPDATE PROJECT

### Route
- **API Route:** ❌ NO API ROUTE EXISTS
- **Location:** N/A
- **Status:** ❌ FAIL

### Repository Function
- **Function:** `updateProject(id, payload)`
- **Location:** `src/lib/repositories/projects.repository.ts:68`
- **Status:** ✅ EXISTS but not exposed via API

### Handler (Repository)
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

### Validation
- **Schema:** `projectSchema` (partial)
- **Status:** ✅ PASS (in repository)

### Auth Protection
- **API Route:** ❌ N/A (no route)
- **Repository:** ❌ NO ownership check
- **Server Action:** ✅ `requireAdmin()` in admin actions
- **Status:** ⚠️ PARTIAL - Only admin can update via server actions

### UI Usage
- **Edit Page:** `src/app/creator/projects/[slug]/edit/page.tsx:159`
- **Method:** Direct Supabase client update (not API route)
- **Auth Check:** Client-side check `if (!user)` only
- **Status:** ⚠️ WEAK - No server-side ownership verification

### Admin Usage
- **Admin Action:** `saveProjectAction`
- **Location:** `src/lib/actions/admin-actions.ts:85`
- **Auth:** `requireAdmin()`
- **Status:** ✅ PASS (admin only)

**Result:** UPDATE operation exists in repository and admin actions but NOT in public API

---

## STEP 4 — DELETE PROJECT

### Route
- **API Route:** ❌ NO API ROUTE EXISTS
- **Location:** N/A
- **Status:** ❌ FAIL

### Repository Function
- **Function:** `deleteProject(id)`
- **Location:** `src/lib/repositories/projects.repository.ts:83`
- **Status:** ✅ EXISTS but not exposed via API

### Handler (Repository)
```typescript
async deleteProject(id: string) {
  const { error } = await supabaseServer.from("projects").delete().eq("id", id);
}
```

### Validation
- **Validation:** ID validation only
- **Status:** ✅ PASS

### Auth Protection
- **API Route:** ❌ N/A (no route)
- **Repository:** ❌ NO ownership check
- **Server Action:** ✅ `requireAdmin()` in admin actions
- **Status:** ⚠️ PARTIAL - Only admin can delete via server actions

### UI Usage
- **Profile Projects:** `src/app/profile/projects/page.tsx:79`
- **Method:** Direct Supabase client delete (not API route)
- **Auth Check:** Client-side check only
- **Status:** ⚠️ WEAK - No server-side ownership verification

### Admin Usage
- **Admin Action:** `deleteProjectAction`
- **Location:** `src/lib/actions/admin-actions.ts:121`
- **Auth:** `requireAdmin()`
- **Status:** ✅ PASS (admin only)

**Result:** DELETE operation exists in repository and admin actions but NOT in public API

---

## CRUD SUMMARY TABLE

| Operation | API Route | Repository | Server Action | UI Usage | Auth | Owner Check | Status |
|-----------|-----------|------------|---------------|----------|------|-------------|--------|
| CREATE | ✅ POST /api/projects | ✅ createProject | ❌ N/A | ✅ Direct client | ✅ Required | ❌ No auto-assign | ⚠️ PARTIAL |
| READ (List) | ✅ GET /api/projects | ✅ getProjects | ❌ N/A | ✅ Repository | ✅ Required | ❌ N/A | ✅ PASS |
| READ (Single) | ✅ GET /api/projects/[slug] | ✅ getProjectBySlug | ❌ N/A | ✅ Repository | ❌ Public | ❌ N/A | ⚠️ PARTIAL |
| UPDATE | ❌ NO ROUTE | ✅ updateProject | ✅ Admin only | ✅ Direct client | ⚠️ Client only | ❌ No verification | ❌ FAIL |
| DELETE | ❌ NO ROUTE | ✅ deleteProject | ✅ Admin only | ✅ Direct client | ⚠️ Client only | ❌ No verification | ❌ FAIL |

---

## CRITICAL ISSUES

### 1. No Public API for Update/Delete
- **Issue:** PUT/PATCH/DELETE routes don't exist
- **Impact:** Cannot update/delete projects via REST API
- **Workaround:** Must use admin dashboard or direct client calls
- **Severity:** HIGH

### 2. No Ownership Verification in Repository
- **Issue:** Repository functions don't check `auth.uid() == owner_id`
- **Impact:** Any authenticated user could theoretically update/delete any project if they bypass UI
- **Mitigation:** RLS policies provide some protection
- **Severity:** HIGH

### 3. Inconsistent Auth Patterns
- **Issue:** Some routes require auth, others don't
- **Impact:** Security inconsistency
- **Example:** GET /api/projects requires auth, but GET /api/projects/[slug] doesn't
- **Severity:** MEDIUM

### 4. Dual Implementation Pattern
- **Issue:** Some operations have both API route and direct client implementation
- **Impact:** Code duplication, inconsistent behavior
- **Example:** CREATE works via API and direct client
- **Severity:** MEDIUM

### 5. Client-Side Only Ownership Checks
- **Issue:** Edit/delete pages check ownership client-side only
- **Impact:** Users could potentially modify requests to edit others' projects
- **Mitigation:** RLS policies should prevent this
- **Severity:** MEDIUM

---

## COMPLETION SCORE

| Operation | API Access | Repository | Auth | Owner Check | Score |
|-----------|------------|------------|------|-------------|-------|
| CREATE | 100% | 100% | 100% | 0% | 75% |
| READ (List) | 100% | 100% | 100% | N/A | 100% |
| READ (Single) | 100% | 100% | 0% | N/A | 67% |
| UPDATE | 0% | 100% | 50% | 0% | 38% |
| DELETE | 0% | 100% | 50% | 0% | 38% |

**Overall CRUD Completion Score:** 50/100

---

## RECOMMENDATIONS

### Priority 1 (Critical)
1. Add PUT /api/projects/[slug] route with ownership verification
2. Add PATCH /api/projects/[slug] route for partial updates
3. Add DELETE /api/projects/[slug] route with ownership verification
4. Add ownership checks to repository functions (auth.uid() == owner_id)

### Priority 2 (High)
1. Standardize auth pattern across all routes
2. Remove direct client calls in favor of API routes
3. Add server-side ownership verification in edit/delete pages
4. Auto-assign owner_id from authenticated user in CREATE operation

### Priority 3 (Medium)
1. Add bulk update/delete operations
2. Add project cloning operation
3. Add project versioning support

---

**Status:** ❌ INCOMPLETE - Missing API routes for update/delete operations
