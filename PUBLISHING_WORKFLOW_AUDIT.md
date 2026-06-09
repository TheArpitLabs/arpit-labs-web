# Publishing Workflow Audit

**Project:** Arpit Labs  
**Phase:** P4 - Creator Experience Optimization  
**Date:** 2026-06-09  
**Auditor:** Cascade

---

## Executive Summary

The publishing workflow supports three states (draft, published, archived) with basic status transitions. Ownership validation is implemented at the API level, and visibility rules are enforced on the public page. However, the workflow lacks publishing requirements, scheduled publishing, publishing history, and proper analytics behavior during status changes.

---

## System Overview

**Status Field:** `status` enum ('draft', 'published', 'archived')  
**Schema:** `/src/lib/validation/project.schema.ts`  
**API:** `/src/app/api/projects/[slug]/route.ts`  
**UI:** `/src/app/creator/projects/[slug]/edit/page.tsx` and `/src/app/profile/projects/page.tsx`

---

## Status Transitions

### Supported Transitions

| From | To | Supported | UI Location | API Support |
|------|-----|-----------|-------------|-------------|
| draft | published | ✓ | Editor (Publish button) | PATCH /api/projects/[slug] |
| draft | archived | ✓ | Dashboard (Archive button) | PATCH /api/projects/[slug] |
| published | draft | ✓ | Dashboard (Unarchive button) | PATCH /api/projects/[slug] |
| published | archived | ✓ | Dashboard (Archive button) | PATCH /api/projects/[slug] |
| archived | published | ✓ | Dashboard (Unarchive button) | PATCH /api/projects/[slug] |
| archived | draft | ✗ | - | - |

### Transition Analysis

**Draft → Published**
- **UI:** "Publish" button in editor
- **Validation:** None (can publish empty project)
- **Confirmation:** None
- **Side Effects:** None (no analytics reset, no notification)

**Draft → Archived**
- **UI:** "Archive" button in dashboard
- **Validation:** None
- **Confirmation:** Browser confirm dialog
- **Side Effects:** None

**Published → Draft**
- **UI:** "Unarchive" button (toggles archived status)
- **Validation:** None
- **Confirmation:** None
- **Side Effects:** None (analytics preserved)

**Published → Archived**
- **UI:** "Archive" button in dashboard
- **Validation:** None
- **Confirmation:** Browser confirm dialog
- **Side Effects:** None

**Archived → Published**
- **UI:** "Unarchive" button (toggles to published)
- **Validation:** None
- **Confirmation:** None
- **Side Effects:** None

**Archived → Draft**
- **UI:** Not supported
- **Validation:** N/A
- **Confirmation:** N/A
- **Side Effects:** N/A

---

## Ownership Validation

### API Level Validation

**Location:** `/src/app/api/projects/[slug]/route.ts`

**Implementation:**
```typescript
// Get existing project to verify ownership
const existingProject = await projectsRepository.getProjectBySlug(slug);
if (!existingProject) {
  return NextResponse.json({ error: 'Project not found' }, { status: 404 });
}

// Ownership validation: user must be owner or admin
const isOwner = user?.id === existingProject.owner_id;
const isAdmin = !!admin;
if (!isOwner && !isAdmin) {
  return NextResponse.json(
    { error: 'Forbidden: You do not own this project' },
    { status: 403 }
  );
}
```

**Coverage:**
- PUT (full update) ✓
- PATCH (partial update) ✓
- DELETE ✓

**Strengths:**
- Validates ownership on all write operations
- Allows admin override
- Returns clear 403 error

**Weaknesses:**
1. **No UI-level validation** - User can click buttons without ownership check
2. **No contributor access** - Contributors cannot edit even if they should
3. **No organization ownership** - No org-level ownership validation
4. **No ownership transfer** - Cannot transfer ownership

### UI Level Validation

**Current:** None

**Issues:**
1. **No ownership check on load** - Anyone can access edit page
2. **No ownership check on button display** - Buttons shown to non-owners
3. **No ownership check on form submit** - Form submits even if not owner
4. **No graceful error handling** - API error shown as alert

