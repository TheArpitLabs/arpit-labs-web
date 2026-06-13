import { supabaseServer } from "@/lib/supabase/server";
import type { AcquisitionCandidate, DuplicateSignal } from "./types";
import { contentHash, jaccardSimilarity } from "./text";

export async function detectDuplicate(candidate: AcquisitionCandidate): Promise<DuplicateSignal[]> {
  const signals: DuplicateSignal[] = [];
  const repositoryUrl = candidate.repositoryUrl || candidate.sourceUrl;
  const externalId = candidate.externalId;
  const hash = contentHash([candidate.title, candidate.description, candidate.rawContent].filter(Boolean).join("\n"));

  signals.push(await matchExisting("repository_url", "repository_url", repositoryUrl, "Repository URL matched an existing imported item."));
  signals.push(await matchExisting("repository_id", "external_id", externalId, "Provider repository ID matched an existing imported item."));
  signals.push(await matchExisting("content_hash", "content_hash", hash, "Normalized content hash matched an existing imported item."));
  signals.push(await approximateTextMatch(candidate));
  signals.push(await screenshotMatch(candidate.screenshotUrl));

  return signals;
}

async function matchExisting(layer: DuplicateSignal["layer"], column: string, value: string | null | undefined, explanation: string): Promise<DuplicateSignal> {
  if (!value) {
    return { layer, matched: false, confidence: 0, explanation: "No input value available for this duplicate layer." };
  }

  const { data } = await supabaseServer
    .from("content_acquisition_queue")
    .select("id")
    .eq(column, value)
    .limit(1)
    .maybeSingle();

  return {
    layer,
    matched: Boolean(data?.id),
    confidence: data?.id ? 1 : 0,
    matchedEntityId: data?.id,
    explanation: data?.id ? explanation : "No exact match found.",
  };
}

async function approximateTextMatch(candidate: AcquisitionCandidate): Promise<DuplicateSignal> {
  const { data } = await supabaseServer
    .from("content_acquisition_queue")
    .select("id,title,description,raw_content")
    .limit(30);

  const text = [candidate.title, candidate.description, candidate.rawContent].filter(Boolean).join("\n");
  const best = (data ?? [])
    .map((item: any) => ({
      id: item.id,
      similarity: jaccardSimilarity(text, [item.title, item.description, item.raw_content].filter(Boolean).join("\n")),
    }))
    .sort((a, b) => b.similarity - a.similarity)[0];

  return {
    layer: "embedding_similarity",
    matched: (best?.similarity ?? 0) >= 0.86,
    confidence: Number((best?.similarity ?? 0).toFixed(3)),
    matchedEntityId: best?.similarity >= 0.86 ? best.id : undefined,
    explanation: "Local token similarity stands in for vector similarity until embeddings are generated.",
  };
}

async function screenshotMatch(screenshotUrl: string | null | undefined): Promise<DuplicateSignal> {
  if (!screenshotUrl) {
    return { layer: "screenshot_similarity", matched: false, confidence: 0, explanation: "No screenshot URL available." };
  }

  const { data } = await supabaseServer
    .from("content_acquisition_queue")
    .select("id")
    .eq("screenshot_url", screenshotUrl)
    .limit(1)
    .maybeSingle();

  return {
    layer: "screenshot_similarity",
    matched: Boolean(data?.id),
    confidence: data?.id ? 0.95 : 0,
    matchedEntityId: data?.id,
    explanation: data?.id ? "Screenshot URL matched an existing candidate." : "No screenshot match found.",
  };
}
