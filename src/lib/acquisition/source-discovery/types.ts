/**
 * Source Discovery Layer Types
 * 
 * Defines the interfaces and types for multi-source content discovery
 */

export type ContentProvider = 'github' | 'arxiv' | 'kaggle' | 'huggingface' | 'producthunt' | 'custom';

export type ContentType = 'project' | 'research_paper' | 'dataset' | 'learning_resource' | 'hackathon' | 'repository';

export type DiscoveryStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface ContentSource {
  id: string;
  name: string;
  providerType: ContentProvider;
  baseUrl: string | null;
  apiEndpoint: string | null;
  authConfig: Record<string, unknown>;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  isActive: boolean;
  priority: number;
  lastSyncedAt: Date | null;
  syncFrequency: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscoveryRule {
  id: string;
  sourceId: string;
  ruleName: string;
  ruleType: 'keyword' | 'topic' | 'organization' | 'language' | 'custom';
  pattern: string;
  weight: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscoveredContent {
  id: string;
  sourceId: string;
  externalId: string;
  sourceUrl: string;
  contentType: ContentType;
  title: string;
  description: string | null;
  author: string | null;
  organization: string | null;
  discoveryMetadata: Record<string, unknown>;
  discoveredAt: Date;
  processedAt: Date | null;
  status: DiscoveryStatus;
  errorMessage: string | null;
}

export interface DiscoveryConfig {
  sourceId: string;
  rules: DiscoveryRule[];
  maxResults?: number;
  timeout?: number;
  retryAttempts?: number;
}

export interface DiscoveryResult {
  success: boolean;
  discovered: DiscoveredContent[];
  errors: Array<{
    externalId: string;
    error: string;
  }>;
  metadata: {
    totalDiscovered: number;
    processingTime: number;
    source: string;
  };
}

export interface SourceConnector {
  /**
   * Initialize the connector with authentication and configuration
   */
  initialize(config: Record<string, unknown>): Promise<void>;

  /**
   * Discover content based on rules and patterns
   */
  discover(config: DiscoveryConfig): Promise<DiscoveryResult>;

  /**
   * Fetch detailed content for a specific item
   */
  fetchContent(externalId: string): Promise<Record<string, unknown>>;

  /**
   * Validate if content should be acquired
   */
  validateContent(content: Record<string, unknown>): Promise<boolean>;

  /**
   * Normalize content to standard format
   */
  normalizeContent(content: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Check rate limits and wait if necessary
   */
  checkRateLimit(): Promise<void>;

  /**
   * Get connector health status
   */
  getHealth(): Promise<{
    healthy: boolean;
    message: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface DiscoveryQueueItem {
  sourceId: string;
  ruleId: string;
  priority: number;
  scheduledFor: Date | null;
  retryCount: number;
  maxRetries: number;
}
