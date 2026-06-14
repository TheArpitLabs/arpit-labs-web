import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "./feature-flags";
import { normalizeRepositoryUrl, extractRepositoryId } from "./url-normalization";
import { contentHash, jaccardSimilarity, normalizeText } from "./text";
import type { AcquisitionCandidate } from "./types";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number;
  duplicateType: "exact" | "high_similarity" | "potential" | "none";
  matchedEntityId?: string;
  matchedEntityType?: "queue" | "project";
  signals: DuplicateSignal[];
  recommendation: "auto_reject" | "manual_review" | "proceed";
}

export interface DuplicateSignal {
  type: "url_normalized" | "repository_id" | "content_hash" | "title_similarity" | "description_similarity" | "readme_similarity" | "architecture_similarity" | "cross_source";
  matched: boolean;
  confidence: number;
  matchedEntityId?: string;
  matchedEntityType?: "queue" | "project";
  explanation: string;
}

export interface SimilarityScore {
  overall: number;
  title: number;
  description: number;
  readme: number;
  architecture: number;
}

/**
 * Enhanced duplicate detection with multiple layers of analysis
 */
export async function checkDuplicate(candidate: AcquisitionCandidate): Promise<DuplicateCheckResult> {
  assertKnowledgeFeature("duplicateDetection");

  const signals: DuplicateSignal[] = [];
  
  // Layer 1: URL Normalization
  const normalizedUrl = normalizeRepositoryUrl(candidate.repositoryUrl || candidate.sourceUrl);
  signals.push(await checkNormalizedUrl(normalizedUrl));

  // Layer 2: Repository ID Matching
  const repositoryId = extractRepositoryId(normalizedUrl.canonical);
  signals.push(await checkRepositoryId(repositoryId, candidate.provider));

  // Layer 3: Content Hashing
  const contentHash = generateContentHash(candidate);
  signals.push(await checkContentHash(contentHash));

  // Layer 4: AI Similarity Engine
  const similarityScores = await calculateSimilarityScores(candidate);
  signals.push({
    type: "title_similarity",
    matched: similarityScores.title >= 0.8,
    confidence: similarityScores.title,
    explanation: `Title similarity: ${(similarityScores.title * 100).toFixed(1)}%`
  });
  signals.push({
    type: "description_similarity",
    matched: similarityScores.description >= 0.8,
    confidence: similarityScores.description,
    explanation: `Description similarity: ${(similarityScores.description * 100).toFixed(1)}%`
  });
  signals.push({
    type: "readme_similarity",
    matched: similarityScores.readme >= 0.8,
    confidence: similarityScores.readme,
    explanation: `README similarity: ${(similarityScores.readme * 100).toFixed(1)}%`
  });
  signals.push({
    type: "architecture_similarity",
    matched: similarityScores.architecture >= 0.8,
    confidence: similarityScores.architecture,
    explanation: `Architecture similarity: ${(similarityScores.architecture * 100).toFixed(1)}%`
  });

  // Layer 5: Cross Source Resolution
  signals.push(await checkCrossSource(candidate));

  // Determine overall result
  const result = determineDuplicateResult(signals, similarityScores);
  
  return result;
}

/**
 * Check normalized URL against existing items
 */
async function checkNormalizedUrl(normalizedUrl: any): Promise<DuplicateSignal> {
  if (!normalizedUrl.isValid) {
    return {
      type: "url_normalized",
      matched: false,
      confidence: 0,
      explanation: "Invalid URL format"
    };
  }

  const { data } = await supabaseServer
    .from("content_acquisition_queue")
    .select("id")
    .eq("canonical_url", normalizedUrl.canonical)
    .limit(1)
    .maybeSingle();

  return {
    type: "url_normalized",
    matched: Boolean(data?.id),
    confidence: data?.id ? 1 : 0,
    matchedEntityId: data?.id,
    explanation: data?.id ? "Normalized URL matches existing queue item" : "No URL match found"
  };
}

/**
 * Check repository ID for renamed/moved repositories
 */
async function checkRepositoryId(repositoryId: string, provider: string): Promise<DuplicateSignal> {
  if (!repositoryId) {
    return {
      type: "repository_id",
      matched: false,
      confidence: 0,
      explanation: "No repository ID available"
    };
  }

  // Check queue
  const { data: queueData } = await supabaseServer
    .from("content_acquisition_queue")
    .select("id")
    .eq("repository_id", repositoryId)
    .limit(1)
    .maybeSingle();

  if (queueData?.id) {
    return {
      type: "repository_id",
      matched: true,
      confidence: 1,
      matchedEntityId: queueData.id,
      explanation: "Repository ID matches existing queue item (possibly renamed/moved)"
    };
  }

  // Check published projects
  const { data: projectData } = await supabaseServer
    .from("projects")
    .select("id")
    .eq("repository_id", repositoryId)
    .limit(1)
    .maybeSingle();

  if (projectData?.id) {
    return {
      type: "repository_id",
      matched: true,
      confidence: 1,
      matchedEntityId: projectData.id,
      matchedEntityType: "project",
      explanation: "Repository ID matches published project (possibly renamed/moved)"
    };
  }

  return {
    type: "repository_id",
    matched: false,
    confidence: 0,
    explanation: "No repository ID match found"
  };
}