**Recommendation:** Add ownership validation at UI level:
- Check ownership on page load
- Hide edit/delete buttons for non-owners
- Show ownership error in UI
- Redirect to view page if not owner

---

## Visibility Rules

### Public Project Page

**Location:** `/src/app/projects/[slug]/page.tsx`

**Implementation:**
```typescript
const { data: project } = await supabaseServer
  .from('projects')
  .select('*')
  .eq('slug', slug)
  .eq('status', 'published')  // Only published projects
  .single();
```

**Rules:**
- Only `status = 'published'` projects are visible
- Draft projects return 404
- Archived projects return 404

**Strengths:**
- Proper server-side filtering
- No draft leakage
- Clean 404 for unpublished

**Weaknesses:**
1. **No preview mode** - Cannot preview draft projects
2. **No shareable draft links** - Cannot share draft for review
3. **No password protection** - Cannot share published with password
4. **No private projects** - No concept of private visibility

### Projects Listing Page

**Location:** `/src/app/projects/page.tsx`

**Implementation:**
```typescript
let query = supabaseServer
  .from('projects')
  .select('*')
  .eq('status', 'published');  // Only published projects
```

**Rules:**
- Only published projects shown in listing
- Draft and archived excluded from all sections
- Featured, trending, latest, popular all filter by published

**Strengths:**
- Consistent filtering across all sections
- No draft leakage in listings
- Proper separation of concerns

**Weaknesses:**
1. **No draft preview section** - Cannot see own drafts
2. **No private project section** - No concept of private projects

### Profile Dashboard

**Location:** `/src/app/profile/projects/page.tsx`

**Implementation:**
```typescript
const { data, error } = await supabaseClient
  .from('projects')
  .select('*')
  .eq('owner_id', userId)
  .order('created_at', { ascending: false });
```

**Rules:**
- Shows all projects owned by user (all statuses)
- Tab filtering by status (draft, published, archived)
- No visibility restrictions for owner

**Strengths:**
- Owner sees all their projects
- Tab-based filtering
- Clear status indicators

**Weaknesses:**
1. **No contributor access** - Contributors cannot see projects they contribute to
2. **No organization access** - Org members cannot see org projects

---

## Analytics Behavior

### View Tracking

**Location:** `/src/app/api/projects/[slug]/analytics/route.ts`

**Implementation:**
```typescript
if (type === 'view') {
  await supabase.from('project_views').insert({
    project_id: id,
    user_id: user?.id || null,
    session_id: request.headers.get('x-session-id') || null,
    ip_address: request.headers.get('x-forwarded-for') || null,
    user_agent: request.headers.get('user-agent') || null,
  });
}
```

**Status Check:**
```typescript
const { data: project } = await supabase
  .from('projects')
  .select('id')
  .eq('slug', slug)
  .eq('status', 'published')  // Only published projects
  .single();
```

**Behavior:**
- Views only tracked for published projects
- Draft projects return 404, no view tracking
- Archived projects return 404, no view tracking

**Issues:**
1. **No draft view tracking** - Cannot see how many times draft viewed
2. **No owner view exclusion** - Owner views counted
3. **No view deduplication** - Same user can spam views
4. **No session tracking** - No proper session-based deduplication

### Like Tracking

**Implementation:**
```typescript
if (type === 'like') {
  await supabase.from('project_likes').insert({
    project_id: id,
    user_id: user.id,
  });
}
```

**Status Check:** Same as views (published only)

**Behavior:**
- Likes only allowed for published projects
- Requires authentication
- Draft projects cannot be liked

**Issues:**
1. **No draft likes** - Cannot like own drafts
2. **No self-like prevention** - Owner can like own project
3. **No unlike on archive** - Likes preserved when archived

### Bookmark Tracking

**Implementation:**
```typescript
if (type === 'bookmark') {
  await supabase.from('project_bookmarks').insert({
    project_id: id,
    user_id: user.id,
  });
}
```

**Status Check:** Same as views (published only)

**Behavior:**
- Bookmarks only allowed for published projects
- Requires authentication
- Draft projects cannot be bookmarked

