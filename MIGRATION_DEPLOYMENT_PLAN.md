# Migration Deployment Plan

## Executive Summary

This plan outlines the safe deployment of missing database migrations to production Supabase. The production environment currently contains only the original 6 tables, while local migrations contain 15 migration files with additional schema changes.

**Critical Missing Tables:**
- membership_plans
- research_datasets
- profiles
- saved_content
- community_posts
- marketplace_items
- subscription_plans
- ai_conversations
- ai_jobs

## Migration File Analysis

### Migration Files Found (15 total)

1. **20260602_phase4_admin.sql** - Admin features, RLS policies on existing tables
2. **20260604_phase7_ai_features.sql** - AI features (11 tables)
3. **20260605_phase7b_vector_search.sql** - Vector search (1 table + extension)
4. **20260605_phase7d_ai_automation.sql** - AI automation (3 tables)
5. **20260605_phase8c_learning_platform.sql** - Learning platform (5 tables)
6. **20260605_phase9_products.sql** - Products (2 tables)
7. **20260606_consolidated_critical_fixes.sql** - Consolidated fixes (25+ tables)
8. **20260606_phase8_profiles_and_saved_content.sql** - Profiles (2 tables)
9. **20260608_phase8b_community.sql** - Community (3 tables)
10. **20260610_phase8e_memberships.sql** - Memberships (3 tables)
11. **20260615_phase9a_products.sql** - Products again (3 tables)
12. **20260620_phase9b_saas_infrastructure.sql** - SaaS infrastructure (4 tables)
13. **20260620_phase9c_marketplace.sql** - Marketplace (3 tables)
14. **20260620_phase9d_payments.sql** - Payments (8 tables)
15. **20260701_phase10_ecosystem.sql** - Ecosystem (20+ tables)

### Idempotency Verification

**Good:** All migrations use `CREATE TABLE IF NOT EXISTS` for tables
**Issue:** Most migrations do NOT use `DROP POLICY IF EXISTS` before `CREATE POLICY`
**Solution:** The deployment SQL will include `DROP POLICY IF EXISTS` before each policy creation

## Dependency Order

### Phase 1: Foundation (No Dependencies)
1. **Extensions** - pgcrypto, uuid-ossp, vector
2. **Profiles** - profiles (core user profile table)
3. **Saved Content** - saved_content (depends on profiles)

### Phase 2: Core Features (Depend on Profiles)
4. **Community** - community_posts, community_replies, community_votes (depend on profiles)
5. **Memberships** - membership_plans, user_subscriptions, feature_access (depend on profiles)
6. **AI Features** - ai_conversations, ai_messages, ai_knowledge_base, ai_embeddings, automation_workflows, automation_runs, ai_predictions, ai_analytics_events, recruiter_profiles, recruiter_interactions, ai_settings
7. **AI Automation** - ai_generations, ai_reports, ai_jobs
8. **Vector Search** - content_embeddings (depends on vector extension)

### Phase 3: Content & Learning (Depend on Profiles)
9. **Learning Platform** - courses, course_modules, labs, roadmaps, user_course_progress (depend on profiles)
10. **Products** - products, product_features, product_screenshots
11. **Research** - research_papers, research_datasets, research_projects
12. **Certifications** - certifications, exams, assessments, badges, user_badges

### Phase 4: Marketplace & Payments (Depend on Core)
13. **Marketplace** - marketplace_categories, marketplace_items, marketplace_orders
14. **Payments** - subscription_plans, subscriptions, transactions, payment_events, invoices, orders, order_items

### Phase 5: Advanced Features (Depend on Multiple)
15. **SaaS Infrastructure** - organizations, workspaces, organization_members, workspace_members (adds organization_id to existing tables)
16. **Ecosystem** - startups, innovation_projects, mentorship_programs, founders, investors, pitch_decks, funding_rounds, community_chapters, community_events, user_behavior, analytics_events, recommendations

## Tables Created by Migration