/**
 * Generate content hash from multiple sources
 */
function generateContentHash(candidate: AcquisitionCandidate): string {
  const content = [
    candidate.title,
    candidate.description,
    candidate.rawContent,
    JSON.stringify(candidate.metadata || {})
  ].filter(Boolean).join("\n");
  
  return contentHash(content);
}

/**
 * Check content hash against existing items
 */
async function checkContentHash(hash: string): Promise<DuplicateSignal> {
  const { data } = await supabaseServer
    .from("content_acquisition_queue")
    .select("id")
    .eq("content_hash", hash)
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    return {
      type: "content_hash",
      matched: true,
      confidence: 1,
      matchedEntityId: data.id,
      explanation: "Content hash matches exactly (duplicate content)"
    };
  }

  // Check published projects
  const { data: projectData } = await supabaseServer
    .from("projects")
    .select("id")
    .eq("content_hash", hash)
    .limit(1)
    .maybeSingle();

  if (projectData?.id) {
    return {
      type: "content_hash",
      matched: true,
      confidence: 1,
      matchedEntityId: projectData.id,
      matchedEntityType: "project",
      explanation: "Content hash matches published project (duplicate content)"
    };
  }

  return {
    type: "content_hash",
    matched: false,
    confidence: 0,
    explanation: "No content hash match found"
  };
}

/**
 * Calculate similarity scores using AI-like analysis
 */
async function calculateSimilarityScores(candidate: AcquisitionCandidate): Promise<SimilarityScore> {
  // Get recent items for comparison
  const { data: queueItems } = await supabaseServer
    .from("content_acquisition_queue")
    .select("id,title,description,raw_content,engineering_overview")
    .limit(50);

  const { data: projects } = await supabaseServer
    .from("projects")
    .select("id,title,description,overview,architecture")
    .limit(50);

  const allItems = [
    ...(queueItems || []).map((item: any) => ({
      id: item.id,
      type: "queue" as const,
      title: item.title,
      description: item.description,
      readme: item.raw_content,
      architecture: item.engineering_overview
    })),
    ...(projects || []).map((item: any) => ({
      id: item.id,
      type: "project" as const,
      title: item.title,
      description: item.description,
      readme: item.overview,
      architecture: item.architecture
    }))
  ];

  if (allItems.length === 0) {
    return { overall: 0, title: 0, description: 0, readme: 0, architecture: 0 };
  }

  // Calculate similarities
  const titleSimilarities = allItems.map(item => 
    jaccardSimilarity(candidate.title, item.title)
  );
  const descriptionSimilarities = allItems.map(item =>
    jaccardSimilarity(candidate.description || "", item.description || "")
  );
  const readmeSimilarities = allItems.map(item =>
    jaccardSimilarity(candidate.rawContent || "", item.readme || "")
  );
  const architectureSimilarities = allItems.map(item =>
    jaccardSimilarity((candidate.metadata?.architecture_summary as string) || "", item.architecture || "")
  );

  const maxTitle = Math.max(...titleSimilarities);
  const maxDescription = Math.max(...descriptionSimilarities);
  const maxReadme = Math.max(...readmeSimilarities);
  const maxArchitecture = Math.max(...architectureSimilarities);

  // Calculate overall similarity (weighted average)
  const overall = (maxTitle * 0.3 + maxDescription * 0.3 + maxReadme * 0.25 + maxArchitecture * 0.15);

  return {
    overall,
    title: maxTitle,
    description: maxDescription,
    readme: maxReadme,
    architecture: maxArchitecture
  };
}

/**
 * Check for cross-source duplicates (same project on multiple platforms)
 */
