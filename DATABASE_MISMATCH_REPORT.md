# Database Mismatch Report
**Generated:** June 6, 2026
**Investigation:** HTTP 500 errors on /research and /marketplace

## Executive Summary

The application is experiencing HTTP 500 errors on `/research` and `/marketplace` routes due to missing database tables. The base `schema.sql` file contains only basic CMS tables, while the application code expects tables defined in migration files that have not been applied to the database.

## Error Stack Traces

### /research Error
```
Error [DatabaseError]: An unexpected database error occurred.
at handleDatabaseError (src/lib/errors.ts:31:10)
at Object.getResearchPapers (src/lib/repositories/ecosystem.repository.ts:18:41)
at async ResearchPage (src/app/research/page.tsx:9:30)
```
**Root Cause:** Missing `research_papers` table

### /marketplace Error
```
Error: {code: ..., details: Null, hint: Null, message: ...}
at Object.getCategories (src/lib/repositories/marketplace.repository.ts:34:91)
at async MarketplacePage (src/app/marketplace/page.tsx:29:122)
```
**Root Cause:** Missing `marketplace_categories` table

## Missing Tables

### Critical (Causing Current 500 Errors)

1. **research_papers** - Required by `/research` page
   - Defined in: `20260701_phase10_ecosystem.sql`
   - Columns: id, title, slug, abstract, content, authors[], division, tags[], published_at, is_featured, created_at, updated_at

2. **research_datasets** - Required by `/research` page
   - Defined in: `20260701_phase10_ecosystem.sql`
   - Columns: id, title, slug, description, download_url, size, format, license, created_at

3. **marketplace_categories** - Required by `/marketplace` page
   - Defined in: `20260620_phase9c_marketplace.sql`
   - Columns: id, name, slug, created_at

4. **marketplace_items** - Required by `/marketplace` page
   - Defined in: `20260620_phase9c_marketplace.sql`
   - Columns: id, title, slug, description, category_id, price, currency, featured, published, seller_id, preview_image, download_url, views_count, downloads_count, sales_count, revenue, created_at, updated_at

### High Priority (Expected by Other Routes)

5. **marketplace_orders** - Required by marketplace functionality
   - Defined in: `20260620_phase9c_marketplace.sql`

6. **community_chapters** - Required by community routes
   - Defined in: `20260701_phase10_ecosystem.sql`

7. **community_events** - Required by community routes
   - Defined in: `20260701_phase10_ecosystem.sql`

8. **community_posts** - Required by community functionality
   - Defined in: `20260608_phase8b_community.sql`

9. **community_replies** - Required by community functionality
   - Defined in: `20260608_phase8b_community.sql`

10. **community_votes** - Required by community functionality
    - Defined in: `20260608_phase8b_community.sql`

### Medium Priority (Additional Features)

11. **certifications** - Learning platform
    - Defined in: `20260701_phase10_ecosystem.sql`

12. **exams** - Learning platform
    - Defined in: `20260701_phase10_ecosystem.sql`

13. **assessments** - Learning platform
    - Defined in: `20260701_phase10_ecosystem.sql`

14. **badges** - Learning platform
    - Defined in: `20260701_phase10_ecosystem.sql`

15. **user_badges** - Learning platform
    - Defined in: `20260701_phase10_ecosystem.sql`

16. **courses** - Learning platform
    - Defined in: `20260605_phase8c_learning_platform.sql`

17. **course_modules** - Learning platform
    - Defined in: `20260605_phase8c_learning_platform.sql`

18. **labs** - Learning platform
    - Defined in: `20260605_phase8c_learning_platform.sql`

19. **roadmaps** - Learning platform
    - Defined in: `20260605_phase8c_learning_platform.sql`

20. **user_course_progress** - Learning platform
    - Defined in: `20260605_phase8c_learning_platform.sql`

### AI & Automation Features

21. **ai_conversations** - AI chat functionality
    - Defined in: `20260604_phase7_ai_features.sql`

22. **ai_messages** - AI chat functionality
    - Defined in: `20260604_phase7_ai_features.sql`

23. **ai_knowledge_base** - AI knowledge base
    - Defined in: `20260604_phase7_ai_features.sql`

24. **ai_embeddings** - Vector search
    - Defined in: `20260604_phase7_ai_features.sql`

25. **content_embeddings** - Vector search
    - Defined in: `20260605_phase7b_vector_search.sql`

26. **automation_workflows** - Automation
    - Defined in: `20260604_phase7_ai_features.sql`

27. **automation_runs** - Automation
    - Defined in: `20260604_phase7_ai_features.sql`

28. **ai_generations** - AI automation
    - Defined in: `20260605_phase7d_ai_automation.sql`

