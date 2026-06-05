# Phase 8C Database Migration Guide

## How to Apply the Learning Platform Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select the project: `arpit-labs`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in left sidebar
   - Click "New Query"

3. **Apply Migration**
   - Open file: `supabase/migrations/20260605_phase8c_learning_platform.sql`
   - Copy entire contents
   - Paste into SQL Editor window
   - Click "Run" button

4. **Verify Tables Created**
   - Go to "Table Editor"
   - Verify these tables exist:
     - `courses`
     - `course_modules`
     - `labs`
     - `roadmaps`
     - `user_course_progress`

### Option 2: Supabase CLI (Advanced)

```bash
# Install/Update Supabase CLI
npm install supabase --save-dev

# Login to Supabase
npx supabase login

# Link project
npx supabase link --project-ref lxbtuwltzljmnwxbygcl

# Apply migrations
npx supabase migration up
```

### Option 3: Direct SQL (If Needed)

```bash
# Connect directly to Postgres
psql "postgresql://[user]:[password]@[host]:[port]/postgres"

# Run migration file
\i supabase/migrations/20260605_phase8c_learning_platform.sql
```

---

## Verification Checklist

After applying migration, verify:

- [ ] `courses` table exists with all columns
- [ ] `course_modules` table exists
- [ ] `labs` table exists
- [ ] `roadmaps` table exists
- [ ] `user_course_progress` table exists
- [ ] All indexes are created (view in Indexes tab)
- [ ] RLS policies are enabled on all tables
- [ ] RLS policies show in Policies tab

---

## Test the Setup

After migration:

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Visit pages**
   - http://localhost:3000/courses (should show empty state)
   - http://localhost:3000/admin/courses (admin interface)

3. **Create test data**
   - Login as admin
   - Go to `/admin/courses`
   - Create a test course
   - Verify it appears on `/courses`

---

## Troubleshooting

### Error: "Could not find the table 'public.courses'"
**Solution**: Migration hasn't been applied. Complete the "Apply Migration" steps above.

### Error: "Permission denied for table 'courses'"
**Solution**: RLS policies may not be configured. Re-run the entire migration file.

### Error: "Relation 'courses' already exists"
**Solution**: Table already exists. Skip migration or drop table first with:
```sql
DROP TABLE IF EXISTS courses CASCADE;
```

### Data not showing on pages
**Solution**: 
1. Verify migration was applied
2. Add test data via admin interface
3. Publish content (set `published = true`)

---

## Environment Setup

Ensure `.env.local` has correct credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lxbtuwltzljmnwxbygcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
ADMIN_EMAILS=arpitkumar0211@gmail.com
```

---

## What Gets Created

### Tables
| Table | Purpose |
|-------|---------|
| courses | Store course content and metadata |
| course_modules | Store individual course sections |
| labs | Store hands-on lab exercises |
| roadmaps | Store learning path definitions |
| user_course_progress | Track user's learning progress |

### Indexes
- Fast lookups by slug, category, publish status
- Optimized queries for filtering and sorting

### RLS Policies
- Public read access to published content
- Admin-only write access
- User-specific progress tracking

---

## Success Indicators

✅ Migration is successful when:
1. All 5 tables are visible in Supabase Table Editor
2. Admin pages load at `/admin/courses`, `/admin/labs`, `/admin/roadmaps`
3. Public pages load at `/courses`, `/labs`, `/roadmaps`
4. Admin can create courses and they appear on public page
5. No console errors about missing tables

---

## Next Steps After Migration

1. Create initial course content
2. Create labs with instructions
3. Create learning roadmaps
4. Set publish status for content
5. Test public viewing
6. Integrate with profile system (Phase 8D)
7. Connect AI system for recommendations (Phase 8D+)

---

**Questions?** Refer to main documentation: `PHASE_8C_LEARNING_PLATFORM.md`
