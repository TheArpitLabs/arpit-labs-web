# Phase 2C: Analytics Migration Guide

## Overview

This migration adds project analytics tracking capabilities including:
- Project likes (user likes on projects)
- Project bookmarks (user saves projects)
- Project views (view tracking with session management)
- Automatic count updates via triggers
- Helper functions for checking user interactions

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select the project: `arpit-labs`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in left sidebar
   - Click "New Query"

3. **Apply Migration**
   - Open file: `supabase/migrations/20260708_phase2c_analytics.sql`
   - Copy entire contents
   - Paste into SQL Editor window
   - Click "Run" button

4. **Verify Tables Created**
   - Go to "Table Editor"
   - Verify these tables exist:
     - `project_likes`
     - `project_bookmarks`
     - `project_views`

### Option 2: Supabase CLI (Advanced)

```bash
# Link project first (if not already linked)
npx supabase link --project-ref [your-project-ref]

# Apply migration
npx supabase migration up
```

---

## Verification Checklist

After applying migration, verify:

- [ ] `project_likes` table exists with all columns
- [ ] `project_bookmarks` table exists with all columns
- [ ] `project_views` table exists with all columns
- [ ] All indexes are created (view in Indexes tab)
- [ ] RLS policies are enabled on all tables
- [ ] Triggers are visible in Database > Triggers
- [ ] Functions are visible in Database > Functions

---

## What Gets Created

### Tables

| Table | Purpose |
|-------|---------|
| `project_likes` | Track user likes on projects |
| `project_bookmarks` | Track user bookmarks/saves on projects |
| `project_views` | Track project views with session management |

### Functions

| Function | Purpose |
|----------|---------|
| `update_project_likes_count()` | Auto-update likes_count on projects table |
| `update_project_views_count()` | Auto-update views_count on projects table |
| `has_user_liked()` | Check if user liked a project |
| `has_user_bookmarked()` | Check if user bookmarked a project |
| `get_trending_projects()` | Get projects sorted by recent engagement |

### Triggers

| Trigger | Purpose |
|---------|---------|
| `update_likes_count` | Fires on project_likes insert/delete |
| `update_views_count` | Fires on project_views insert |

---

## API Endpoints

The following API endpoint has been created:

### POST/GET `/api/projects/[id]/analytics`

**POST** - Track analytics events:
- `type: 'view'` - Record a project view
- `type: 'like'` - Like a project (requires auth)
- `type: 'unlike'` - Unlike a project (requires auth)
- `type: 'bookmark'` - Bookmark a project (requires auth)
- `type: 'unbookmark'` - Unbookmark a project (requires auth)

**GET** - Get analytics status:
- Returns `views_count`, `likes_count`
- Returns `user_liked`, `user_bookmarked` (if authenticated)

---

## Testing the Setup

After migration:

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Visit projects page**
   - http://localhost:3000/projects
   - Verify search bar appears
   - Verify filters appear (Branch, Project Type, Sort)
   - Verify Trending Projects section appears
   - Verify project cards show likes, branch, and author

3. **Test search**
   - Type in search bar
   - Verify real-time filtering works

4. **Test filters**
   - Select a branch filter
   - Verify projects are filtered
   - Select a project type filter
   - Verify projects are filtered
   - Change sort option
   - Verify projects are re-sorted

5. **Test profile page**
   - Visit http://localhost:3000/profile
   - Verify Total Views stat appears
   - Verify Total Likes stat appears

---

## Troubleshooting

### Error: "Could not find the table 'public.project_likes'"
**Solution**: Migration hasn't been applied. Complete the "Apply Migration" steps above.

### Error: "Permission denied for table 'project_likes'"
**Solution**: RLS policies may not be configured. Re-run the entire migration file.

### Error: "Relation 'project_likes' already exists"
**Solution**: Table already exists. Skip migration or drop table first with:
```sql
DROP TABLE IF EXISTS project_likes CASCADE;
DROP TABLE IF EXISTS project_bookmarks CASCADE;
DROP TABLE IF EXISTS project_views CASCADE;
```

### Analytics not updating
**Solution**: 
1. Verify triggers are created in Database > Triggers
2. Check that projects table has `views_count` and `likes_count` columns
3. Test API endpoint directly

---

## Success Indicators

✅ Migration is successful when:
1. All 3 tables are visible in Supabase Table Editor
2. Triggers appear in Database > Triggers
3. Functions appear in Database > Functions
4. Projects page shows search, filters, and trending section
5. Project cards display likes, branch, and author info
6. Profile page shows Total Views and Total Likes stats
7. No console errors about missing tables or functions

---

## Next Steps After Migration

1. Test search functionality with real project data
2. Test filters with different branch/project type combinations
3. Test like/unlike functionality (requires auth)
4. Test bookmark/unbookmark functionality (requires auth)
5. Verify view tracking works automatically
6. Monitor analytics data in Supabase dashboard

---

**Questions?** Refer to main documentation: `ARPIT_LABS_STATUS_REPORT.md`
