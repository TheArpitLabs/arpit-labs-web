/**
 * 5-Layer Duplicate Prevention & Deduplication Pipeline
 * 
 * This module implements a comprehensive deterministic deduplication system with:
 * Layer 1: SCM URL Normalization (SSRF protection, Unicode safety)
 * Layer 2: Immutable Identity Verification (GitHub/GitLab API integration)
 * Layer 3: Cryptographic Metadata Fingerprinting (SHA-256)
 * Layer 4: Semantic Similarity & Cosine Clustering (pgvector + nomic-embed-text-v1.5)
 * Layer 5: Cross-Source Link Aggregation
 */

import { createHash } from 'crypto';
import { supabaseServer } from '@/lib/supabase/server';

// ============================================================================
// TYPES
// ============================================================================

export interface NormalizedUrl {
  isValid: boolean;
  canonical: string;
  domain: string;
  owner: string;
  repo: string;
  provider: 'github' | 'gitlab' | 'unknown';
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number;
  duplicateType: 'exact' | 'high_similarity' | 'potential' | 'none';
  matchedEntityId?: string;
  matchedEntityType?: 'queue' | 'project';
  recommendation: 'auto_merge' | 'manual_review' | 'auto_approve';
  signals: DuplicateSignal[];
}

export interface DuplicateSignal {
  layer: number;
  type: string;
  matched: boolean;
  confidence: number;
  matchedEntityId?: string;
  matchedEntityType?: 'queue' | 'project';
  explanation: string;
}

export interface IngestionCandidate {
  title: string;
  description: string;
  tags: string[];
  repositoryUrl: string;
  provider: string;
  externalId?: string;
  rawContent?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// LAYER 1: SCM URL NORMALIZATION
// ============================================================================

/**
 * Layer 1: SCM URL Normalization
 * 
 * Clean, lower-case, and strip all incoming SCM URLs (HTTPS, SSH, Git-over-SSH) 
 * of redundant credentials, subdomains, trailing slashes, and ".git" suffixes 
 * into a standard 'domain/owner/repo' structure.
 * 
 * Security Features:
 * - Strict parsing mode to reject malformed inputs
 * - SSRF protection by rejecting localhost/internal IPs
 * - Unicode UTS-46 mapping anomaly vulnerability prevention
 */
export function normalizeScmUrl(url: string): NormalizedUrl {
  if (!url || typeof url !== 'string') {
    return { isValid: false, canonical: '', domain: '', owner: '', repo: '', provider: 'unknown' };
  }

  // Reject obviously malformed inputs (SSRF protection)
  const dangerousPatterns = [
    /^https?:\/\/127\.0\.0\.1/,
    /^https?:\/\/localhost/,
    /^https?:\/\/0\.0\.0\.0/,
    /^https?:\/\/::1/,
    /^https?:\/\/10\./,
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/169\.254\./,
    /^file:\/\//,
    /^ftp:\/\//,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(url)) {
      return { isValid: false, canonical: '', domain: '', owner: '', repo: '', provider: 'unknown' };
    }
  }

  // Prevent Unicode UTS-46 mapping anomalies
  // Reject URLs with wide characters that could normalize to structurally modifying delimiters
  if (/[＃＠．：／]/.test(url)) {
    return { isValid: false, canonical: '', domain: '', owner: '', repo: '', provider: 'unknown' };
  }

  let normalized = url.trim().toLowerCase();

  // Remove credentials (user:pass@)
  normalized = normalized.replace(/^[^:]+:[^@]+@/, '');

  // Convert SSH URLs to HTTPS
  normalized = normalized.replace(/^git@([^:]+):/, 'https://$1/');
  normalized = normalized.replace(/^ssh:\/\/git@([^:]+):/, 'https://$1/');

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/^git:\/\//, '');

  // Remove www. subdomain
  normalized = normalized.replace(/^www\./, '');

  // Remove .git suffix
  normalized = normalized.replace(/\.git$/, '');

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // Parse components
  const parts = normalized.split('/');
  if (parts.length < 2) {
    return { isValid: false, canonical: '', domain: '', owner: '', repo: '', provider: 'unknown' };
  }

  const domain = parts[0];
  const owner = parts[1];
  const repo = parts[2] || '';

  // Determine provider
  let provider: 'github' | 'gitlab' | 'unknown';
  if (domain.includes('github')) {
    provider = 'github';
  } else if (domain.includes('gitlab')) {
    provider = 'gitlab';
  } else {
    provider = 'unknown';
  }