### Foundation Tables
- **profiles** - User profiles (id, email, full_name, avatar_url, bio, github_url, linkedin_url, website_url)
- **saved_content** - User saved content (id, user_id, content_type, content_id)

### Community Tables
- **community_posts** - Community posts (id, user_id, title, slug, content, category, tags, views, upvotes)
- **community_replies** - Post replies (id, post_id, user_id, content)
- **community_votes** - Post votes (id, post_id, user_id, vote_type)
- **community_chapters** - Local chapters (id, name, country, city, lead_id, member_count)
- **community_events** - Chapter events (id, chapter_id, title, description, event_type, location, start_time, end_time)

### Membership Tables
- **membership_plans** - Membership plans (id, name, slug, description, monthly_price, yearly_price, features, active)
- **user_subscriptions** - User subscriptions (id, user_id, plan_id, status, billing_cycle, start_date, end_date)
- **feature_access** - Feature access mapping (id, plan_id, feature_key, enabled)

### AI Tables
- **ai_conversations** - AI chat conversations (id, user_id, anonymous_session_id, title, topic, metadata)
- **ai_messages** - AI conversation messages (id, conversation_id, role, content, tokens_used, model)
- **ai_knowledge_base** - AI knowledge base (id, source_type, source_id, content, metadata_obj)
- **ai_embeddings** - Vector embeddings (id, source_type, source_id, content_id, embedding, model)
- **ai_generations** - AI generations (id, generation_type, prompt, output, metadata, tokens_used, status)
- **ai_reports** - AI reports (id, report_type, content, generated_at)
- **ai_jobs** - AI jobs (id, job_type, status, started_at, completed_at, metadata)
- **automation_workflows** - Automation workflows (id, name, description, workflow_type, is_active, schedule)
- **automation_runs** - Automation runs (id, workflow_id, status, input_data, output_data, error_message)
- **ai_predictions** - AI predictions (id, prediction_type, subject, predicted_values, confidence_score)
- **ai_analytics_events** - AI analytics events (id, event_type, visitor_id, user_id, session_id, event_data)
- **recruiter_profiles** - Recruiter profiles (id, user_id, company_name, job_title, email, phone, focus_areas)
- **recruiter_interactions** - Recruiter interactions (id, recruiter_id, interaction_type, interaction_data)
- **ai_settings** - AI settings (id, ai_enabled, chat_enabled, search_enabled, default_model, temperature)
- **content_embeddings** - Content embeddings for vector search (id, content_type, content_id, title, chunk, embedding)

### Learning Platform Tables
- **courses** - Courses (id, title, slug, description, content, category, difficulty, duration, thumbnail, published)
- **course_modules** - Course modules (id, course_id, title, content, order_index)
- **labs** - Labs (id, title, slug, description, instructions, difficulty, category, published)
- **roadmaps** - Roadmaps (id, title, slug, description, category, content, published)
- **user_course_progress** - User course progress (id, user_id, course_id, progress_percentage, completed)

### Product Tables
- **products** - Products (id, title, slug, description, overview, category, pricing_type, pricing_details, featured, published, demo_url, documentation_url, cover_image, screenshots)
- **product_features** - Product features (id, product_id, title, description)
- **product_screenshots** - Product screenshots (id, product_id, image_url, sort_order)

### Research Tables
- **research_papers** - Research papers (id, title, slug, abstract, content, authors, division, tags, published_at, is_featured)
- **research_datasets** - Research datasets (id, title, slug, description, download_url, size, format, license)
- **research_projects** - Research projects (id, title, slug, description, status, division)

### Certification Tables
- **certifications** - Certifications (id, title, slug, description, topic, level, image_url)
- **exams** - Exams (id, certification_id, title, questions, passing_score, duration_minutes)
- **assessments** - Assessments (id, user_id, exam_id, score, passed, completed_at)
- **badges** - Badges (id, name, description, icon_url, criteria)
- **user_badges** - User badges (id, user_id, badge_id, awarded_at)

