# User Route Migration Plan

**Project**: Arpit Labs  
**Planning Date**: June 9, 2026  
**Objective**: Design target route structure and map existing features to new locations

---

## Target Route Structure

### User Dashboard (`/dashboard`)

```
/dashboard
├── /                          # Overview (organizations + quick stats)
├── /projects                  # Projects management (moved from /profile/projects)
├── /saved                     # Saved content (moved from /profile)
├── /activity                  # Activity feed (new - currently placeholder)
└── /settings                  # User settings (new - currently missing)
```

### User Profile (`/profile`)

```
/profile
├── /                          # Profile overview (identity, achievements)
└── /settings                  # Account settings (moved from /dashboard/settings)
```

---

## Feature Mapping

### Current → Target Mapping

| Current Route | Feature | Target Route | Action |
|---------------|---------|--------------|--------|
| `/profile` | Profile overview (avatar, bio, email, join date) | `/profile` | Keep |
| `/profile` | Project statistics | `/dashboard/projects` | Move |
| `/profile` | My Projects (recent) | `/dashboard` | Move as summary |
| `/profile` | Saved Content | `/dashboard/saved` | Move |
| `/profile` | Research Activity | `/dashboard/activity` | Move + expand |
| `/profile` | Community Activity | `/dashboard/activity` | Merge |
| `/profile` | Achievements | `/profile` | Keep |
| `/profile/projects` | Projects management (full) | `/dashboard/projects` | Move |
| `/profile/projects` | Project statistics | `/dashboard/projects` | Keep (deduplicate) |
| `/dashboard` | Organizations overview | `/dashboard` | Keep |
| `/dashboard` | Workspaces placeholder | `/dashboard` | Keep |
| `/dashboard/marketplace` | Marketplace dashboard | `/dashboard/marketplace` | Keep |

---

## Detailed Migration Plan

### Phase 1: Create New Dashboard Structure

#### 1.1 Create `/dashboard/projects` (New)

**Source**: `/profile/projects/page.tsx`

**Changes Required**:
- Copy entire file to `/dashboard/projects/page.tsx`
- Update authentication from client-side to server-side `requireUser()`
- Update internal links from `/profile/projects` to `/dashboard/projects`
- Update breadcrumb/navigation if any
- Test all CRUD operations

**Files to Create**:
- `/src/app/dashboard/projects/page.tsx`

**Files to Modify**:
- Update any links pointing to `/profile/projects` → `/dashboard/projects`

**Risk**: Medium - Core project management functionality

---

#### 1.2 Create `/dashboard/saved` (New)

**Source**: Saved Content section from `/profile/page.tsx` (Lines 373-413)

**Changes Required**:
- Extract saved content section to new page
- Convert to server component with `requireUser()`
- Add page header and navigation
- Keep existing saved content logic
- Test saved content functionality

**Files to Create**:
- `/src/app/dashboard/saved/page.tsx`

**Files to Modify**:
- Remove saved content section from `/profile/page.tsx`
- Update links to saved content → `/dashboard/saved`

**Risk**: Low - Simple extraction

---

#### 1.3 Create `/dashboard/activity` (New)

**Source**: Research Activity + Community Activity from `/profile/page.tsx`

**Changes Required**:
- Merge Research Activity and Community Activity sections
- Expand from empty state to full activity feed
- Convert to server component with `requireUser()`
- Add activity feed logic (to be implemented later)
- Keep empty state as fallback

**Files to Create**:
- `/src/app/dashboard/activity/page.tsx`

**Files to Modify**:
- Remove Research Activity section from `/profile/page.tsx`
- Remove Community Activity section from `/profile/page.tsx`
- Update links → `/dashboard/activity`

**Risk**: Low - Currently empty state, expansion is future work

---

#### 1.4 Create `/dashboard/settings` (New)

**Source**: New feature (currently missing)

**Changes Required**:
- Create new settings page
- Add account settings form
- Add notification preferences
- Add privacy settings
- Use server-side `requireUser()`
- Link to profile settings if separate

**Files to Create**:
- `/src/app/dashboard/settings/page.tsx`

**Risk**: Medium - New feature implementation

---

### Phase 2: Update Existing Dashboard

#### 2.1 Update `/dashboard` Overview

**Source**: `/dashboard/page.tsx`