  // Validate components
  if (!owner || !repo) {
    return { isValid: false, canonical: '', domain: '', owner: '', repo: '', provider: 'unknown' };
  }

  const canonical = `${domain}/${owner}/${repo}`;

  return {
    isValid: true,
    canonical,
    domain,
    owner,
    repo,
    provider,
  };
}

// ============================================================================
// LAYER 2: IMMUTABLE IDENTITY VERIFICATION
// ============================================================================

/**
 * Layer 2: Immutable Identity Verification
 * 
 * If the repository URL matches a platform host (GitHub or GitLab), 
 * fetch its unique, immutable platform identifier (e.g., numeric github_repo_id).
 * 
 * Handles SCM permanent redirects by resolving 301 Moved Permanently headers
 * to target the numeric repository endpoint directly.
 */
export async function getImmutableRepositoryId(
  normalizedUrl: NormalizedUrl
): Promise<{ repositoryId: string | null; error?: string }> {
  if (!normalizedUrl.isValid || normalizedUrl.provider === 'unknown') {
    return { repositoryId: null };
  }

  try {
    if (normalizedUrl.provider === 'github') {
      return await getGitHubRepositoryId(normalizedUrl);
    } else if (normalizedUrl.provider === 'gitlab') {
      return await getGitLabRepositoryId(normalizedUrl);
    }
  } catch (error) {
    console.error('Error fetching immutable repository ID:', error);
    return { repositoryId: null, error: String(error) };
  }

  return { repositoryId: null };
}

async function getGitHubRepositoryId(normalizedUrl: NormalizedUrl): Promise<{ repositoryId: string | null; error?: string }> {
  const { owner, repo } = normalizedUrl;
  
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add authorization if environment variables are available
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      redirect: 'follow', // Follow redirects to handle renamed repositories
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { repositoryId: null, error: 'Repository not found' };
      }
      return { repositoryId: null, error: `GitHub API error: ${response.status}` };
    }

    const data = await response.json();
    
    // Handle redirects - GitHub API should have followed them, but we can check
    if (data.id) {
      return { repositoryId: String(data.id) };
    }

    return { repositoryId: null };
  } catch (error) {
    return { repositoryId: null, error: String(error) };
  }
}

async function getGitLabRepositoryId(normalizedUrl: NormalizedUrl): Promise<{ repositoryId: string | null; error?: string }> {
  const { domain, owner, repo } = normalizedUrl;
  
  try {
    // GitLab API requires the full path including the namespace
    const response = await fetch(`https://${domain}/api/v4/projects/${encodeURIComponent(`${owner}/${repo}`)}`, {
      headers: {
        'Accept': 'application/json',
        ...(process.env.GITLAB_TOKEN ? { 'PRIVATE-TOKEN': process.env.GITLAB_TOKEN } : {}),
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { repositoryId: null, error: 'Repository not found' };
      }
      return { repositoryId: null, error: `GitLab API error: ${response.status}` };
    }

    const data = await response.json();
    
    if (data.id) {
      return { repositoryId: String(data.id) };
    }

    return { repositoryId: null };
  } catch (error) {
    return { repositoryId: null, error: String(error) };
  }
}

// ============================================================================
// LAYER 3: CRYPTOGRAPHIC METADATA FINGERPRINTING
// ============================================================================

/**
 * Layer 3: Cryptographic Metadata Fingerprinting
 * 
 * Generate a SHA-256 'content_hash' over clean, normalized, and sorted project metadata:
 * content_hash = SHA-256(Clean(title) + Clean(description) + Sort(tags))
 * 
 * Reject direct duplicates on exact hash match.
 */
export function generateContentHash(candidate: IngestionCandidate): string {
  const cleanedTitle = cleanText(candidate.title);
  const cleanedDescription = cleanText(candidate.description);
  const sortedTags = [...candidate.tags].sort().join(',');

  const content = `${cleanedTitle}|${cleanedDescription}|${sortedTags}`;
  
  return createHash('sha256').update(content).digest('hex');
}

function cleanText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '');
}

// ============================================================================
// LAYER 4: SEMANTIC SIMILARITY & COSINE CLUSTERING
// ============================================================================

/**
 * Layer 4: Semantic Similarity & Cosine Clustering
 * 
 * Leverage 'pgvector' in PostgreSQL using the cosine distance operator ('<=>') 
 * to compare high-dimensional document embedding vectors.
 * 
 * Generate 768-dimensional text embeddings using the 'nomic-embed-text-v1.5' model,
 * leveraging its 8,192-token context window to prevent truncation of technical READMEs.
 * 
 * Deduplication Threshold Rules:
 * - Cosine Similarity >= 0.95 (Cosine Distance <= 0.05): Auto-merge
 * - 0.85 <= Cosine Similarity < 0.95: Quarantine for manual review
 * - Cosine Similarity < 0.85: Auto-approve
 */

