import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { tokenize } from "./text";
import { logger } from '@/lib/logger';

interface Project {
  id: string;
  title: string;
  slug: string;
  description?: string;
  domain?: string;
  difficulty?: string;
  tech_stack?: string[];
  author?: string;
  stars?: number;
  created_at?: string;
}

interface EmbeddingResult {
  id: string;
  content_id: string;
  content_type: string;
  similarity?: number;
}

interface SearchHistory {
  query: string;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
  mode?: "keyword" | "vector" | "hybrid" | "fulltext";
}

export interface SearchFilters {
  technology?: string[];
  domain?: string[];
  difficulty?: string[];
  category?: string[];
  author?: string[];
  organization?: string[];
  dateFrom?: string;
  dateTo?: string;
  minPopularity?: number;
  minQuality?: number;
}

export interface SearchResult {
  id: string;
  entityType: "project" | "research" | "resource" | "dataset" | "contributor" | "organization";
  entityId: string;
  title: string;
  description: string;
  url: string;
  score: number;
  relevanceScore: number;
  popularityScore: number;
  qualityScore: number;
  metadata: {
    domain?: string[];
    difficulty?: string;
    technology?: string[];
    author?: string;
    organization?: string;
    [key: string]: unknown;
  };
  highlights?: {
    title?: string;
    description?: string;
  };
}

export interface SearchAnalytics {
  queryId: string;
  query: string;
  mode: string;
  resultCount: number;
  avgScore: number;
  executionTime: number;
  timestamp: string;
}

/**
 * Enhanced Semantic Search Engine
 * Combines keyword, full text, vector, and hybrid search with advanced scoring
 */
export async function enhancedSearch(options: SearchOptions): Promise<{
  results: SearchResult[];
  analytics: SearchAnalytics;
}> {
  assertKnowledgeFeature("semanticSearch");

  const startTime = Date.now();
  const {
    query,
    limit = 10,
    offset = 0,
    filters = {},
    mode = "hybrid"
  } = options;

  // Execute search based on mode
  let results: SearchResult[] = [];

  switch (mode) {
    case "keyword":
      results = await keywordSearch(query, limit, offset, filters);
      break;
    case "vector":
      results = await vectorSearch(query, limit, offset, filters);
      break;
    case "fulltext":
      results = await fullTextSearch(query, limit, offset, filters);
      break;
    case "hybrid":
    default:
      results = await hybridSearch(query, limit, offset, filters);
      break;
  }

  // Apply filters
  if (Object.keys(filters).length > 0) {
    results = applyFilters(results, filters);
  }

  // Calculate final scores
  results = calculateFinalScores(results, query);

  // Sort and paginate
  results = results
    .sort((a, b) => b.score - a.score)
    .slice(offset, offset + limit);

  // Generate highlights
  results = generateHighlights(results, query);

  // Track analytics
  const analytics = await trackSearchAnalytics(query, mode, results, Date.now() - startTime);

  return { results, analytics };
}

/**
 * Keyword Search - Basic pattern matching
 */
async function keywordSearch(
  query: string,
  limit: number,
  _offset: number,
  _filters: SearchFilters
): Promise<SearchResult[]> {
  const tokens = tokenize(query);
  const patterns = tokens.slice(0, 3).map(t => `%${t}%`);

  const { data: projects } = await supabaseServer
    .from("projects")
    .select("id,title,slug,description,domain,difficulty,tech_stack,author,stars,created_at")
    .or(patterns.map(p => `title.ilike.${p}`).join(","))
    .limit(limit * 2);

  const results: SearchResult[] = (projects || []).map((project: any) => ({
    id: project.id,
    entityType: "project",
    entityId: project.id,
    title: project.title,
    description: project.description || "",
    url: `/projects/${project.slug}`,
    score: 0.6,
    relevanceScore: 0.6,
    popularityScore: Math.min(project.stars / 1000, 1),
    qualityScore: 0.5,
    metadata: {
      domain: project.domain ? [project.domain] : [],
      difficulty: project.difficulty,
      technology: project.tech_stack || [],
      author: project.author,
    },
  }));

  return results;
}

/**
 * Vector Search - Semantic similarity using embeddings
 */
