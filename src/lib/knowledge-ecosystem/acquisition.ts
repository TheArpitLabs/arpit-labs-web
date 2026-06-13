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
