# Creator Analytics Audit

**Project:** Arpit Labs  
**Phase:** P4 - Creator Experience Optimization  
**Date:** 2026-06-09  
**Auditor:** Cascade

---

## Executive Summary

The creator analytics system provides basic view and like tracking with aggregate counts displayed in the profile dashboard. However, it lacks detailed analytics views, engagement metrics, contributor analytics, and historical data. The implementation has no deduplication, no time-based filtering, and no export capabilities.

---

## System Overview

**Analytics API:** `/src/app/api/projects/[slug]/analytics/route.ts`  
**Analytics Library:** `/src/lib/analytics.ts` (Google Analytics integration)  
**Dashboard UI:** `/src/app/profile/page.tsx`  
**Database Tables:** `project_views`, `project_likes`, `project_bookmarks`

---

## Tracked Metrics

### Views

**Implementation:**
```typescript
await supabase.from('project_views').insert({
  project_id: id,
  user_id: user?.id || null,
  session_id: request.headers.get('x-session-id') || null,
  ip_address: request.headers.get('x-forwarded-for') || null,
  user_agent: request.headers.get('user-agent') || null,
});
```

**Data Stored:**
- project_id (uuid)
- user_id (uuid, nullable)
- session_id (text, nullable)
- ip_address (text, nullable)
- user_agent (text, nullable)
- created_at (timestamptz)

**Aggregate Display:**
- `views_count` field in projects table (incremented via trigger or manual)
- Displayed in profile dashboard
- Displayed in project listing
- Displayed in project detail page

**Issues:**
1. **No view deduplication** - Same user can spam views
2. **No session-based deduplication** - Session ID not properly used
3. **No time window deduplication** - No cooldown period
4. **No bot detection** - Bots can inflate view counts
5. **No geographic data** - No location tracking
6. **No referrer tracking** - No source attribution
7. **No device tracking** - No mobile/desktop breakdown

### Likes

**Implementation:**
```typescript
await supabase.from('project_likes').insert({
  project_id: id,
  user_id: user.id,
});
```

**Data Stored:**
- project_id (uuid)
- user_id (uuid)
- created_at (timestamptz)

**Aggregate Display:**
- `likes_count` field in projects table
- Displayed in profile dashboard
- Displayed in project listing
- Displayed in project detail page

**Issues:**
1. **No self-like prevention** - Owner can like own project
2. **No unlike tracking** - Unlike deletes record, no history
3. **No like reason** - No context for why liked
4. **No like notifications** - No notification when liked

### Bookmarks

**Implementation:**
```typescript
await supabase.from('project_bookmarks').insert({
  project_id: id,
  user_id: user.id,
});
```

**Data Stored:**
- project_id (uuid)
- user_id (uuid)
- created_at (timestamptz)

**Aggregate Display:**
- Count displayed in profile dashboard (saved items)
- Not displayed per project

**Issues:**
1. **No bookmark count per project** - Cannot see how many bookmarks
2. **No bookmark categories** - Cannot organize bookmarks
3. **No bookmark sharing** - Cannot share bookmark lists
4. **No bookmark export** - Cannot export bookmarks

---

## Engagement Metrics

### Current State

**Missing Engagement Metrics:**
1. **Time on page** - Not tracked
2. **Scroll depth** - Not tracked
3. **Click-through rate** - Not tracked
4. **Bounce rate** - Not tracked
5. **Return visitors** - Not tracked
6. **Conversion rate** - Not tracked (demo clicks, GitHub clicks)

### Google Analytics Integration

**Location:** `/src/lib/analytics.ts`

**Implemented Events:**
```typescript
analytics.projectView(projectSlug, projectTitle)
analytics.externalLink(url)
analytics.codeSnippetCopy(language)
analytics.timeOnPage(page, seconds)
analytics.scrollDepth(percentage)
```

**Issues:**
1. **Not integrated with project analytics** - GA events separate from database
2. **No unified dashboard** - GA data not shown in creator dashboard
3. **No real-time data** - GA data has delay
4. **No custom dimensions** - No project-specific GA tracking
5. **No event correlation** - Cannot correlate GA events with database events