**Changes Required**:
- Add project summary section (moved from `/profile`)
- Add quick stats summary
- Add navigation links to new dashboard sections
- Keep organizations overview
- Keep workspaces placeholder
- Update links to point to new dashboard routes

**Files to Modify**:
- `/src/app/dashboard/page.tsx`

**Risk**: Medium - Main dashboard entry point

---

#### 2.2 Keep `/dashboard/marketplace`

**Source**: `/dashboard/marketplace/page.tsx`

**Changes Required**:
- No changes needed
- Already in correct location
- Already uses server-side auth

**Files to Modify**:
- None

**Risk**: None

---

### Phase 3: Simplify Profile

#### 3.1 Update `/profile` Overview

**Source**: `/profile/page.tsx`

**Changes Required**:
- Remove project statistics section (moved to `/dashboard/projects`)
- Remove My Projects section (moved to `/dashboard`)
- Remove Saved Content section (moved to `/dashboard/saved`)
- Remove Research Activity section (moved to `/dashboard/activity`)
- Remove Community Activity section (moved to `/dashboard/activity`)
- Keep Profile Overview section
- Keep Achievements section
- Convert to server-side `requireUser()`
- Add navigation links to dashboard

**Files to Modify**:
- `/src/app/profile/page.tsx`

**Risk**: Medium - Major content removal

---

#### 3.2 Remove `/profile/projects`

**Source**: `/profile/projects/page.tsx`

**Changes Required**:
- Delete entire directory
- Implement redirect `/profile/projects` → `/dashboard/projects`
- Update all internal links

**Files to Delete**:
- `/src/app/profile/projects/page.tsx`
- `/src/app/profile/projects/` (directory)

**Files to Create**:
- `/src/app/profile/projects/page.tsx` (redirect component)

**Risk**: High - Breaking change, requires redirects

---

### Phase 4: Implement Redirects

#### 4.1 Create `/profile/projects` Redirect

**Source**: New redirect component

**Changes Required**:
- Create redirect component at `/profile/projects/page.tsx`
- Redirect to `/dashboard/projects`
- Preserve query parameters if any

**Files to Create**:
- `/src/app/profile/projects/page.tsx` (redirect)

**Risk**: Low - Standard redirect pattern

---

#### 4.2 Update Navigation Links

**Source**: All components with links to old routes

**Changes Required**:
- Search codebase for `/profile/projects` links
- Update to `/dashboard/projects`
- Search codebase for `/profile` links that should go to dashboard
- Update accordingly

**Files to Modify**:
- Navigation components
- Sidebar components
- Any hardcoded links

**Risk**: Medium - Comprehensive search required

---

## Migration Sequence

### Step 1: Preparation (Day 1)
1. Create new dashboard routes (empty scaffolds)
2. Set up redirects for old routes
3. Update navigation components
4. Test redirect flow

### Step 2: Feature Migration (Day 2)
1. Migrate `/profile/projects` → `/dashboard/projects`
2. Migrate saved content → `/dashboard/saved`
3. Update `/dashboard` overview
4. Test project management flow

### Step 3: Profile Cleanup (Day 3)
1. Remove duplicated sections from `/profile`
2. Convert `/profile` to server-side auth
3. Add navigation to dashboard
4. Test profile page

### Step 4: Finalization (Day 4)
1. Remove old `/profile/projects` directory
2. Implement final redirects
3. Comprehensive testing
4. Update documentation

---

## File Impact Summary

### Files to Create

| File | Source | Purpose |
|------|--------|---------|
| `/src/app/dashboard/projects/page.tsx` | `/profile/projects/page.tsx` | Projects management |
| `/src/app/dashboard/saved/page.tsx` | `/profile` section | Saved content |
| `/src/app/dashboard/activity/page.tsx` | `/profile` sections | Activity feed |
| `/src/app/dashboard/settings/page.tsx` | New | User settings |
| `/src/app/profile/projects/page.tsx` | New | Redirect component |

### Files to Modify

| File | Changes | Risk |
|------|---------|------|
| `/src/app/dashboard/page.tsx` | Add project summary, update links | Medium |
| `/src/app/profile/page.tsx` | Remove sections, convert auth | Medium |
| Navigation components | Update route links | Medium |

### Files to Delete

