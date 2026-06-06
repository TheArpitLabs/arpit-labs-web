-- ============================================================================
-- POST-DEPLOYMENT VERIFICATION QUERIES
-- Run these queries after deploying SUPABASE_DEPLOY.sql to verify success
-- ============================================================================

-- ============================================================================
-- 1. CRITICAL TABLE VERIFICATION
-- These are the tables that were confirmed missing in production
-- ============================================================================

-- Check if membership_plans table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'membership_plans'
  ) as membership_plans_exists;

-- Check if research_datasets table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'research_datasets'
  ) as research_datasets_exists;

-- Check if profiles table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) as profiles_exists;

-- Check if saved_content table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saved_content'
  ) as saved_content_exists;

-- Check if community_posts table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts'
  ) as community_posts_exists;

-- Check if marketplace_items table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'marketplace_items'
  ) as marketplace_items_exists;

-- Check if subscription_plans table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_plans'
  ) as subscription_plans_exists;

-- Check if ai_conversations table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_conversations'
  ) as ai_conversations_exists;

-- Check if ai_jobs table exists
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ai_jobs'
  ) as ai_jobs_exists;

-- ============================================================================
-- 2. COMPREHENSIVE TABLE VERIFICATION
-- Check all tables that should have been created
-- ============================================================================

-- Foundation tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('profiles'),
  ('saved_content')
) AS t(table_name)
ORDER BY table_name;

-- Community tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('community_posts'),
  ('community_replies'),
  ('community_votes'),
  ('community_chapters'),
  ('community_events')
) AS t(table_name)
ORDER BY table_name;

-- Membership tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('membership_plans'),
  ('user_subscriptions'),
  ('feature_access')
) AS t(table_name)
ORDER BY table_name;

-- AI tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('ai_conversations'),
  ('ai_messages'),
  ('ai_knowledge_base'),
  ('ai_embeddings'),
  ('ai_generations'),
  ('ai_reports'),
  ('ai_jobs'),
  ('automation_workflows'),
  ('automation_runs'),
  ('ai_predictions'),
  ('ai_analytics_events'),
  ('recruiter_profiles'),
  ('recruiter_interactions'),
  ('ai_settings'),
  ('content_embeddings')
) AS t(table_name)
ORDER BY table_name;

-- Learning platform tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('courses'),
  ('course_modules'),
  ('labs'),
  ('roadmaps'),
  ('user_course_progress')
) AS t(table_name)
ORDER BY table_name;

-- Product tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('products'),
  ('product_features'),
  ('product_screenshots')
) AS t(table_name)
ORDER BY table_name;

-- Research tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('research_papers'),
  ('research_datasets'),
  ('research_projects')
) AS t(table_name)
ORDER BY table_name;

-- Certification tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('certifications'),
  ('exams'),
  ('assessments'),
  ('badges'),
  ('user_badges')
) AS t(table_name)
ORDER BY table_name;

-- Marketplace tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('marketplace_categories'),
  ('marketplace_items'),
  ('marketplace_orders')
) AS t(table_name)
ORDER BY table_name;

-- Payment tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('subscription_plans'),
  ('subscriptions'),
  ('transactions'),
  ('payment_events'),
  ('invoices'),
  ('orders'),
  ('order_items')
) AS t(table_name)
ORDER BY table_name;

-- SaaS infrastructure tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('organizations'),
  ('workspaces'),
  ('organization_members'),
  ('workspace_members')
) AS t(table_name)
ORDER BY table_name;

-- Ecosystem tables
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t.table_name
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (VALUES 
  ('startups'),
  ('innovation_projects'),
  ('mentorship_programs'),
  ('founders'),
  ('investors'),
  ('pitch_decks'),
  ('funding_rounds'),
  ('user_behavior'),
  ('analytics_events'),
  ('recommendations')
) AS t(table_name)
ORDER BY table_name;

