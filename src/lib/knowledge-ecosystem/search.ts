import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { jaccardSimilarity, tokenize } from "./text";
import type { SearchMode, SearchResult } from "./types";

export async function hybridKnowledgeSearch(query: string, mode: SearchMode = "hybrid", limit = 10): Promise<SearchResult[]> {
  assertKnowledgeFeature("semanticSearch");
  const keywordResults = mode === "vector" ? [] : await keywordSearch(query, limit);
  const vectorResults = mode === "keyword" ? [] : await localVectorSearch(query, limit);
  const merged = new Map<string, SearchResult>();

  for (const result of [...keywordResults, ...vectorResults]) {
    const key = `${result.entityType}:${result.entityId}`;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, score: Math.max(existing.score, result.score), reason: `${existing.reason}; ${result.reason}` } : result);
  }

  const results = Array.from(merged.values()).sort((a, b) => b.score - a.score).slice(0, limit);
  await supabaseServer.from("semantic_search_queries").insert({ query, mode, result_count: results.length }).throwOnError();
  return results;
}

async function keywordSearch(query: string, limit: number): Promise<SearchResult[]> {
  const tokens = tokenize(query);
  const pattern = tokens[0] ?? query;
  const { data } = await supabaseServer
    .from("projects")
    .select("id,title,slug,description")
    .or(`title.ilike.%${pattern}%,description.ilike.%${pattern}%,domain.ilike.%${pattern}%`)
    .limit(limit);

  return (data ?? []).map((project: any) => ({
    entityType: "project",
    entityId: project.id,
    title: project.title,
    description: project.description,
    score: 0.72,
    reason: "Keyword match against project title, description, or domain.",
    url: `/projects/${project.slug}`,
  }));
}

async function localVectorSearch(query: string, limit: number): Promise<SearchResult[]> {
  const { data } = await supabaseServer
    .from("ai_knowledge_base")
    .select("id,source_type,source_id,source_title,source_url,content")
    .eq("is_active", true)
    .limit(80);

  return (data ?? [])
    .map((item: any) => ({
      entityType: "content" as const,
      entityId: item.source_id ?? item.id,
      title: item.source_title ?? "Knowledge item",
      description: item.content?.slice(0, 220),
      score: Number(jaccardSimilarity(query, item.content).toFixed(3)),
      reason: "Token-similarity semantic match. Replace with pgvector RPC when embeddings are populated.",
      url: item.source_url,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