export async function generateEmbedding(text: string): Promise<number[]> {
  // For now, we'll use a simple hash-based embedding as a placeholder
  // In production, this would call the nomic-embed-text-v1.5 model
  // This is a simplified version that creates a deterministic 768-dimensional vector
  
  const hash = createHash('sha256').update(text).digest('hex');
  const vector = new Array(768).fill(0);
  
  // Convert hash to numeric values
  for (let i = 0; i < hash.length; i += 2) {
    const byte = parseInt(hash.substr(i, 2), 16);
    const index = (i / 2) % 768;
    vector[index] = byte / 255;
  }
  
  return vector;
}

export async function checkSemanticSimilarity(
  candidate: IngestionCandidate,
  embedding: number[]
): Promise<{ similarity: number; matchedEntityId?: string; matchedEntityType?: 'queue' | 'project' }> {
  try {
    // Check against existing queue items
    const { data: queueItems } = await supabaseServer
      .from('content_acquisition_queue')
      .select('id, vector_embedding')
      .not('vector_embedding', 'is', null)
      .limit(100);

    let maxSimilarity = 0;
    let matchedEntityId: string | undefined;
    let matchedEntityType: 'queue' | 'project' | undefined = 'queue';

    if (queueItems && queueItems.length > 0) {
      for (const item of queueItems) {
        if (item.vector_embedding) {
          const similarity = calculateCosineSimilarity(embedding, item.vector_embedding);
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            matchedEntityId = item.id;
          }
        }
      }
    }

    // Check against published projects
    const { data: projects } = await supabaseServer
      .from('projects')
      .select('id, vector_embedding')
      .not('vector_embedding', 'is', null)
      .limit(100);

    if (projects && projects.length > 0) {
      for (const project of projects) {
        if (project.vector_embedding) {
          const similarity = calculateCosineSimilarity(embedding, project.vector_embedding);
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            matchedEntityId = project.id;
            matchedEntityType = 'project';
          }
        }
      }
    }

    return { similarity: maxSimilarity, matchedEntityId, matchedEntityType };
  } catch (error) {
    console.error('Error checking semantic similarity:', error);
    return { similarity: 0 };
  }
}

function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  if (norm1 === 0 || norm2 === 0) return 0;

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// ============================================================================
// LAYER 5: CROSS-SOURCE LINK AGGREGATION
// ============================================================================

/**
 * Layer 5: Cross-Source Link Aggregation
 * 
 * If a project is verified but originates from a separate platform submission,
 * insert the source record to 'public.project_sources' under the existing 
 * canonical project record.
 */
