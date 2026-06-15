/**
 * Recommendation Engine
 * 
 * Provides personalized content recommendations using multiple algorithms
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  UserProfile, 
  RecommendationContext, 
  RecommendationRequest, 
  RecommendationResult, 
  RecommendationResponse,
  RecommendationConfig 
} from './types';

export interface RecommendationEngine {
  getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse>;
  updateUserProfile(userId: string, interactions: Array<{ contentId: string; action: string }>): Promise<void>;
  getTrendingContent(limit?: number): Promise<RecommendationResult[]>;
  getSimilarContent(contentId: string, limit?: number): Promise<RecommendationResult[]>;
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<RecommendationResult[]>;
  clearCache(): Promise<void>;
  getRecommendationStats(): Promise<{ totalRecommendations: number; byAlgorithm: Record<string, number> }>;
}

class BaseRecommendationEngine implements RecommendationEngine {
  private supabase: SupabaseClient;
  private config: RecommendationConfig;
  private cache: Map<string, { data: RecommendationResponse; timestamp: number }>;
  private stats: Map<string, number>;

  constructor(config: RecommendationConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    this.cache = new Map();
    this.stats = new Map();
  }

  private generateCacheKey(request: RecommendationRequest): string {
    return JSON.stringify({
      context: request.context,
      limit: request.limit,
      offset: request.offset,
      filters: request.filters,
      algorithm: request.algorithm
    });
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.config.cacheTTL;
  }

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        userId: data.user_id,
        interests: data.interests || [],
        skills: data.skills || [],
        viewedContent: data.viewed_content || [],
        bookmarkedContent: data.bookmarked_content || [],
        interactionHistory: data.interaction_history || [],
        preferences: data.preferences || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  private async updateUserProfileData(userId: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      await this.supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          ...profile,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  async updateUserProfile(userId: string, interactions: Array<{ contentId: string; action: string }>): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      
      if (!profile) {
        // Create new profile
        await this.updateUserProfileData(userId, {
          interests: [],
          skills: [],
          viewedContent: [],
          bookmarkedContent: [],
          interactionHistory: interactions.map(i => ({
            contentId: i.contentId,
            contentType: 'unknown',
            action: i.action as any,
            timestamp: new Date()
          })),
          preferences: {
            contentTypes: [],
            topics: [],
            difficulty: 'intermediate',
            languages: [],
            updateFrequency: 'weekly'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return;
      }

      // Update existing profile
      const newViewedContent = [...new Set([
        ...profile.viewedContent,
        ...interactions.filter(i => i.action === 'view').map(i => i.contentId)
      ])];
      
      const newBookmarkedContent = [...new Set([
        ...profile.bookmarkedContent,
        ...interactions.filter(i => i.action === 'bookmark').map(i => i.contentId)
      ])];

      const newInteractionHistory = [
        ...profile.interactionHistory,
        ...interactions.map(i => ({
          contentId: i.contentId,
          contentType: 'unknown',
          action: i.action as any,
          timestamp: new Date()
        }))
      ];

      await this.updateUserProfileData(userId, {
        viewedContent: newViewedContent,
        bookmarkedContent: newBookmarkedContent,
        interactionHistory: newInteractionHistory,
        updatedAt: new Date()
      });

    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startTime = Date.now();
    
    // Check cache
    if (this.config.cacheEnabled) {
      const cacheKey = this.generateCacheKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data;
      }
    }

    try {
      let results: RecommendationResult[] = [];
      let algorithm = request.algorithm || 'hybrid';

      // Route to appropriate algorithm
      switch (algorithm) {
        case 'collaborative':
          results = await this.collaborativeFiltering(request);
          break;
        case 'content-based':
          results = await this.contentBasedFiltering(request);
          break;
        case 'trending':
          results = await this.getTrendingContent(request.limit);
          break;
        case 'similar':
          if (request.context.currentContentId) {
            results = await this.getSimilarContent(request.context.currentContentId, request.limit);
          } else {
            results = await this.contentBasedFiltering(request);
          }
          break;
        case 'hybrid':
        default:
          results = await this.hybridRecommendations(request);
          break;
      }

      // Apply filters
      if (request.filters) {
        results = this.applyFilters(results, request.filters);
      }

      // Apply pagination
      const offset = request.offset || 0;
      const limit = request.limit || this.config.maxRecommendations;
      const paginatedResults = results.slice(offset, offset + limit);

      // Filter by minimum confidence
      const filteredResults = paginatedResults.filter(
        r => r.confidence >= this.config.minConfidence
      );

      const response: RecommendationResponse = {
        results: filteredResults,
        total: results.length,
        algorithm,
        metadata: {
          userId: request.context.userId,
          context: request.context,
          generatedAt: new Date()
        }
      };

      // Update stats
      this.stats.set(algorithm, (this.stats.get(algorithm) || 0) + 1);

      // Cache results
      if (this.config.cacheEnabled) {
        const cacheKey = this.generateCacheKey(request);
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
      }

      return response;

    } catch (error) {
      console.error('Error in getRecommendations:', error);
      throw error;
    }
  }

  private async collaborativeFiltering(request: RecommendationRequest): Promise<RecommendationResult[]> {
    try {
      if (!request.context.userId) {
        return [];
      }

      // Find similar users based on interaction history
      const { data: similarUsers, error } = await this.supabase
        .from('user_profiles')
        .select('user_id, viewed_content, bookmarked_content')
        .neq('user_id', request.context.userId)
        .limit(50);

      if (error || !similarUsers) {
        return [];
      }

      const userProfile = await this.getUserProfile(request.context.userId);
      if (!userProfile) {
        return [];
      }

      // Calculate similarity scores
      const userSimilarity = similarUsers.map(otherUser => {
        const commonViewed = otherUser.viewed_content.filter(
          (id: string) => userProfile.viewedContent.includes(id)
        ).length;
        const commonBookmarked = otherUser.bookmarked_content.filter(
          (id: string) => userProfile.bookmarkedContent.includes(id)
        ).length;
        
        return {
          userId: otherUser.user_id,
          similarity: (commonViewed * 0.7 + commonBookmarked * 0.3) / 
                     (userProfile.viewedContent.length + userProfile.bookmarkedContent.length || 1)
        };
      }).sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);

      // Get content liked by similar users
      const recommendations = new Map<string, RecommendationResult>();
      
      for (const similar of userSimilarity) {
        const similarProfile = await this.getUserProfile(similar.userId);
        if (!similarProfile) continue;

        const contentIds = [...similarProfile.viewedContent, ...similarProfile.bookmarkedContent];
        
        for (const contentId of contentIds) {
          if (!userProfile.viewedContent.includes(contentId) && 
              !userProfile.bookmarkedContent.includes(contentId)) {
            
            const existing = recommendations.get(contentId);
            const score = similar.similarity;
            
            if (existing) {
              existing.score += score;
              existing.confidence = Math.min(existing.confidence + 0.1, 1);
            } else {
              recommendations.set(contentId, {
                contentId,
                contentType: 'unknown',
                score,
                confidence: 0.5,
                reason: 'Users with similar interests liked this',
                metadata: {}
              });
            }
          }
        }
      }

      return Array.from(recommendations.values())
        .sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Error in collaborativeFiltering:', error);
      return [];
    }
  }

  private async contentBasedFiltering(request: RecommendationRequest): Promise<RecommendationResult[]> {
    try {
      if (!request.context.userId) {
        return [];
      }

      const userProfile = await this.getUserProfile(request.context.userId);
      if (!userProfile) {
        return [];
      }

      // Get content based on user's interests and skills
      const interests = userProfile.interests || [];
      const skills = userProfile.skills || [];

      if (interests.length === 0 && skills.length === 0) {
        return [];
      }

      // Search for content matching interests/skills
      const searchTerms = [...interests, ...skills].join(' ');
      
      const { data: content, error } = await this.supabase
        .from('content_embeddings')
        .select(`
          content_id,
          content_type,
          metadata
        `)
        .limit(100);

      if (error || !content) {
        return [];
      }

      // Score content based on relevance to interests/skills
      const results: RecommendationResult[] = content.map(item => {
        const metadata = item.metadata as Record<string, unknown>;
        const text = Object.values(metadata).join(' ').toLowerCase();
        
        let relevanceScore = 0;
        interests.forEach(interest => {
          if (text.includes(interest.toLowerCase())) {
            relevanceScore += 1;
          }
        });
        skills.forEach(skill => {
          if (text.includes(skill.toLowerCase())) {
            relevanceScore += 0.8;
          }
        });

        return {
          contentId: item.content_id,
          contentType: item.content_type,
          score: relevanceScore,
          confidence: Math.min(relevanceScore / Math.max(interests.length, skills.length, 1), 1),
          reason: 'Matches your interests and skills',
          metadata: metadata || {}
        };
      }).filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score);

      // Exclude already viewed/bookmarked content
      return results.filter(
        r => !userProfile.viewedContent.includes(r.contentId) &&
             !userProfile.bookmarkedContent.includes(r.contentId)
      );

    } catch (error) {
      console.error('Error in contentBasedFiltering:', error);
      return [];
    }
  }

  private async hybridRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const collaborativeResults = this.config.enableCollaborativeFiltering 
      ? await this.collaborativeFiltering(request) 
      : [];
    
    const contentBasedResults = this.config.enableContentBasedFiltering 
      ? await this.contentBasedFiltering(request) 
      : [];
    
    const trendingResults = this.config.enableTrending 
      ? await this.getTrendingContent(request.limit) 
      : [];

    // Combine results with weights
    const combined = new Map<string, RecommendationResult>();

    const addResults = (results: RecommendationResult[], weight: number) => {
      results.forEach(result => {
        const existing = combined.get(result.contentId);
        if (existing) {
          existing.score = (existing.score + result.score * weight) / 2;
          existing.confidence = Math.min(existing.confidence + 0.05, 1);
        } else {
          combined.set(result.contentId, {
            ...result,
            score: result.score * weight
          });
        }
      });
    };

    addResults(collaborativeResults, this.config.weights.collaborative);
    addResults(contentBasedResults, this.config.weights.contentBased);
    addResults(trendingResults, this.config.weights.trending);

    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score);
  }

  async getTrendingContent(limit: number = 20): Promise<RecommendationResult[]> {
    try {
      const { data, error } = await this.supabase
        .from('content_acquisition_queue')
        .select(`
          id,
          source_url,
          metadata,
          quality_score
        `)
        .gte('quality_score', 0.7)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data.map(item => ({
        contentId: item.id,
        contentType: (item.metadata as any)?.content_type || 'unknown',
        score: item.quality_score || 0,
        confidence: 0.8,
        reason: 'Trending content with high quality score',
        metadata: item.metadata as Record<string, unknown> || {}
      })).sort((a, b) => b.score - a.score);

    } catch (error) {
      console.error('Error in getTrendingContent:', error);
      return [];
    }
  }

  async getSimilarContent(contentId: string, limit: number = 20): Promise<RecommendationResult[]> {
    try {
      // Get the content's embedding
      const { data: content, error } = await this.supabase
        .from('content_embeddings')
        .select('content_id, content_type, embedding, metadata')
        .eq('content_id', contentId)
        .single();

      if (error || !content) {
        return [];
      }

      // Find similar content using cosine similarity
      const { data: allContent, error: allError } = await this.supabase
        .from('content_embeddings')
        .select('content_id, content_type, embedding, metadata')
        .neq('content_id', contentId)
        .limit(100);

      if (allError || !allContent) {
        return [];
      }

      const targetEmbedding = content.embedding as number[];
      
      const similarities = allContent.map(item => {
        const embedding = item.embedding as number[];
        const similarity = this.cosineSimilarity(targetEmbedding, embedding);
        
        return {
          contentId: item.content_id,
          contentType: item.content_type,
          score: similarity,
          confidence: similarity,
          reason: 'Similar to content you viewed',
          metadata: item.metadata as Record<string, unknown> || {}
        };
      }).filter(r => r.score > 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return similarities;

    } catch (error) {
      console.error('Error in getSimilarContent:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 20): Promise<RecommendationResult[]> {
    const request: RecommendationRequest = {
      context: { userId },
      limit,
      algorithm: 'hybrid'
    };

    const response = await this.getRecommendations(request);
    return response.results;
  }

  private applyFilters(results: RecommendationResult[], filters: Record<string, unknown>): RecommendationResult[] {
    return results.filter(result => {
      for (const [key, value] of Object.entries(filters)) {
        if (result.metadata[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async getRecommendationStats(): Promise<{ totalRecommendations: number; byAlgorithm: Record<string, number> }> {
    const total = Array.from(this.stats.values()).reduce((sum, count) => sum + count, 0);
    const byAlgorithm: Record<string, number> = {};
    
    this.stats.forEach((count, algorithm) => {
      byAlgorithm[algorithm] = count;
    });

    return {
      totalRecommendations: total,
      byAlgorithm
    };
  }
}

// Singleton instance
let recommendationEngineInstance: RecommendationEngine | null = null;

export function getRecommendationEngine(config?: RecommendationConfig): RecommendationEngine {
  if (!recommendationEngineInstance && config) {
    recommendationEngineInstance = new BaseRecommendationEngine(config);
  }
  return recommendationEngineInstance!;
}

export function resetRecommendationEngine(): void {
  recommendationEngineInstance = null;
}
