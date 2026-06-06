-- ============================================================================
-- SUPABASE DEPLOYMENT SCRIPT
-- Consolidated migration deployment for Arpit Labs
-- Created: June 6, 2026
-- Purpose: Deploy all missing database schema changes to production
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: pgvector extension requires admin privileges
-- Run separately if needed: CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. FOUNDATION TABLES
-- ============================================================================

-- Profiles table (core user profile table)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  github_url text,
  linkedin_url text,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Saved content table
CREATE TABLE IF NOT EXISTS saved_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. COMMUNITY TABLES
-- ============================================================================

-- Community posts
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  category text,
  tags text[] DEFAULT '{}',
  views integer NOT NULL DEFAULT 0,
  upvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Community replies
CREATE TABLE IF NOT EXISTS community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Community votes
CREATE TABLE IF NOT EXISTS community_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_vote_per_user_per_post UNIQUE (post_id, user_id)
);

-- Community chapters
CREATE TABLE IF NOT EXISTS community_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  city text,
  lead_id uuid REFERENCES auth.users(id),
  member_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Community events
CREATE TABLE IF NOT EXISTS community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES community_chapters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  event_type text DEFAULT 'meetup',
  location text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  max_attendees integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. MEMBERSHIP TABLES
-- ============================================================================

-- Membership plans
CREATE TABLE IF NOT EXISTS membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  monthly_price numeric NOT NULL DEFAULT 0,
  yearly_price numeric NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL DEFAULT now() + INTERVAL '30 days',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Feature access
CREATE TABLE IF NOT EXISTS feature_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false
);

-- ============================================================================
-- 5. AI FEATURES TABLES
-- ============================================================================

-- AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_session_id text,
  title text,
  topic varchar(50),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- AI messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role varchar(20),
  content text NOT NULL,
  tokens_used int,
  model varchar(50),
  embedding_id uuid,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- AI knowledge base
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type varchar(50),
  source_id uuid,
  source_title text,
  source_url text,
  content text NOT NULL,
  metadata_obj jsonb,
  indexed_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  chunk_number int DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- AI embeddings (requires pgvector extension)
CREATE TABLE IF NOT EXISTS ai_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type varchar(50),
  source_id uuid,
  content_id uuid REFERENCES ai_knowledge_base(id) ON DELETE CASCADE,
  embedding vector(1536),
  model varchar(50) DEFAULT 'text-embedding-3-small',
  text_preview text,
  metadata_obj jsonb,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Automation workflows
CREATE TABLE IF NOT EXISTS automation_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  workflow_type varchar(50),
  is_active boolean DEFAULT true,
  schedule text,
  trigger_type varchar(50),
  trigger_config jsonb,
  actions jsonb,
  last_run_at timestamptz,
  last_error text,
  run_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Automation runs
CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  status varchar(50),
  input_data jsonb,
  output_data jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds int,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- AI predictions
CREATE TABLE IF NOT EXISTS ai_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type varchar(50),
  subject varchar(255),
  predicted_values jsonb,
  confidence_score float,
  prediction_start_date date,
  prediction_end_date date,
  actual_values jsonb,
  accuracy_score float,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- AI analytics events
CREATE TABLE IF NOT EXISTS ai_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type varchar(50),
  visitor_id uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_data jsonb,
  predicted_interest varchar(255),
  confidence float,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Recruiter profiles
CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  job_title text,
  email text,
  phone text,
  focus_areas text[],
  experience_level varchar(50),
  resume_summary text,
  skills_overview text,
  project_highlights jsonb,
  hiring_report text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Recruiter interactions
CREATE TABLE IF NOT EXISTS recruiter_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
  interaction_type varchar(50),
  interaction_data jsonb,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- AI settings
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_enabled boolean DEFAULT true,
  chat_enabled boolean DEFAULT true,
  search_enabled boolean DEFAULT true,
  default_model varchar(50) DEFAULT 'gpt-4',
  temperature float DEFAULT 0.7,
  max_tokens int DEFAULT 2000,
  kb_max_context_length int DEFAULT 4000,
  kb_refresh_interval int DEFAULT 3600,
  chat_rate_limit int DEFAULT 100,
  search_rate_limit int DEFAULT 500,
  monthly_api_budget float DEFAULT 1000,
  current_month_spent float DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- AI generations
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_type text,
  prompt text,
  output text,
  metadata jsonb DEFAULT '{}'::jsonb,
  tokens_used int,
  status text,
  created_at timestamptz DEFAULT now()
);

