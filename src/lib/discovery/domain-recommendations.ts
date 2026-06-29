/**
 * Domain Recommendation Integration
 * 
 * Integrates the recommendation engine with domain-specific content discovery
 * Provides personalized recommendations within engineering domains
 */

import { recommendationEngine } from './recommendation-engine';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface DomainRecommendationOptions {
  domainSlug: string;
  subdomainSlug?: string;
  userId?: string;
  limit?: number;
}

export interface DomainRecommendation {
  contentId: string;
  contentType: 'project' | 'research_paper' | 'dataset' | 'learning_resource';
  title: string;
  description: string;
  score: number;
  confidence: number;
  reason: string;
  domainName?: string;
  subdomainName?: string;
  metadata: Record<string, unknown>;
}

export class DomainRecommendationService {
  /**
   * Get domain-specific recommendations
   */
  async getDomainRecommendations(options: DomainRecommendationOptions): Promise<DomainRecommendation[]> {
    const { domainSlug, userId, limit = 20 } = options;

    try {
      // Get domain ID
      const { data: domain, error: domainError } = await supabase
        .from('engineering_domains')
        .select('id, name')
        .eq('slug', domainSlug)
        .single();

      if (domainError || !domain) {
        logger.error('Error fetching domain:', domainError);
        return [];
      }

      // Use simple recommendation engine
      if (userId) {
        const recommendations = await recommendationEngine.getRecommendations(userId);
        
        // Enrich recommendations with content details
        const enrichedRecommendations = await this.enrichRecommendations(
          recommendations,
          domain.name
        );

        return enrichedRecommendations.slice(0, limit);
      }

      return [];

    } catch (error) {
      logger.error('Error getting domain recommendations:', error);
      return [];
    }
  }

  /**
   * Get trending content within a domain
   */
  async getDomainTrending(domainSlug: string, limit: number = 20): Promise<DomainRecommendation[]> {
    try {
      const { data: domain, error: domainError } = await supabase
        .from('engineering_domains')
        .select('id, name')
        .eq('slug', domainSlug)
        .single();

      if (domainError || !domain) {
        return [];
      }

      // Get trending content from content_trending_scores
      const { data: trendingData, error: trendingError } = await supabase
        .from('content_trending_scores')
        .select(`
          content_id,
          content_type,
          trending_score,
          momentum_score,
          engineering_domains!inner (name),
          engineering_subdomains (name)
        `)
        .eq('engineering_domains.slug', domainSlug)
        .eq('trend_period', 'daily')
        .order('trending_score', { ascending: false })
        .limit(limit);

      if (trendingError || !trendingData) {
        return [];
      }

      // Enrich with content details
      const recommendations = await Promise.all(
        trendingData.map(async (item: any) => {
          const contentDetails = await this.getContentDetails(
            item.content_id,
            item.content_type
          );

          return {
            contentId: item.content_id,
            contentType: item.content_type as any,
            title: (contentDetails?.title as string) || 'Unknown',
            description: (contentDetails?.description as string) || '',
            score: item.trending_score,
            confidence: Math.min(item.trending_score / 100, 1),
            reason: 'Trending in this domain',
            domainName: item.engineering_domains?.name,
            subdomainName: item.engineering_subdomains?.name,
            metadata: {
              momentum_score: item.momentum_score,
              ...contentDetails
            }
          };
        })
      );

      return recommendations.filter(r => r.title !== 'Unknown');

    } catch (error) {
      logger.error('Error getting domain trending:', error);
      return [];
    }
  }

  /**
   * Track user interaction for recommendations
   */
  async trackInteraction(
    userId: string,
    contentId: string,
    action: 'view' | 'bookmark' | 'like' | 'share'
  ): Promise<void> {
    try {
      await recommendationEngine.trackBehavior(userId, action, 'content', contentId);
    } catch (error) {
      logger.error('Error tracking interaction:', error);
    }
  }

  /**
   * Get personalized recommendations for a user within a domain
   */
  async getPersonalizedDomainRecommendations(
    userId: string,
    domainSlug: string,
    limit: number = 20
  ): Promise<DomainRecommendation[]> {
    return this.getDomainRecommendations({
      domainSlug,
      userId,
      limit
    });
  }

  /**
   * Helper: Enrich recommendations with content details
   */
  private async enrichRecommendations(
    recommendations: any[],
    domainName: string
  ): Promise<DomainRecommendation[]> {
    return Promise.all(
      recommendations.map(async (rec) => {
        const contentDetails = await this.getContentDetails(rec.id, rec.type);

        return {
          contentId: rec.id,
          contentType: rec.type as any,
          title: (contentDetails?.title as string) || 'Unknown',
          description: (contentDetails?.description as string) || '',
          score: rec.score || 0,
          confidence: rec.confidence || 0,
          reason: rec.reason || 'Personalized recommendation',
          domainName,
          metadata: {
            ...contentDetails
          }
        };
      })
    );
  }

  /**
   * Helper: Get content details from various tables
   */
  private async getContentDetails(contentId: string, contentType: string) {
    try {
      switch (contentType) {
        case 'project':
          const { data: project } = await supabase
            .from('projects')
            .select('title, description, tech_stack')
            .eq('id', contentId)
            .single();
          return project;
        
        case 'research_paper':
          const { data: paper } = await supabase
            .from('research_papers')
            .select('title, abstract, authors')
            .eq('id', contentId)
            .single();
          return paper ? { title: paper.title, description: paper.abstract } : null;
        
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
}

export const domainRecommendationService = new DomainRecommendationService();