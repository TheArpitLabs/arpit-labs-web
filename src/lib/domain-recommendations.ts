/**
 * Domain Recommendation Integration
 * 
 * Integrates the recommendation engine with domain-specific content discovery
 * Provides personalized recommendations within engineering domains
 */

import { getRecommendationEngine, RecommendationEngine } from './acquisition/recommendation/recommendation-engine';
import { RecommendationRequest, RecommendationContext, RecommendationConfig } from './acquisition/recommendation/types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface DomainRecommendationOptions {
  domainSlug: string;
  subdomainSlug?: string;
  userId?: string;
  limit?: number;
  algorithm?: 'collaborative' | 'content-based' | 'trending' | 'hybrid';
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
  private recommendationEngine: RecommendationEngine;

  constructor() {
    const config: RecommendationConfig = {
      enableCollaborativeFiltering: true,
      enableContentBasedFiltering: true,
      enableTrending: true,
      enableSimilarity: true,
      weights: {
        collaborative: 0.35,
        contentBased: 0.35,
        trending: 0.2,
        similarity: 0.1
      },
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
      minConfidence: 0.3,
      maxRecommendations: 50
    };
    this.recommendationEngine = getRecommendationEngine(config);
  }

  /**
   * Get domain-specific recommendations
   */
  async getDomainRecommendations(options: DomainRecommendationOptions): Promise<DomainRecommendation[]> {
    const { domainSlug, subdomainSlug, userId, limit = 20, algorithm = 'hybrid' } = options;

    try {
      // Get domain ID
      const { data: domain, error: domainError } = await supabase
        .from('engineering_domains')
        .select('id, name')
        .eq('slug', domainSlug)
        .single();

      if (domainError || !domain) {
        console.error('Error fetching domain:', domainError);
        return [];
      }

      // Build recommendation context
      const subdomainId = subdomainSlug ? await this.getSubdomainId(subdomainSlug, domain.id) : undefined;
      const context: RecommendationContext = {
        userId: userId || 'anonymous',
        currentContentId: undefined,
        sessionContext: {
          domainId: domain.id,
          subdomainId: subdomainId
        }
      };

      // Build recommendation request
      const request: RecommendationRequest = {
        context,
        limit,
        algorithm,
        filters: {
          domain_id: domain.id,
          ...(subdomainSlug && { subdomain_id: subdomainId })
        }
      };

      // Get recommendations from engine
      const response = await this.recommendationEngine.getRecommendations(request);

      // Enrich recommendations with content details
      const enrichedRecommendations = await this.enrichRecommendations(
        response.results,
        domain.name
      );

      return enrichedRecommendations.slice(0, limit);

    } catch (error) {
      console.error('Error getting domain recommendations:', error);
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
      console.error('Error getting domain trending:', error);
      return [];
    }
  }

  /**
   * Get similar content within a domain
   */
  async getDomainSimilarContent(
    contentId: string,
    domainSlug: string,
    limit: number = 10
  ): Promise<DomainRecommendation[]> {
    try {
      const { data: domain, error: domainError } = await supabase
        .from('engineering_domains')
        .select('id, name')
        .eq('slug', domainSlug)
        .single();

      if (domainError || !domain) {
        return [];
      }

      // Get similar content from recommendation engine
      const similarContent = await this.recommendationEngine.getSimilarContent(contentId, limit * 2);

      // Filter by domain and enrich
      const domainSimilar = await this.filterByDomainAndEnrich(
        similarContent,
        domain.id,
        domain.name,
        limit
      );

      return domainSimilar;

    } catch (error) {
      console.error('Error getting domain similar content:', error);
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
      await this.recommendationEngine.updateUserProfile(userId, [{ contentId, action }]);
    } catch (error) {
      console.error('Error tracking interaction:', error);
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
      limit,
      algorithm: 'hybrid'
    });
  }

  /**
   * Helper: Get subdomain ID from slug
   */
  private async getSubdomainId(subdomainSlug: string, domainId: string): Promise<string | undefined> {
    try {
      const { data, error } = await supabase
        .from('engineering_subdomains')
        .select('id')
        .eq('slug', subdomainSlug)
        .eq('domain_id', domainId)
        .single();

      return error ? undefined : data?.id;
    } catch {
      return undefined;
    }
  }

  /**
   * Helper: Enrich recommendations with content details
   */
  private async enrichRecommendations(
    recommendations: Array<{ contentId: string; contentType: string; score: number; confidence: number; reason: string; metadata: Record<string, unknown> }>,
    domainName: string
  ): Promise<DomainRecommendation[]> {
    const enriched = await Promise.all(
      recommendations.map(async (rec) => {
        const contentDetails = await this.getContentDetails(rec.contentId, rec.contentType);

        return {
          contentId: rec.contentId,
          contentType: rec.contentType as any,
          title: (contentDetails?.title as string) || 'Unknown',
          description: (contentDetails?.description as string) || '',
          score: rec.score,
          confidence: rec.confidence,
          reason: rec.reason,
          domainName,
          subdomainName: contentDetails?.subdomain_name as string | undefined,
          metadata: {
            ...rec.metadata,
            ...contentDetails
          }
        };
      })
    );

    return enriched.filter(r => r.title !== 'Unknown');
  }

  /**
   * Helper: Get content details from appropriate table
   */
  private async getContentDetails(contentId: string, contentType: string): Promise<Record<string, unknown> | null> {
    try {
      let tableName = '';
      switch (contentType) {
        case 'project':
          tableName = 'projects';
          break;
        case 'research_paper':
          tableName = 'research_papers';
          break;
        case 'dataset':
          tableName = 'datasets';
          break;
        case 'learning_resource':
          tableName = 'learning_resources';
          break;
        default:
          return null;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select(`
          title,
          description,
          engineering_subdomains (name)
        `)
        .eq('id', contentId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        title: (data as any).title as string,
        description: (data as any).description as string,
        subdomain_name: (data as any).engineering_subdomains?.name as string | undefined
      };

    } catch (error) {
      console.error('Error getting content details:', error);
      return null;
    }
  }

  /**
   * Helper: Filter recommendations by domain and enrich
   */
  private async filterByDomainAndEnrich(
    recommendations: Array<{ contentId: string; contentType: string; score: number; confidence: number; reason: string; metadata: Record<string, unknown> }>,
    domainId: string,
    domainName: string,
    limit: number
  ): Promise<DomainRecommendation[]> {
    const filtered: DomainRecommendation[] = [];

    for (const rec of recommendations) {
      const contentDetails = await this.getContentDetails(rec.contentId, rec.contentType);
      
      if (contentDetails) {
        // Check if content belongs to the domain
        const { data: domainCheck } = await supabase
          .from(rec.contentType === 'project' ? 'projects' : 
               rec.contentType === 'research_paper' ? 'research_papers' :
               rec.contentType === 'dataset' ? 'datasets' : 'learning_resources')
          .select('domain_id')
          .eq('id', rec.contentId)
          .single();

        if (domainCheck?.domain_id === domainId) {
          filtered.push({
            contentId: rec.contentId,
            contentType: rec.contentType as any,
            title: (contentDetails.title as string) || 'Unknown',
            description: (contentDetails.description as string) || '',
            score: rec.score,
            confidence: rec.confidence,
            reason: rec.reason,
            domainName,
            subdomainName: contentDetails.subdomain_name as string | undefined,
            metadata: {
              ...rec.metadata,
              ...contentDetails
            }
          });
        }

        if (filtered.length >= limit) break;
      }
    }

    return filtered;
  }
}

// Singleton instance
let domainRecommendationService: DomainRecommendationService | null = null;

export function getDomainRecommendationService(): DomainRecommendationService {
  if (!domainRecommendationService) {
    domainRecommendationService = new DomainRecommendationService();
  }
  return domainRecommendationService;
}

export function resetDomainRecommendationService(): void {
  domainRecommendationService = null;
}