async function vectorSearch(
  query: string,
  limit: number,
  _offset: number,
  _filters: SearchFilters
): Promise<SearchResult[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    // Search using pgvector
    const { data: embeddings } = await supabaseServer.rpc("search_content_embeddings", {
      query_embedding: queryEmbedding,
      match_count: limit * 2,
      similarity_threshold: 0.3,
    });

    if (!embeddings || embeddings.length === 0) {
      return [];
    }

    // Fetch full entity data
    const entityIds = embeddings.map((e: EmbeddingResult) => e.content_id).filter(Boolean);
    const { data: projects } = await supabaseServer
      .from("projects")
      .select("id,title,slug,description,domain,difficulty,tech_stack,author,stars")
      .in("id", entityIds);

    const projectMap = new Map((projects || []).map((p: Project) => [p.id, p]));

    const results: SearchResult[] = embeddings
      .filter((e: EmbeddingResult) => e.content_type === "project" && projectMap.has(e.content_id))
      .map((e: EmbeddingResult) => {
        const project = projectMap.get(e.content_id);
        if (!project) return null;
        
        const similarity = e.similarity || 0;
        return {
          id: e.id,
          entityType: "project",
          entityId: e.content_id,
          title: project.title,
          description: project.description || "",
          url: `/projects/${project.slug}`,
          score: similarity,
          relevanceScore: similarity,
          popularityScore: Math.min((project.stars || 0) / 1000, 1),
          qualityScore: 0.5,
          metadata: {
            domain: project.domain ? [project.domain] : [],
            difficulty: project.difficulty,
            technology: project.tech_stack || [],
            author: project.author,
          },
        };
      }).filter((r: SearchResult | null): r is SearchResult => r !== null);

    return results;
  } catch (error) {
    logger.error("Vector search failed:", error);
    return [];
  }
}

/**
 * Full Text Search - PostgreSQL full text search
 */
async function fullTextSearch(
  query: string,
  limit: number,
  _offset: number,
  _filters: SearchFilters
): Promise<SearchResult[]> {
  try {
    const { data: projects } = await supabaseServer
      .from("projects")
      .select("id,title,slug,description,domain,difficulty,tech_stack,author,stars")
      .textSearch("title", query)
      .limit(limit * 2);

    const results: SearchResult[] = (projects || []).map((project: Project) => ({
      id: project.id,
      entityType: "project",
      entityId: project.id,
      title: project.title,
      description: project.description || "",
      url: `/projects/${project.slug}`,
      score: 0.7,
      relevanceScore: 0.7,
      popularityScore: Math.min((project.stars || 0) / 1000, 1),
      qualityScore: 0.5,
      metadata: {
        domain: project.domain ? [project.domain] : [],
        difficulty: project.difficulty,
        technology: project.tech_stack || [],
        author: project.author,
      },
    }));

    return results;
  } catch (error) {
    logger.error("Full text search failed:", error);
    return [];
  }
}

/**
 * Hybrid Search - Combine multiple search methods with weighted scoring
 */
async function hybridSearch(
  query: string,
  limit: number,
  offset: number,
  filters: SearchFilters
): Promise<SearchResult[]> {
  // Run all search methods in parallel
  const [keywordResults, vectorResults, fullTextResults] = await Promise.all([
    keywordSearch(query, limit, offset, filters),
    vectorSearch(query, limit, offset, filters),
    fullTextSearch(query, limit, offset, filters),
  ]);

  // Merge and deduplicate results
  const merged = new Map<string, SearchResult>();

  for (const result of [...keywordResults, ...vectorResults, ...fullTextResults]) {
    const key = `${result.entityType}:${result.entityId}`;
    const existing = merged.get(key);

    if (existing) {
      // Weighted combination of scores
      const keywordWeight = 0.3;
      const vectorWeight = 0.5;
      const fullTextWeight = 0.2;

      const combinedScore = 
        (existing.relevanceScore * keywordWeight) +
        (result.relevanceScore * vectorWeight) +
        (existing.relevanceScore * fullTextWeight);

      merged.set(key, {
        ...existing,
        score: combinedScore,
        relevanceScore: combinedScore,
      });
    } else {
      merged.set(key, result);
    }
  }

  return Array.from(merged.values());
}

/**
 * Apply filters to search results
 */
function applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
  return results.filter(result => {
    // Technology filter
    if (filters.technology && filters.technology.length > 0) {
      const hasTechnology = filters.technology.some(tech =>
        result.metadata.technology?.some(t => 
          t.toLowerCase().includes(tech.toLowerCase())
        )
      );
      if (!hasTechnology) return false;
    }

    // Domain filter
    if (filters.domain && filters.domain.length > 0) {
      const hasDomain = filters.domain.some(d =>
        result.metadata.domain?.includes(d)
      );
      if (!hasDomain) return false;
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty.length > 0) {
      if (!result.metadata.difficulty || !filters.difficulty.includes(result.metadata.difficulty)) {
        return false;
      }
    }

    // Author filter
    if (filters.author && filters.author.length > 0) {
      if (!result.metadata.author || !filters.author.includes(result.metadata.author)) {
        return false;
      }
    }

    // Organization filter
    if (filters.organization && filters.organization.length > 0) {
      if (!result.metadata.organization || !filters.organization.includes(result.metadata.organization)) {
        return false;
      }
    }

    // Popularity filter
    if (filters.minPopularity !== undefined) {
      if (result.popularityScore < filters.minPopularity) return false;
    }

    // Quality filter
    if (filters.minQuality !== undefined) {
      if (result.qualityScore < filters.minQuality) return false;
    }

    return true;
  });
}