### Marketplace Tables
- **marketplace_categories** - Marketplace categories (id, name, slug)
- **marketplace_items** - Marketplace items (id, title, slug, description, category_id, price, currency, featured, published, seller_id, preview_image, download_url, views_count, downloads_count, sales_count, revenue)
- **marketplace_orders** - Marketplace orders (id, user_id, item_id, status, amount, currency)

### Payment Tables
- **subscription_plans** - Subscription plans (id, name, slug, description, monthly_price, yearly_price, features, active)
- **subscriptions** - Subscriptions (id, user_id, plan_id, provider, provider_subscription_id, status, current_period_start, current_period_end, cancel_at_period_end)
- **transactions** - Transactions (id, user_id, amount, currency, provider, provider_transaction_id, status, type, metadata)
- **payment_events** - Payment events (id, provider, event_type, payload, processed)
- **invoices** - Invoices (id, user_id, transaction_id, invoice_number, pdf_url, amount, currency, status)
- **orders** - Orders (id, user_id, total_amount, currency, status, transaction_id)
- **order_items** - Order items (id, order_id, item_type, item_id, amount)

### SaaS Infrastructure Tables
- **organizations** - Organizations (id, name, slug, logo_url, billing_email)
- **workspaces** - Workspaces (id, organization_id, name, slug)
- **organization_members** - Organization members (id, organization_id, user_id, role)
- **workspace_members** - Workspace members (id, workspace_id, user_id)

### Ecosystem Tables
- **startups** - Startups (id, name, slug, description, logo_url, website_url, founder_id, stage)
- **innovation_projects** - Innovation projects (id, title, description, challenge_id, team_members)
- **mentorship_programs** - Mentorship programs (id, title, description, mentor_id, max_mentees)
- **founders** - Founders (id, bio, expertise, linked_in)
- **investors** - Investors (id, firm_name, investment_focus, ticket_size_min, ticket_size_max)
- **pitch_decks** - Pitch decks (id, startup_id, file_url, version)
- **funding_rounds** - Funding rounds (id, startup_id, round_type, amount, closed_at)
- **user_behavior** - User behavior (id, user_id, action_type, entity_type, entity_id, metadata)
- **analytics_events** - Analytics events (id, event_name, properties, user_id, session_id)
- **recommendations** - Recommendations (id, user_id, recommended_entity_type, recommended_entity_id, score, reason)

## Foreign Key Dependencies

### profiles (Foundation)
- saved_content.user_id → profiles.id
- community_posts.user_id → profiles.id
- community_replies.user_id → profiles.id
- community_votes.user_id → profiles.id
- user_subscriptions.user_id → profiles.id
- user_course_progress.user_id → profiles.id

### auth.users (Supabase Auth)
- ai_conversations.user_id → auth.users.id
- recruiter_profiles.user_id → auth.users.id
- automation_workflows.created_by → auth.users.id
- ai_analytics_events.user_id → auth.users.id
- marketplace_items.seller_id → auth.users.id
- marketplace_orders.user_id → auth.users.id
- subscriptions.user_id → auth.users.id
- transactions.user_id → auth.users.id
- invoices.user_id → auth.users.id
- orders.user_id → auth.users.id
- assessments.user_id → auth.users.id
- user_badges.user_id → auth.users.id
- startups.founder_id → auth.users.id
- organization_members.user_id → auth.users.id
- workspace_members.user_id → auth.users.id
- user_behavior.user_id → auth.users.id
- founders.id → auth.users.id
- investors.id → auth.users.id