29. **ai_reports** - AI automation
    - Defined in: `20260605_phase7d_ai_automation.sql`

30. **ai_jobs** - AI automation
    - Defined in: `20260605_phase7d_ai_automation.sql`

31. **ai_predictions** - AI analytics
    - Defined in: `20260604_phase7_ai_features.sql`

32. **ai_analytics_events** - AI analytics
    - Defined in: `20260604_phase7_ai_features.sql`

33. **recruiter_profiles** - Recruiter assistant
    - Defined in: `20260604_phase7_ai_features.sql`

34. **recruiter_interactions** - Recruiter assistant
    - Defined in: `20260604_phase7_ai_features.sql`

35. **ai_settings** - AI configuration
    - Defined in: `20260604_phase7_ai_features.sql`

### Innovation & Ecosystem

36. **startups** - Innovation hub
    - Defined in: `20260701_phase10_ecosystem.sql`

37. **innovation_projects** - Innovation hub
    - Defined in: `20260701_phase10_ecosystem.sql`

38. **mentorship_programs** - Innovation hub
    - Defined in: `20260701_phase10_ecosystem.sql`

39. **founders** - Venture studio
    - Defined in: `20260701_phase10_ecosystem.sql`

40. **investors** - Venture studio
    - Defined in: `20260701_phase10_ecosystem.sql`

41. **pitch_decks** - Venture studio
    - Defined in: `20260701_phase10_ecosystem.sql`

42. **funding_rounds** - Venture studio
    - Defined in: `20260701_phase10_ecosystem.sql`

### Products & Marketplace

43. **products** - Product hub
    - Defined in: `20260605_phase9_products.sql` and `20260615_phase9a_products.sql`

44. **product_features** - Product hub
    - Defined in: `20260605_phase9_products.sql` and `20260615_phase9a_products.sql`

45. **product_screenshots** - Product hub
    - Defined in: `20260615_phase9a_products.sql`

### Memberships & Subscriptions

46. **membership_plans** - Membership system
    - Defined in: `20260610_phase8e_memberships.sql`

47. **user_subscriptions** - Membership system
    - Defined in: `20260610_phase8e_memberships.sql`

48. **feature_access** - Membership system
    - Defined in: `20260610_phase8e_memberships.sql`

49. **subscription_plans** - Payment system
    - Defined in: `20260620_phase9d_payments.sql`

50. **subscriptions** - Payment system
    - Defined in: `20260620_phase9d_payments.sql`

51. **transactions** - Payment system
    - Defined in: `20260620_phase9d_payments.sql`

52. **payment_events** - Payment system
    - Defined in: `20260620_phase9d_payments.sql`

53. **invoices** - Payment system
    - Defined in: `20260620_phase9d_payments.sql`

54. **orders** - Payment system
    - Defined in: `20260620_phase9d_payments.sql`

55. **order_items** - Payment system
    - Defined in: `20260620_phase9d_payments.sql`

### SaaS Infrastructure

56. **organizations** - Multi-tenant SaaS
    - Defined in: `20260620_phase9b_saas_infrastructure.sql`

57. **workspaces** - Multi-tenant SaaS
    - Defined in: `20260620_phase9b_saas_infrastructure.sql`

58. **organization_members** - Multi-tenant SaaS
    - Defined in: `20260620_phase9b_saas_infrastructure.sql`

59. **workspace_members** - Multi-tenant SaaS
    - Defined in: `20260620_phase9b_saas_infrastructure.sql`

### Analytics & Behavior

60. **user_behavior** - Analytics
    - Defined in: `20260701_phase10_ecosystem.sql`

61. **analytics_events** - Analytics
    - Defined in: `20260701_phase10_ecosystem.sql`

62. **recommendations** - Analytics
    - Defined in: `20260701_phase10_ecosystem.sql`

## Missing Functions

### RPC Functions

1. **increment_marketplace_sales** - Marketplace sales tracking
   - Defined in: `20260620_phase9c_marketplace.sql`

2. **increment_marketplace_views** - Marketplace view tracking
   - Defined in: `20260620_phase9c_marketplace.sql`

3. **search_content_embeddings** - Vector search
   - Defined in: `20260605_phase7b_vector_search.sql`

4. **search_similar_content** - Vector search
   - Defined in: `20260604_phase7_ai_features.sql`

5. **refresh_ai_knowledge_base** - AI knowledge base refresh
   - Defined in: `20260604_phase7_ai_features.sql`

6. **increment_post_upvote_count** - Community voting
   - Defined in: `20260608_phase8b_community.sql`

7. **decrement_post_upvote_count** - Community voting
   - Defined in: `20260608_phase8b_community.sql`

