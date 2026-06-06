# MISSING SCHEMA REPORT

**Generated:** June 6, 2026
**Purpose:** Identify database schema issues causing production errors

## Executive Summary

**CRITICAL FINDING:** Both failing tables (`research_datasets` and `membership_plans`) ARE defined in migration files but may not be applied to production database.

## Failing Queries Analysis

### 1. Research Page Error: `Object.getResearchDatasets()`

**File Location:** `/src/lib/repositories/ecosystem.repository.ts` (lines 22-26)

**Repository Method:** `ecosystemRepository.getResearchDatasets()`

**Query Details:**
- **Table:** `research_datasets`
- **Columns:** `*` (all columns)
- **Filters:** None
- **Order:** `created_at` descending
- **Query:** `supabaseServer.from("research_datasets").select("*").order("created_at", { ascending: false })`

**Migration Status:** ✅ EXISTS
- **Migration File:** `20260701_phase10_ecosystem.sql` (lines 19-29)
- **Also in:** `20260606_consolidated_critical_fixes.sql` (lines 19-29)

**Table Schema:**
```sql
create table if not exists research_datasets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  download_url text,
  size text,
  format text,
  license text,
  created_at timestamptz not null default now()
);
```

**Missing Columns:** None
**Missing Indexes:** None (has `idx_research_datasets_created_at` in consolidated migration)
**RLS Policy:** ✅ EXISTS - "Public can view research_datasets"

---

### 2. Membership Checkout Error: `Object.getPlanById()`

**File Location:** `/src/lib/repositories/membership.repository.ts` (lines 29-36)

**Repository Method:** `membershipRepository.getPlanById(planId: string)`

**Query Details:**
- **Table:** `membership_plans`
- **Columns:** `*` (all columns)
- **Filters:** `eq("id", planId)`
- **Return Type:** Single record
- **Query:** `supabaseServer.from("membership_plans").select("*").eq("id", planId).single()`

**Migration Status:** ✅ EXISTS
- **Migration File:** `20260610_phase8e_memberships.sql` (lines 6-16)

**Table Schema:**
```sql
create table if not exists membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  monthly_price numeric not null default 0,
  yearly_price numeric not null default 0,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
```

**Missing Columns:** None
**Missing Indexes:** None (has `idx_membership_plans_slug` in migration)
**RLS Policy:** ✅ EXISTS - "Public can view membership plans" and "Admins can manage membership plans"

---

## All Required Tables by Feature Area

### Research Feature
| Table | Status | Migration File |
|-------|--------|----------------|
| `research_papers` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `research_datasets` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `research_projects` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `certifications` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `exams` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `assessments` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `badges` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `user_badges` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |

### Marketplace Feature
| Table | Status | Migration File |
|-------|--------|----------------|
| `marketplace_items` | ✅ EXISTS | `20260620_phase9c_marketplace.sql` |
| `marketplace_categories` | ✅ EXISTS | `20260620_phase9c_marketplace.sql` |
| `marketplace_orders` | ✅ EXISTS | `20260620_phase9c_marketplace.sql` |

### Memberships Feature
| Table | Status | Migration File |
|-------|--------|----------------|
| `membership_plans` | ✅ EXISTS | `20260610_phase8e_memberships.sql` |
| `user_subscriptions` | ✅ EXISTS | `20260610_phase8e_memberships.sql` |
| `feature_access` | ✅ EXISTS | `20260610_phase8e_memberships.sql` |

### Profile Feature
| Table | Status | Migration File |
|-------|--------|----------------|
| `profiles` | ⚠️ NEEDS VERIFICATION | Likely in base schema |

### Products Feature
| Table | Status | Migration File |
|-------|--------|----------------|
| `products` | ✅ EXISTS | `20260615_phase9a_products.sql` |
| `product_features` | ✅ EXISTS | `20260615_phase9a_products.sql` |
| `product_screenshots` | ✅ EXISTS | `20260615_phase9a_products.sql` |

### Projects Feature
| Table | Status | Migration File |
|-------|--------|----------------|
| `projects` | ✅ EXISTS | `20260602_phase4_admin.sql` |