---

## Contributor Metrics

### Current State

**Not Implemented**

**Available Data:**
- Contributors table exists (`project_contributors`)
- Contributor roles (owner, maintainer, contributor, collaborator)
- Contribution types (array field)

**Missing Metrics:**
1. **Contributor count** - Not displayed
2. **Contribution activity** - Not tracked
3. **Contributor engagement** - Not tracked
4. **Contribution impact** - Not tracked
5. **Top contributors** - Not ranked

**Recommendation:** Add contributor analytics:
- Track contributor views/likes on their projects
- Track contribution frequency
- Track contribution quality
- Display contributor leaderboard

---

## Dashboard Analytics

### Profile Dashboard

**Location:** `/src/app/profile/page.tsx`

**Displayed Metrics:**
```typescript
const totalProjects = projects.length;
const publishedProjects = projects.filter(p => p.status === 'published').length;
const draftProjects = projects.filter(p => p.status === 'draft').length;
const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);
const totalLikes = projects.reduce((sum, p) => sum + (p.likes_count || 0), 0);
```

**Visual Display:**
- My Projects (count)
- Total Views (aggregate)
- Total Likes (aggregate)
- Saved (count)

**Issues:**
1. **No per-project analytics** - Cannot see individual project stats
2. **No time-based filtering** - Cannot filter by date range
3. **No trend analysis** - Cannot see growth over time
4. **No comparison** - Cannot compare projects
5. **No export** - Cannot export analytics data
6. **No charts** - No visual representation

### Projects Dashboard

**Location:** `/src/app/profile/projects/page.tsx`

**Displayed Metrics:**
```typescript
const totalProjects = projects.length;
const totalViews = projects.reduce((sum, p) => sum + (p.views_count || 0), 0);
const totalLikes = projects.reduce((sum, p) => sum + (p.likes_count || 0), 0);
```

**Visual Display:**
- Total Projects (count)
- Total Views (aggregate)
- Total Likes (aggregate)

**Per-Project Display:**
- Views count per project
- Created date per project
- Status badge per project

**Issues:**
1. **No detailed analytics view** - Cannot drill into project analytics
2. **No engagement rate** - Cannot calculate views/likes ratio
3. **No trend indicators** - Cannot see if growing or declining
4. **No comparison with average** - Cannot compare to other projects

---

## Analytics API

### POST /api/projects/[slug]/analytics

**Purpose:** Track analytics events (view, like, bookmark)

**Event Types:**
- `view` - Track page view
- `like` - Track like
- `unlike` - Remove like
- `bookmark` - Track bookmark
- `unbookmark` - Remove bookmark

**Implementation:**
```typescript
if (type === 'view') {
  await supabase.from('project_views').insert({...});
}
if (type === 'like') {
  await supabase.from('project_likes').insert({...});
}
```

**Issues:**
1. **No batch events** - Cannot send multiple events at once
2. **No event validation** - No validation of event data
3. **No rate limiting** - Can spam events
4. **No error handling** - Generic error response
5. **No event metadata** - Cannot attach custom data

### GET /api/projects/[slug]/analytics

**Purpose:** Get analytics for a project

**Response:**
```typescript
{
  views_count: project.views_count || 0,
  likes_count: project.likes_count || 0,
  user_liked: userLiked,
  user_bookmarked: userBookmarked,
}
```

**Issues:**
1. **No historical data** - Only current counts
2. **No time series** - Cannot see trends
3. **No breakdown by source** - Cannot see where views came from
4. **No geographic data** - Cannot see where viewers are
5. **No device data** - Cannot see device breakdown

---

## Data Quality Issues

### View Count Accuracy

**Current:** Simple increment on each view

**Issues:**
1. **No deduplication** - Same user can refresh to increment
2. **No bot filtering** - Bots can inflate counts
3. **No session tracking** - Session ID not properly used
4. **No time window** - No cooldown between views

**Recommendation:** Implement proper view counting:
- Deduplicate by user + time window (24 hours)
- Filter known bots
- Use session-based tracking
- Implement cooldown period

