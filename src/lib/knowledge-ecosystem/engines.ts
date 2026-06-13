import { supabaseServer } from "@/lib/supabase/server";
import type { KnowledgeEdge, KnowledgeNode } from "./types";

export async function upsertKnowledgeNode(node: KnowledgeNode) {
  const { data, error } = await supabaseServer
    .from("knowledge_nodes")
    .upsert(
      {
        entity_type: node.entityType,
        entity_id: node.entityId,
        title: node.title,
        slug: node.slug,
        metadata: node.metadata ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "entity_type,entity_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertKnowledgeEdge(edge: KnowledgeEdge) {
  const { data, error } = await supabaseServer
    .from("knowledge_edges")
    .upsert(
      {
        from_type: edge.fromType,
        from_id: edge.fromId,
        to_type: edge.toType,
        to_id: edge.toId,
        relationship: edge.relationship,
        weight: edge.weight ?? 1,
      },
      { onConflict: "from_type,from_id,to_type,to_id,relationship" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recordTrendSignal(topic: string, metrics: { growth: number; velocity: number; popularity: number; metadata?: Record<string, unknown> }) {
  const { data, error } = await supabaseServer
    .from("trend_signals")
    .upsert(
      {
        topic,
        growth: metrics.growth,
        velocity: metrics.velocity,
        popularity: metrics.popularity,
        metadata: metrics.metadata ?? {},
        signal_date: new Date().toISOString().slice(0, 10),
      },
      { onConflict: "topic,signal_date" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createAiReviewFinding(input: {
  entityType: string;
  entityId?: string;
  findingType: "broken_link" | "spam" | "plagiarism" | "missing_docs" | "low_quality";
  severity?: "low" | "medium" | "high" | "critical";
  details?: Record<string, unknown>;
}) {
  const { data, error } = await supabaseServer
    .from("ai_review_findings")
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      finding_type: input.findingType,
      severity: input.severity ?? "medium",
      details: input.details ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function queueMediaGeneration(input: {
  entityType: string;
  entityId?: string;
  assetType: "project_banner" | "social_card" | "cover_image" | "preview_asset";
  prompt: string;
}) {
  const { data, error } = await supabaseServer
    .from("generated_media_assets")
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      asset_type: input.assetType,
      prompt: input.prompt,
      status: "queued",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createLearningPath(input: {
  sourceProjectId?: string;
  title: string;
  steps: Array<{ title: string; description: string; resources?: string[] }>;
  difficulty?: "beginner" | "intermediate" | "advanced";
}) {
  const { data, error } = await supabaseServer
    .from("learning_paths")
    .insert({
      source_project_id: input.sourceProjectId,
      title: input.title,
      steps: input.steps,
      difficulty: input.difficulty ?? "intermediate",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recordHackathonIntelligence(input: {
  sourceUrl?: string;
  title: string;
  organizer?: string;
  themes?: string[];
  winningProjects?: unknown[];
  teams?: unknown[];
  eventDate?: string;
}) {
  const { data, error } = await supabaseServer
    .from("hackathon_intelligence")
    .insert({
      source_url: input.sourceUrl,
      title: input.title,
      organizer: input.organizer,
      themes: input.themes ?? [],
      winning_projects: input.winningProjects ?? [],
      teams: input.teams ?? [],
      event_date: input.eventDate,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function linkContributorIdentity(input: {
  contributorId?: string;
  provider: "github" | "devpost" | "linkedin" | "kaggle" | "huggingface";
  providerUserId?: string;
  profileUrl: string;
  confidence: number;
}) {
  const { data, error } = await supabaseServer
    .from("contributor_identity_links")
    .upsert(
      {
        contributor_id: input.contributorId,
        provider: input.provider,
        provider_user_id: input.providerUserId,
        profile_url: input.profileUrl,
        confidence: input.confidence,
      },
      { onConflict: "provider,profile_url" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createCollaborationOpportunity(input: {
  audience: "students" | "researchers" | "startups" | "companies";
  title: string;
  description: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabaseServer
    .from("collaboration_opportunities")
    .insert({
      audience: input.audience,
      title: input.title,
      description: input.description,
      project_id: input.projectId,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recordObservabilityEvent(input: {
  eventType: string;
  service: string;
  message: string;
  severity?: "debug" | "info" | "warning" | "error" | "critical";
  durationMs?: number;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabaseServer
    .from("platform_observability_events")
    .insert({
      event_type: input.eventType,
      service: input.service,
      message: input.message,
      severity: input.severity ?? "info",
      duration_ms: input.durationMs,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const scalingPlan = {
  cacheKeys: {
    projectSearch: "knowledge:search:projects",
    recommendations: "knowledge:recommendations",
    acquisitionQueue: "knowledge:acquisition:queue",
  },
  queues: ["acquisition.import", "analysis.readme", "duplicates.scan", "media.generate", "recommendations.refresh"],
  backgroundJobs: ["scheduled-import", "trend-refresh", "quality-rescore", "broken-link-review", "embedding-refresh"],
};