| File | Reason | Risk |
|------|--------|------|
| `/src/app/profile/projects/page.tsx` | Moved to dashboard | High |

---

## Testing Plan

### Unit Tests

1. **Authentication**
   - Test `requireUser()` on all new dashboard routes
   - Test redirect to `/login` for unauthenticated users
   - Test session validation

2. **Project Management**
   - Test project CRUD in new location
   - Test project statistics
   - Test draft/published/archived tabs
   - Test archive/delete operations

3. **Saved Content**
   - Test saved content display
   - Test saved content deletion
   - Test content type filtering

4. **Redirects**
   - Test `/profile/projects` → `/dashboard/projects`
   - Test query parameter preservation
   - Test 301 status codes

### Integration Tests

1. **User Flow**
   - Login → Dashboard → Projects
   - Login → Dashboard → Saved
   - Login → Profile → Dashboard navigation

2. **Navigation**
   - Test all navigation links
   - Test breadcrumbs
   - Test back button behavior

3. **Data Integrity**
   - Verify project data accessible in new location
   - Verify saved data accessible in new location
   - Verify no data loss during migration

### Regression Tests

1. **Existing Functionality**
   - Test marketplace dashboard still works
   - Test organizations still works
   - Test profile overview still works

2. **External Links**
   - Test bookmarks to old routes
   - Test external links to old routes
   - Test email links to old routes

---

## Rollback Plan

### Rollback Triggers

- Critical bugs in project management
- Data loss or corruption
- Performance degradation
- User complaints > threshold

### Rollback Steps

1. Restore old routes from git
2. Remove new dashboard routes
3. Revert navigation changes
4. Clear any cache
5. Announce rollback to users

### Rollback Time

- **Estimated**: 30 minutes
- **Downtime**: Minimal (hot swap)

---

## Risk Mitigation

### High Risk Items

1. **Breaking `/profile/projects`**
   - **Mitigation**: Implement permanent redirect
   - **Monitoring**: Track 404s for old route
   - **Fallback**: Keep old route as alias if needed

2. **Authentication Changes**
   - **Mitigation**: Thorough testing of auth flows
   - **Monitoring**: Track auth failures
   - **Fallback**: Revert to client-side if issues

### Medium Risk Items

1. **Navigation Updates**
   - **Mitigation**: Comprehensive link search
   - **Monitoring**: Track broken links
   - **Fallback**: Manual link fixes

2. **Profile Content Removal**
   - **Mitigation**: Clear user communication
   - **Monitoring**: Track user feedback
   - **Fallback**: Restore sections if needed

---

## Success Criteria

### Functional Requirements

- ✅ All project management features work in new location
- ✅ All saved content features work in new location
- ✅ Profile page loads correctly with reduced content
- ✅ All redirects work properly
- ✅ Authentication works consistently across all routes

### Non-Functional Requirements

- ✅ No performance degradation
- ✅ No data loss
- ✅ No broken links
- ✅ Consistent user experience
- ✅ Clear navigation between profile and dashboard

### User Experience

- ✅ Users can find all features in new locations
- ✅ Navigation is intuitive
- ✅ Redirects are seamless
- ✅ Profile and dashboard purposes are clear

---

## Communication Plan

### Pre-Migration

- Announce upcoming changes to users
- Document new route structure
- Provide migration timeline

### During Migration

- Display maintenance banner if needed
- Provide progress updates
- Monitor for issues

### Post-Migration

- Send announcement email
- Update documentation
- Provide help resources
- Monitor user feedback

---

## Estimated Effort

| Phase | Duration | Effort |
|-------|----------|--------|
| Preparation | 1 day | Medium |
| Feature Migration | 2 days | High |
| Profile Cleanup | 1 day | Medium |
| Testing | 1 day | Medium |
| Documentation | 0.5 day | Low |
| **Total** | **5.5 days** | **High** |

---

## Conclusion

**Target Structure**: Clear separation between profile (identity) and dashboard (work)

**Migration Approach**: Phased approach with redirects to minimize disruption

**Risk Level**: Medium (mitigated by redirects and testing)

**Timeline**: 5.5 days estimated

**Next Step**: Auth verification and final consolidation report

---

**Plan Generated**: June 9, 2026  
**Status**: Ready for Implementation  
**Next Phase**: Auth Review