8. **get_user_organizations** - Multi-tenant SaaS
   - Defined in: `20260620_phase9b_saas_infrastructure.sql`

9. **update_updated_at_column** - Timestamp trigger
   - Defined in: `20260615_phase9a_products.sql`

### Helper Functions

10. **is_admin** - Admin check
    - Defined in: `20260602_phase4_admin.sql`

## Missing Extensions

1. **vector** - pgvector extension for vector similarity search
   - Required by: `20260605_phase7b_vector_search.sql`
   - Note: Requires admin privileges to enable

2. **pgcrypto** - Cryptographic functions
   - Required by: Multiple migrations
   - Note: Already in schema.sql

## Missing RLS Policies

All tables defined in migrations have RLS policies that need to be applied. The base schema.sql only has policies for the basic tables.

## Missing Indexes

Each migration file includes performance indexes that need to be created. Key indexes include:

- Vector similarity indexes for embeddings
- Foreign key indexes for joins
- Composite indexes for common query patterns
- GIN indexes for array columns (tags, etc.)

## Missing Triggers

1. **update_products_updated_at** - Auto-update timestamp
   - Defined in: `20260615_phase9a_products.sql`

2. **update_organizations_updated_at** - Auto-update timestamp
   - Defined in: `20260620_phase9b_saas_infrastructure.sql`

3. **update_workspaces_updated_at** - Auto-update timestamp
   - Defined in: `20260620_phase9b_saas_infrastructure.sql`

4. **update_subscription_plans_updated_at** - Auto-update timestamp
   - Defined in: `20260620_phase9d_payments.sql`

5. **update_subscriptions_updated_at** - Auto-update timestamp
   - Defined in: `20260620_phase9d_payments.sql`

## Missing Storage Buckets

The following storage buckets are referenced but may not be created:

1. **projects** - Project images/files
2. **blog** - Blog images
3. **experiments** - Experiment files
4. **uploads** - General uploads

## Migration Status

| Migration File | Status | Tables Affected |
|----------------|--------|-----------------|
| 20260602_phase4_admin.sql | Unknown | Alters existing tables, adds policies |
| 20260604_phase7_ai_features.sql | Not Applied | 11 AI-related tables |
| 20260605_phase7b_vector_search.sql | Not Applied | 1 table + vector extension |
| 20260605_phase7d_ai_automation.sql | Not Applied | 3 AI automation tables |
| 20260605_phase8c_learning_platform.sql | Not Applied | 5 learning platform tables |
| 20260605_phase9_products.sql | Not Applied | 2 product tables |
| 20260606_phase8_profiles_and_saved_content.sql | In Schema.sql | 2 tables (already exist) |
| 20260608_phase8b_community.sql | Not Applied | 3 community tables |
| 20260610_phase8e_memberships.sql | Not Applied | 3 membership tables |
| 20260615_phase9a_products.sql | Not Applied | 3 product tables (enhanced) |
| 20260620_phase9b_saas_infrastructure.sql | Not Applied | 4 SaaS tables |
| 20260620_phase9c_marketplace.sql | Not Applied | 3 marketplace tables |
| 20260620_phase9d_payments.sql | Not Applied | 7 payment tables |
| 20260701_phase10_ecosystem.sql | Not Applied | 18 ecosystem tables |

## Recommendations

### Immediate Actions (Critical)

1. **Apply Critical Migrations First**
   - `20260620_phase9c_marketplace.sql` - Fix /marketplace 500 error
   - `20260701_phase10_ecosystem.sql` - Fix /research 500 error

2. **Apply Community Migrations**
   - `20260608_phase8b_community.sql` - Fix /community routes

3. **Apply Product Migrations**
   - `20260615_phase9a_products.sql` - Fix /products routes

### Secondary Actions (Feature Complete)

4. Apply remaining migrations in order:
   - AI features (if AI functionality is needed)
   - Learning platform (if learning features are needed)
   - Membership system (if subscriptions are needed)
   - Payment system (if payments are needed)
   - SaaS infrastructure (if multi-tenancy is needed)

### Database Administration

5. **Enable pgvector Extension**
   - Contact Supabase support or use SQL editor with admin privileges
   - Required for vector search functionality

6. **Create Storage Buckets**
   - Create buckets in Supabase storage dashboard
   - Configure appropriate RLS policies

7. **Verify RLS Policies**
   - Ensure all policies are correctly applied
   - Test with authenticated and anonymous users

## Next Steps

1. Create consolidated migration script for critical tables
2. Apply migrations to local/development database
3. Test /research and /marketplace routes
4. Apply remaining migrations based on feature requirements
5. Update schema.sql to reflect complete database structure
6. Document migration process for production deployment
