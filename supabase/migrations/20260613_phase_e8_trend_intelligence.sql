-- Phase E8: Trend Intelligence Engine
-- Additive migration to enable trend tracking and analysis

-- Create trends table
CREATE TABLE IF NOT EXISTS trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technology', 'domain', 'research', 'contributor', 'project')),
  score NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
  momentum NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
  velocity NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down', 'stable')) DEFAULT 'stable',
  timeframe TEXT NOT NULL CHECK (timeframe IN ('daily', 'weekly', 'monthly', 'quarterly')) DEFAULT 'weekly',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, category, timeframe)
);

CREATE INDEX IF NOT EXISTS idx_trends_name ON trends(name);
CREATE INDEX IF NOT EXISTS idx_trends_category ON trends(category);
CREATE INDEX IF NOT EXISTS idx_trends_score ON trends(score DESC);
CREATE INDEX IF NOT EXISTS idx_trends_direction ON trends(direction);
CREATE INDEX IF NOT EXISTS idx_trends_timeframe ON trends(timeframe);

-- Create trend_history table for historical data
CREATE TABLE IF NOT EXISTS trend_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technology', 'domain', 'research', 'contributor', 'project')),
  value NUMERIC(10, 2) NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trend_history_name ON trend_history(name);
CREATE INDEX IF NOT EXISTS idx_trend_history_category ON trend_history(category);
CREATE INDEX IF NOT EXISTS idx_trend_history_timestamp ON trend_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trend_history_name_category_timestamp ON trend_history(name, category, timestamp DESC);

-- RPC function to get top trends by category
CREATE OR REPLACE FUNCTION get_top_trends(category_param TEXT DEFAULT NULL, limit_param INTEGER DEFAULT 50)
RETURNS TABLE(
  id UUID,
  name TEXT,
  category TEXT,
  score NUMERIC,
  momentum NUMERIC,
  velocity NUMERIC,
  direction TEXT,
  timeframe TEXT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.category,
    t.score,
    t.momentum,
    t.velocity,
    t.direction,
    t.timeframe
  FROM trends t
  WHERE (category_param IS NULL OR t.category = category_param)
  ORDER BY t.score DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get trend history
CREATE OR REPLACE FUNCTION get_trend_history(name_param TEXT, category_param TEXT, days_param INTEGER DEFAULT 30)
RETURNS TABLE(
  timestamp TIMESTAMPTZ,
  value NUMERIC,
  count INTEGER
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    th.timestamp,
    th.value,
    th.count
  FROM trend_history th
  WHERE th.name = name_param
    AND th.category = category_param
    AND th.timestamp >= now() - (days_param || ' days')::INTERVAL
  ORDER BY th.timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- RPC function to calculate trend metrics
CREATE OR REPLACE FUNCTION calculate_trend_metrics(name_param TEXT, category_param TEXT)
RETURNS TABLE(
  current_score NUMERIC,
  avg_momentum NUMERIC,
  avg_velocity NUMERIC,
  direction TEXT,
  data_points INTEGER
)
AS $$
DECLARE
  current_score_val NUMERIC;
  avg_momentum_val NUMERIC;
  avg_velocity_val NUMERIC;
  direction_val TEXT;
  data_points_val INTEGER;
BEGIN
  SELECT 
    t.score,
    AVG(t.momentum),
    AVG(t.velocity),
    t.direction,
    COUNT(*)
  INTO current_score_val, avg_momentum_val, avg_velocity_val, direction_val, data_points_val
  FROM trends t
  WHERE t.name = name_param
    AND t.category = category_param
  GROUP BY t.score, t.direction;
  
  RETURN QUERY
  SELECT 
    COALESCE(current_score_val, 0),
    COALESCE(avg_momentum_val, 0),
    COALESCE(avg_velocity_val, 0),
    COALESCE(direction_val, 'stable'),
    COALESCE(data_points_val, 0);
END;
$$ LANGUAGE plpgsql;

-- RPC function to get emerging domains
CREATE OR REPLACE FUNCTION get_emerging_domains(limit_param INTEGER DEFAULT 10)
RETURNS TABLE(
  name TEXT,
  score NUMERIC,
  momentum NUMERIC,
  direction TEXT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.name,
    t.score,
    t.momentum,
    t.direction
  FROM trends t
  WHERE t.category = 'domain'
    AND t.direction = 'up'
    AND t.momentum > 0.5
  ORDER BY t.momentum DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to compare trends across timeframes
CREATE OR REPLACE FUNCTION compare_trend_timeframes(name_param TEXT, category_param TEXT)
RETURNS TABLE(
  daily_score NUMERIC,
  weekly_score NUMERIC,
  monthly_score NUMERIC,
  quarterly_score NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((SELECT t.score FROM trends t WHERE t.name = name_param AND t.category = category_param AND t.timeframe = 'daily' LIMIT 1), 0),
    COALESCE((SELECT t.score FROM trends t WHERE t.name = name_param AND t.category = category_param AND t.timeframe = 'weekly' LIMIT 1), 0),
    COALESCE((SELECT t.score FROM trends t WHERE t.name = name_param AND t.category = category_param AND t.timeframe = 'monthly' LIMIT 1), 0),
    COALESCE((SELECT t.score FROM trends t WHERE t.name = name_param AND t.category = category_param AND t.timeframe = 'quarterly' LIMIT 1), 0);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE trends IS 'Stores trend data for technologies, domains, research, contributors, and projects';
COMMENT ON TABLE trend_history IS 'Stores historical trend data points for analysis';
COMMENT ON FUNCTION get_top_trends IS 'Get top trends by category with optional limit';
COMMENT ON FUNCTION get_trend_history IS 'Get historical trend data for a specific trend';
COMMENT ON FUNCTION calculate_trend_metrics IS 'Calculate aggregate trend metrics';
COMMENT ON FUNCTION get_emerging_domains IS 'Get domains with upward momentum';
COMMENT ON FUNCTION compare_trend_timeframes IS 'Compare trend scores across different timeframes';
