# USER DASHBOARD FINAL STRUCTURE
## Phase D5 - Step 3

**Date:** 2025-06-09

---

### AUDIT RULE

**/profile** = identity & personal overview  
**/dashboard** = work & productivity

---

### ROUTE AUDIT

| Current Route | Purpose | Target Route | Migration Required |
|---------------|---------|--------------|-------------------|
| `/profile` | User identity, personal stats, project overview, research activity, community activity, saved content, achievements | `/profile` | **NO** |
| `/profile/projects` | Project management (CRUD operations, status tabs, edit/delete/archive) | `/dashboard/projects` | **YES** |
| `/dashboard` | Organizations overview, workspaces, SaaS tenant context | `/dashboard` | **NO** |
| `/dashboard/marketplace` | Marketplace purchases, seller dashboard, revenue tracking | `/dashboard/marketplace` | **NO** |

---

### DETAILED ANALYSIS

#### 1. /profile (KEEP)
**Current Purpose:**
- User profile header (avatar, name, bio, email, join date)
- Personal stats (My Projects, Total Views, Total Likes, Saved)
- Project overview (featured project, recent projects)
- Research activity section
- Community activity section
- Saved content list
- Achievements section

**Classification:** Identity & Personal Overview  
**Decision:** Keep at `/profile`  
**Rationale:** This is the user's personal identity page showing who they are and their personal activity summary.

---

#### 2. /profile/projects (MIGRATE)
**Current Purpose:**
- Project management interface
- Tabs for draft/published/archived projects
- Project cards with cover images
- CRUD operations (View, Edit, Delete, Archive)
- Stats (Total Projects, Total Views, Total Likes)
- Create new project button

**Classification:** Work & Productivity  
**Decision:** Migrate to `/dashboard/projects`  
**Rationale:** This is a work management interface for active project operations, not personal identity.

---

#### 3. /dashboard (KEEP)
**Current Purpose:**
- Organizations overview
- Workspaces placeholder
- SaaS tenant context
- Create organization button
- Recent workspaces section

**Classification:** Work & Productivity  
**Decision:** Keep at `/dashboard`  
**Rationale:** This is the main work dashboard for organizations and workspaces.

---

#### 4. /dashboard/marketplace (KEEP)
**Current Purpose:**
- Marketplace purchases management
- Seller dashboard
- Revenue tracking (Total Revenue, Total Sales, Active Items)
- List new items form
- My items management

**Classification:** Work & Productivity  
**Decision:** Keep at `/dashboard/marketplace`  
**Rationale:** This is a work dashboard for marketplace operations.

---

### MIGRATION PLAN

#### Required Migration: /profile/projects → /dashboard/projects

**Actions Required:**
1. Create directory: `src/app/dashboard/projects/`
2. Move file: `src/app/profile/projects/page.tsx` → `src/app/dashboard/projects/page.tsx`
3. Update internal links:
   - `/profile/projects` → `/dashboard/projects`
4. Update navigation references:
   - Profile page "View All" link
   - Any other references to `/profile/projects`

**Impact:**
- Low risk (simple file move)
- No data changes required
- No API changes required
- Only routing changes

---

### FINAL STRUCTURE

**Profile Routes (Identity & Personal Overview):**
- `/profile` - User profile and personal activity overview

**Dashboard Routes (Work & Productivity):**
- `/dashboard` - Organizations and workspaces
- `/dashboard/projects` - Project management (migrated from `/profile/projects`)
- `/dashboard/marketplace` - Marketplace operations

---

### CONSOLIDATION SCORE

**Before:** 4 routes scattered across profile and dashboard  
**After:** 4 routes properly organized by purpose  
**Score:** 100% (proper semantic organization)

---

### STATUS: COMPLETE
