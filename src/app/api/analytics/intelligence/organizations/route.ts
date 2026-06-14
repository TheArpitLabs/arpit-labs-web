/**
 * Analytics API for Organization Intelligence Engine (E14)
 * Provides metrics and analytics for organization profiles
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
    const rateLimit = checkRateLimit(`analytics-organizations-${ip}`, 200, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('organization_intelligence_engine')) {
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

    // Fetch organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .gte('indexed_at', startDate.toISOString());

    if (orgsError) throw orgsError;

    // Fetch rankings
    const { data: rankings, error: rankingsError } = await supabase
      .from('organization_rankings')
      .select('*, organizations(*)')
      .gte('calculated_at', startDate.toISOString());

    if (rankingsError) throw rankingsError;

    // Calculate analytics
    const analytics = {
      summary: {
        totalOrganizations: organizations?.length || 0,
        totalRankings: rankings?.length || 0,
        avgOverallScore: organizations?.reduce((acc, o) => acc + (o.overall_score || 0), 0) / (organizations?.length || 1) || 0,
        avgInnovationScore: organizations?.reduce((acc, o) => acc + (o.innovation_score || 0), 0) / (organizations?.length || 1) || 0,
        activeOrganizations: organizations?.filter(o => o.status === 'active').length || 0,
      },
      byType: organizations?.reduce((acc, org) => {
        acc[org.organization_type] = (acc[org.organization_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byIndustry: organizations?.reduce((acc, org) => {
        if (org.industry) {
          acc[org.industry] = (acc[org.industry] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {},
      byStatus: organizations?.reduce((acc, org) => {
        acc[org.status] = (acc[org.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      topOrganizations: organizations
        ?.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
        .slice(0, 10) || [],
      rankingByType: rankings?.reduce((acc, ranking) => {
        acc[ranking.ranking_type] = (acc[ranking.ranking_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      scoreDistribution: {
        high: organizations?.filter(o => (o.overall_score || 0) >= 75).length || 0,
        medium: organizations?.filter(o => (o.overall_score || 0) >= 50 && (o.overall_score || 0) < 75).length || 0,
        low: organizations?.filter(o => (o.overall_score || 0) < 50).length || 0,
      },
      innovationLeaders: organizations
        ?.sort((a, b) => (b.innovation_score || 0) - (a.innovation_score || 0))
        .slice(0, 10) || [],
      researchLeaders: organizations
        ?.sort((a, b) => (b.research_score || 0) - (a.research_score || 0))
        .slice(0, 10) || [],
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching organization analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