-- ============================================================================
-- 3. RLS POLICY VERIFICATION
-- Check that RLS is enabled on critical tables
-- ============================================================================

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'profiles',
  'saved_content',
  'community_posts',
  'membership_plans',
  'ai_conversations',
  'courses',
  'products',
  'research_datasets',
  'marketplace_items',
  'subscription_plans'
)
ORDER BY tablename;

-- ============================================================================
-- 4. INDEX VERIFICATION
-- Check that critical indexes exist
-- ============================================================================

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'membership_plans',
  'research_datasets',
  'profiles',
  'community_posts',
  'marketplace_items',
  'ai_conversations',
  'ai_jobs'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- 5. FOREIGN KEY VERIFICATION
-- Check that foreign key constraints exist
-- ============================================================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN (
  'saved_content',
  'community_posts',
  'user_subscriptions',
  'ai_conversations',
  'course_modules',
  'user_course_progress',
  'marketplace_items',
  'subscriptions'
)
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 6. FUNCTION VERIFICATION
-- Check that critical functions exist
-- ============================================================================

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'is_admin',
  'update_updated_at_column',
  'get_user_organizations',
  'increment_marketplace_sales',
  'increment_marketplace_views',
  'increment_post_upvote_count',
  'decrement_post_upvote_count',
  'refresh_ai_knowledge_base',
  'search_similar_content',
  'search_content_embeddings'
)
ORDER BY routine_name;

-- ============================================================================
-- 7. SEED DATA VERIFICATION
-- Check that seed data was inserted correctly
-- ============================================================================

-- Check marketplace categories
SELECT 
  slug,
  name,
  COUNT(*) as count
FROM marketplace_categories
GROUP BY slug, name
ORDER BY slug;

-- Check membership plans
SELECT 
  slug,
  name,
  active,
  COUNT(*) as count
FROM membership_plans
GROUP BY slug, name, active
ORDER BY slug;

-- Check feature access
SELECT 
  mp.slug as plan_slug,
  fa.feature_key,
  fa.enabled,
  COUNT(*) as count
FROM feature_access fa
JOIN membership_plans mp ON fa.plan_id = mp.id
GROUP BY mp.slug, fa.feature_key, fa.enabled
ORDER BY mp.slug, fa.feature_key;

-- Check subscription plans
SELECT 
  slug,
  name,
  active,
  COUNT(*) as count
FROM subscription_plans
GROUP BY slug, name, active
ORDER BY slug;

-- ============================================================================
-- 8. COMPREHENSIVE SUMMARY
-- Single query to show overall deployment status
-- ============================================================================

