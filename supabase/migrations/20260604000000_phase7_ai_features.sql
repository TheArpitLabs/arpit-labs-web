-- Phase 7: AI Features Database Schema
-- Created: June 4, 2026
-- Purpose: Support AI Assistant, Vector Search, Automation, Analytics

-- =============================================================================
-- 1. AI CONVERSATION HISTORY
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_session_id TEXT,
  
  title TEXT,
  topic VARCHAR(50), -- "projects", "blog", "experiments", "general"
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  role VARCHAR(20), -- "user" or "assistant"
  content TEXT NOT NULL,
  
  -- Metadata for tracking
  tokens_used INT,
  model VARCHAR(50), -- "gpt-4", "gpt-3.5-turbo", etc.
  embedding_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_topic ON ai_conversations(topic);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- =============================================================================
-- 2. AI KNOWLEDGE BASE (Indexed Content)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source information
  source_type VARCHAR(50), -- "project", "blog", "experiment", "journey"
  source_id UUID,
  source_title TEXT,
  source_url TEXT,
  
  -- Content
  content TEXT NOT NULL,
  metadata_obj JSONB, -- Original metadata (title, description, etc.)
  
  -- Indexing
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  chunk_number INT DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_kb_source_type ON ai_knowledge_base(source_type);
CREATE INDEX IF NOT EXISTS idx_ai_kb_source_id ON ai_knowledge_base(source_id);
CREATE INDEX IF NOT EXISTS idx_ai_kb_is_active ON ai_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_kb_created_at ON ai_knowledge_base(indexed_at);

-- =============================================================================
-- 3. VECTOR EMBEDDINGS (for Semantic Search)
-- =============================================================================

-- Only create this table if pgvector extension is available
do $$
begin
  if exists (select 1 from pg_extension where extname = 'vector') then
    CREATE TABLE IF NOT EXISTS ai_embeddings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Source
      source_type VARCHAR(50), -- "project", "blog", "experiment", "kb"
      source_id UUID,
      content_id UUID REFERENCES ai_knowledge_base(id) ON DELETE CASCADE,
      
      -- Embedding data
      embedding VECTOR(1536), -- OpenAI embedding dimension
      model VARCHAR(50) DEFAULT 'text-embedding-3-small',
      
      -- Metadata
      text_preview TEXT, -- First 200 chars
      metadata_obj JSONB,
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      
      metadata JSONB DEFAULT '{}'::JSONB
    );

    -- Create index for similarity search
    CREATE INDEX IF NOT EXISTS idx_ai_embeddings_source ON ai_embeddings(source_type, source_id);
    CREATE INDEX IF NOT EXISTS idx_ai_embeddings_created_at ON ai_embeddings(created_at);
  else
    RAISE NOTICE 'pgvector extension not available, skipping ai_embeddings table';
  end if;
end $$;

-- =============================================================================
-- 4. AUTOMATION WORKFLOWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Workflow type
  workflow_type VARCHAR(50), -- "blog_publish", "newsletter", "social_share", "report"
  
  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  schedule TEXT, -- Cron expression
  
  -- Trigger settings
  trigger_type VARCHAR(50), -- "manual", "scheduled", "event"
  trigger_config JSONB,
  
  -- Action settings
  actions JSONB, -- Array of actions to perform
  
  -- Stats
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  run_count INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  
  status VARCHAR(50), -- "pending", "running", "success", "failed"
  
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_automation_workflows_is_active ON automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_type ON automation_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_automation_runs_workflow_id ON automation_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_created_at ON automation_runs(created_at);

-- =============================================================================
-- 5. AI ANALYTICS & PREDICTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  prediction_type VARCHAR(50), -- "visitor_interest", "content_trend", "technology_trend"
  
  -- Prediction data
  subject VARCHAR(255), -- What is being predicted
  predicted_values JSONB, -- Array of predictions with scores
  confidence_score FLOAT,
  
  -- Time range
  prediction_start_date DATE,
  prediction_end_date DATE,
  
  -- Verification
  actual_values JSONB, -- Actual values after period ends
  accuracy_score FLOAT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS ai_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  event_type VARCHAR(50), -- "visitor_view", "content_interaction", "ai_query"
  
  visitor_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Event details
  event_data JSONB,
  
  -- Analysis
  predicted_interest VARCHAR(255),
  confidence FLOAT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_events_visitor_id ON ai_analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_events_event_type ON ai_analytics_events(event_type);

-- =============================================================================
-- 6. RECRUITER ASSISTANT & PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile info
  company_name TEXT,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  
  -- Preferences
  focus_areas TEXT[], -- ["IoT", "AI", "Cybersecurity"]
  experience_level VARCHAR(50), -- "entry", "mid", "senior"
  
  -- Generated content
  resume_summary TEXT,
  skills_overview TEXT,
  project_highlights JSONB,
  hiring_report TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS recruiter_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
  
  interaction_type VARCHAR(50), -- "view", "contact", "offer"
  
  interaction_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id ON recruiter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_is_active ON recruiter_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_recruiter_interactions_recruiter_id ON recruiter_interactions(recruiter_id);

