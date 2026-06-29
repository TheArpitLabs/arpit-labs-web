/**
 * Analytics API for Trend Intelligence Engine (E8)
 * Provides metrics and analytics for trend analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limiting';
import { featureFlags } from '@/lib/infrastructure/feature-flags';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`analytics-trends-${ip}`, 200, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('trend_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 1d, 7d, 30d, 90d
    const category = searchParams.get('category');

    // Calculate time range
    const now = new Date();
    let startDate: Date;
    switch (timeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch trend metrics
    let trendsQuery = supabase
      .from('technology_trends')
      .select('*')
      .gte('last_analyzed_at', startDate.toISOString());

    if (category) {
      trendsQuery = trendsQuery.eq('category', category);
    }

    const { data: trends, error: trendsError } = await trendsQuery;

    if (trendsError) throw trendsError;

    // Fetch analysis logs
    const { data: analysisLogs, error: logsError } = await supabase
      .from('trend_analysis_logs')
      .select('*')
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false });

    if (logsError) throw logsError;

    // Calculate analytics
    const analytics = {
      summary: {
        totalTrends: trends?.length || 0,
        totalAnalyses: analysisLogs?.length || 0,
        successfulAnalyses: analysisLogs?.filter(l => l.status === 'completed').length || 0,
        failedAnalyses: analysisLogs?.filter(l => l.status === 'failed').length || 0,
        avgTrendScore: trends?.reduce((acc, t) => acc + (t.trend_score || 0), 0) / (trends?.length || 1) || 0,
      },
      byCategory: trends?.reduce((acc, trend) => {
        acc[trend.category] = (acc[trend.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      topTrends: trends
        ?.sort((a, b) => (b.trend_score || 0) - (a.trend_score || 0))
        .slice(0, 10) || [],
      analysisTimeline: analysisLogs?.map(log => ({
        timestamp: log.started_at,
        status: log.status,
        itemsAnalyzed: log.items_analyzed,
        trendsDetected: log.trends_detected,
      })) || [],
      emergingDomains: await getEmergingDomainsAnalytics(startDate, supabase),
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    logger.error('Error fetching trend analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

async function getEmergingDomainsAnalytics(startDate: Date, supabase: any) {
  const { data: domains, error } = await supabase
    .from('emerging_domains')
    .select('*')
    .gte('first_detected_at', startDate.toISOString())
    .order('potential_score', { ascending: false });

  if (error) return [];

  return domains?.map((domain: any) => ({
    name: domain.name,
    maturityLevel: domain.maturity_level,
    potentialScore: domain.potential_score,
    adoptionRate: domain.adoption_rate,
    firstDetected: domain.first_detected_at,
  })) || [];
}
