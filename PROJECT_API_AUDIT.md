# PROJECT API AUDIT

**Phase:** P2 — Project Management System Hardening  
**Date:** 2026-06-09  
**Objective:** Audit Project API endpoints for HTTP method support

---

## EXECUTIVE SUMMARY

The Project API has **partial implementation** with significant gaps in CRUD operations.

**Completion Score:** 40/100

---

## STEP 1 — API ENDPOINT AUDIT

### `/api/projects`

| Method | Support | Handler | Status | Notes |
|--------|---------|---------|--------|-------|
| GET | ✅ YES | `src/app/api/projects/route.ts:8` | PASS | Lists projects with filters (status, project_type, featured, search, owner_id) |
| POST | ✅ YES | `src/app/api/projects/route.ts:67` | PASS | Creates new project with validation |
| PUT | ❌ NO | N/A | FAIL | No PUT handler exists |
| PATCH | ❌ NO | N/A | FAIL | No PATCH handler exists |
| DELETE | ❌ NO | N/A | FAIL | No DELETE handler exists |

**Result:** 2/5 methods supported (40%)

---

### `/api/projects/[slug]`

| Method | Support | Handler | Status | Notes |
|--------|---------|---------|--------|-------|
| GET | ✅ YES | `src/app/api/projects/[slug]/route.ts:6` | PASS | Gets single project by slug, increments view_count |
| POST | ❌ NO | N/A | FAIL | No POST handler exists |
| PUT | ❌ NO | N/A | FAIL | No PUT handler for updates |
| PATCH | ❌ NO | N/A | FAIL | No PATCH handler for partial updates |
| DELETE | ❌ NO | N/A | FAIL | No DELETE handler exists |

**Result:** 1/5 methods supported (20%)

---

### `/api/projects/[slug]/analytics`

| Method | Support | Handler | Status | Notes |
|--------|---------|---------|--------|-------|
| GET | ✅ YES | `src/app/api/projects/[slug]/analytics/route.ts:95` | PASS | Returns views_count, likes_count, user_liked, user_bookmarked |
| POST | ✅ YES | `src/app/api/projects/[slug]/analytics/route.ts:4` | PASS | Tracks view, like, unlike, bookmark, unbookmark |
| PUT | ❌ NO | N/A | FAIL | Not applicable for analytics |
| PATCH | ❌ NO | N/A | FAIL | Not applicable for analytics |
| DELETE | ❌ NO | N/A | FAIL | Not applicable for analytics |

**Result:** 2/5 methods supported (40%) - Expected for analytics endpoint

---

## STEP 2 — MISSING API ROUTES

### Critical Missing Routes

1. **PUT /api/projects/[slug]** - Update entire project
   - Required for full REST API compliance
   - Currently only available via admin actions (server actions, not API)

2. **PATCH /api/projects/[slug]** - Partial project updates
   - Required for status changes (draft → published → archived)
   - Currently only available via admin actions

3. **DELETE /api/projects/[slug]** - Delete project
   - Required for project management
   - Currently only available via admin actions

4. **POST /api/projects/[slug]/contributors** - Add contributors
   - Table exists in database but no API route

5. **DELETE /api/projects/[slug]/contributors/[userId]** - Remove contributors
   - Table exists in database but no API route

6. **POST /api/projects/[slug]/tags** - Add tags
   - Table exists in database but no API route

7. **DELETE /api/projects/[slug]/tags/[tag]** - Remove tags
   - Table exists in database but no API route

8. **POST /api/projects/[slug]/media** - Upload media
   - Table exists in database but no API route

9. **DELETE /api/projects/[slug]/media/[mediaId]** - Delete media
   - Table exists in database but no API route

---

## STEP 3 — AUTHENTICATION & AUTHORIZATION

### Current Auth Implementation

| Route | Auth Check | Owner Check | Admin Check |
|-------|------------|-------------|-------------|
| GET /api/projects | ✅ getUserFromRequest | ❌ NO | ❌ NO |
| POST /api/projects | ✅ getUserFromRequest | ❌ NO | ❌ NO |
| GET /api/projects/[slug] | ❌ NO | ❌ NO | ❌ NO |
| POST /api/projects/[slug]/analytics | ⚠️ Partial (for like/bookmark) | ❌ NO | ❌ NO |
| GET /api/projects/[slug]/analytics | ❌ NO | ❌ NO | ❌ NO |

