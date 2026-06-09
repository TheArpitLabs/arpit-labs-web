# User Feature Inventory

**Project**: Arpit Labs  
**Audit Date**: June 9, 2026  
**Scope**: User-facing dashboard and profile functionality

---

## Overview

This inventory catalogs all user-facing features across the current dashboard and profile routes to identify consolidation opportunities.

---

## Route: `/profile`

**File**: `src/app/profile/page.tsx`  
**Type**: Client Component  
**Auth**: Client-side (`supabaseClient.auth.getUser()`)

### Features

#### 1. Profile Overview
- **Location**: Lines 193-218
- **Components**: Avatar, name, bio, email, join date
- **Data Sources**: 
  - `profiles` table (avatar_url, full_name, bio)
  - `auth.users` (email, created_at)
- **UI Elements**:
  - Avatar image with fallback
  - Full name display
  - Bio text
  - Email with Mail icon
  - Join date with Calendar icon

#### 2. Dashboard Stats
- **Location**: Lines 220-266
- **Components**: 4 stat cards
- **Data Sources**:
  - `projects` table (owner_id filter)
  - `saved_content` table (user_id filter)
- **Metrics**:
  - My Projects (total count)
  - Total Views (sum of views_count)
  - Total Likes (sum of likes_count)
  - Saved (count of saved_content)
- **UI Elements**:
  - FolderOpen icon for projects
  - TrendingUp icon for views
  - Heart icon for likes
  - Bookmark icon for saved

#### 3. My Projects Section
- **Location**: Lines 268-337
- **Components**: Featured project card + recent projects list
- **Data Sources**: `projects` table (owner_id filter)
- **Features**:
  - Featured project highlight (if exists)
  - Recent projects list (top 3)
  - "View All" link to `/profile/projects`
- **UI Elements**:
  - Featured badge
  - Project type badge
  - Views count
  - Status badge
  - Created date
- **Actions**: View project

#### 4. Research Activity Section
- **Location**: Lines 339-354
- **Status**: Empty state placeholder
- **Data Sources**: None (not implemented)
- **UI Elements**: EmptyState component with "Explore Research" action

#### 5. Community Activity Section
- **Location**: Lines 356-371
- **Status**: Empty state placeholder
- **Data Sources**: None (not implemented)
- **UI Elements**: EmptyState component with "Visit Community" action

#### 6. Saved Content Section
- **Location**: Lines 373-413
- **Components**: Saved items list
- **Data Sources**: `saved_content` table (user_id filter)
- **Features**:
  - List of saved items by content_type
  - Content ID display
  - View link per item
- **UI Elements**:
  - Content type badge
  - Content ID
  - View link

#### 7. Achievements Section
- **Location**: Lines 415-430
- **Status**: Empty state placeholder
- **Data Sources**: None (not implemented)
- **UI Elements**: EmptyState component with "Explore Activities" action

---

## Route: `/profile/projects`

**File**: `src/app/profile/projects/page.tsx`  
**Type**: Client Component  
**Auth**: Client-side (`supabaseClient.auth.getUser()`)

### Features

#### 1. Projects Management
- **Location**: Lines 116-291
- **Components**: Full projects CRUD interface
- **Data Sources**: `projects` table (owner_id filter)
- **Features**:
  - Draft/Published/Archived tabs
  - Project grid with cards
  - Stats cards (Total Projects, Total Views, Total Likes)
  - Create new project button
- **UI Elements**:
  - Tab navigation with counts
  - Project cards with cover images
  - Project type badge
  - Featured badge
  - Views count
  - Created date
- **Actions**:
  - View project
  - Edit project
  - Archive/Unarchive project
  - Delete project

#### 2. Project Statistics
- **Location**: Lines 132-170
- **Components**: 3 stat cards
- **Metrics**:
  - Total Projects
  - Total Views
  - Total Likes
- **UI Elements**:
  - FolderOpen icon
  - Eye icon
  - TrendingUp icon

---

## Route: `/dashboard`

**File**: `src/app/dashboard/page.tsx`  
**Type**: Server Component  
**Auth**: Server-side (`getTenantContext()` → redirect to `/login`)

### Features

#### 1. Organizations Overview
- **Location**: Lines 47-78
- **Components**: Organizations list
- **Data Sources**: `organizations` table (via getTenantContext)
- **Features**:
  - List of user's organizations
  - Organization cards with name
  - Link to organization detail
  - "Create Organization" button
- **UI Elements**:
  - Building2 icon
  - Organization initial avatar
  - ArrowRight icon
- **Actions**: View organization, Create organization

#### 2. Workspaces Placeholder
- **Location**: Lines 80-93
- **Status**: Empty state placeholder
- **Data Sources**: None (not implemented)
- **UI Elements**: Empty state with "Select an organization" message

---

## Route: `/dashboard/marketplace`

**File**: `src/app/dashboard/marketplace/page.tsx`  
**Type**: Server Component  
**Auth**: Server-side (`requireUser()`)

### Features

#### 1. Marketplace Dashboard
- **Location**: Lines 38-217
- **Components**: Tabbed interface
- **Data Sources**: 
  - `marketplace_orders` table (via marketplaceRepository)
  - `marketplace_items` table (via marketplaceRepository)
