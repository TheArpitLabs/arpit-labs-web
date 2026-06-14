/**
 * Analytics API for Autonomous Discovery Engine (E11)
 * Provides metrics and analytics for discovery pipelines
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
    const rateLimit = checkRateLimit(`analytics-discovery-${ip}`, 200, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('autonomous_discovery_engine')) {
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

    // Fetch discovered items
    const { data: items, error: itemsError } = await supabase
      .from('discovered_items')
      .select('*, discovery_sources(*)')
      .gte('discovered_at', startDate.toISOString());

    if (itemsError) throw itemsError;

    // Fetch pipelines
    const { data: pipelines, error: pipelinesError } = await supabase
      .from('discovery_pipelines')
      .select('*, discovery_sources(*)')
      .gte('last_run_at', startDate.toISOString());

    if (pipelinesError) throw pipelinesError;

    // Fetch metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('discovery_metrics')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (metricsError) throw metricsError;

    // Calculate analytics
    const analytics = {
      summary: {
        totalDiscovered: items?.length || 0,
        totalPipelines: pipelines?.length || 0,
        publishedItems: items?.filter(i => i.publish_status === 'published').length || 0,
        pendingItems: items?.filter(i => i.processing_status === 'pending').length || 0,
        completedItems: items?.filter(i => i.processing_status === 'completed').length || 0,
        avgQualityScore: items?.reduce((acc, i) => acc + (i.quality_score || 0), 0) / (items?.length || 1) || 0,
      },
      bySource: items?.reduce((acc, item) => {
        const sourceName = item.discovery_sources?.name || 'unknown';
        acc[sourceName] = (acc[sourceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byType: items?.reduce((acc, item) => {
        acc[item.item_type] = (acc[item.item_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byStatus: items?.reduce((acc, item) => {
        acc[item.processing_status] = (acc[item.processing_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      pipelinePerformance: pipelines?.map(p => ({
        name: p.name,
        totalRuns: p.total_runs,
        successfulRuns: p.successful_runs,
        failedRuns: p.failed_runs,
        successRate: p.total_runs > 0 ? (p.successful_runs / p.total_runs) * 100 : 0,
        itemsDiscovered: p.items_discovered,
      })) || [],
      qualityDistribution: {
        high: items?.filter(i => (i.quality_score || 0) >= 75).length || 0,
        medium: items?.filter(i => (i.quality_score || 0) >= 50 && (i.quality_score || 0) < 75).length || 0,
        low: items?.filter(i => (i.quality_score || 0) < 50).length || 0,
      },
      topSources: items
        ?.reduce((acc, item) => {
          const sourceName = item.discovery_sources?.name || 'unknown';
          if (!acc[sourceName]) {
            acc[sourceName] = { count: 0, avgScore: 0, totalScore: 0 };
          }
          acc[sourceName].count++;
          acc[sourceName].totalScore += item.quality_score || 0;
          acc[sourceName].avgScore = acc[sourceName].totalScore / acc[sourceName].count;
          return acc;
        }, {} as Record<string, { count: number; avgScore: number; totalScore: number }>) || {},
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching discovery analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
