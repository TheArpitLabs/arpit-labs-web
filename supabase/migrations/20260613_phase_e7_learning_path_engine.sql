-- Phase E7: Learning Path Engine
-- Additive migration to enable learning path functionality

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('technologies', 'frameworks', 'domains', 'tools', 'general')),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  description TEXT,
  related_skills TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_level ON skills(level);

-- Create skill_relationships table
CREATE TABLE IF NOT EXISTS skill_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  related_entity_id TEXT NOT NULL,
  related_entity_type TEXT NOT NULL CHECK (related_entity_type IN ('skill', 'project', 'resource', 'dataset')),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('prerequisite', 'requires', 'related_to', 'builds_on')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_relationships_skill_id ON skill_relationships(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_relationships_entity ON skill_relationships(related_entity_id, related_entity_type);
CREATE INDEX IF NOT EXISTS idx_skill_relationships_type ON skill_relationships(relationship_type);

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  path_type TEXT NOT NULL CHECK (path_type IN ('beginner', 'intermediate', 'advanced', 'expert')),
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_estimated_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, path_type)
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_project_id ON learning_paths(project_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_type ON learning_paths(path_type);

-- Create career_tracks table
CREATE TABLE IF NOT EXISTS career_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  recommended_skills TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_duration INTEGER NOT NULL DEFAULT 0,
  domains TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_tracks_name ON career_tracks(name);
CREATE INDEX IF NOT EXISTS idx_career_tracks_difficulty ON career_tracks(difficulty);
CREATE INDEX IF NOT EXISTS idx_career_tracks_domains ON career_tracks USING GIN(domains);

-- Create user_learning_progress table
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  career_track_id UUID REFERENCES career_tracks(id) ON DELETE CASCADE,
  progress_type TEXT NOT NULL CHECK (progress_type IN ('project_completed', 'skill_learned', 'path_completed', 'track_progress')),
  progress_value INTEGER NOT NULL DEFAULT 0 CHECK (progress_value >= 0 AND progress_value <= 100),
  metadata JSONB DEFAULT '{}'::JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_project_id ON user_learning_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_skill_id ON user_learning_progress(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_track_id ON user_learning_progress(career_track_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_type ON user_learning_progress(progress_type);

-- Create learning_recommendations table
CREATE TABLE IF NOT EXISTS learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('project', 'skill', 'career_track', 'learning_path')),
  recommended_entity_id TEXT NOT NULL,
  recommended_entity_type TEXT NOT NULL,
  reason TEXT,
  score NUMERIC(5,2) DEFAULT 0.0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user_id ON learning_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_type ON learning_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_expires_at ON learning_recommendations(expires_at);

-- RPC function to get skills for a project
CREATE OR REPLACE FUNCTION get_project_skills(project_id_param UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  category TEXT,
  level TEXT,
  description TEXT,
  related_skills TEXT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.category,
    s.level,
    s.description,
    s.related_skills
  FROM skill_relationships sr
  INNER JOIN skills s ON sr.skill_id = s.id
  WHERE sr.related_entity_id = project_id_param::TEXT
    AND sr.related_entity_type = 'project'
    AND sr.relationship_type = 'requires'
  ORDER BY s.level;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get learning path for a project
CREATE OR REPLACE FUNCTION get_learning_path(project_id_param UUID, path_type_param TEXT DEFAULT 'intermediate')
RETURNS TABLE(
  id UUID,
  project_id UUID,
  path_type TEXT,
  steps JSONB,
  total_estimated_time INTEGER
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id,
    lp.project_id,
    lp.path_type,
    lp.steps,
    lp.total_estimated_time
  FROM learning_paths lp
  WHERE lp.project_id = project_id_param
    AND lp.path_type = path_type_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get user progress
CREATE OR REPLACE FUNCTION get_user_learning_progress(user_id_param UUID)
RETURNS TABLE(
  id UUID,
  project_id UUID,
  skill_id UUID,
  career_track_id UUID,
  progress_type TEXT,
  progress_value INTEGER,
  completed_at TIMESTAMPTZ
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ulp.id,
    ulp.project_id,
    ulp.skill_id,
    ulp.career_track_id,
    ulp.progress_type,
    ulp.progress_value,
    ulp.completed_at
  FROM user_learning_progress ulp
  WHERE ulp.user_id = user_id_param
  ORDER BY ulp.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get career track progress
CREATE OR REPLACE FUNCTION get_career_track_progress(user_id_param UUID, track_id_param UUID)
RETURNS TABLE(
  track_id UUID,
  track_name TEXT,
  progress NUMERIC,
  completed_skills TEXT[],
  missing_skills TEXT[]
)
AS $$
DECLARE
  track_record RECORD;
  user_skills TEXT[] := '{}';
  completed_skills TEXT[] := '{}';
  missing_skills TEXT[] := '{}';
  progress_value NUMERIC;
BEGIN
  -- Get career track
  SELECT * INTO track_record
  FROM career_tracks
  WHERE id = track_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Get user's completed skills
  SELECT ARRAY_AGG(skill_id::TEXT) INTO user_skills
  FROM user_learning_progress
  WHERE user_id = user_id_param
    AND progress_type = 'skill_learned'
    AND progress_value = 100;
  
  -- Calculate completed and missing skills
  FOREACH skill_req IN ARRAY track_record.required_skills LOOP
    IF skill_req = ANY(user_skills) THEN
      completed_skills := array_append(completed_skills, skill_req);
    ELSE
      missing_skills := array_append(missing_skills, skill_req);
    END IF;
  END LOOP;
  
  -- Calculate progress
  progress_value := (array_length(completed_skills, 1)::NUMERIC / array_length(track_record.required_skills, 1)::NUMERIC) * 100;
  
  RETURN QUERY
  SELECT 
    track_record.id,
    track_record.name,
    COALESCE(progress_value, 0),
    completed_skills,
    missing_skills;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get learning recommendations
CREATE OR REPLACE FUNCTION get_learning_recommendations(user_id_param UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  recommendation_type TEXT,
  recommended_entity_id TEXT,
  recommended_entity_type TEXT,
  reason TEXT,
  score NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lr.id,
    lr.recommendation_type,
    lr.recommended_entity_id,
    lr.recommended_entity_type,
    lr.reason,
    lr.score
  FROM learning_recommendations lr
  WHERE lr.user_id = user_id_param
    AND (lr.expires_at IS NULL OR lr.expires_at > now())
  ORDER BY lr.score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE skills IS 'Stores skills extracted from projects, research, and resources';
COMMENT ON TABLE skill_relationships IS 'Stores relationships between skills and other entities';
COMMENT ON TABLE learning_paths IS 'Stores generated learning paths for projects';
COMMENT ON TABLE career_tracks IS 'Defines career tracks with required and recommended skills';
COMMENT ON TABLE user_learning_progress IS 'Tracks user progress on projects, skills, and career tracks';
COMMENT ON TABLE learning_recommendations IS 'Stores AI-generated learning recommendations for users';

COMMENT ON FUNCTION get_project_skills IS 'Get skills required for a project';
COMMENT ON FUNCTION get_learning_path IS 'Get learning path for a project';
COMMENT ON FUNCTION get_user_learning_progress IS 'Get user learning progress';
COMMENT ON FUNCTION get_career_track_progress IS 'Get user progress on a career track';
COMMENT ON FUNCTION get_learning_recommendations IS 'Get learning recommendations for a user';