### Internal Dependencies
- ai_messages.conversation_id → ai_conversations.id
- ai_embeddings.content_id → ai_knowledge_base.id
- automation_runs.workflow_id → automation_workflows.id
- recruiter_interactions.recruiter_id → recruiter_profiles.id
- course_modules.course_id → courses.id
- user_course_progress.course_id → courses.id
- product_features.product_id → products.id
- product_screenshots.product_id → products.id
- marketplace_items.category_id → marketplace_categories.id
- marketplace_orders.item_id → marketplace_items.id
- subscriptions.plan_id → subscription_plans.id
- transactions.transaction_id → invoices.id
- orders.transaction_id → transactions.id
- order_items.order_id → orders.id
- workspaces.organization_id → organizations.id
- organization_members.organization_id → organizations.id
- workspace_members.workspace_id → workspaces.id
- exams.certification_id → certifications.id
- assessments.exam_id → exams.id
- user_badges.badge_id → badges.id
- pitch_decks.startup_id → startups.id
- funding_rounds.startup_id → startups.id
- community_events.chapter_id → community_chapters.id
- community_replies.post_id → community_posts.id
- community_votes.post_id → community_posts.id
- user_subscriptions.plan_id → membership_plans
- feature_access.plan_id → membership_plans

## RLS Dependencies

### Tables Requiring RLS
All new tables require Row Level Security (RLS) to be enabled.

### RLS Policy Dependencies
- **public.is_admin()** function must exist (created in phase4_admin migration)
- **auth.uid()** function (Supabase built-in)
- **auth.role()** function (Supabase built-in)
- **auth.jwt()** function (Supabase built-in)

### Critical RLS Functions
- `public.is_admin()` - Checks if user has admin role
- `public.get_user_organizations()` - Returns user's organization IDs (for SaaS infrastructure)

## Deployment Strategy

### Approach
1. **Consolidated Deployment**: Create a single SUPABASE_DEPLOY.sql file that combines all necessary schema changes
2. **Idempotent Operations**: Use `IF NOT EXISTS` for all CREATE statements
3. **Policy Safety**: Use `DROP POLICY IF EXISTS` before each CREATE POLICY
4. **Safe Execution**: Order operations by dependency to prevent foreign key errors
5. **Non-Destructive**: Only ADD columns to existing tables, never DROP or MODIFY existing columns

### Execution Order in SUPABASE_DEPLOY.sql
1. Extensions (pgcrypto, uuid-ossp, vector)
2. Foundation tables (profiles, saved_content)
3. Core feature tables (community, memberships, AI features)
4. Content & learning tables (courses, products, research)
5. Marketplace & payment tables
6. Advanced feature tables (SaaS infrastructure, ecosystem)
7. Indexes (all indexes with IF NOT EXISTS)
8. RLS policies (with DROP IF EXISTS)
9. Functions and triggers
10. Seed data (with ON CONFLICT DO NOTHING)

## Post-Deployment Verification

### Required Tables to Verify
- membership_plans ✓
- research_datasets ✓
- profiles ✓
- saved_content ✓
- community_posts ✓
- marketplace_items ✓
- subscription_plans ✓
- ai_conversations ✓
- ai_jobs ✓

### Verification Queries
See POST_DEPLOYMENT_VERIFICATION.sql for complete verification queries.

## Risk Mitigation

### Potential Issues
1. **Policy Conflicts**: Existing policies may conflict with new policies
   - **Mitigation**: Use `DROP POLICY IF EXISTS` before creating policies
2. **Extension Permissions**: pgvector extension may require admin privileges
   - **Mitigation**: Run extension creation separately with admin access
3. **Foreign Key Errors**: Tables created in wrong order
   - **Mitigation**: Strict dependency ordering in deployment SQL
4. **Data Loss**: ALTER TABLE operations on existing tables
   - **Mitigation**: Only use ADD COLUMN IF NOT EXISTS, never DROP or MODIFY

### Rollback Plan
1. Keep backup of production database before deployment
2. Each migration is reversible (DROP TABLE IF EXISTS)
3. RLS policies can be dropped individually
4. Extensions can be dropped if needed

## Summary

This deployment plan ensures safe, idempotent deployment of all missing database migrations to production Supabase. The consolidated SUPABASE_DEPLOY.sql file will:
- Create 50+ new tables
- Add RLS policies for security
- Create indexes for performance
- Add necessary functions and triggers
- Seed initial data where required
- Maintain existing data integrity
- Be fully idempotent for safe re-execution
