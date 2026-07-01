-- Phase E9: Contributor Intelligence Engine
-- Additive migration to enable unified contributor profiles and scoring

-- Create contributor_profiles table
CREATE TABLE IF NOT EXISTS contributor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unified_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}'::JSONB,
  scores JSONB DEFAULT '{}'::JSONB,
  stats JSONB DEFAULT '{}'::JSONB,
  expertise TEXT[] NOT NULL DEFAULT '{}',
  domains TEXT[] NOT NULL DEFAULT '{}',
  technologies TEXT[] NOT NULL DEFAULT '{}',
  contributor_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  expertise_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  contribution_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  research_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  overall_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributor_profiles_unified_id ON contributor_profiles(unified_id);
CREATE INDEX IF NOT EXISTS idx_contributor_profiles_username ON contributor_profiles(username);
CREATE INDEX IF NOT EXISTS idx_contributor_profiles_overall_score ON contributor_profiles(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_contributor_profiles_contributor_score ON contributor_profiles(contributor_score DESC);
CREATE INDEX IF NOT EXISTS idx_contributor_profiles_expertise_score ON contributor_profiles(expertise_score DESC);
CREATE INDEX IF NOT EXISTS idx_contributor_profiles_contribution_score ON contributor_profiles(contribution_score DESC);
CREATE INDEX IF NOT EXISTS idx_contributor_profiles_research_score ON contributor_profiles(research_score DESC);
CREATE INDEX IF NOT EXISTS idx_contributor_profiles_domains ON contributor_profiles USING GIN(domains);
CREATE INDEX IF NOT EXISTS idx_contributor_profiles_technologies ON contributor_profiles USING GIN(technologies);

-- Create contributor_sources table
CREATE TABLE IF NOT EXISTS contributor_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES contributor_profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('github', 'gitlab', 'research', 'hackathon', 'marketplace')),
  source_id TEXT NOT NULL,
  username TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributor_sources_contributor_id ON contributor_sources(contributor_id);
CREATE INDEX IF NOT EXISTS idx_contributor_sources_source ON contributor_sources(source);
CREATE INDEX IF NOT EXISTS idx_contributor_sources_source_id ON contributor_sources(source_id);
CREATE INDEX IF NOT EXISTS idx_contributor_sources_synced_at ON contributor_sources(synced_at DESC);