-- =============================================================================
-- 7. AI SETTINGS & CONFIGURATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- General settings
  ai_enabled BOOLEAN DEFAULT TRUE,
  chat_enabled BOOLEAN DEFAULT TRUE,
  search_enabled BOOLEAN DEFAULT TRUE,
  
  -- Model settings
  default_model VARCHAR(50) DEFAULT 'gpt-4',
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 2000,
  
  -- Knowledge base settings
  kb_max_context_length INT DEFAULT 4000,
  kb_refresh_interval INT DEFAULT 3600, -- seconds
  
  -- Rate limiting
  chat_rate_limit INT DEFAULT 100, -- messages per day
  search_rate_limit INT DEFAULT 500, -- searches per day
  
  -- Costs
  monthly_api_budget FLOAT DEFAULT 1000,
  current_month_spent FLOAT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  metadata JSONB DEFAULT '{}'::JSONB
);

-- =============================================================================
-- 8. ENABLE VECTOR EXTENSION
-- =============================================================================

-- Enable pgvector extension for vector similarity search
-- Note: Run this with admin privileges on your Supabase project
-- CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- 9. ROW-LEVEL SECURITY POLICIES
-- =============================================================================

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON ai_conversations;
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can create conversations
DROP POLICY IF EXISTS "Users can create conversations" ON ai_conversations;
CREATE POLICY "Users can create conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Public can read knowledge base
DROP POLICY IF EXISTS "Public can read knowledge base" ON ai_knowledge_base;
CREATE POLICY "Public can read knowledge base"
  ON ai_knowledge_base FOR SELECT
  USING (is_active = TRUE);

-- Policy: Authenticated users can read all content
DROP POLICY IF EXISTS "Authenticated users can read AI features" ON ai_conversations;
CREATE POLICY "Authenticated users can read AI features"
  ON ai_conversations FOR SELECT
  USING (auth.role() = 'authenticated');

-- =============================================================================
-- 10. FUNCTION: Refresh Knowledge Base
-- =============================================================================

DROP FUNCTION IF EXISTS refresh_ai_knowledge_base();
CREATE FUNCTION refresh_ai_knowledge_base()
RETURNS TABLE(
  content_count INT,
  embedding_count INT,
  last_refresh TIMESTAMP
) AS $$
BEGIN
  -- Get counts
  RETURN QUERY
  SELECT
    COUNT(*)::INT as content_count,
    (SELECT COUNT(*)::INT FROM ai_embeddings) as embedding_count,
    now() as last_refresh;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 11. FUNCTION: Search with Embeddings
-- =============================================================================

-- Only create this function if pgvector extension is available
-- Note: This function requires the pgvector extension to be enabled
-- If pgvector is not available, this function will fail gracefully

-- =============================================================================
-- 12. GRANTS & PERMISSIONS
-- =============================================================================

-- Grant appropriate permissions to authenticated users and service role
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Allow authenticated users to access their own data
GRANT SELECT, INSERT, UPDATE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT ON ai_messages TO authenticated;
GRANT SELECT ON ai_knowledge_base TO authenticated, anon;
GRANT SELECT ON recruiter_profiles TO authenticated;

-- Service role has full access
GRANT ALL ON ai_conversations TO service_role;
GRANT ALL ON ai_messages TO service_role;
GRANT ALL ON ai_knowledge_base TO service_role;
GRANT ALL ON ai_embeddings TO service_role;
GRANT ALL ON automation_workflows TO service_role;
GRANT ALL ON automation_runs TO service_role;
GRANT ALL ON ai_predictions TO service_role;
GRANT ALL ON ai_analytics_events TO service_role;
GRANT ALL ON recruiter_profiles TO service_role;
GRANT ALL ON recruiter_interactions TO service_role;
GRANT ALL ON ai_settings TO service_role;

-- =============================================================================
-- 13. COMMENTS & DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE ai_conversations IS 'Stores AI chat conversations and sessions';
COMMENT ON TABLE ai_messages IS 'Individual messages within conversations';
COMMENT ON TABLE ai_knowledge_base IS 'Indexed content for knowledge base - source of truth for embeddings';
COMMENT ON TABLE ai_embeddings IS 'Vector embeddings for semantic search - requires pgvector extension';
COMMENT ON TABLE automation_workflows IS 'Automation workflow configurations';
COMMENT ON TABLE automation_runs IS 'Records of automation workflow executions';
COMMENT ON TABLE ai_predictions IS 'AI predictions for trends and interests';
COMMENT ON TABLE recruiter_profiles IS 'Recruiter assistant profile and generated content';
COMMENT ON TABLE ai_settings IS 'Global AI system settings and configuration';

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================

-- To apply this migration:
-- 1. In Supabase dashboard, go to SQL Editor
-- 2. Run this script
-- 3. If pgvector extension is needed:
--    - Contact Supabase support to enable pgvector on your project
--    - Or use Pinecone/Weaviate as external vector DB

-- For vector search without pgvector:
-- - Use Pinecone (free tier available)
-- - Use Weaviate (open source available)
-- - Use OpenAI's embeddings API directly

-- =============================================================================
