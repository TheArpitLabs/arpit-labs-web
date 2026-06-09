# User Duplication Report

**Project**: Arpit Labs  
**Audit Date**: June 9, 2026  
**Scope**: Identify duplicated functionality across user dashboard and profile routes

---

## Executive Summary

**Duplication Score**: 7/10 (High Duplication)

Significant duplication exists between `/profile` and `/profile/projects` routes, with overlapping statistics, project listings, and authentication patterns. The `/dashboard` route has minimal overlap but serves a different purpose (organizations vs personal content).

---

## Critical Duplications

### 1. Project Statistics

**Locations**:
- `/profile/page.tsx` (Lines 220-266)
- `/profile/projects/page.tsx` (Lines 132-170)

**Duplicated Metrics**:
- Total Projects count
- Total Views (sum of views_count)
- Total Likes (sum of likes_count)

**Implementation Differences**:
| Aspect | `/profile` | `/profile/projects` |
|--------|------------|---------------------|
| Card Count | 4 cards | 3 cards |
| Additional Metric | Saved count | None |
| Icon Usage | FolderOpen, TrendingUp, Heart, Bookmark | FolderOpen, Eye, TrendingUp |
| Data Source | Same query | Same query |

**Impact**: High - Users see the same metrics in two different places with slight variations

**Recommendation**: Consolidate to single location in `/dashboard` with link to detailed view

---

### 2. Project Listings

**Locations**:
- `/profile/page.tsx` (Lines 268-337) - Recent projects (top 3)
- `/profile/projects/page.tsx` (Lines 189-272) - Full project grid

**Duplicated Functionality**:
- Project card rendering
- Project data fetching
- Status badges
- Featured badges
- View links

**Implementation Differences**:
| Aspect | `/profile` | `/profile/projects` |
|--------|------------|---------------------|
| Projects Shown | Top 3 recent | All (filtered by tab) |
| Card Detail | Simplified | Full with cover image |
| Actions | View only | View, Edit, Archive, Delete |
| Tabs | None | Draft/Published/Archived |

**Impact**: High - Same project data rendered twice with different UI

**Recommendation**: Keep full management in `/dashboard/projects`, show summary in `/dashboard` overview

---

### 3. Authentication Patterns

**Locations**:
- `/profile/page.tsx` (Lines 27-28) - Client-side
- `/profile/projects/page.tsx` (Lines 27-29) - Client-side
- `/dashboard/page.tsx` (Lines 10-19) - Server-side
- `/dashboard/marketplace/page.tsx` (Line 27) - Server-side

**Duplicated Patterns**:
- User state management
- Loading states
- Empty states for unauthenticated users
- Auth state change listeners

**Implementation Differences**:
| Aspect | `/profile/*` | `/dashboard/*` |
|--------|-------------|----------------|
| Auth Method | `supabaseClient.auth.getUser()` | `getTenantContext()` / `requireUser()` |
| Auth Type | Client-side | Server-side |
| Redirect | Shows empty state | Redirects to `/login` |
| State Management | useState + useEffect | Server component |

**Impact**: Medium - Inconsistent user experience and security model

**Recommendation**: Standardize to server-side `requireUser()` for all user dashboard routes

---

### 4. Empty State Patterns

**Locations**:
- `/profile/page.tsx` (Lines 328-335, 346-353, 363-370, 381-387, 422-429)
- `/profile/projects/page.tsx` (Lines 274-288)
- `/dashboard/page.tsx` (Lines 55-59, 86-92)
- `/dashboard/marketplace/page.tsx` (Lines 73-80, 167-170)

**Duplicated Patterns**:
- EmptyState component usage
- "No items yet" messaging
- Action buttons for empty states
- Icon usage for empty states

**Implementation Differences**:
| Aspect | `/profile/*` | `/dashboard/*` |
|--------|-------------|----------------|
| Component | EmptyState | Custom cards or EmptyState |
| Messaging | "No projects yet", "No research activity" | "You are not part of any organization yet" |
| Actions | Create Project, Explore Research | Get started, Browse Marketplace |

**Impact**: Low - Standard pattern, acceptable duplication

**Recommendation**: Keep as-is (standard UX pattern)

---

## Medium Duplications

### 5. Project Data Fetching

**Locations**:
- `/profile/page.tsx` (Lines 45-49)
- `/profile/projects/page.tsx` (Lines 54-64)

**Duplicated Logic**:
```typescript
// Both routes use identical query pattern
supabaseClient
  .from('projects')
  .select('*')
  .eq('owner_id', userId)
  .order('created_at', { ascending: false })
```

**Impact**: Medium - Same query logic in multiple places

**Recommendation**: Extract to shared repository function `getUserProjects(userId)`

---

### 6. Loading States

**Locations**:
- `/profile/page.tsx` (Lines 130-154)
- `/profile/projects/page.tsx` (Lines 108-114)

**Duplicated Patterns**:
- Skeleton loaders
- Loading text
- Conditional rendering based on loading state

**Implementation Differences**:
| Aspect | `/profile` | `/profile/projects` |
|--------|------------|---------------------|
| Loader Type | StatCardSkeleton + profile skeleton | Simple "Loading..." text |
| Complexity | High | Low |

**Impact**: Low - Standard loading pattern

**Recommendation**: Keep as-is (different complexity levels appropriate)

---

## Low Duplications

### 7. Card Components

**Locations**:
- All routes use `Card` component from `@/components/ui/card`