### Like Count Accuracy

**Current:** Simple insert/delete

**Issues:**
1. **No self-like prevention** - Owner can like own project
2. **No unlike history** - Cannot see unlike patterns
3. **No like fraud detection** - No detection of like spam

**Recommendation:** Improve like tracking:
- Prevent self-likes
- Track unlike history
- Detect like spam patterns
- Add like reason tracking

---

## Missing Analytics Features

### Time-Based Analytics

**Missing:**
1. **Daily views** - Cannot see views per day
2. **Weekly views** - Cannot see views per week
3. **Monthly views** - Cannot see views per month
4. **Yearly views** - Cannot see views per year
5. **Time series charts** - No visual trend representation

**Recommendation:** Add time-based analytics:
- Add date dimension to views table
- Implement time series queries
- Add chart visualization
- Add date range filters

### Source Analytics

**Missing:**
1. **Referrer tracking** - Cannot see where traffic comes from
2. **UTM parameter tracking** - Cannot track campaigns
3. **Source breakdown** - Cannot see organic vs social vs direct
4. **Conversion tracking** - Cannot track conversions by source

**Recommendation:** Add source tracking:
- Track referrer URL
- Parse UTM parameters
- Categorize sources
- Track conversions by source

### Geographic Analytics

**Missing:**
1. **Country breakdown** - Cannot see views by country
2. **City breakdown** - Cannot see views by city
3. **Regional analytics** - Cannot see regional patterns
4. **Map visualization** - No geographic map

**Recommendation:** Add geographic tracking:
- Track IP address
- Geolocate to country/city
- Add map visualization
- Add regional filters

### Device Analytics

**Missing:**
1. **Device type** - Cannot see mobile vs desktop
2. **Browser breakdown** - Cannot see browser usage
3. **OS breakdown** - Cannot see OS usage
4. **Screen resolution** - Cannot see screen sizes

**Recommendation:** Add device tracking:
- Parse user agent
- Detect device type
- Detect browser
- Detect OS
- Add device breakdown charts

---

## Export and Reporting

### Current State

**Not Implemented**

**Missing:**
1. **CSV export** - Cannot export analytics to CSV
2. **PDF reports** - Cannot generate PDF reports
3. **Scheduled reports** - Cannot schedule email reports
4. **Custom reports** - Cannot create custom report templates

**Recommendation:** Add export and reporting:
- Add CSV export functionality
- Add PDF report generation
- Add scheduled email reports
- Add custom report builder

---

## Recommendations

### High Priority

1. **Implement view deduplication** - Prevent view spam
2. **Prevent self-likes** - Owners cannot like own projects
3. **Add time-based analytics** - Views over time
4. **Add per-project analytics view** - Detailed project stats
5. **Add charts and visualizations** - Better data presentation

### Medium Priority

6. **Add source tracking** - Referrer and UTM parameters
7. **Add geographic tracking** - Country and city breakdown
8. **Add device tracking** - Mobile vs desktop
9. **Add contributor analytics** - Track contributor performance
10. **Add export functionality** - CSV and PDF export

### Low Priority

11. **Add engagement metrics** - Time on page, scroll depth
12. **Add conversion tracking** - Demo clicks, GitHub clicks
13. **Add scheduled reports** - Email analytics reports
14. **Add custom reports** - Report builder
15. **Add real-time analytics** - WebSocket-based live updates

---

## Maturity Score

**Current Score:** 4/10

**Breakdown:**
- Basic Metrics: 6/10 ✓ (views and likes tracked)
- Data Quality: 3/10 ✗ (no deduplication, no bot filtering)
- Analytics Depth: 2/10 ✗ (no time series, no breakdowns)
- Visualization: 2/10 ✗ (no charts, no trends)
- Contributor Analytics: 0/10 ✗ (not implemented)
- Export/Reporting: 0/10 ✗ (not implemented)

**Primary Blockers:** No view deduplication, no time-based analytics, no per-project analytics view, no data quality controls.