**Issues:**
1. **No draft bookmarks** - Cannot bookmark own drafts
2. **No bookmark cleanup on archive** - Bookmarks preserved when archived

### Analytics Reset

**Current:** No analytics reset on status change

**Issues:**
1. **No view reset on archive** - Views preserved when archived
2. **No like reset on unpublish** - Likes preserved when unpublished
3. **No analytics history** - Cannot see analytics over time
4. **No analytics by status** - Cannot compare draft vs published analytics

**Recommendation:** Consider analytics reset behavior:
- Preserve analytics on archive (historical record)
- Reset views on unpublish (clean slate)
- Add analytics history table
- Add analytics by status filtering

---

## Publishing Requirements

### Current State

**No publishing requirements**

**Issues:**
1. **Can publish empty project** - No required fields validation
2. **Can publish without cover image** - No media requirements
3. **Can publish without description** - Description is required but minimal
4. **Can publish without links** - No GitHub URL requirement
5. **No content quality check** - No minimum content requirements

### Recommended Requirements

**Minimum Requirements:**
- Title (already required)
- Description (already required)
- Cover image (recommended)
- At least one link (GitHub or demo)

**Quality Requirements (optional):**
- Overview content
- Problem statement
- Architecture description
- At least one screenshot
- Tech stack populated

**Validation Location:** Should be added to editor before publish button

---

## Scheduled Publishing

### Current State

**Not supported**

**Issues:**
1. **No scheduled publishing** - Cannot schedule publish for future
2. **No auto-publish** - Cannot set publish date
3. **No time zone support** - N/A
4. **No publishing calendar** - N/A

**Recommendation:** Add scheduled publishing:
- Add publish_date field to schema
- Add date/time picker in editor
- Add cron job to auto-publish
- Add publishing calendar view

---

## Publishing History

### Current State

**Not supported**

**Issues:**
1. **No publishing log** - Cannot see when project was published
2. **No status change history** - Cannot see status transitions
3. **No version history** - Cannot see content changes
4. **No rollback** - Cannot revert to previous version

**Recommendation:** Add publishing history:
- Add project_history table
- Log all status changes
- Log all content changes
- Add history view in editor
- Add rollback functionality

---

## Notifications

### Current State

**Not supported**

**Issues:**
1. **No publish notification** - No notification when project published
2. **No like notification** - No notification when project liked
3. **No comment notification** - N/A (comments not implemented)
4. **No follower notification** - N/A (followers not implemented)

**Recommendation:** Add notifications:
- Email notification on publish
- In-app notification on like
- Webhook support for integrations
- Notification preferences

---

## Recommendations

### High Priority

1. **Add publishing requirements** - Validate required fields before publish
2. **Add UI-level ownership validation** - Prevent unauthorized access
3. **Add draft preview mode** - Allow previewing drafts
4. **Add contributor access** - Allow contributors to edit
5. **Add view deduplication** - Prevent view spam

### Medium Priority

6. **Add scheduled publishing** - Allow scheduling future publishes
7. **Add publishing history** - Track status and content changes
8. **Add shareable draft links** - Allow sharing drafts for review
9. **Add analytics reset on unpublish** - Clean slate for republication
10. **Add private projects** - Support private visibility

### Low Priority

11. **Add password protection** - Protect published projects with password
12. **Add publishing notifications** - Notify on publish and engagement
13. **Add ownership transfer** - Allow transferring ownership
14. **Add organization ownership** - Support org-level ownership
15. **Add publishing calendar** - View and manage scheduled publishes

---

## Maturity Score

**Current Score:** 6/10

**Breakdown:**
- Status Transitions: 7/10 ✓ (basic transitions work)
- Ownership Validation: 6/10 ✗ (API only, no UI validation)
- Visibility Rules: 8/10 ✓ (proper filtering)
- Analytics Behavior: 5/10 ✗ (no deduplication, no history)
- Publishing Requirements: 2/10 ✗ (no requirements)
- Advanced Features: 1/10 ✗ (no scheduling, no history)

**Primary Blockers:** No publishing requirements, no UI-level ownership validation, no draft preview mode, no view deduplication.