WITH required_tables AS (
  SELECT * FROM (VALUES 
    ('profiles', 'Foundation'),
    ('saved_content', 'Foundation'),
    ('community_posts', 'Community'),
    ('community_replies', 'Community'),
    ('community_votes', 'Community'),
    ('community_chapters', 'Community'),
    ('community_events', 'Community'),
    ('membership_plans', 'Membership'),
    ('user_subscriptions', 'Membership'),
    ('feature_access', 'Membership'),
    ('ai_conversations', 'AI'),
    ('ai_messages', 'AI'),
    ('ai_knowledge_base', 'AI'),
    ('ai_embeddings', 'AI'),
    ('ai_generations', 'AI'),
    ('ai_reports', 'AI'),
    ('ai_jobs', 'AI'),
    ('automation_workflows', 'AI'),
    ('automation_runs', 'AI'),
    ('ai_predictions', 'AI'),
    ('ai_analytics_events', 'AI'),
    ('recruiter_profiles', 'AI'),
    ('recruiter_interactions', 'AI'),
    ('ai_settings', 'AI'),
    ('content_embeddings', 'AI'),
    ('courses', 'Learning'),
    ('course_modules', 'Learning'),
    ('labs', 'Learning'),
    ('roadmaps', 'Learning'),
    ('user_course_progress', 'Learning'),
    ('products', 'Products'),
    ('product_features', 'Products'),
    ('product_screenshots', 'Products'),
    ('research_papers', 'Research'),
    ('research_datasets', 'Research'),
    ('research_projects', 'Research'),
    ('certifications', 'Certifications'),
    ('exams', 'Certifications'),
    ('assessments', 'Certifications'),
    ('badges', 'Certifications'),
    ('user_badges', 'Certifications'),
    ('marketplace_categories', 'Marketplace'),
    ('marketplace_items', 'Marketplace'),
    ('marketplace_orders', 'Marketplace'),
    ('subscription_plans', 'Payments'),
    ('subscriptions', 'Payments'),
    ('transactions', 'Payments'),
    ('payment_events', 'Payments'),
    ('invoices', 'Payments'),
    ('orders', 'Payments'),
    ('order_items', 'Payments'),
    ('organizations', 'SaaS'),
    ('workspaces', 'SaaS'),
    ('organization_members', 'SaaS'),
    ('workspace_members', 'SaaS'),
    ('startups', 'Ecosystem'),
    ('innovation_projects', 'Ecosystem'),
    ('mentorship_programs', 'Ecosystem'),
    ('founders', 'Ecosystem'),
    ('investors', 'Ecosystem'),
    ('pitch_decks', 'Ecosystem'),
    ('funding_rounds', 'Ecosystem'),
    ('user_behavior', 'Ecosystem'),
    ('analytics_events', 'Ecosystem'),
    ('recommendations', 'Ecosystem')
) AS t(table_name, category)
),
table_status AS (
  SELECT 
    rt.table_name,
    rt.category,
    CASE 
      WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = rt.table_name
      ) THEN 'EXISTS'
      ELSE 'MISSING'
    END as status
  FROM required_tables rt
)
SELECT 
  category,
  status,
  COUNT(*) as table_count
FROM table_status
GROUP BY category, status
ORDER BY category, status;

-- ============================================================================
-- 9. CRITICAL TABLES ONLY (Quick check)
-- For rapid verification of the most important tables
-- ============================================================================

SELECT 
  'Critical Tables Verification' as check_type,
  SUM(CASE WHEN table_name = 'membership_plans' AND status = 'EXISTS' THEN 1 ELSE 0 END) as membership_plans,
  SUM(CASE WHEN table_name = 'research_datasets' AND status = 'EXISTS' THEN 1 ELSE 0 END) as research_datasets,
  SUM(CASE WHEN table_name = 'profiles' AND status = 'EXISTS' THEN 1 ELSE 0 END) as profiles,
  SUM(CASE WHEN table_name = 'saved_content' AND status = 'EXISTS' THEN 1 ELSE 0 END) as saved_content,
  SUM(CASE WHEN table_name = 'community_posts' AND status = 'EXISTS' THEN 1 ELSE 0 END) as community_posts,
  SUM(CASE WHEN table_name = 'marketplace_items' AND status = 'EXISTS' THEN 1 ELSE 0 END) as marketplace_items,
  SUM(CASE WHEN table_name = 'subscription_plans' AND status = 'EXISTS' THEN 1 ELSE 0 END) as subscription_plans,
  SUM(CASE WHEN table_name = 'ai_conversations' AND status = 'EXISTS' THEN 1 ELSE 0 END) as ai_conversations,
  SUM(CASE WHEN table_name = 'ai_jobs' AND status = 'EXISTS' THEN 1 ELSE 0 END) as ai_jobs
FROM (
  SELECT 
    t.table_name,
    CASE 
      WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = t.table_name
      ) THEN 'EXISTS'
      ELSE 'MISSING'
    END as status
  FROM (VALUES 
    ('membership_plans'),
    ('research_datasets'),
    ('profiles'),
    ('saved_content'),
    ('community_posts'),
    ('marketplace_items'),
    ('subscription_plans'),
    ('ai_conversations'),
    ('ai_jobs')
  ) AS t(table_name)
) subquery;

-- ============================================================================
-- VERIFICATION COMPLETE
-- All critical tables should show status = 'EXISTS'
-- ============================================================================