- **Tabs**:
  - My Purchases
  - Seller Dashboard

#### 2. My Purchases Tab
- **Location**: Lines 71-117
- **Features**:
  - List of purchased items
  - Download button per item
  - Purchase date and amount
- **UI Elements**:
  - ShoppingBag icon
  - Item preview image
  - Download button
- **Actions**: Download item

#### 3. Seller Dashboard Tab
- **Location**: Lines 120-211
- **Features**:
  - Seller stats (Revenue, Sales, Active Items)
  - List new item form
  - My items list
- **UI Elements**:
  - Store icon
  - TrendingUp icon
  - MarketplaceItemForm component
- **Actions**: List item, View item

---

## Data Source Summary

### Database Tables Used

| Table | Routes | Purpose |
|-------|--------|---------|
| `profiles` | `/profile` | User profile data |
| `projects` | `/profile`, `/profile/projects` | User projects |
| `saved_content` | `/profile` | Saved items |
| `organizations` | `/dashboard` | User organizations |
| `marketplace_orders` | `/dashboard/marketplace` | Purchase history |
| `marketplace_items` | `/dashboard/marketplace` | Seller items |

### Authentication Methods

| Route | Auth Method | Type |
|-------|-------------|------|
| `/profile` | `supabaseClient.auth.getUser()` | Client-side |
| `/profile/projects` | `supabaseClient.auth.getUser()` | Client-side |
| `/dashboard` | `getTenantContext()` | Server-side |
| `/dashboard/marketplace` | `requireUser()` | Server-side |

---

## Component Usage

### Shared Components

| Component | Routes | Purpose |
|-----------|--------|---------|
| `Card` | All | Container |
| `Badge` | `/profile`, `/profile/projects`, `/dashboard/marketplace` | Status indicators |
| `Button` | All | Actions |
| `EmptyState` | `/profile`, `/profile/projects` | Empty states |
| `Link` | All | Navigation |

### Layout Components

| Component | Routes | Purpose |
|-----------|--------|---------|
| `Container` | `/dashboard`, `/dashboard/marketplace` | Page wrapper |
| `Footer` | `/profile`, `/dashboard` | Page footer |

### Icons Used

| Icon | Routes | Purpose |
|------|--------|---------|
| `User` | `/profile` | User icon |
| `Mail` | `/profile` | Email |
| `Calendar` | `/profile` | Join date |
| `FolderOpen` | `/profile`, `/profile/projects` | Projects |
| `Search` | `/profile` | Research |
| `MessageSquare` | `/profile` | Community |
| `Bookmark` | `/profile` | Saved |
| `Award` | `/profile` | Achievements |
| `Code2` | `/profile` | Projects section |
| `TrendingUp` | `/profile`, `/profile/projects`, `/dashboard/marketplace` | Views/Analytics |
| `Users` | `/profile` | Community |
| `Activity` | `/profile` | Recent activity |
| `Heart` | `/profile` | Likes |
| `Building2` | `/dashboard` | Organizations |
| `Layout` | `/dashboard` | Workspaces |
| `ArrowRight` | `/dashboard` | Navigation |
| `Plus` | `/dashboard`, `/profile/projects` | Create actions |
| `ShoppingBag` | `/dashboard/marketplace` | Marketplace |
| `Download` | `/dashboard/marketplace` | Download |
| `Clock` | `/dashboard/marketplace` | Time |
| `ExternalLink` | `/dashboard/marketplace` | External links |
| `Store` | `/dashboard/marketplace` | Seller |
| `Edit` | `/profile/projects` | Edit |
| `Trash2` | `/profile/projects` | Delete |
| `Eye` | `/profile/projects` | View |
| `Archive` | `/profile/projects` | Archive |

---

## External Dependencies

### Repositories

| Repository | Routes | Purpose |
|------------|--------|---------|
| `marketplaceRepository` | `/dashboard/marketplace` | Marketplace data |

### Auth Functions

| Function | Routes | Purpose |
|----------|--------|---------|
| `getTenantContext` | `/dashboard` | SaaS tenant context |
| `requireUser` | `/dashboard/marketplace` | Server-side auth |

---

## Feature Completeness

### Implemented Features

- ✅ Profile overview
- ✅ Project statistics
- ✅ Project management (CRUD)
- ✅ Saved content
- ✅ Organizations overview
- ✅ Marketplace purchases
- ✅ Seller dashboard

### Placeholder Features

- ⚠️ Research Activity (empty state)
- ⚠️ Community Activity (empty state)
- ⚠️ Achievements (empty state)
- ⚠️ Workspaces (empty state)

### Missing Features

- ❌ Activity feed
- ❌ Notifications
- ❌ Settings page

---

## Summary

**Total Routes**: 4  
**Total Features**: 20+  
**Implemented**: 16  
**Placeholders**: 4  
**Missing**: 3

**Key Observations**:
1. Mixed authentication methods (client-side vs server-side)
2. Duplicated project statistics across routes
3. Profile serves as de facto dashboard with multiple sections
4. Marketplace is properly integrated in dashboard
5. Organizations are only in dashboard, not profile
6. Several empty state placeholders for future features

---

**Report Generated**: June 9, 2026  
**Next Step**: Duplication Analysis
