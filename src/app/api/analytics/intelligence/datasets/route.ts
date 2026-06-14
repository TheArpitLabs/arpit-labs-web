/**
 * Analytics API for Dataset Intelligence Engine (E13)
 * Provides metrics and analytics for dataset discovery and quality
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { featureFlags } from '@/lib/infrastructure/feature-flags';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`analytics-datasets-${ip}`, 200, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('dataset_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

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

    // Fetch datasets
    const { data: datasets, error: datasetsError } = await supabase
      .from('datasets')
      .select('*')
      .gte('indexed_at', startDate.toISOString());

    if (datasetsError) throw datasetsError;

    // Fetch quality metrics
    const { data: qualityMetrics, error: qualityError } = await supabase
      .from('dataset_quality_metrics')
      .select('*, datasets(*)')
      .gte('assessed_at', startDate.toISOString());

    if (qualityError) throw qualityError;

    // Fetch dataset recommendations
    const { data: recommendations, error: recsError } = await supabase
      .from('dataset_recommendations')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (recsError) throw recsError;

    // Calculate analytics
    const analytics = {
      summary: {
        totalDatasets: datasets?.length || 0,
        totalQualityAssessments: qualityMetrics?.length || 0,
        totalRecommendations: recommendations?.length || 0,
        avgQualityScore: qualityMetrics?.reduce((acc, q) => acc + (q.overall_quality || 0), 0) / (qualityMetrics?.length || 1) || 0,
        avgDownloadCount: datasets?.reduce((acc, d) => acc + (d.download_count || 0), 0) / (datasets?.length || 1) || 0,
        highQualityDatasets: qualityMetrics?.filter(q => (q.overall_quality || 0) >= 75).length || 0,
      },
      bySource: datasets?.reduce((acc, dataset) => {
        acc[dataset.source] = (acc[dataset.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byDomain: datasets?.reduce((acc, dataset) => {
        acc[dataset.domain] = (acc[dataset.domain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byTaskType: datasets?.reduce((acc, dataset) => {
        dataset.task_type?.forEach((task: string) => {
          acc[task] = (acc[task] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>) || {},
      topDatasets: datasets
        ?.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
        .slice(0, 10) || [],
      qualityDistribution: {
        excellent: qualityMetrics?.filter(q => (q.overall_quality || 0) >= 90).length || 0,
        good: qualityMetrics?.filter(q => (q.overall_quality || 0) >= 75 && (q.overall_quality || 0) < 90).length || 0,
        fair: qualityMetrics?.filter(q => (q.overall_quality || 0) >= 50 && (q.overall_quality || 0) < 75).length || 0,
        poor: qualityMetrics?.filter(q => (q.overall_quality || 0) < 50).length || 0,
      },
      recommendationByType: recommendations?.reduce((acc, rec) => {
        acc[rec.recommendation_type] = (acc[rec.recommendation_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      usageMetrics: {
        totalDownloads: datasets?.reduce((acc, d) => acc + (d.download_count || 0), 0) || 0,
        totalViews: datasets?.reduce((acc, d) => acc + (d.view_count || 0), 0) || 0,
        totalLikes: datasets?.reduce((acc, d) => acc + (d.like_count || 0), 0) || 0,
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching dataset analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