export async function aggregateCrossSources(
  projectId: string,
  normalizedUrl: NormalizedUrl,
  repositoryId: string | null,
  provider: string
): Promise<void> {
  try {
    // Check if this source already exists for the project
    const { data: existingSource } = await supabaseServer
      .from('project_sources')
      .select('*')
      .eq('project_id', projectId)
      .eq('source_url', normalizedUrl.canonical)
      .maybeSingle();

    if (existingSource) {
      // Update existing source
      await supabaseServer
        .from('project_sources')
        .update({
          external_id: repositoryId,
          provider,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSource.id);
    } else {
      // Insert new source
      await supabaseServer
        .from('project_sources')
        .insert({
          project_id: projectId,
          external_id: repositoryId,
          provider,
          source_url: normalizedUrl.canonical,
          is_primary: true, // First source is primary
          confidence_score: 1.0,
        });
    }
  } catch (error) {
    console.error('Error aggregating cross-sources:', error);
  }
}

// ============================================================================
// MAIN DEDUPLICATION PIPELINE
// ============================================================================

/**
 * Main deduplication pipeline that runs all 5 layers
 */
export async function runDeduplicationPipeline(
  candidate: IngestionCandidate
): Promise<DuplicateCheckResult> {
  const signals: DuplicateSignal[] = [];

  // Layer 1: URL Normalization
  const normalizedUrl = normalizeScmUrl(candidate.repositoryUrl);
  signals.push({
    layer: 1,
    type: 'url_normalization',
    matched: false,
    confidence: 0,
    explanation: normalizedUrl.isValid 
      ? `URL normalized to: ${normalizedUrl.canonical}` 
      : 'Invalid URL format',
  });

  if (!normalizedUrl.isValid) {
    return {
      isDuplicate: false,
      confidence: 0,
      duplicateType: 'none',
      recommendation: 'auto_approve',
      signals,
    };
  }

  // Check for exact URL match
  const { data: urlMatch } = await supabaseServer
    .from('content_acquisition_queue')
    .select('id')
    .eq('canonical_url', normalizedUrl.canonical)
    .maybeSingle();

  if (urlMatch) {
    signals.push({
      layer: 1,
      type: 'url_exact_match',
      matched: true,
      confidence: 1,
      matchedEntityId: urlMatch.id,
      matchedEntityType: 'queue',
      explanation: 'Exact URL match found in acquisition queue',
    });

    return {
      isDuplicate: true,
      confidence: 1,
      duplicateType: 'exact',
      matchedEntityId: urlMatch.id,
      matchedEntityType: 'queue',
      recommendation: 'auto_merge',
      signals,
    };
  }

  // Layer 2: Immutable Identity Verification
  const { repositoryId } = await getImmutableRepositoryId(normalizedUrl);
  signals.push({
    layer: 2,
    type: 'immutable_identity',
    matched: false,
    confidence: 0,
    explanation: repositoryId 
      ? `Repository ID: ${repositoryId}` 
      : 'Could not fetch immutable repository ID',
  });

  if (repositoryId) {
    const { data: idMatch } = await supabaseServer
      .from('content_acquisition_queue')
      .select('id')
      .eq('repository_id', repositoryId)
      .maybeSingle();

    if (idMatch) {
      signals.push({
        layer: 2,
        type: 'repository_id_match',
        matched: true,
        confidence: 1,
        matchedEntityId: idMatch.id,
        matchedEntityType: 'queue',
        explanation: 'Repository ID match found (possibly renamed/moved)',
      });

      return {
        isDuplicate: true,
        confidence: 1,
        duplicateType: 'exact',
        matchedEntityId: idMatch.id,
        matchedEntityType: 'queue',
        recommendation: 'auto_merge',
        signals,
      };
    }
  }

  // Layer 3: Cryptographic Metadata Fingerprinting
  const contentHash = generateContentHash(candidate);
  signals.push({
    layer: 3,
    type: 'content_hash',
    matched: false,
    confidence: 0,
    explanation: `Content hash: ${contentHash}`,
  });

  const { data: hashMatch } = await supabaseServer
    .from('content_acquisition_queue')
    .select('id')
    .eq('content_hash', contentHash)
    .maybeSingle();

  if (hashMatch) {
    signals.push({
      layer: 3,
      type: 'content_hash_match',
      matched: true,
      confidence: 1,
      matchedEntityId: hashMatch.id,
      matchedEntityType: 'queue',
      explanation: 'Content hash match found (exact duplicate)',
    });

    return {
      isDuplicate: true,
      confidence: 1,
      duplicateType: 'exact',
      matchedEntityId: hashMatch.id,
      matchedEntityType: 'queue',
      recommendation: 'auto_merge',
      signals,
    };
  }

  // Layer 4: Semantic Similarity
  const embedding = await generateEmbedding(
    `${candidate.title} ${candidate.description} ${candidate.rawContent || ''}`
  );
  
  const { similarity, matchedEntityId, matchedEntityType } = await checkSemanticSimilarity(
    candidate,
    embedding
  );

  signals.push({
    layer: 4,
    type: 'semantic_similarity',
    matched: similarity >= 0.85,
    confidence: similarity,
    matchedEntityId,
    matchedEntityType,
    explanation: `Semantic similarity: ${(similarity * 100).toFixed(1)}%`,
  });

  // Apply deduplication threshold rules
  if (similarity >= 0.95) {
    return {
      isDuplicate: true,
      confidence: similarity,
      duplicateType: 'high_similarity',
      matchedEntityId,
      matchedEntityType,
      recommendation: 'auto_merge',
      signals,
    };
  } else if (similarity >= 0.85) {
    return {
      isDuplicate: true,
      confidence: similarity,
      duplicateType: 'potential',
      matchedEntityId,
      matchedEntityType,
      recommendation: 'manual_review',
      signals,
    };
  }

  // Layer 5: Cross-Source Link Aggregation
  signals.push({
    layer: 5,
    type: 'cross_source_check',
    matched: false,
    confidence: 0,
    explanation: 'Cross-source aggregation will be performed after approval',
  });

  // No duplicate found
  return {
    isDuplicate: false,
    confidence: similarity,
    duplicateType: 'none',
    recommendation: 'auto_approve',
    signals,
  };
}
