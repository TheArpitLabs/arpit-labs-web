/**
 * Moderation Engine
 * 
 * Provides automated and human-in-the-loop content moderation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { 
  ModerationPolicy, 
  ModerationRule, 
  ModerationResult, 
  ModerationFlag,
  ModerationQueueItem,
  ModerationConfig 
} from './types';

export interface ModerationEngine {
  moderateContent(contentId: string, contentType: string, content: string, metadata?: Record<string, unknown>): Promise<ModerationResult>;
  reviewContent(contentId: string, status: 'approved' | 'rejected', reviewerId: string, notes?: string): Promise<void>;
  getModerationQueue(limit?: number): Promise<ModerationQueueItem[]>;
  createPolicy(policy: Omit<ModerationPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModerationPolicy>;
  updatePolicy(policyId: string, updates: Partial<ModerationPolicy>): Promise<void>;
  deletePolicy(policyId: string): Promise<void>;
  getActivePolicies(): Promise<ModerationPolicy[]>;
  getModerationStats(): Promise<{ totalModerated: number; approved: number; rejected: number; flagged: number; pending: number }>;
}

class BaseModerationEngine implements ModerationEngine {
  private supabase: SupabaseClient;
  private config: ModerationConfig;
  private policies: Map<string, ModerationPolicy>;
  private keywordCache: Set<string>;
  private patternCache: Map<string, RegExp>;

  constructor(config: ModerationConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    this.policies = new Map();
    this.keywordCache = new Set();
    this.patternCache = new Map();
  }

  private async loadPolicies(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('moderation_policies')
        .select('*')
        .eq('enabled', true)
        .order('priority', { ascending: false });

      if (error) {
        logger.error('Error loading policies:', error);
        return;
      }

      this.policies.clear();
      this.keywordCache.clear();
      this.patternCache.clear();

      (data || []).forEach(policy => {
        this.policies.set(policy.id, {
          id: policy.id,
          name: policy.name,
          description: policy.description,
          rules: policy.rules || [],
          enabled: policy.enabled,
          priority: policy.priority,
          createdAt: new Date(policy.created_at),
          updatedAt: new Date(policy.updated_at)
        });

        // Cache keywords and patterns
        policy.rules.forEach((rule: ModerationRule) => {
          if (rule.type === 'keyword' && rule.config.keywords) {
            (rule.config.keywords as string[]).forEach(keyword => {
              this.keywordCache.add(keyword.toLowerCase());
            });
          }
          if (rule.type === 'pattern' && rule.config.pattern) {
            this.patternCache.set(rule.id, new RegExp(rule.config.pattern as string, 'gi'));
          }
        });
      });

    } catch (error) {
      logger.error('Error loading policies:', error);
    }
  }

  async moderateContent(
    contentId: string, 
    contentType: string, 
    content: string, 
    metadata?: Record<string, unknown>
  ): Promise<ModerationResult> {
    try {
      // Ensure policies are loaded
      if (this.policies.size === 0) {
        await this.loadPolicies();
      }

      const flags: ModerationFlag[] = [];
      let totalScore = 0;
      let totalConfidence = 0;

      // Apply all active policies
      for (const policy of Array.from(this.policies.values()).sort((a, b) => b.priority - a.priority)) {
        for (const rule of policy.rules.filter((r: ModerationRule) => r.enabled)) {
          const ruleResult = await this.applyRule(content, rule, metadata);
          
          if (ruleResult.flagged) {
            flags.push({
              ruleId: rule.id,
              ruleName: rule.id,
              type: rule.type,
              severity: rule.severity,
              message: ruleResult.message,
              matchedContent: ruleResult.matchedContent,
              confidence: ruleResult.confidence
            });
            
            totalScore += this.getSeverityScore(rule.severity);
            totalConfidence += ruleResult.confidence;
          }
        }
      }

      // Calculate average confidence
      const avgConfidence = flags.length > 0 ? totalConfidence / flags.length : 1;

      // Determine status based on thresholds
      let status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'review';
      
      if (totalScore >= this.config.autoRejectThreshold) {
        status = 'rejected';
      } else if (totalScore >= this.config.flagThreshold) {
        status = this.config.enableHumanReview ? 'review' : 'flagged';
      } else if (totalScore >= this.config.autoApproveThreshold) {
        status = 'approved';
      } else {
        status = 'pending';
      }

      const result: ModerationResult = {
        contentId,
        contentType,
        status,
        flags,
        score: totalScore,
        confidence: avgConfidence
      };

      // Store result in database
      await this.storeModerationResult(result);

      // If status is review, add to queue
      if (status === 'review' && this.config.enableHumanReview) {
        await this.addToModerationQueue(contentId, contentType, result);
      }

      return result;

    } catch (error) {
      logger.error('Error in moderateContent:', error);
      throw error;
    }
  }

  private async applyRule(
    content: string, 
    rule: ModerationRule, 
    metadata?: Record<string, unknown>
  ): Promise<{ flagged: boolean; message: string; matchedContent?: string; confidence: number }> {
    const contentLower = content.toLowerCase();

    switch (rule.type) {
      case 'keyword':
        return this.applyKeywordRule(contentLower, rule);
      
      case 'pattern':
        return this.applyPatternRule(content, rule);
      
      case 'ml':
        return this.applyMLRule(content, rule, metadata);
      
      case 'custom':
        return this.applyCustomRule(content, rule, metadata);
      
      default:
        return { flagged: false, message: '', confidence: 0 };
    }
  }

  private applyKeywordRule(content: string, rule: ModerationRule): { flagged: boolean; message: string; matchedContent?: string; confidence: number } {
    if (!this.config.enableKeywordFiltering) {
      return { flagged: false, message: '', confidence: 0 };
    }

    const keywords = rule.config.keywords as string[] || [];
    
    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        return {
          flagged: true,
          message: `Keyword match: ${keyword}`,
          matchedContent: keyword,
          confidence: 0.9
        };
      }
    }

    return { flagged: false, message: '', confidence: 0 };
  }

  private applyPatternRule(content: string, rule: ModerationRule): { flagged: boolean; message: string; matchedContent?: string; confidence: number } {
    if (!this.config.enablePatternMatching) {
      return { flagged: false, message: '', confidence: 0 };
    }

    const pattern = rule.config.pattern as string;
    const regex = new RegExp(pattern, 'gi');
    const match = content.match(regex);

    if (match) {
      return {
        flagged: true,
        message: `Pattern match: ${pattern}`,
        matchedContent: match[0],
        confidence: 0.85
      };
    }

    return { flagged: false, message: '', confidence: 0 };
  }

  private async applyMLRule(
    content: string, 
    rule: ModerationRule, 
    metadata?: Record<string, unknown>
  ): Promise<{ flagged: boolean; message: string; matchedContent?: string; confidence: number }> {
    if (!this.config.enableMLModeration || !this.config.mlModelConfig) {
      return { flagged: false, message: '', confidence: 0 };
    }

    try {
      // Placeholder for ML model inference
      // In production, this would call an actual ML model API
      const mlResult = await this.callMLModel(content, metadata);
      
      if (mlResult.flagged) {
        return {
          flagged: true,
          message: mlResult.message,
          confidence: mlResult.confidence
        };
      }

      return { flagged: false, message: '', confidence: 0 };

    } catch (error) {
      logger.error('Error in ML rule:', error);
      return { flagged: false, message: '', confidence: 0 };
    }
  }

  private async callMLModel(content: string, metadata?: Record<string, unknown>): Promise<{ flagged: boolean; message: string; confidence: number }> {
    // Placeholder for actual ML model call
    // In production, this would use OpenAI Moderation API or similar
    return {
      flagged: false,
      message: '',
      confidence: 0
    };
  }

  private applyCustomRule(
    content: string, 
    rule: ModerationRule, 
    metadata?: Record<string, unknown>
  ): { flagged: boolean; message: string; matchedContent?: string; confidence: number } {
    // Custom rule logic based on config
    const customLogic = rule.config.logic as string;
    
    try {
      // Simple example: check content length
      if (customLogic === 'min_length' && rule.config.minLength) {
        const minLength = rule.config.minLength as number;
        if (content.length < minLength) {
          return {
            flagged: true,
            message: `Content too short (minimum ${minLength} characters)`,
            confidence: 1
          };
        }
      }

      // Check for specific metadata
      if (customLogic === 'metadata_check' && metadata) {
        const requiredFields = rule.config.requiredFields as string[] || [];
        for (const field of requiredFields) {
          if (!metadata[field]) {
            return {
              flagged: true,
              message: `Missing required field: ${field}`,
              confidence: 1
            };
          }
        }
      }

      return { flagged: false, message: '', confidence: 0 };

    } catch (error) {
      logger.error('Error in custom rule:', error);
      return { flagged: false, message: '', confidence: 0 };
    }
  }

  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'critical': return 10;
      case 'high': return 7;
      case 'medium': return 4;
      case 'low': return 1;
      default: return 0;
    }
  }

  private async storeModerationResult(result: ModerationResult): Promise<void> {
    try {
      await this.supabase
        .from('moderation_results')
        .upsert({
          content_id: result.contentId,
          content_type: result.contentType,
          status: result.status,
          flags: result.flags,
          score: result.score,
          confidence: result.confidence,
          reviewed_by: result.reviewedBy,
          reviewed_at: result.reviewedAt?.toISOString(),
          notes: result.notes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'content_id'
        });

    } catch (error) {
      logger.error('Error storing moderation result:', error);
    }
  }

  private async addToModerationQueue(contentId: string, contentType: string, result: ModerationResult): Promise<void> {
    try {
      await this.supabase
        .from('moderation_queue')
        .insert({
          content_id: contentId,
          content_type: contentType,
          status: 'review',
          priority: result.score,
          submitted_at: new Date().toISOString(),
          result: result
        });

    } catch (error) {
      logger.error('Error adding to moderation queue:', error);
    }
  }

  async reviewContent(
    contentId: string, 
    status: 'approved' | 'rejected', 
    reviewerId: string, 
    notes?: string
  ): Promise<void> {
    try {
      // Update moderation result
      await this.supabase
        .from('moderation_results')
        .update({
          status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          notes
        })
        .eq('content_id', contentId);

      // Update queue
      await this.supabase
        .from('moderation_queue')
        .update({
          status,
          assigned_to: reviewerId
        })
        .eq('content_id', contentId);

    } catch (error) {
      logger.error('Error in reviewContent:', error);
      throw error;
    }
  }

  async getModerationQueue(limit: number = 50): Promise<ModerationQueueItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('moderation_queue')
        .select('*')
        .eq('status', 'review')
        .order('priority', { ascending: false })
        .order('submitted_at', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('Error getting moderation queue:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        contentId: item.content_id,
        contentType: item.content_type,
        status: item.status,
        priority: item.priority,
        submittedAt: new Date(item.submitted_at),
        assignedTo: item.assigned_to,
        result: item.result as ModerationResult
      }));

    } catch (error) {
      logger.error('Error in getModerationQueue:', error);
      return [];
    }
  }

  async createPolicy(policy: Omit<ModerationPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModerationPolicy> {
    try {
      const { data, error } = await this.supabase
        .from('moderation_policies')
        .insert({
          name: policy.name,
          description: policy.description,
          rules: policy.rules,
          enabled: policy.enabled,
          priority: policy.priority,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating policy:', error);
        throw error;
      }

      const newPolicy: ModerationPolicy = {
        id: data.id,
        name: data.name,
        description: data.description,
        rules: data.rules,
        enabled: data.enabled,
        priority: data.priority,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Reload policies
      await this.loadPolicies();

      return newPolicy;

    } catch (error) {
      logger.error('Error in createPolicy:', error);
      throw error;
    }
  }

  async updatePolicy(policyId: string, updates: Partial<ModerationPolicy>): Promise<void> {
    try {
      await this.supabase
        .from('moderation_policies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', policyId);

      // Reload policies
      await this.loadPolicies();

    } catch (error) {
      logger.error('Error in updatePolicy:', error);
      throw error;
    }
  }

  async deletePolicy(policyId: string): Promise<void> {
    try {
      await this.supabase
        .from('moderation_policies')
        .delete()
        .eq('id', policyId);

      // Reload policies
      await this.loadPolicies();

    } catch (error) {
      logger.error('Error in deletePolicy:', error);
      throw error;
    }
  }

  async getActivePolicies(): Promise<ModerationPolicy[]> {
    // Ensure policies are loaded
    if (this.policies.size === 0) {
      await this.loadPolicies();
    }

    return Array.from(this.policies.values()).filter(p => p.enabled);
  }

  async getModerationStats(): Promise<{ totalModerated: number; approved: number; rejected: number; flagged: number; pending: number }> {
    try {
      const { data, error } = await this.supabase
        .from('moderation_results')
        .select('status');

      if (error) {
        logger.error('Error getting moderation stats:', error);
        return { totalModerated: 0, approved: 0, rejected: 0, flagged: 0, pending: 0 };
      }

      const stats = {
        totalModerated: data?.length || 0,
        approved: 0,
        rejected: 0,
        flagged: 0,
        pending: 0
      };

      (data || []).forEach(item => {
        switch (item.status) {
          case 'approved': stats.approved++; break;
          case 'rejected': stats.rejected++; break;
          case 'flagged': stats.flagged++; break;
          case 'pending': stats.pending++; break;
        }
      });

      return stats;

    } catch (error) {
      logger.error('Error in getModerationStats:', error);
      return { totalModerated: 0, approved: 0, rejected: 0, flagged: 0, pending: 0 };
    }
  }
}

// Singleton instance
let moderationEngineInstance: ModerationEngine | null = null;

export function getModerationEngine(config?: ModerationConfig): ModerationEngine {
  if (!moderationEngineInstance && config) {
    moderationEngineInstance = new BaseModerationEngine(config);
  }
  return moderationEngineInstance!;
}

export function resetModerationEngine(): void {
  moderationEngineInstance = null;
}
