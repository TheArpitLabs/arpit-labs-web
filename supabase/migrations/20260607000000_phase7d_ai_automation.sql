-- Phase 7D: AI Automation (generations, reports, jobs)
-- Created: 2026-06-05

-- =============================================================================
-- 1. AI Generations
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_type TEXT,
  prompt TEXT,
  output TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  tokens_used INT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_status ON ai_generations(status);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at);

-- =============================================================================
-- 2. AI Reports
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT,
  content JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_type ON ai_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_ai_reports_generated_at ON ai_reports(generated_at);

-- =============================================================================
-- 3. AI Jobs
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT,
  status TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON ai_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_created_at ON ai_jobs(created_at);

-- =============================================================================
-- 4. Row Level Security & Policies
-- =============================================================================
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins (authenticated role) have full access — adjust for your auth model
DROP POLICY IF EXISTS "Admins have full access to ai_generations" ON ai_generations;
CREATE POLICY "Admins have full access to ai_generations" ON ai_generations FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins have full access to ai_reports" ON ai_reports;
CREATE POLICY "Admins have full access to ai_reports" ON ai_reports FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins have full access to ai_jobs" ON ai_jobs;
CREATE POLICY "Admins have full access to ai_jobs" ON ai_jobs FOR ALL USING (auth.role() = 'authenticated');

-- Public/Authenticated access as needed
DROP POLICY IF EXISTS "Authenticated users can insert generations" ON ai_generations;
CREATE POLICY "Authenticated users can insert generations" ON ai_generations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can select reports" ON ai_reports;
CREATE POLICY "Authenticated users can select reports" ON ai_reports FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage jobs" ON ai_jobs;
CREATE POLICY "Authenticated users can manage jobs" ON ai_jobs FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================================
-- 5. Grants
-- =============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_generations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_jobs TO authenticated;

GRANT ALL ON ai_generations TO service_role;
GRANT ALL ON ai_reports TO service_role;
GRANT ALL ON ai_jobs TO service_role;

-- =============================================================================
-- 6. Comments
-- =============================================================================
COMMENT ON TABLE ai_generations IS 'Stores AI generation outputs and metadata (newsletter, blog, social, enhancement, etc)';
COMMENT ON TABLE ai_reports IS 'Stores generated AI reports and metrics';
COMMENT ON TABLE ai_jobs IS 'Job queue and status for AI automation tasks';

-- Migration notes:
-- Apply this SQL in your Supabase SQL Editor or include in your migration pipeline.
-- Ensure pgcrypto extension is present for gen_random_uuid().