async function checkCrossSource(candidate: AcquisitionCandidate): Promise<DuplicateSignal> {
  const normalizedUrl = normalizeRepositoryUrl(candidate.repositoryUrl || candidate.sourceUrl);
  
  if (!normalizedUrl.isValid || !normalizedUrl.owner || !normalizedUrl.repo) {
    return {
      type: "cross_source",
      matched: false,
      confidence: 0,
      explanation: "Insufficient information for cross-source check"
    };
  }

  // Check for same owner/repo across different providers
  const { data } = await supabaseServer
    .from("content_acquisition_queue")
    .select("id,provider,canonical_url")
    .limit(50);

  if (!data || data.length === 0) {
    return {
      type: "cross_source",
      matched: false,
      confidence: 0,
      explanation: "No items for cross-source comparison"
    };
  }

  // Look for matching owner/repo combinations
  const crossSourceMatches = data.filter((item: any) => {
    if (item.provider === candidate.provider) return false;
    
    const itemUrl = item.canonical_url || item.repository_url || item.source_url || "";
    const itemNormalized = normalizeRepositoryUrl(itemUrl);
    if (!itemNormalized.isValid) return false;
    
    return itemNormalized.owner === normalizedUrl.owner && 
           itemNormalized.repo === normalizedUrl.repo;
  });

  if (crossSourceMatches.length > 0) {
    return {
      type: "cross_source",
      matched: true,
      confidence: 0.9,
      matchedEntityId: crossSourceMatches[0].id,
      explanation: `Same project found on ${crossSourceMatches.length} other platform(s)`
    };
  }

  return {
    type: "cross_source",
    matched: false,
    confidence: 0,
    explanation: "No cross-source duplicates found"
  };
}

/**
 * Determine overall duplicate result based on signals
 */
function determineDuplicateResult(signals: DuplicateSignal[], similarityScores: SimilarityScore): DuplicateCheckResult {
  const exactMatches = signals.filter(s => s.matched && s.confidence === 1);
  const highSimilarity = similarityScores.overall >= 0.95;
  const mediumSimilarity = similarityScores.overall >= 0.8 && similarityScores.overall < 0.95;

  // Exact duplicate
  if (exactMatches.length > 0) {
    return {
      isDuplicate: true,
      confidence: 1,
      duplicateType: "exact",
      matchedEntityId: exactMatches[0].matchedEntityId,
      matchedEntityType: exactMatches[0].matchedEntityType,
      signals,
      recommendation: "auto_reject"
    };
  }

  // High similarity (>95%)
  if (highSimilarity) {
    return {
      isDuplicate: true,
      confidence: similarityScores.overall,
      duplicateType: "high_similarity",
      signals,
      recommendation: "auto_reject"
    };
  }

  // Medium similarity (80-95%)
  if (mediumSimilarity) {
    return {
      isDuplicate: true,
      confidence: similarityScores.overall,
      duplicateType: "potential",
      signals,
      recommendation: "manual_review"
    };
  }

  // No duplicate
  return {
    isDuplicate: false,
    confidence: similarityScores.overall,
    duplicateType: "none",
    signals,
    recommendation: "proceed"
  };
}

/**
 * Store duplicate check result in database
 */
export async function storeDuplicateCheck(queueItemId: string, result: DuplicateCheckResult): Promise<void> {
  const { error } = await supabaseServer
    .from("duplicate_checks")
    .insert({
      queue_item_id: queueItemId,
      is_duplicate: result.isDuplicate,
      confidence: result.confidence,
      duplicate_type: result.duplicateType,
      matched_entity_id: result.matchedEntityId,
      matched_entity_type: result.matchedEntityType,
      signals: result.signals,
      similarity_score: result.confidence,
      recommendation: result.recommendation,
      checked_at: new Date().toISOString()
    });

  if (error) {
    console.error("Failed to store duplicate check:", error);
  }
}

/**
 * Get duplicate checks for a queue item
 */
export async function getDuplicateChecks(queueItemId: string): Promise<any[]> {
  const { data, error } = await supabaseServer
    .from("duplicate_checks")
    .select("*")
    .eq("queue_item_id", queueItemId)
    .order("checked_at", { ascending: false });

  if (error) {
    console.error("Failed to get duplicate checks:", error);
    return [];
  }

  return data || [];
}

/**
 * Resolve cross-source duplicates by merging sources
 */
export async function resolveCrossSource(primaryQueueItemId: string, secondaryQueueItemIds: string[]): Promise<void> {
  // Update secondary items to reference the primary
  for (const secondaryId of secondaryQueueItemIds) {
    const { error } = await supabaseServer
      .from("content_acquisition_queue")
      .update({
        status: "merged",
        merged_into: primaryQueueItemId,
        merged_at: new Date().toISOString()
      })
      .eq("id", secondaryId);

    if (error) {
      console.error("Failed to merge duplicate:", error);
    }
  }

  // Store project sources for the primary item
  const { error: sourceError } = await supabaseServer
    .from("project_sources")
    .insert({
      queue_item_id: primaryQueueItemId,
      source_ids: [primaryQueueItemId, ...secondaryQueueItemIds],
      resolved_at: new Date().toISOString()
    });

  if (sourceError) {
    console.error("Failed to store project sources:", sourceError);
  }
}