-- AI reports
CREATE TABLE IF NOT EXISTS ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text,
  content jsonb,
  generated_at timestamptz DEFAULT now()
);

-- AI jobs
CREATE TABLE IF NOT EXISTS ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text,
  status text,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content embeddings (vector search)
CREATE TABLE IF NOT EXISTS content_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type varchar(100) NOT NULL,
  content_id uuid,
  title text,
  chunk text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 6. LEARNING PLATFORM TABLES
-- ============================================================================

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  content text,
  category text NOT NULL,
  difficulty text NOT NULL,
  duration integer NOT NULL,
  thumbnail text,
  published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Course modules
CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Labs
CREATE TABLE IF NOT EXISTS labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  instructions text NOT NULL,
  difficulty text NOT NULL,
  category text NOT NULL,
  published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Roadmaps
CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  published boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User course progress
CREATE TABLE IF NOT EXISTS user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage integer NOT NULL DEFAULT 0,
  completed boolean DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- ============================================================================
-- 7. PRODUCT TABLES
-- ============================================================================

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  overview text,
  category text NOT NULL,
  pricing_type text NOT NULL,
  pricing_details text,
  featured boolean DEFAULT false,
  published boolean DEFAULT false,
  demo_url text,
  documentation_url text,
  cover_image text,
  screenshots text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Product features
CREATE TABLE IF NOT EXISTS product_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Product screenshots
CREATE TABLE IF NOT EXISTS product_screenshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. RESEARCH TABLES
-- ============================================================================

-- Research papers
CREATE TABLE IF NOT EXISTS research_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  abstract text NOT NULL,
  content text,
  authors text[] DEFAULT array[]::text[],
  division text NOT NULL,
  tags text[] DEFAULT array[]::text[],
  published_at timestamptz,
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Research datasets
CREATE TABLE IF NOT EXISTS research_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  download_url text,
  size text,
  format text,
  license text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Research projects
CREATE TABLE IF NOT EXISTS research_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'active',
  division text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. CERTIFICATION TABLES
-- ============================================================================

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  topic text NOT NULL,
  level text DEFAULT 'intermediate',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id uuid REFERENCES certifications(id) ON DELETE CASCADE,
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  passing_score integer DEFAULT 70,
  duration_minutes integer DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  score integer NOT NULL,
  passed boolean NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon_url text,
  criteria text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10. MARKETPLACE TABLES
-- ============================================================================

