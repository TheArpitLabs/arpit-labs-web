-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration was successful
-- ============================================================================

-- Check if key tables exist
SELECT 
  'profiles' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) as exists;

SELECT 
  'saved_content' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saved_content'
  ) as exists;

SELECT 
  'community_posts' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts'
  ) as exists;

SELECT 
  'products' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'products'
  ) as exists;

SELECT 
  'marketplace_categories' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'marketplace_categories'
  ) as exists;

SELECT 
  'marketplace_items' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'marketplace_items'
  ) as exists;

SELECT 
  'research_papers' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'research_papers'
  ) as exists;

SELECT 
  'research_datasets' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'research_datasets'
  ) as exists;

SELECT 
  'certifications' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'certifications'
  ) as exists;

SELECT 
  'startups' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'startups'
  ) as exists;

SELECT 
  'community_chapters' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_chapters'
  ) as exists;

-- Check initial marketplace categories
SELECT * FROM marketplace_categories;