### Courses/Learning Feature
| Table | Status | Migration File |
|-------|--------|----------------|
| `courses` | ✅ EXISTS | `20260605_phase8c_learning_platform.sql` |
| `course_modules` | ✅ EXISTS | `20260605_phase8c_learning_platform.sql` |
| `user_course_progress` | ✅ EXISTS | `20260605_phase8c_learning_platform.sql` |

### Innovation/Startup Feature
| Table | Status | Migration File |
|-------|--------|----------------|
| `startups` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `innovation_projects` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `mentorship_programs` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `founders` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `investors` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `pitch_decks` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `funding_rounds` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |

### Community Feature
| Table | Status | Migration File |
|-------|--------|----------------|
| `community_chapters` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |
| `community_events` | ✅ EXISTS | `20260701_phase10_ecosystem.sql` |

---

## Root Cause Analysis

**HYPOTHESIS:** The migrations exist in the codebase but have NOT been applied to the production Supabase database.

**Evidence:**
1. Both failing tables are properly defined in migration files
2. Table schemas match repository queries exactly
3. RLS policies are defined
4. Indexes are created
5. No missing columns detected

**Likely Scenarios:**
1. **Migration not applied:** The `20260701_phase10_ecosystem.sql` migration (containing `research_datasets`) may not have been run on production
2. **Migration not applied:** The `20260610_phase8e_memberships.sql` migration (containing `membership_plans`) may not have been run on production
3. **Partial migration state:** Some migrations were applied but not all
4. **Database reset:** Production database was reset after migrations were applied

---

## SQL Verification Queries

Run these queries in Supabase SQL Editor to verify table existence:

```sql
-- Verify research_datasets table
SELECT * FROM research_datasets LIMIT 1;

-- Verify membership_plans table
SELECT * FROM membership_plans LIMIT 1;

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('research_datasets', 'membership_plans')
ORDER BY table_name;

-- Check migration status (if migration tracking is enabled)
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC LIMIT 10;
```

---

## Minimal Migration Plan

### Step 1: Verify Current Database State
Run the SQL verification queries above to confirm which tables are missing.

### Step 2: Apply Missing Migrations (In Order)

If tables are missing, apply migrations in this order:

1. **Base migrations** (if not already applied):
   - `20260602_phase4_admin.sql`
   - `20260604_phase7_ai_features.sql`
   - `20260605_phase7b_vector_search.sql`

2. **Phase 8 migrations**:
   - `20260605_phase8c_learning_platform.sql`
   - `20260606_phase8_profiles_and_saved_content.sql`
   - `20260608_phase8b_community.sql`
   - `20260610_phase8e_memberships.sql` ⚠️ **CRITICAL for membership_plans**

3. **Phase 9 migrations**:
   - `20260605_phase9_products.sql`
   - `20260615_phase9a_products.sql`
   - `20260620_phase9b_saas_infrastructure.sql`
   - `20260620_phase9c_marketplace.sql`
   - `20260620_phase9d_payments.sql`

4. **Phase 10 migrations**:
   - `20260701_phase10_ecosystem.sql` ⚠️ **CRITICAL for research_datasets**

5. **Consolidated fixes**:
   - `20260606_consolidated_critical_fixes.sql`

### Step 3: Verify Application
After applying migrations, run the verification queries again to confirm tables exist.

### Step 4: Test Application
- Access Research page: `/research`
- Access Membership checkout: `/memberships/checkout`
- Verify no DatabaseError is thrown

---

## Recommendations

1. **DO NOT generate new migrations** - The required migrations already exist
2. **Apply existing migrations to production** - Use Supabase dashboard or CLI
3. **Verify migration tracking** - Ensure `supabase_migrations.schema_migrations` table is being updated
4. **Set up migration automation** - Consider using Supabase CLI or GitHub Actions for automatic migration deployment
5. **Add migration status monitoring** - Create a health check endpoint that verifies critical tables exist

---

## Next Actions

1. Run SQL verification queries in production Supabase
2. Identify which specific migrations are missing
3. Apply missing migrations in the order specified above
4. Test the failing endpoints
5. Monitor for any additional schema errors
