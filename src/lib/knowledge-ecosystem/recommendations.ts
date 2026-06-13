import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { jaccardSimilarity } from "./text";
import type { SearchResult } from "./types";

export async function getRelatedKnowledge(entityType: string, entityId: string, limit = 8): Promise<SearchResult[]> {
  assertKnowledgeFeature("recommendations");

  const source = await loadSourceText(entityType, entityId);
  if (!source) return [];

  const candidates = await loadCandidates(entityType, entityId);
  const related = candidates
    .map((candidate) => ({
      entityType: candidate.entityType,
      entityId: candidate.id,
      title: candidate.title,
      description: candidate.description,
      score: Number(jaccardSimilarity(source.text, candidate.text).toFixed(3)),
      reason: "Content similarity and shared knowledge graph context.",
      url: candidate.url,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  for (const item of related) {
    await supabaseServer.from("recommendation_links").upsert(
      {
        source_type: entityType,
        source_id: entityId,
        target_type: item.entityType,
        target_id: item.entityId,
        score: item.score,
        reason: item.reason,
      },
      { onConflict: "source_type,source_id,target_type,target_id" }
    );
  }

  return related;
}

async function loadSourceText(entityType: string, entityId: string) {
  if (entityType === "project") {
    const { data } = await supabaseServer.from("projects").select("title,description,overview,architecture").eq("id", entityId).maybeSingle();
    if (!data) return null;
    return { text: [data.title, data.description, data.overview, data.architecture].filter(Boolean).join("\n") };
  }

  const { data } = await supabaseServer.from("knowledge_nodes").select("title,metadata").eq("entity_type", entityType).eq("entity_id", entityId).maybeSingle();
  if (!data) return null;
  return { text: [data.title, JSON.stringify(data.metadata ?? {})].join("\n") };
}

async function loadCandidates(entityType: string, entityId: string) {
  const { data: projects } = await supabaseServer.from("projects").select("id,title,slug,description,overview,architecture").neq("id", entityId).limit(50);
  const projectCandidates = (projects ?? []).map((project: any) => ({
    entityType: "project" as const,
    id: project.id,
    title: project.title,
    description: project.description,
    text: [project.title, project.description, project.overview, project.architecture].filter(Boolean).join("\n"),
    url: `/projects/${project.slug}`,
  }));

  const { data: nodes } = await supabaseServer.from("knowledge_nodes").select("entity_type,entity_id,title,slug,metadata").limit(50);
  const nodeCandidates = (nodes ?? [])
    .filter((node: any) => !(node.entity_type === entityType && node.entity_id === entityId))
    .map((node: any) => ({
      entityType: node.entity_type,
      id: node.entity_id,
      title: node.title,
      description: typeof node.metadata?.description === "string" ? node.metadata.description : null,
      text: [node.title, JSON.stringify(node.metadata ?? {})].join("\n"),
      url: node.slug ? `/${node.entity_type}/${node.slug}` : null,
    }));

  return [...projectCandidates, ...nodeCandidates];
}
