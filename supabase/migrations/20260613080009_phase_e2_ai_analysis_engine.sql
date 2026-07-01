-- Phase E2: AI Project Analysis Engine
-- Additive migration to enhance content_acquisition_queue with AI analysis fields

-- Add new columns for enhanced AI analysis
ALTER TABLE content_acquisition_queue 
ADD COLUMN IF NOT EXISTS executive_summary TEXT,
ADD COLUMN IF NOT EXISTS technical_summary TEXT,
ADD COLUMN IF NOT EXISTS engineering_overview TEXT,
ADD COLUMN IF NOT EXISTS tech_stack JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
ADD COLUMN IF NOT EXISTS difficulty_reasoning TEXT,
ADD COLUMN IF NOT EXISTS domains TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS learning_outcomes JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS architecture_components JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS architecture_data_flow TEXT,
ADD COLUMN IF NOT EXISTS architecture_system_overview TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis_status TEXT DEFAULT 'pending' CHECK (ai_analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Add indexes for analysis queries
CREATE INDEX IF NOT EXISTS idx_acquisition_ai_status ON content_acquisition_queue(ai_analysis_status);
CREATE INDEX IF NOT EXISTS idx_acquisition_difficulty ON content_acquisition_queue(difficulty);
CREATE INDEX IF NOT EXISTS idx_acquisition_domains ON content_acquisition_queue USING GIN(domains);

-- Add comment for documentation
COMMENT ON COLUMN content_acquisition_queue.executive_summary IS 'AI-generated executive summary of the project';
COMMENT ON COLUMN content_acquisition_queue.technical_summary IS 'AI-generated technical summary focusing on implementation details';
COMMENT ON COLUMN content_acquisition_queue.engineering_overview IS 'AI-generated engineering overview with architectural insights';
COMMENT ON COLUMN content_acquisition_queue.tech_stack IS 'Detected tech stack organized by category (languages, frameworks, databases, cloud, libraries)';
COMMENT ON COLUMN content_acquisition_queue.difficulty IS 'AI-assessed difficulty level: beginner, intermediate, advanced, or expert';
COMMENT ON COLUMN content_acquisition_queue.difficulty_reasoning IS 'AI reasoning for the difficulty assessment';
COMMENT ON COLUMN content_acquisition_queue.domains IS 'Classified engineering domains (AI, ML, IoT, Cybersecurity, Robotics, Cloud, DevOps, Web, Mobile, Research)';
COMMENT ON COLUMN content_acquisition_queue.learning_outcomes IS 'AI-generated learning outcomes for students studying this project';
COMMENT ON COLUMN content_acquisition_queue.architecture_components IS 'Identified system components and their roles';
COMMENT ON COLUMN content_acquisition_queue.architecture_data_flow IS 'Description of data flow between components';
COMMENT ON COLUMN content_acquisition_queue.architecture_system_overview IS 'High-level system architecture overview';
COMMENT ON COLUMN content_acquisition_queue.ai_analysis_status IS 'Status of AI analysis: pending, analyzing, completed, or failed';
COMMENT ON COLUMN content_acquisition_queue.ai_analyzed_at IS 'Timestamp when AI analysis was completed';