/**
 * Calculate final scores combining relevance, popularity, and quality
 */
function calculateFinalScores(results: SearchResult[], _query: string): SearchResult[] {
  return results.map(result => {
    const relevanceWeight = 0.6;
    const popularityWeight = 0.25;
    const qualityWeight = 0.15;

    const finalScore = 
      (result.relevanceScore * relevanceWeight) +
      (result.popularityScore * popularityWeight) +
      (result.qualityScore * qualityWeight);

    return {
      ...result,
      score: finalScore,
    };
  });
}

/**
 * Generate search highlights
 */
function generateHighlights(results: SearchResult[], query: string): SearchResult[] {
  const tokens = tokenize(query);

  return results.map(result => {
    const titleLower = result.title.toLowerCase();
    const descriptionLower = result.description.toLowerCase();

    // Highlight title
    let highlightedTitle = result.title;
    if (tokens.some(t => titleLower.includes(t.toLowerCase()))) {
      highlightedTitle = highlightText(result.title, tokens);
    }

    // Highlight description
    let highlightedDescription = result.description;
    if (tokens.some(t => descriptionLower.includes(t.toLowerCase()))) {
      highlightedDescription = highlightText(result.description, tokens);
    }

    return {
      ...result,
      highlights: {
        title: highlightedTitle,
        description: highlightedDescription,
      },
    };
  });
}

/**
 * Highlight text with query terms
 */
function highlightText(text: string, tokens: string[]): string {
  let highlighted = text;
  tokens.forEach(token => {
    const regex = new RegExp(`(${token})`, "gi");
    highlighted = highlighted.replace(regex, "<mark>$1</mark>");
  });
  return highlighted;
}

/**
 * Generate query embedding using OpenAI
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn("OPENAI_API_KEY not set, returning zero vector");
    return Array(1536).fill(0);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.data?.[0]?.embedding || Array(1536).fill(0);
  } catch (error) {
    logger.error("Failed to generate embedding:", error);
    return Array(1536).fill(0);
  }
}

/**
 * Track search analytics
 */
async function trackSearchAnalytics(
  query: string,
  mode: string,
  results: SearchResult[],
  executionTime: number
): Promise<SearchAnalytics> {
  const queryId = crypto.randomUUID();
  const avgScore = results.length > 0 
    ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
    : 0;

  try {
    await supabaseServer.from("search_queries").insert({
      id: queryId,
      query,
      mode,
      result_count: results.length,
      avg_score: avgScore,
      execution_time: executionTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to track search analytics:", error);
  }

  return {
    queryId,
    query,
    mode,
    resultCount: results.length,
    avgScore,
    executionTime,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get search suggestions/autocomplete
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  if (!query || query.length < 2) return [];

  const { data: projects } = await supabaseServer
    .from("projects")
    .select("title")
    .ilike("title", `%${query}%`)
    .limit(limit);

  const suggestions = (projects || []).map((p: { title: string }) => p.title);

  // Add common search terms
  const commonTerms = [
    "Arduino projects",
    "AI projects",
    "Cybersecurity",
    "IoT projects",
    "Computer vision",
    "Robotics",
    "Machine learning",
    "Beginner projects",
  ];

  const matchingTerms = commonTerms.filter(term =>
    term.toLowerCase().includes(query.toLowerCase())
  );

  return [...new Set([...suggestions, ...matchingTerms])].slice(0, limit);
}

/**
 * Get recent searches for a user
 */
export async function getRecentSearches(userId: string, limit: number = 10): Promise<string[]> {
  try {
    const { data } = await supabaseServer
      .from("search_history")
      .select("query")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data || []).map((s: SearchHistory) => s.query);
  } catch (error) {
    logger.error("Failed to get recent searches:", error);
    return [];
  }
}

/**
 * Save search to history
 */
export async function saveSearchToHistory(userId: string, query: string): Promise<void> {
  try {
    await supabaseServer.from("search_history").insert({
      user_id: userId,
      query,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Failed to save search to history:", error);
  }
}
