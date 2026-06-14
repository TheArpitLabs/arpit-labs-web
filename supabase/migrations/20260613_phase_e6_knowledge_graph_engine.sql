-- Phase E6: Knowledge Graph Engine
-- Additive migration to enable knowledge graph functionality

-- Create graph_entities table
CREATE TABLE IF NOT EXISTS graph_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'research', 'dataset', 'resource', 'technology', 'contributor', 'organization', 'hackathon', 'learning_path')),
  title TEXT NOT NULL,
  slug TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_graph_entities_unique ON graph_entities(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_graph_entities_type ON graph_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_graph_entities_title ON graph_entities USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_graph_entities_slug ON graph_entities(slug);

-- Create graph_relationships table
CREATE TABLE IF NOT EXISTS graph_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity_id UUID NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
  to_entity_id UUID NOT NULL REFERENCES graph_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  weight NUMERIC(5,2) DEFAULT 1.0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_graph_relationships_from ON graph_relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_graph_relationships_to ON graph_relationships(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_graph_relationships_type ON graph_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_graph_relationships_weight ON graph_relationships(weight DESC);

-- Create graph_entity_types table for type definitions
CREATE TABLE IF NOT EXISTS graph_entity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create graph_metrics table for tracking graph statistics
CREATE TABLE IF NOT EXISTS graph_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('count', 'average', 'sum', 'min', 'max')),
  entity_type TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_graph_metrics_name ON graph_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_graph_metrics_type ON graph_metrics(entity_type);
CREATE INDEX IF NOT EXISTS idx_graph_metrics_recorded_at ON graph_metrics(recorded_at DESC);

-- Insert default entity types
INSERT INTO graph_entity_types (type_name, display_name, description, color, icon) VALUES
  ('project', 'Project', 'Software projects and applications', '#3b82f6', 'code'),
  ('research', 'Research', 'Research papers and publications', '#8b5cf6', 'file-text'),
  ('dataset', 'Dataset', 'Datasets and benchmarks', '#10b981', 'database'),
  ('resource', 'Resource', 'Learning resources and documentation', '#f59e0b', 'book'),
  ('technology', 'Technology', 'Technologies, frameworks, and tools', '#ef4444', 'cpu'),
  ('contributor', 'Contributor', 'Contributors and developers', '#ec4899', 'users'),
  ('organization', 'Organization', 'Organizations and companies', '#6366f1', 'building'),
  ('hackathon', 'Hackathon', 'Hackathons and competitions', '#14b8a6', 'trophy'),
  ('learning_path', 'Learning Path', 'Structured learning paths', '#f97316', 'graduation-cap')
ON CONFLICT (type_name) DO NOTHING;

-- RPC function to get related entities
CREATE OR REPLACE FUNCTION get_related_entities(
  entity_id_param TEXT,
  entity_type_param TEXT,
  relationship_type_param TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  entity_id TEXT,
  entity_type TEXT,
  title TEXT,
  slug TEXT,
  metadata JSONB,
  relationship_type TEXT,
  weight NUMERIC
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ge.id,
    ge.entity_id,
    ge.entity_type,
    ge.title,
    ge.slug,
    ge.metadata,
    gr.relationship_type,
    gr.weight
  FROM graph_relationships gr
  INNER JOIN graph_entities ge ON gr.to_entity_id = ge.id
  INNER JOIN graph_entities source ON gr.from_entity_id = source.id
  WHERE source.entity_id = entity_id_param
    AND source.entity_type = entity_type_param
    AND (relationship_type_param IS NULL OR gr.relationship_type = relationship_type_param)
  ORDER BY gr.weight DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- RPC function to find path between entities
CREATE OR REPLACE FUNCTION find_entity_path(
  from_entity_id_param TEXT,
  to_entity_id_param TEXT,
  max_depth_param INTEGER DEFAULT 5
)
RETURNS TABLE(
  path_entity_ids TEXT[],
  path_relationship_types TEXT[],
  total_weight NUMERIC
)
AS $$
DECLARE
  visited_ids TEXT[] := ARRAY[from_entity_id_param];
  current_paths TEXT[][] := ARRAY[ARRAY[from_entity_id_param]];
  current_weights NUMERIC[] := ARRAY[0.0];
  current_rels TEXT[][] := ARRAY[ARRAY[]::TEXT[]];
  found_path BOOLEAN := FALSE;
  result_path TEXT[];
  result_rels TEXT[];
  result_weight NUMERIC;
BEGIN
  -- Simple BFS to find path
  FOR i IN 1..max_depth_param LOOP
    EXIT WHEN found_path OR array_length(current_paths, 1) = 0;
    
    DECLARE
      new_paths TEXT[][] := '{}';
      new_weights NUMERIC[] := '{}';
      new_rels TEXT[][] := '{}';
    BEGIN
      FOR j IN 1..array_length(current_paths, 1) LOOP
        DECLARE
          current_path TEXT[];
          current_weight NUMERIC;
          current_rels TEXT[];
          last_entity_id TEXT;
        BEGIN
          current_path := current_paths[j];
          current_weight := current_weights[j];
          current_rels := current_rels[j];
          last_entity_id := current_path[array_length(current_path, 1)];
          
          -- Get related entities
          FOR rec IN 
            SELECT ge.entity_id, gr.relationship_type, gr.weight
            FROM graph_relationships gr
            INNER JOIN graph_entities ge ON gr.to_entity_id = ge.id
            INNER JOIN graph_entities source ON gr.from_entity_id = source.id
            WHERE source.entity_id = last_entity_id
              AND NOT (ge.entity_id = ANY(visited_ids))
          LOOP
            -- Check if we found the target
            IF rec.entity_id = to_entity_id_param THEN
              found_path := TRUE;
              result_path := array_append(current_path, rec.entity_id);
              result_rels := array_append(current_rels, rec.relationship_type);
              result_weight := current_weight + rec.weight;
              EXIT;
            END IF;
            
            -- Add to queue for next iteration
            new_paths := array_append(new_paths, array_append(current_path, rec.entity_id));
            new_weights := array_append(new_weights, current_weight + rec.weight);
            new_rels := array_append(new_rels, array_append(current_rels, rec.relationship_type));
            visited_ids := array_append(visited_ids, rec.entity_id);
          END LOOP;
          
          EXIT WHEN found_path;
        END;
      END LOOP;
      
      current_paths := new_paths;
      current_weights := new_weights;
      current_rels := new_rels;
    END;
  END LOOP;
  
  IF found_path THEN
    RETURN QUERY SELECT result_path, result_rels, result_weight;
  ELSE
    RETURN QUERY SELECT NULL::TEXT[], NULL::TEXT[], NULL::NUMERIC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get graph statistics
CREATE OR REPLACE FUNCTION get_graph_statistics()
RETURNS TABLE(
  total_entities BIGINT,
  total_relationships BIGINT,
  entity_type TEXT,
  entity_count BIGINT,
  relationship_type TEXT,
  relationship_count BIGINT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM graph_entities) as total_entities,
    (SELECT COUNT(*) FROM graph_relationships) as total_relationships,
    ge.entity_type,
    COUNT(*) as entity_count,
    NULL::TEXT as relationship_type,
    NULL::BIGINT as relationship_count
  FROM graph_entities ge
  GROUP BY ge.entity_type
  
  UNION ALL
  
  SELECT 
    (SELECT COUNT(*) FROM graph_entities) as total_entities,
    (SELECT COUNT(*) FROM graph_relationships) as total_relationships,
    NULL::TEXT as entity_type,
    NULL::BIGINT as entity_count,
    gr.relationship_type,
    COUNT(*) as relationship_count
  FROM graph_relationships gr
  GROUP BY gr.relationship_type;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get most connected entities
CREATE OR REPLACE FUNCTION get_most_connected_entities(
  entity_type_param TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  entity_id UUID,
  entity_type TEXT,
  title TEXT,
  connection_count BIGINT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ge.id as entity_id,
    ge.entity_type,
    ge.title,
    COUNT(gr.to_entity_id) as connection_count
  FROM graph_entities ge
  LEFT JOIN graph_relationships gr ON ge.id = gr.from_entity_id
  WHERE ge.entity_type = entity_type_param
  GROUP BY ge.id, ge.entity_type, ge.title
  ORDER BY connection_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- RPC function to search entities
CREATE OR REPLACE FUNCTION search_graph_entities(
  search_query TEXT,
  entity_type_param TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  entity_id TEXT,
  entity_type TEXT,
  title TEXT,
  slug TEXT,
  metadata JSONB
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ge.id,
    ge.entity_id,
    ge.entity_type,
    ge.title,
    ge.slug,
    ge.metadata
  FROM graph_entities ge
  WHERE 
    (entity_type_param IS NULL OR ge.entity_type = entity_type_param)
    AND (ge.title ILIKE '%' || search_query || '%' 
         OR ge.metadata::text ILIKE '%' || search_query || '%')
  ORDER BY 
    CASE 
      WHEN ge.title ILIKE search_query || '%' THEN 1
      WHEN ge.title ILIKE '%' || search_query THEN 2
      ELSE 3
    END
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE graph_entities IS 'Stores all entities in the knowledge graph';
COMMENT ON TABLE graph_relationships IS 'Stores relationships between entities';
COMMENT ON TABLE graph_entity_types IS 'Defines entity types with metadata';
COMMENT ON TABLE graph_metrics IS 'Stores graph metrics and statistics';

COMMENT ON FUNCTION get_related_entities IS 'Get entities related to a given entity';
COMMENT ON FUNCTION find_entity_path IS 'Find path between two entities in the graph';
COMMENT ON FUNCTION get_graph_statistics IS 'Get overall graph statistics';
COMMENT ON FUNCTION get_most_connected_entities IS 'Get most connected entities by type';
COMMENT ON FUNCTION search_graph_entities IS 'Search entities by title and metadata';