-- RPC function to get top contributors by score
CREATE OR REPLACE FUNCTION get_top_contributors(score_type TEXT DEFAULT 'overall', limit_param INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  unified_id TEXT,
  username TEXT,
  display_name TEXT,
  avatar TEXT,
  score NUMERIC,
  stats JSONB,
  expertise TEXT[],
  domains TEXT[],
  technologies TEXT[]
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.unified_id,
    cp.username,
    cp.display_name,
    cp.avatar,
    CASE 
      WHEN score_type = 'overall' THEN cp.overall_score
      WHEN score_type = 'contributor' THEN cp.contributor_score
      WHEN score_type = 'expertise' THEN cp.expertise_score
      WHEN score_type = 'contribution' THEN cp.contribution_score
      WHEN score_type = 'research' THEN cp.research_score
      ELSE cp.overall_score
    END AS score,
    cp.stats,
    cp.expertise,
    cp.domains,
    cp.technologies
  FROM contributor_profiles cp
  ORDER BY 
    CASE 
      WHEN score_type = 'overall' THEN cp.overall_score
      WHEN score_type = 'contributor' THEN cp.contributor_score
      WHEN score_type = 'expertise' THEN cp.expertise_score
      WHEN score_type = 'contribution' THEN cp.contribution_score
      WHEN score_type = 'research' THEN cp.research_score
      ELSE cp.overall_score
    END DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get contributor by unified ID
CREATE OR REPLACE FUNCTION get_contributor_by_unified_id(unified_id_param TEXT)
RETURNS TABLE(
  id UUID,
  unified_id TEXT,
  username TEXT,
  display_name TEXT,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB,
  scores JSONB,
  stats JSONB,
  expertise TEXT[],
  domains TEXT[],
  technologies TEXT[],
  overall_score NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.unified_id,
    cp.username,
    cp.display_name,
    cp.avatar,
    cp.bio,
    cp.location,
    cp.website,
    cp.social_links,
    jsonb_build_object(
      'contributor', cp.contributor_score,
      'expertise', cp.expertise_score,
      'contribution', cp.contribution_score,
      'research', cp.research_score,
      'overall', cp.overall_score
    ) AS scores,
    cp.stats,
    cp.expertise,
    cp.domains,
    cp.technologies,
    cp.overall_score
  FROM contributor_profiles cp
  WHERE cp.unified_id = unified_id_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get contributors by domain
CREATE OR REPLACE FUNCTION get_contributors_by_domain(domain_param TEXT, limit_param INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  unified_id TEXT,
  username TEXT,
  display_name TEXT,
  avatar TEXT,
  overall_score NUMERIC,
  expertise_score NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.unified_id,
    cp.username,
    cp.display_name,
    cp.avatar,
    cp.overall_score,
    cp.expertise_score
  FROM contributor_profiles cp
  WHERE domain_param = ANY(cp.domains)
  ORDER BY cp.overall_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get contributors by technology
CREATE OR REPLACE FUNCTION get_contributors_by_technology(technology_param TEXT, limit_param INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  unified_id TEXT,
  username TEXT,
  display_name TEXT,
  avatar TEXT,
  overall_score NUMERIC,
  expertise_score NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.unified_id,
    cp.username,
    cp.display_name,
    cp.avatar,
    cp.overall_score,
    cp.expertise_score
  FROM contributor_profiles cp
  WHERE technology_param = ANY(cp.technologies)
  ORDER BY cp.overall_score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get contributor sources
CREATE OR REPLACE FUNCTION get_contributor_sources(contributor_id_param UUID)
RETURNS TABLE(
  id UUID,
  source TEXT,
  source_id TEXT,
  username TEXT,
  synced_at TIMESTAMPTZ
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.source,
    cs.source_id,
    cs.username,
    cs.synced_at
  FROM contributor_sources cs
  WHERE cs.contributor_id = contributor_id_param
  ORDER BY cs.synced_at DESC;
END;
$$ LANGUAGE plpgsql;

-- RPC function to recalculate contributor scores
CREATE OR REPLACE FUNCTION recalculate_contributor_scores(contributor_id_param UUID)
RETURNS TABLE(
  contributor_score NUMERIC,
  expertise_score NUMERIC,
  contribution_score NUMERIC,
  research_score NUMERIC,
  overall_score NUMERIC
)
AS $$
DECLARE
  contributor_record RECORD;
  contributor_score_val NUMERIC;
  expertise_score_val NUMERIC;
  contribution_score_val NUMERIC;
  research_score_val NUMERIC;
  overall_score_val NUMERIC;
BEGIN
  SELECT * INTO contributor_record FROM contributor_profiles WHERE id = contributor_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate scores based on stats
  contributor_score_val := LEAST(
    (contributor_record.stats->>'totalProjects')::INTEGER * 10 +
    (contributor_record.stats->>'totalStars')::NUMERIC * 0.5 +
    (contributor_record.stats->>'totalForks')::INTEGER * 1 +
    (contributor_record.stats->>'totalCommits')::INTEGER * 0.1 +
    (contributor_record.stats->>'totalPullRequests')::INTEGER * 2 +
    (contributor_record.stats->>'totalIssues')::INTEGER * 1,
    100
  );
  
  expertise_score_val := LEAST(
    array_length(contributor_record.domains, 1) * 10 +
    array_length(contributor_record.technologies, 1) * 5 +
    CASE 
      WHEN array_length(contributor_record.domains, 1) > 0 
      THEN (contributor_record.stats->>'totalProjects')::INTEGER / array_length(contributor_record.domains, 1) * 5
      ELSE 0
    END,
    100
  );
  
  contribution_score_val := LEAST(
    (contributor_record.stats->>'totalMarketplaceContributions')::INTEGER * 10 +
    (contributor_record.stats->>'totalHackathonParticipations')::INTEGER * 5 +
    (contributor_record.stats->>'totalPullRequests')::INTEGER * 2 +
    (contributor_record.stats->>'totalIssues')::INTEGER * 1,
    100
  );
  
  research_score_val := LEAST(
    (contributor_record.stats->>'totalResearchPapers')::INTEGER * 20,
    100
  );
  
  overall_score_val := (contributor_score_val + expertise_score_val + contribution_score_val + research_score_val) / 4;
  
  -- Update profile
  UPDATE contributor_profiles
  SET 
    contributor_score = contributor_score_val,
    expertise_score = expertise_score_val,
    contribution_score = contribution_score_val,
    research_score = research_score_val,
    overall_score = overall_score_val,
    updated_at = now()
  WHERE id = contributor_id_param;
  
  RETURN QUERY
  SELECT 
    contributor_score_val,
    expertise_score_val,
    contribution_score_val,
    research_score_val,
    overall_score_val;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE contributor_profiles IS 'Stores unified contributor profiles with scores and stats';
COMMENT ON TABLE contributor_sources IS 'Stores source links for unified contributor profiles';
COMMENT ON FUNCTION get_top_contributors IS 'Get top contributors by score type';
COMMENT ON FUNCTION get_contributor_by_unified_id IS 'Get contributor by unified ID';
COMMENT ON FUNCTION get_contributors_by_domain IS 'Get contributors by domain expertise';
COMMENT ON FUNCTION get_contributors_by_technology IS 'Get contributors by technology expertise';
COMMENT ON FUNCTION get_contributor_sources IS 'Get all sources for a contributor';
COMMENT ON FUNCTION recalculate_contributor_scores IS 'Recalculate all scores for a contributor';
