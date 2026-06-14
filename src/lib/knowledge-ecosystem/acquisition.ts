import { supabaseServer } from "@/lib/supabase/server";
import { analyzeCandidate } from "./analysis";
import { assertKnowledgeFeature } from "./feature-flags";
import { calculateQualityScore, calculateTrustScore } from "./scoring";
import { contentHash } from "./text";
import { detectDuplicate } from "./duplicate-detection";
import type { AcquisitionCandidate, AcquisitionProvider, AcquisitionStatus } from "./types";

export async function queueAcquisition(candidate: AcquisitionCandidate) {
  assertKnowledgeFeature("acquisitionEngine");

  const hash = contentHash([candidate.title, candidate.description, candidate.rawContent].filter(Boolean).join("\n"));
  const duplicateSignals = await detectDuplicate(candidate);
  const isDuplicate = duplicateSignals.some((signal) => signal.matched && signal.confidence >= 0.86);
  const analysis = analyzeCandidate(candidate);
  const quality = calculateQualityScore(candidate);
  const trust = calculateTrustScore(candidate);

  const payload = {
    provider: candidate.provider,
    external_id: candidate.externalId,
    source_url: candidate.sourceUrl,
    repository_url: candidate.repositoryUrl,
    screenshot_url: candidate.screenshotUrl,
    title: candidate.title,
    description: candidate.description,
    author: candidate.author,
    raw_content: candidate.rawContent,
    content_hash: hash,
    status: isDuplicate ? "duplicate" : "queued",
    duplicate_signals: duplicateSignals,
    analysis,
    quality_score: quality.score,
    trust_score: trust.score,
    metadata: candidate.metadata ?? {},
  };

  const { data, error } = await supabaseServer
    .from("content_acquisition_queue")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listAcquisitionQueue(filters?: { provider?: AcquisitionProvider; status?: AcquisitionStatus }) {
  assertKnowledgeFeature("acquisitionEngine");
  let query = supabaseServer.from("content_acquisition_queue").select("*").order("created_at", { ascending: false }).limit(100);
  if (filters?.provider) query = query.eq("provider", filters.provider);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateAcquisitionStatus(id: string, status: AcquisitionStatus, reviewerId?: string) {
  assertKnowledgeFeature("acquisitionEngine");
  const { data, error } = await supabaseServer
    .from("content_acquisition_queue")
    .update({
      status,
      reviewed_by: reviewerId,
      reviewed_at: ["approved", "rejected", "duplicate"].includes(status) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkQueueAcquisition(provider: AcquisitionProvider, urls: string[]) {
  const queued = [];
  for (const sourceUrl of urls) {
    queued.push(
      await queueAcquisition({
        provider,
        sourceUrl,
        repositoryUrl: ["github", "gitlab"].includes(provider) ? sourceUrl : undefined,
        title: sourceUrl.split("/").filter(Boolean).slice(-1)[0] ?? sourceUrl,
        description: `Queued ${provider} resource for acquisition review.`,
        metadata: { queuedBy: "bulk_import" },
      })
    );
  }
  return queued;
}

export async function publishApprovedItem(queueItemId: string, reviewerId?: string) {
  assertKnowledgeFeature("acquisitionEngine");

  const { data: queueItem, error: fetchError } = await supabaseServer
    .from("content_acquisition_queue")
    .select("*")
    .eq("id", queueItemId)
    .single();

  if (fetchError || !queueItem) {
    throw new Error("Queue item not found");
  }

  if (queueItem.status !== "approved") {
    throw new Error("Only approved items can be published");
  }

  if (queueItem.imported_entity_id) {
    throw new Error("Item already published");
  }

  const projectData = {
    title: queueItem.title,
    slug: generateSlug(queueItem.title),
    description: queueItem.description || "",
    overview: queueItem.raw_content?.substring(0, 2000),
    github_url: queueItem.repository_url || queueItem.source_url,
    tech_stack: queueItem.metadata?.languages || [],
    tags: queueItem.metadata?.topics || [],
    cover_image: queueItem.screenshot_url || queueItem.metadata?.cover_image,
    published: true,
    featured: false,
  };

  const { data: project, error: projectError } = await supabaseServer
    .from("projects")
    .insert(projectData)
    .select()
    .single();

  if (projectError || !project) {
    throw new Error(`Failed to create project: ${projectError?.message}`);
  }

  const { error: updateError } = await supabaseServer
    .from("content_acquisition_queue")
    .update({
      status: "imported",
      imported_entity_type: "project",
      imported_entity_id: project.id,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", queueItemId);

  if (updateError) {
    throw new Error(`Failed to update queue item: ${updateError.message}`);
  }

  return { queueItem, project };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}