-- Marketplace categories
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Marketplace items
CREATE TABLE IF NOT EXISTS marketplace_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid REFERENCES marketplace_categories(id),
  price decimal(10, 2) NOT NULL DEFAULT 0.00,
  currency text NOT NULL DEFAULT 'USD',
  featured boolean DEFAULT false,
  published boolean DEFAULT false,
  seller_id uuid REFERENCES auth.users(id) NOT NULL,
  preview_image text,
  download_url text,
  views_count integer DEFAULT 0,
  downloads_count integer DEFAULT 0,
  sales_count integer DEFAULT 0,
  revenue decimal(15, 2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Marketplace orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  item_id uuid REFERENCES marketplace_items(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  amount decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 11. PAYMENT TABLES
-- ============================================================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  monthly_price decimal(10, 2) NOT NULL,
  yearly_price decimal(10, 2) NOT NULL,
  features jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE SET NULL,
  provider text NOT NULL,
  provider_subscription_id text UNIQUE NOT NULL,
  status text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  provider text NOT NULL,
  provider_transaction_id text UNIQUE NOT NULL,
  status text NOT NULL,
  type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payment events
CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  invoice_number text UNIQUE NOT NULL,
  pdf_url text,
  amount decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text DEFAULT 'paid',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL,
  transaction_id uuid REFERENCES transactions(id),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  amount decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 12. SAAS INFRASTRUCTURE TABLES
-- ============================================================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  billing_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Workspace members
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- 13. ECOSYSTEM TABLES
-- ============================================================================

-- Startups
CREATE TABLE IF NOT EXISTS startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  logo_url text,
  website_url text,
  founder_id uuid REFERENCES auth.users(id),
  stage text DEFAULT 'ideation',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Innovation projects
CREATE TABLE IF NOT EXISTS innovation_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  challenge_id uuid,
  team_members uuid[] DEFAULT array[]::uuid[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Mentorship programs
CREATE TABLE IF NOT EXISTS mentorship_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  mentor_id uuid REFERENCES auth.users(id),
  max_mentees integer DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Founders
CREATE TABLE IF NOT EXISTS founders (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio text,
  expertise text[] DEFAULT array[]::text[],
  linked_in text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Investors
CREATE TABLE IF NOT EXISTS investors (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_name text,
  investment_focus text[] DEFAULT array[]::text[],
  ticket_size_min numeric,
  ticket_size_max numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Pitch decks
CREATE TABLE IF NOT EXISTS pitch_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid REFERENCES startups(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Funding rounds
CREATE TABLE IF NOT EXISTS funding_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid REFERENCES startups(id) ON DELETE CASCADE,
  round_type text NOT NULL,
  amount numeric,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User behavior
CREATE TABLE IF NOT EXISTS user_behavior (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_entity_type text NOT NULL,
  recommended_entity_id uuid NOT NULL,
  score numeric,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 14. INDEXES (All with IF NOT EXISTS)
-- ============================================================================

-- Foundation indexes
CREATE INDEX IF NOT EXISTS idx_saved_content_user_id ON saved_content(user_id);

-- Community indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_slug ON community_posts(slug);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_community_events_chapter ON community_events(chapter_id);
CREATE INDEX IF NOT EXISTS idx_community_events_start ON community_events(start_time);

-- Membership indexes
CREATE INDEX IF NOT EXISTS idx_membership_plans_slug ON membership_plans(slug);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_feature_access_plan_id ON feature_access(plan_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_access_plan_feature ON feature_access(plan_id, feature_key);

-- AI indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_topic ON ai_conversations(topic);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_kb_source_type ON ai_knowledge_base(source_type);
CREATE INDEX IF NOT EXISTS idx_ai_kb_source_id ON ai_knowledge_base(source_id);
CREATE INDEX IF NOT EXISTS idx_ai_kb_is_active ON ai_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_kb_created_at ON ai_knowledge_base(indexed_at);
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_source ON ai_embeddings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_created_at ON ai_embeddings(created_at);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_is_active ON automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_type ON automation_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_automation_runs_workflow_id ON automation_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_created_at ON automation_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_events_visitor_id ON ai_analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_events_event_type ON ai_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id ON recruiter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_is_active ON recruiter_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_recruiter_interactions_recruiter_id ON recruiter_interactions(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_status ON ai_generations(status);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_reports_type ON ai_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_ai_reports_generated_at ON ai_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON ai_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_created_at ON ai_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_content_type ON content_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_created_at ON content_embeddings(created_at);

-- Learning platform indexes
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(published);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_order ON course_modules(order_index);
CREATE INDEX IF NOT EXISTS idx_labs_category ON labs(category);
CREATE INDEX IF NOT EXISTS idx_labs_published ON labs(published);
CREATE INDEX IF NOT EXISTS idx_labs_slug ON labs(slug);
CREATE INDEX IF NOT EXISTS idx_roadmaps_category ON roadmaps(category);
CREATE INDEX IF NOT EXISTS idx_roadmaps_published ON roadmaps(published);
CREATE INDEX IF NOT EXISTS idx_roadmaps_slug ON roadmaps(slug);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_id ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_course_id ON user_course_progress(course_id);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published);

-- Research indexes
CREATE INDEX IF NOT EXISTS idx_research_papers_division ON research_papers(division);
CREATE INDEX IF NOT EXISTS idx_research_papers_published_at ON research_papers(published_at);
CREATE INDEX IF NOT EXISTS idx_research_datasets_created_at ON research_datasets(created_at);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON marketplace_items(category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_published ON marketplace_items(published);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_slug ON marketplace_items(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_slug ON marketplace_categories(slug);

-- ============================================================================
-- 15. FUNCTIONS
-- ============================================================================

-- Admin function (from phase4)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Get user organizations function
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF uuid AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Increment marketplace sales
CREATE OR REPLACE FUNCTION increment_marketplace_sales(item_id uuid, amount decimal)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_items
  SET sales_count = sales_count + 1,
      revenue = revenue + amount
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment marketplace views
CREATE OR REPLACE FUNCTION increment_marketplace_views(item_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_items
  SET views_count = views_count + 1
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment post upvote count
CREATE OR REPLACE FUNCTION increment_post_upvote_count(p_id uuid)
RETURNS void LANGUAGE sql STABLE AS $$
  UPDATE community_posts SET upvotes = coalesce(upvotes,0) + 1 WHERE id = p_id;
$$;

-- Decrement post upvote count
CREATE OR REPLACE FUNCTION decrement_post_upvote_count(p_id uuid)
RETURNS void LANGUAGE sql STABLE AS $$
  UPDATE community_posts SET upvotes = greatest(coalesce(upvotes,0) - 1, 0) WHERE id = p_id;
$$;

-- Refresh AI knowledge base
CREATE OR REPLACE FUNCTION refresh_ai_knowledge_base()
RETURNS TABLE(
  content_count INT,
  embedding_count INT,
  last_refresh timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT as content_count,
    (SELECT COUNT(*)::INT FROM ai_embeddings) as embedding_count,
    now() as last_refresh;
END;
$$ LANGUAGE plpgsql;

-- Search similar content (requires pgvector)
CREATE OR REPLACE FUNCTION search_similar_content(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  similarity_threshold float DEFAULT 0.5
)
RETURNS TABLE(
  id uuid,
  source_type varchar,
  source_id uuid,
  text_preview text,
  similarity float,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id,
    ae.source_type,
    ae.source_id,
    ae.text_preview,
    (ae.embedding <#> query_embedding) * -1 as similarity,
    ae.metadata_obj
  FROM ai_embeddings ae
  WHERE (ae.embedding <#> query_embedding) * -1 > similarity_threshold
  ORDER BY ae.embedding <#> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Search content embeddings (requires pgvector)
CREATE OR REPLACE FUNCTION search_content_embeddings(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  similarity_threshold float DEFAULT 0.0
)
RETURNS TABLE(
  id uuid,
  content_type varchar,
  content_id uuid,
  title text,
  chunk text,
  similarity float,
  metadata jsonb,
  created_at timestamptz
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.content_type,
    ce.content_id,
    ce.title,
    ce.chunk,
    1 - (ce.embedding <#> query_embedding) AS similarity,
    ce.metadata,
    ce.created_at
  FROM content_embeddings ce
  WHERE (1 - (ce.embedding <#> query_embedding)) > similarity_threshold
  ORDER BY ce.embedding <#> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 16. RLS POLICIES (With DROP IF EXISTS for safety)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE innovation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their profile" ON profiles;
CREATE POLICY "Users can view their profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their profile" ON profiles;
CREATE POLICY "Users can insert their profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their profile" ON profiles;
CREATE POLICY "Users can update their profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Saved content policies
DROP POLICY IF EXISTS "Users can view their saved content" ON saved_content;
CREATE POLICY "Users can view their saved content" ON saved_content FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert saved content" ON saved_content;
CREATE POLICY "Users can insert saved content" ON saved_content FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their saved content" ON saved_content;
CREATE POLICY "Users can delete their saved content" ON saved_content FOR DELETE USING (auth.uid() = user_id);

-- Community posts policies
DROP POLICY IF EXISTS "public can read community posts" ON community_posts;
CREATE POLICY "public can read community posts" ON community_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "users can insert community posts" ON community_posts;
CREATE POLICY "users can insert community posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners or admins manage community posts" ON community_posts;
CREATE POLICY "owners or admins manage community posts" ON community_posts FOR ALL USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Community replies policies
DROP POLICY IF EXISTS "public can read community replies" ON community_replies;
CREATE POLICY "public can read community replies" ON community_replies FOR SELECT USING (true);
DROP POLICY IF EXISTS "users can insert community replies" ON community_replies;
CREATE POLICY "users can insert community replies" ON community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owners or admins delete community replies" ON community_replies;
CREATE POLICY "owners or admins delete community replies" ON community_replies FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Community votes policies
DROP POLICY IF EXISTS "users can insert community votes" ON community_votes;
CREATE POLICY "users can insert community votes" ON community_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "admins manage community votes" ON community_votes;
CREATE POLICY "admins manage community votes" ON community_votes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Community chapters policies
DROP POLICY IF EXISTS "Public can view chapters" ON community_chapters;
CREATE POLICY "Public can view chapters" ON community_chapters FOR SELECT USING (true);

-- Community events policies
DROP POLICY IF EXISTS "Public can view events" ON community_events;
CREATE POLICY "Public can view events" ON community_events FOR SELECT USING (true);

-- Membership plans policies
DROP POLICY IF EXISTS "Public can view membership plans" ON membership_plans;
CREATE POLICY "Public can view membership plans" ON membership_plans FOR SELECT USING (active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage membership plans" ON membership_plans;
CREATE POLICY "Admins can manage membership plans" ON membership_plans FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- User subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage user subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can manage user subscriptions" ON user_subscriptions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Feature access policies
DROP POLICY IF EXISTS "Public can view feature access" ON feature_access;
CREATE POLICY "Public can view feature access" ON feature_access FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage feature access" ON feature_access;
CREATE POLICY "Admins can manage feature access" ON feature_access FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- AI conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON ai_conversations;
CREATE POLICY "Users can view their own conversations" ON ai_conversations FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Users can create conversations" ON ai_conversations;
CREATE POLICY "Users can create conversations" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Authenticated users can read AI features" ON ai_conversations;
CREATE POLICY "Authenticated users can read AI features" ON ai_conversations FOR SELECT USING (auth.role() = 'authenticated');

-- AI knowledge base policies
DROP POLICY IF EXISTS "Public can read knowledge base" ON ai_knowledge_base;
CREATE POLICY "Public can read knowledge base" ON ai_knowledge_base FOR SELECT USING (is_active = true);

-- AI generations policies
DROP POLICY IF EXISTS "Admins have full access to ai_generations" ON ai_generations;
CREATE POLICY "Admins have full access to ai_generations" ON ai_generations FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated users can insert generations" ON ai_generations;
CREATE POLICY "Authenticated users can insert generations" ON ai_generations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- AI reports policies
DROP POLICY IF EXISTS "Admins have full access to ai_reports" ON ai_reports;
CREATE POLICY "Admins have full access to ai_reports" ON ai_reports FOR ALL USING (auth.role() = 'authenticated');

-- AI jobs policies
DROP POLICY IF EXISTS "Admins have full access to ai_jobs" ON ai_jobs;
CREATE POLICY "Admins have full access to ai_jobs" ON ai_jobs FOR ALL USING (auth.role() = 'authenticated');

-- Courses policies
DROP POLICY IF EXISTS "Public can view published courses" ON courses;
CREATE POLICY "Public can view published courses" ON courses FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON courses;
CREATE POLICY "Authenticated users can manage courses" ON courses FOR ALL USING (auth.role() = 'authenticated');

-- Course modules policies
DROP POLICY IF EXISTS "Public can view modules of published courses" ON course_modules;
CREATE POLICY "Public can view modules of published courses" ON course_modules FOR SELECT USING (EXISTS(SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND courses.published = true));
DROP POLICY IF EXISTS "Authenticated users can manage modules" ON course_modules;
CREATE POLICY "Authenticated users can manage modules" ON course_modules FOR ALL USING (auth.role() = 'authenticated');

-- Labs policies
DROP POLICY IF EXISTS "Public can view published labs" ON labs;
CREATE POLICY "Public can view published labs" ON labs FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Authenticated users can manage labs" ON labs;
CREATE POLICY "Authenticated users can manage labs" ON labs FOR ALL USING (auth.role() = 'authenticated');

-- Roadmaps policies
DROP POLICY IF EXISTS "Public can view published roadmaps" ON roadmaps;
CREATE POLICY "Public can view published roadmaps" ON roadmaps FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Authenticated users can manage roadmaps" ON roadmaps;
CREATE POLICY "Authenticated users can manage roadmaps" ON roadmaps FOR ALL USING (auth.role() = 'authenticated');

-- User course progress policies
DROP POLICY IF EXISTS "Users can view their own progress" ON user_course_progress;
CREATE POLICY "Users can view their own progress" ON user_course_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own progress" ON user_course_progress;
CREATE POLICY "Users can update their own progress" ON user_course_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their progress" ON user_course_progress;
CREATE POLICY "Users can insert their progress" ON user_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products policies
DROP POLICY IF EXISTS "Public select published products" ON products;
CREATE POLICY "Public select published products" ON products FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Public select features for published products" ON product_features;
CREATE POLICY "Public select features for published products" ON product_features FOR SELECT USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_features.product_id AND p.published = true));
DROP POLICY IF EXISTS "Public select screenshots for published products" ON product_screenshots;
CREATE POLICY "Public select screenshots for published products" ON product_screenshots FOR SELECT USING (EXISTS (SELECT 1 FROM products p WHERE p.id = product_screenshots.product_id AND p.published = true));

-- Research policies
DROP POLICY IF EXISTS "Public can view published research" ON research_papers;
CREATE POLICY "Public can view published research" ON research_papers FOR SELECT USING (published_at <= now());
DROP POLICY IF EXISTS "Public can view research_datasets" ON research_datasets;
CREATE POLICY "Public can view research_datasets" ON research_datasets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public can view research_projects" ON research_projects;
CREATE POLICY "Public can view research_projects" ON research_projects FOR SELECT USING (true);

-- Certifications policies
DROP POLICY IF EXISTS "Public can view certifications" ON certifications;
CREATE POLICY "Public can view certifications" ON certifications FOR SELECT USING (true);

-- Exams policies
DROP POLICY IF EXISTS "Authenticated users can see exams" ON exams;
CREATE POLICY "Authenticated users can see exams" ON exams FOR SELECT USING (auth.role() = 'authenticated');

-- Assessments policies
DROP POLICY IF EXISTS "Users can view their own assessments" ON assessments;
CREATE POLICY "Users can view their own assessments" ON assessments FOR SELECT USING (auth.uid() = user_id);

-- Badges policies
DROP POLICY IF EXISTS "Public can view badges" ON badges;
CREATE POLICY "Public can view badges" ON badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
CREATE POLICY "Users can insert their own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Marketplace policies
DROP POLICY IF EXISTS "Public categories read" ON marketplace_categories;
CREATE POLICY "Public categories read" ON marketplace_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public items read" ON marketplace_items;
CREATE POLICY "Public items read" ON marketplace_items FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "Sellers manage own items" ON marketplace_items;
CREATE POLICY "Sellers manage own items" ON marketplace_items FOR ALL USING (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Users read own orders" ON marketplace_orders;
CREATE POLICY "Users read own orders" ON marketplace_orders FOR SELECT USING (auth.uid() = user_id);

-- Subscription plans policies
DROP POLICY IF EXISTS "Public can view active plans" ON subscription_plans;
CREATE POLICY "Public can view active plans" ON subscription_plans FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Admins can do everything on plans" ON subscription_plans;
CREATE POLICY "Admins can do everything on plans" ON subscription_plans FOR ALL USING (auth.jwt() ->> 'email' = 'arpit@arpitlabs.com');

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR SELECT USING (auth.jwt() ->> 'email' = 'arpit@arpitlabs.com');

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT USING (auth.jwt() ->> 'email' = 'arpit@arpitlabs.com');

-- Invoices policies
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;
CREATE POLICY "Admins can view all invoices" ON invoices FOR SELECT USING (auth.jwt() ->> 'email' = 'arpit@arpitlabs.com');

-- Orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (auth.jwt() ->> 'email' = 'arpit@arpitlabs.com');

-- Order items policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (auth.jwt() ->> 'email' = 'arpit@arpitlabs.com');

-- Payment events policies
DROP POLICY IF EXISTS "Admins only" ON payment_events;
CREATE POLICY "Admins only" ON payment_events FOR ALL USING (auth.jwt() ->> 'email' = 'arpit@arpitlabs.com');

-- Organizations policies
DROP POLICY IF EXISTS "Org: Users can view their orgs" ON organizations;
CREATE POLICY "Org: Users can view their orgs" ON organizations FOR SELECT USING (id IN (SELECT public.get_user_organizations()) OR public.is_admin());
DROP POLICY IF EXISTS "Org: Admins can update" ON organizations;
CREATE POLICY "Org: Admins can update" ON organizations FOR UPDATE USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')) OR public.is_admin());

-- Workspaces policies
DROP POLICY IF EXISTS "WS: Users can view" ON workspaces;
CREATE POLICY "WS: Users can view" ON workspaces FOR SELECT USING (organization_id IN (SELECT public.get_user_organizations()) OR public.is_admin());
DROP POLICY IF EXISTS "WS: Admins manage" ON workspaces;
CREATE POLICY "WS: Admins manage" ON workspaces FOR ALL USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = workspaces.organization_id AND user_id = auth.uid() AND role IN ('owner', 'admin')) OR public.is_admin());

-- Organization members policies
DROP POLICY IF EXISTS "Members: View" ON organization_members;
CREATE POLICY "Members: View" ON organization_members FOR SELECT USING (organization_id IN (SELECT public.get_user_organizations()) OR public.is_admin());
DROP POLICY IF EXISTS "Members: Owner manage" ON organization_members;
CREATE POLICY "Members: Owner manage" ON organization_members FOR ALL USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organization_members.organization_id AND user_id = auth.uid() AND role = 'owner') OR public.is_admin());

-- Startups policies
DROP POLICY IF EXISTS "Founders can manage their startups" ON startups;
CREATE POLICY "Founders can manage their startups" ON startups FOR ALL USING (auth.uid() = founder_id);
DROP POLICY IF EXISTS "Public can view active startups" ON startups;
CREATE POLICY "Public can view active startups" ON startups FOR SELECT USING (true);

-- Innovation projects policies
DROP POLICY IF EXISTS "Public can view innovation_projects" ON innovation_projects;
CREATE POLICY "Public can view innovation_projects" ON innovation_projects FOR SELECT USING (true);

-- Mentorship programs policies
DROP POLICY IF EXISTS "Public can view mentorship_programs" ON mentorship_programs;
CREATE POLICY "Public can view mentorship_programs" ON mentorship_programs FOR SELECT USING (true);

-- Founders policies
DROP POLICY IF EXISTS "Founders can manage their profile" ON founders;
CREATE POLICY "Founders can manage their profile" ON founders FOR ALL USING (auth.uid() = id);
DROP POLICY IF EXISTS "Public can view founders" ON founders;
CREATE POLICY "Public can view founders" ON founders FOR SELECT USING (true);

-- Investors policies
DROP POLICY IF EXISTS "Investors can manage their profile" ON investors;
CREATE POLICY "Investors can manage their profile" ON investors FOR ALL USING (auth.uid() = id);
DROP POLICY IF EXISTS "Public can view investors" ON investors;
CREATE POLICY "Public can view investors" ON investors FOR SELECT USING (true);

-- Pitch decks policies
DROP POLICY IF EXISTS "Founders can manage their pitch_decks" ON pitch_decks;
CREATE POLICY "Founders can manage their pitch_decks" ON pitch_decks FOR ALL USING (auth.uid() = (SELECT founder_id FROM startups WHERE id = pitch_decks.startup_id));

-- Funding rounds policies
DROP POLICY IF EXISTS "Public can view funding_rounds" ON funding_rounds;
CREATE POLICY "Public can view funding_rounds" ON funding_rounds FOR SELECT USING (true);

-- User behavior policies
DROP POLICY IF EXISTS "Only system/admins can view behavior" ON user_behavior;
CREATE POLICY "Only system/admins can view behavior" ON user_behavior FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Analytics events policies
DROP POLICY IF EXISTS "Only system/admins can view analytics_events" ON analytics_events;
CREATE POLICY "Only system/admins can view analytics_events" ON analytics_events FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email = 'arpit@arpitlabs.com'));
DROP POLICY IF EXISTS "Only system/admins can manage analytics_events" ON analytics_events;
CREATE POLICY "Only system/admins can manage analytics_events" ON analytics_events FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email = 'arpit@arpitlabs.com'));

-- Recommendations policies
DROP POLICY IF EXISTS "Users can view their own recommendations" ON recommendations;
CREATE POLICY "Users can view their own recommendations" ON recommendations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage recommendations" ON recommendations;
CREATE POLICY "Admins can manage recommendations" ON recommendations FOR ALL USING (auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND email = 'arpit@arpitlabs.com'));

-- ============================================================================
-- 17. TRIGGERS
-- ============================================================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_marketplace_items_updated_at ON marketplace_items;
CREATE TRIGGER update_marketplace_items_updated_at
  BEFORE UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_labs_updated_at ON labs;
CREATE TRIGGER update_labs_updated_at
  BEFORE UPDATE ON labs
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_roadmaps_updated_at ON roadmaps;
CREATE TRIGGER update_roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 18. SEED DATA (With ON CONFLICT for safety)
-- ============================================================================

-- Marketplace categories
INSERT INTO marketplace_categories (name, slug) VALUES
  ('Templates', 'templates'),
  ('UI Kits', 'ui-kits'),
  ('E-books', 'e-books'),
  ('Software', 'software'),
  ('Icons', 'icons')
ON CONFLICT (slug) DO NOTHING;

-- Membership plans
INSERT INTO membership_plans (slug, name, description, monthly_price, yearly_price, features, active)
VALUES
  ('free', 'Free', 'Access the community, public learning resources, and essential AI support.', 0, 0, '["community_access", "public_projects", "public_blog", "limited_ai", "public_courses"]', true),
  ('student', 'Student', 'Unlock premium courses, roadmap guidance, hackathon resources, and more AI credits.', 19, 190, '["community_access", "public_projects", "public_blog", "limited_ai", "public_courses", "premium_courses", "learning_roadmaps", "hackathon_resources", "higher_ai_limits", "saved_learning_progress"]', true),
  ('premium', 'Premium', 'Everything in Student plus unlimited AI, recruiter assistant, premium labs, and analytics.', 39, 390, '["community_access", "public_projects", "public_blog", "limited_ai", "public_courses", "premium_courses", "learning_roadmaps", "hackathon_resources", "higher_ai_limits", "saved_learning_progress", "unlimited_ai", "recruiter_assistant", "ai_project_generator", "premium_labs", "exclusive_content", "advanced_analytics"]', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  features = EXCLUDED.features,
  active = EXCLUDED.active;

-- Feature access mapping
INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'community_access', true FROM membership_plans WHERE slug IN ('free', 'student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'public_projects', true FROM membership_plans WHERE slug IN ('free', 'student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'public_blog', true FROM membership_plans WHERE slug IN ('free', 'student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'limited_ai', true FROM membership_plans WHERE slug IN ('free', 'student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'public_courses', true FROM membership_plans WHERE slug IN ('free', 'student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'premium_courses', true FROM membership_plans WHERE slug IN ('student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'learning_roadmaps', true FROM membership_plans WHERE slug IN ('student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'hackathon_resources', true FROM membership_plans WHERE slug IN ('student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'higher_ai_limits', true FROM membership_plans WHERE slug IN ('student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'saved_learning_progress', true FROM membership_plans WHERE slug IN ('student', 'premium')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'unlimited_ai', true FROM membership_plans WHERE slug = 'premium'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'recruiter_assistant', true FROM membership_plans WHERE slug = 'premium'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'ai_project_generator', true FROM membership_plans WHERE slug = 'premium'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'premium_labs', true FROM membership_plans WHERE slug = 'premium'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'exclusive_content', true FROM membership_plans WHERE slug = 'premium'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

INSERT INTO feature_access (plan_id, feature_key, enabled)
SELECT id, 'advanced_analytics', true FROM membership_plans WHERE slug = 'premium'
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

-- Subscription plans
INSERT INTO subscription_plans (name, slug, description, monthly_price, yearly_price, features, active)
VALUES 
  ('FREE', 'free', 'Community Access & Basic AI Features', 0, 0, '["Community Access", "Basic AI Features", "Public Courses"]', true),
  ('STUDENT', 'student', 'Advanced AI Features & Premium Learning', 9.99, 99.99, '["Advanced AI Features", "Premium Learning", "Hackathon Benefits"]', true),
  ('PREMIUM', 'premium', 'Full Platform Access & Priority Support', 29.99, 299.99, '["Full Platform Access", "Priority Support", "Marketplace Discounts", "Recruiter Features"]', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