**Issues:**
- No ownership verification in API routes (auth.uid() == owner_id)
- Relies solely on RLS policies for access control
- API routes don't enforce owner_id before allowing operations

---

## STEP 4 — VALIDATION

### Validation Implementation

| Route | Validation | Schema | Status |
|-------|------------|--------|--------|
| POST /api/projects | ✅ YES | `projectSchema` (Zod) | PASS |
| PUT /api/projects/[slug] | ❌ NO | N/A | FAIL |
| PATCH /api/projects/[slug] | ❌ NO | N/A | FAIL |

**Schema Location:** `src/lib/validation/project.schema.ts`

**Schema Fields:**
- title, slug, description (required)
- project_type (enum: software, hardware, research, opensource, hackathon, hybrid)
- branch, domain, category (optional)
- technologies, languages, frameworks, tools (JSON/arrays)
- github_url, demo_url, documentation_url, video_url (optional URLs)
- cover_image (optional)
- owner_id, organization_id (optional UUIDs)
- status (enum: draft, published, archived, default: draft)
- featured (boolean, default: false)
- Legacy fields for backward compatibility

---

## STEP 5 — REPOSITORY LAYER

### Repository Functions

| Function | Location | Used by API | Status |
|----------|----------|-------------|--------|
| getProjects | `src/lib/repositories/projects.repository.ts:7` | ✅ YES | PASS |
| getProjectBySlug | `src/lib/repositories/projects.repository.ts:39` | ✅ YES | PASS |
| createProject | `src/lib/repositories/projects.repository.ts:54` | ✅ YES | PASS |
| updateProject | `src/lib/repositories/projects.repository.ts:68` | ❌ NO | FAIL |
| deleteProject | `src/lib/repositories/projects.repository.ts:83` | ❌ NO | FAIL |

**Issue:** Repository functions exist for update/delete but are not exposed via API routes. They are only used in admin server actions.

---

## STEP 6 — ADMIN ACTIONS

### Server Actions (Not API Routes)

| Action | Location | Auth | Status |
|--------|----------|------|--------|
| saveProjectAction | `src/lib/actions/admin-actions.ts:85` | ✅ requireAdmin() | PASS |
| deleteProjectAction | `src/lib/actions/admin-actions.ts:121` | ✅ requireAdmin() | PASS |

**Issue:** These are server actions for admin dashboard, not REST API endpoints. Regular users cannot update/delete projects via API.

---

## CONCLUSION

### Critical Gaps

1. **No PUT/PATCH/DELETE API routes** for project updates/deletion
2. **No API routes** for contributors, tags, or media management
3. **No ownership enforcement** in API layer (relies only on RLS)
4. **Repository functions exist** but not exposed via API
5. **Admin-only access** to update/delete via server actions

### Completion Score Breakdown

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| GET Support | 100% | 20% | 20 |
| POST Support | 100% | 20% | 20 |
| PUT Support | 0% | 20% | 0 |
| PATCH Support | 0% | 20% | 0 |
| DELETE Support | 0% | 20% | 0 |

**Total Completion Score:** 40/100

---

## RECOMMENDATIONS

### Priority 1 (Critical)
1. Add PUT /api/projects/[slug] route with ownership verification
2. Add PATCH /api/projects/[slug] route for partial updates
3. Add DELETE /api/projects/[slug] route with ownership verification
4. Add ownership checks (auth.uid() == owner_id) to all write operations

### Priority 2 (High)
1. Add API routes for project_contributors management
2. Add API routes for project_tags management
3. Add API routes for project_media management
4. Add PATCH endpoint for status transitions (draft → published → archived)

### Priority 3 (Medium)
1. Add API routes for bulk operations
2. Add API routes for project cloning
3. Add API routes for project export/import

---

**Status:** ❌ INCOMPLETE - Requires API route implementation
