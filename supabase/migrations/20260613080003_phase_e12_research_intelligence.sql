-- Phase E12: Research Intelligence Engine
-- Additive migration to enable research graph, summaries, recommendations, citation analysis, and paper similarity

-- Create research_papers table
CREATE TABLE IF NOT EXISTS research_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  abstract TEXT,
  arxiv_id TEXT UNIQUE,
  doi TEXT UNIQUE,
  published_date TIMESTAMPTZ,
  venue TEXT,
  citations INTEGER NOT NULL DEFAULT 0,
  domains TEXT[] NOT NULL DEFAULT '{}',
  technologies TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT,
  key_findings TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_papers_arxiv_id ON research_papers(arxiv_id);
CREATE INDEX IF NOT EXISTS idx_research_papers_doi ON research_papers(doi);
CREATE INDEX IF NOT EXISTS idx_research_papers_citations ON research_papers(citations DESC);
CREATE INDEX IF NOT EXISTS idx_research_papers_domains ON research_papers USING GIN(domains);
CREATE INDEX IF NOT EXISTS idx_research_papers_technologies ON research_papers USING GIN(technologies);

-- Create research_citations table
CREATE TABLE IF NOT EXISTS research_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citing_paper_id UUID NOT NULL REFERENCES research_papers(id) ON DELETE CASCADE,
  cited_paper_id UUID NOT NULL REFERENCES research_papers(id) ON DELETE CASCADE,
  citation_type TEXT NOT NULL CHECK (citation_type IN ('direct', 'indirect', 'self')),
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_citations_citing_paper ON research_citations(citing_paper_id);
CREATE INDEX IF NOT EXISTS idx_research_citations_cited_paper ON research_citations(cited_paper_id);
CREATE INDEX IF NOT EXISTS idx_research_citations_type ON research_citations(citation_type);

-- Create research_similarities table
CREATE TABLE IF NOT EXISTS research_similarities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id_1 UUID NOT NULL REFERENCES research_papers(id) ON DELETE CASCADE,
  paper_id_2 UUID NOT NULL REFERENCES research_papers(id) ON DELETE CASCADE,
  similarity_score NUMERIC(5, 2) NOT NULL,
  similarity_type TEXT NOT NULL CHECK (similarity_type IN ('content', 'citation', 'domain', 'methodology')),
  reasons TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_similarities_paper_1 ON research_similarities(paper_id_1);
CREATE INDEX IF NOT EXISTS idx_research_similarities_paper_2 ON research_similarities(paper_id_2);
CREATE INDEX IF NOT EXISTS idx_research_similarities_score ON research_similarities(similarity_score DESC);

-- RPC function to increment citation count
CREATE OR REPLACE FUNCTION increment_citation_count(paper_id_param UUID)
RETURNS VOID
AS $$
BEGIN
  UPDATE research_papers
  SET citations = citations + 1,
      updated_at = now()
  WHERE id = paper_id_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get papers by domain
CREATE OR REPLACE FUNCTION get_papers_by_domain(domain_param TEXT, limit_param INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  title TEXT,
  authors TEXT[],
  abstract TEXT,
  citations INTEGER,
  domains TEXT[],
  technologies TEXT[]
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.title,
    rp.authors,
    rp.abstract,
    rp.citations,
    rp.domains,
    rp.technologies
  FROM research_papers rp
  WHERE domain_param = ANY(rp.domains)
  ORDER BY rp.citations DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get papers by technology
CREATE OR REPLACE FUNCTION get_papers_by_technology(technology_param TEXT, limit_param INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  title TEXT,
  authors TEXT[],
  abstract TEXT,
  citations INTEGER,
  domains TEXT[],
  technologies TEXT[]
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.title,
    rp.authors,
    rp.abstract,
    rp.citations,
    rp.domains,
    rp.technologies
  FROM research_papers rp
  WHERE technology_param = ANY(rp.technologies)
  ORDER BY rp.citations DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get research statistics
CREATE OR REPLACE FUNCTION get_research_statistics()
RETURNS TABLE(
  total_papers INTEGER,
  total_citations INTEGER,
  avg_citations NUMERIC,
  top_domain TEXT,
  top_technology TEXT
)
AS $$
DECLARE
  top_domain_rec RECORD;
  top_tech_rec RECORD;
BEGIN
  SELECT COUNT(*) INTO total_papers FROM research_papers;
  SELECT SUM(citations) INTO total_citations FROM research_papers;
  SELECT AVG(citations) INTO avg_citations FROM research_papers;
  
  SELECT unnest(domains) AS domain, COUNT(*) INTO top_domain_rec
  FROM research_papers
  GROUP BY domain
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  SELECT unnest(technologies) AS technology, COUNT(*) INTO top_tech_rec
  FROM research_papers
  GROUP BY technology
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  RETURN QUERY
  SELECT 
    total_papers,
    COALESCE(total_citations, 0),
    COALESCE(avg_citations, 0),
    COALESCE(top_domain_rec.domain, 'N/A'),
    COALESCE(top_tech_rec.technology, 'N/A');
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE research_papers IS 'Stores research papers with metadata, citations, and analysis';
COMMENT ON TABLE research_citations IS 'Stores citation relationships between research papers';
COMMENT ON TABLE research_similarities IS 'Stores similarity scores between research papers';
COMMENT ON FUNCTION increment_citation_count IS 'Increment citation count for a paper';
COMMENT ON FUNCTION get_papers_by_domain IS 'Get papers filtered by domain';
COMMENT ON FUNCTION get_papers_by_technology IS 'Get papers filtered by technology';
COMMENT ON FUNCTION get_research_statistics IS 'Get overall research statistics';
