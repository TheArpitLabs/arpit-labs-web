/**
 * Moderation Engine Types
 * 
 * Defines the interfaces and types for content moderation
 */

export interface ModerationPolicy {
  id: string;
  name: string;
  description: string;
  rules: ModerationRule[];
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModerationRule {
  id: string;
  type: 'keyword' | 'pattern' | 'ml' | 'custom';
  config: Record<string, unknown>;
  action: 'flag' | 'block' | 'review' | 'approve';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface ModerationResult {
  contentId: string;
  contentType: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'review';
  flags: ModerationFlag[];
  score: number;
  confidence: number;
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
}

export interface ModerationFlag {
  ruleId: string;
  ruleName: string;
  type: string;
  severity: string;
  message: string;
  matchedContent?: string;
  confidence: number;
}

export interface ModerationQueueItem {
  id: string;
  contentId: string;
  contentType: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'review';
  priority: number;
  submittedAt: Date;
  assignedTo?: string;
  result?: ModerationResult;
}

export interface ModerationConfig {
  enableAutoModeration: boolean;
  enableMLModeration: boolean;
  enableKeywordFiltering: boolean;
  enablePatternMatching: boolean;
  autoApproveThreshold: number;
  autoRejectThreshold: number;
  flagThreshold: number;
  reviewQueueSize: number;
  enableHumanReview: boolean;
  mlModelConfig?: {
    model: string;
    endpoint: string;
    apiKey: string;
  };
}
