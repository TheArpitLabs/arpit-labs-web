/**
 * Trending Engine
 * 
 * Calculates trending scores for content based on engagement metrics
 * Supports daily, weekly, and monthly trend periods
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TrendingMetrics {
  views_count: number;
  saves_count: number;
  shares_count: number;
  clones_count: number;
  forks_count: number;
  daily_views: number;
  weekly_views: number;
  monthly_views: number;
  search_count: number;
}

export interface TrendingScore {
  content_id: string;
  content_type: string;
  domain_id?: string;
  subdomain_id?: string;
  trending_score: number;
  momentum_score: number;
  velocity_score: number;
  trend_period: 'daily' | 'weekly' | 'monthly';
  last_calculated_at: Date;
}

export interface TrendingOptions {
  content_id: string;
  content_type: 'project' | 'research_paper' | 'dataset' | 'learning_resource';
  domain_id?: string;
  subdomain_id?: string;
  metrics: TrendingMetrics;
  trend_period?: 'daily' | 'weekly' | 'monthly';
}

export interface TrendingContentResult {
  content_id: string;
  content_type: string;
  trending_score: number;
  momentum_score: number;
  title?: string;
  description?: string;
  domain_name?: string;
  subdomain_name?: string;
}

class TrendingEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * Calculate trending score based on engagement metrics
   * Formula: weighted combination of views, saves, shares, recent activity, and search frequency
   */
  private calculateTrendingScore(metrics: TrendingMetrics, period: 'daily' | 'weekly' | 'monthly'): number {
    const weights = {
      views: 0.3,
      saves: 0.25,
      shares: 0.2,
      recent_activity: 0.15,
      search: 0.1
    };

    let recentViews = metrics.daily_views;
    if (period === 'weekly') recentViews = metrics.weekly_views;
    if (period === 'monthly') recentViews = metrics.monthly_views;

    const score = 
      (metrics.views_count * weights.views) +
      (metrics.saves_count * weights.saves) +
      (metrics.shares_count * weights.shares) +
      (recentViews * weights.recent_activity) +
      (metrics.search_count * weights.search);

    // Normalize to 0-100 range
    return Math.min(Math.round(score), 100);
  }

  /**
   * Calculate momentum score (rate of change)
   */
  private calculateMomentumScore(metrics: TrendingMetrics): number {
    // Momentum is based on the ratio of recent activity to total activity
    const totalActivity = metrics.views_count + metrics.saves_count + metrics.shares_count;
    const recentActivity = metrics.daily_views + metrics.weekly_views;
    
    if (totalActivity === 0) return 0;
    
    const momentum = (recentActivity / totalActivity) * 100;
    return Math.min(Math.round(momentum), 100);
  }

  /**
   * Calculate velocity score (speed of growth)
   */
  private calculateVelocityScore(metrics: TrendingMetrics): number {
    // Velocity is based on the rate of new engagement
    const velocity = (metrics.daily_views * 7 + metrics.weekly_views) / 30;
    return Math.min(Math.round(velocity), 100);
  }

  /**
   * Update trending score for a specific content item
   */
  async updateTrendingScore(options: TrendingOptions): Promise<TrendingScore> {
    const {
      content_id,
      content_type,
      domain_id,
      subdomain_id,
      metrics,
      trend_period = 'daily'
    } = options;

    const trending_score = this.calculateTrendingScore(metrics, trend_period);
    const momentum_score = this.calculateMomentumScore(metrics);
    const velocity_score = this.calculateVelocityScore(metrics);

    const { data, error } = await this.supabase
      .from('content_trending_scores')
      .upsert({
        content_id,
        content_type,
        domain_id,
        subdomain_id,
        ...metrics,
        trending_score,
        momentum_score,
        velocity_score,
        trend_period,
        last_calculated_at: new Date().toISOString()
      }, {
        onConflict: 'content_id,content_type,trend_period'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating trending score:', error);
      throw error;
    }

    return data as TrendingScore;
  }

  /**
   * Batch update trending scores for multiple content items
   */
  async batchUpdateTrendingScores(optionsList: TrendingOptions[]): Promise<TrendingScore[]> {
    const promises = optionsList.map(options => this.updateTrendingScore(options));
    return Promise.all(promises);
  }

  /**
   * Get trending content for a specific domain
   */
  async getTrendingByDomain(
    domainSlug: string,
    limit: number = 20,
    trend_period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<TrendingContentResult[]> {
    const { data, error } = await this.supabase
      .from('content_trending_scores')
      .select(`
        content_id,
        content_type,
        trending_score,
        momentum_score,
        domain_id,
        subdomain_id,
        engineering_domains!inner (name, slug),
        engineering_subdomains (name, slug)
      `)
      .eq('engineering_domains.slug', domainSlug)
      .eq('trend_period', trend_period)
      .order('trending_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting trending by domain:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      content_id: item.content_id,
      content_type: item.content_type,
      trending_score: item.trending_score,
      momentum_score: item.momentum_score,
      domain_name: item.engineering_domains?.name,
      subdomain_name: item.engineering_subdomains?.name
    }));
  }

  /**
   * Get trending content for a specific subdomain
   */
  async getTrendingBySubdomain(
    subdomainSlug: string,
    limit: number = 20,
    trend_period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<TrendingContentResult[]> {
    const { data, error } = await this.supabase
      .from('content_trending_scores')
      .select(`
        content_id,
        content_type,
        trending_score,
        momentum_score,
        domain_id,
        subdomain_id,
        engineering_subdomains!inner (name, slug),
        engineering_domains (name, slug)
      `)
      .eq('engineering_subdomains.slug', subdomainSlug)
      .eq('trend_period', trend_period)
      .order('trending_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting trending by subdomain:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      content_id: item.content_id,
      content_type: item.content_type,
      trending_score: item.trending_score,
      momentum_score: item.momentum_score,
      domain_name: item.engineering_domains?.name,
      subdomain_name: item.engineering_subdomains?.name
    }));
  }

  /**
   * Get global trending content across all domains
   */
  async getGlobalTrending(
    limit: number = 50,
    trend_period: 'daily' | 'weekly' | 'monthly' = 'daily',
    contentType?: 'project' | 'research_paper' | 'dataset' | 'learning_resource'
  ): Promise<TrendingContentResult[]> {
    let query = this.supabase
      .from('content_trending_scores')
      .select(`
        content_id,
        content_type,
        trending_score,
        momentum_score,
        domain_id,
        subdomain_id,
        engineering_domains (name, slug),
        engineering_subdomains (name, slug)
      `)
      .eq('trend_period', trend_period)
      .order('trending_score', { ascending: false });

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Error getting global trending:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      content_id: item.content_id,
      content_type: item.content_type,
      trending_score: item.trending_score,
      momentum_score: item.momentum_score,
      domain_name: item.engineering_domains?.name,
      subdomain_name: item.engineering_subdomains?.name
    }));
  }

  /**
   * Track content view
   */
  async trackView(contentId: string, contentType: string): Promise<void> {
    await this.supabase.rpc('increment_content_views', {
      p_content_id: contentId,
      p_content_type: contentType
    });
  }

  /**
   * Track content save
   */
  async trackSave(contentId: string, contentType: string): Promise<void> {
    await this.supabase.rpc('increment_content_saves', {
      p_content_id: contentId,
      p_content_type: contentType
    });
  }

  /**
   * Track content share
   */
  async trackShare(contentId: string, contentType: string): Promise<void> {
    await this.supabase.rpc('increment_content_shares', {
      p_content_id: contentId,
      p_content_type: contentType
    });
  }

  /**
   * Track search query for trending calculation
   */
  async trackSearch(query: string, domainSlug?: string): Promise<void> {
    await this.supabase.rpc('track_search_query', {
      p_query: query,
      p_domain_slug: domainSlug
    });
  }

  /**
   * Recalculate all trending scores (should be run periodically)
   */
  async recalculateAllTrendingScores(): Promise<void> {
    const { error } = await this.supabase.rpc('update_trending_scores');
    
    if (error) {
      console.error('Error recalculating trending scores:', error);
      throw error;
    }
  }

  /**
   * Get trending statistics for a domain
   */
  async getDomainTrendingStats(domainSlug: string): Promise<{
    total_trending_items: number;
    avg_trending_score: number;
    top_content_type: string;
    growth_rate: number;
  }> {
    const { data, error } = await this.supabase
      .from('content_trending_scores')
      .select(`
        trending_score,
        content_type
      `)
      .eq('engineering_domains.slug', domainSlug);

    if (error || !data) {
      return {
        total_trending_items: 0,
        avg_trending_score: 0,
        top_content_type: 'project',
        growth_rate: 0
      };
    }

    const totalItems = data.length;
    const avgScore = data.reduce((sum, item: any) => sum + item.trending_score, 0) / totalItems;
    
    // Find most common content type
    const typeCounts: Record<string, number> = {};
    data.forEach((item: any) => {
      typeCounts[item.content_type] = (typeCounts[item.content_type] || 0) + 1;
    });
    const topContentType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'project';

    return {
      total_trending_items: totalItems,
      avg_trending_score: Math.round(avgScore),
      top_content_type: topContentType,
      growth_rate: avgScore * 0.1 // Simplified growth rate
    };
  }
}

// Singleton instance
let trendingEngineInstance: TrendingEngine | null = null;

export function getTrendingEngine(): TrendingEngine {
  if (!trendingEngineInstance) {
    trendingEngineInstance = new TrendingEngine();
  }
  return trendingEngineInstance;
}

export function resetTrendingEngine(): void {
  trendingEngineInstance = null;
}
