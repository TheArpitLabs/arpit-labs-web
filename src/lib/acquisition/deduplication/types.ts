/**
 * Deduplication Engine Types
 * 
 * Defines the interfaces and types for content deduplication
 */

export interface ContentHash {
  id: string;
  contentHash: string;
  contentType: string;
  firstSeenId: string;
  firstSeenAt: Date;
  occurrenceCount: number;
  lastSeenAt: Date;
}

export interface ContentCluster {
  id: string;
  clusterName: string | null;
  contentType: string;
  canonicalId: string;
  similarityThreshold: number;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentClusterMember {
  id: string;
  clusterId: string;
  contentId: string;
  contentType: string;
  similarityScore: number;
  isCanonical: boolean;
  createdAt: Date;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  duplicateType: 'exact' | 'similar' | 'none';
  confidence: number;
  canonicalId?: string;
  clusterId?: string;
  similarityScore?: number;
  recommendation: 'auto_reject' | 'manual_review' | 'accept';
  reason: string;
}

export interface DeduplicationConfig {
  similarityThreshold: number;
  enableClustering: boolean;
  autoRejectExactDuplicates: boolean;
  autoRejectHighSimilarity: boolean;
  highSimilarityThreshold: number;
}

export interface ContentComparison {
  contentId: string;
  similarityScore: number;
  matchingFields: string[];
  differences: string[];
}