**Impact**: None - Shared component (intentional)

**Recommendation**: Keep as-is (proper component reuse)

---

### 8. Badge Components

**Locations**:
- `/profile/page.tsx` - Status badges
- `/profile/projects/page.tsx` - Status badges
- `/dashboard/marketplace/page.tsx` - Status badges

**Impact**: None - Shared component (intentional)

**Recommendation**: Keep as-is (proper component reuse)

---

## Unique Features (No Duplication)

### `/profile` Unique Features
- Profile overview (avatar, bio, email, join date)
- Saved content section
- Research Activity placeholder
- Community Activity placeholder
- Achievements placeholder

### `/profile/projects` Unique Features
- Full project CRUD operations
- Draft/Published/Archived tabs
- Archive/Unarchive functionality
- Delete functionality

### `/dashboard` Unique Features
- Organizations overview
- Workspaces placeholder
- SaaS tenant context

### `/dashboard/marketplace` Unique Features
- Marketplace purchases
- Seller dashboard
- Revenue tracking
- Item listing form

---

## Data Duplication Analysis

### Database Query Duplication

| Query | Routes | Frequency |
|-------|--------|-----------|
| `projects` by owner_id | `/profile`, `/profile/projects` | 2x |
| `profiles` by id | `/profile` | 1x |
| `saved_content` by user_id | `/profile` | 1x |
| `organizations` by user | `/dashboard` | 1x |
| `marketplace_orders` by user | `/dashboard/marketplace` | 1x |
| `marketplace_items` by seller | `/dashboard/marketplace` | 1x |

**Total Duplicate Queries**: 1 (projects query)

**Recommendation**: Cache project data or fetch once and pass down

---

## Component Duplication Analysis

### Custom Components

| Component | Routes | Duplication Level |
|-----------|--------|-------------------|
| Project Card (simplified) | `/profile` | Unique |
| Project Card (full) | `/profile/projects` | Unique |
| Profile Overview | `/profile` | Unique |
| Stats Cards | `/profile`, `/profile/projects` | High |
| Organization Card | `/dashboard` | Unique |
| Marketplace Item Card | `/dashboard/marketplace` | Unique |

---

## Route Overlap Analysis

### User Journey Overlap

**Current User Flow**:
1. User logs in → Can access both `/profile` and `/dashboard`
2. User wants to see projects → Can go to `/profile` (summary) or `/profile/projects` (full)
3. User wants to see organizations → Must go to `/dashboard`
4. User wants to see marketplace → Must go to `/dashboard/marketplace`

**Confusion Points**:
- Projects appear in both `/profile` and `/profile/projects`
- Statistics appear in both `/profile` and `/profile/projects`
- No clear distinction between "profile" and "dashboard" purposes
- Organizations only in `/dashboard` but projects in `/profile`

---

## Consolidation Opportunities

### High Priority

1. **Merge Project Statistics**
   - Remove from `/profile`
   - Keep in `/dashboard/projects` (detailed view)
   - Show summary in `/dashboard` overview

2. **Merge Project Listings**
   - Remove recent projects from `/profile`
   - Keep full management in `/dashboard/projects`
   - Add link from `/dashboard` overview

3. **Standardize Authentication**
   - Convert `/profile` routes to server-side `requireUser()`
   - Remove client-side auth checks
   - Consistent redirect to `/login`

### Medium Priority

4. **Extract Project Query**
   - Create `getUserProjects(userId)` repository function
   - Use in both locations (or eliminate one)

5. **Consolidate Empty States**
   - Standardize EmptyState usage
   - Consistent messaging patterns

### Low Priority

6. **Profile vs Dashboard Purpose**
   - Define clear separation:
     - `/profile` = Personal identity, settings, achievements
     - `/dashboard` = Work management, organizations, analytics

---

## Risk Assessment

### Consolidation Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Breaking existing bookmarks | High | Implement redirects |
| User confusion from route changes | Medium | Clear messaging, gradual rollout |
| Lost functionality during migration | Medium | Thorough testing, feature parity |
| SEO impact from route changes | Low | Implement 301 redirects |

---

## Recommendations Summary

### Immediate Actions

1. **Standardize Authentication**
   - Convert `/profile` to server-side auth
   - Security improvement + consistency

2. **Merge Project Statistics**
   - Remove duplicate stats from `/profile`
   - Keep single source of truth in `/dashboard/projects`

3. **Merge Project Listings**
   - Remove recent projects from `/profile`
   - Keep full management in `/dashboard/projects`

### Short-term Actions

4. **Extract Shared Queries**
   - Create repository functions for common queries
   - Reduce code duplication

5. **Define Route Purposes**
   - `/profile` = Identity, settings, social features
   - `/dashboard` = Work, organizations, analytics

### Long-term Actions

6. **Implement Redirects**
   - `/profile/projects` → `/dashboard/projects`
   - Preserve backward compatibility

7. **User Education**
   - Communicate route changes
   - Update documentation

---

## Conclusion

**Current State**: High duplication between `/profile` and `/profile/projects` routes with inconsistent authentication patterns.

**Target State**: Clear separation between profile (identity) and dashboard (work) with single source of truth for each feature.

**Effort Estimate**: Medium (2-3 days for consolidation + testing)

**Impact**: High - Improved UX, reduced code duplication, better security model

---

**Report Generated**: June 9, 2026  
**Next Step**: Route Migration Plan
