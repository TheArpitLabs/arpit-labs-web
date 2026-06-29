/**
 * Analytics API for Collaboration Marketplace (E10)
 * Provides metrics and analytics for collaboration opportunities
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
    const rateLimit = checkRateLimit(`analytics-collaboration-${ip}`, 200, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('collaboration_marketplace')) {
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

    // Fetch collaboration opportunities
    const { data: opportunities, error: opportunitiesError } = await supabase
      .from('collaboration_opportunities')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (opportunitiesError) throw opportunitiesError;

    // Fetch applications
    const { data: applications, error: applicationsError } = await supabase
      .from('collaboration_applications')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (applicationsError) throw applicationsError;

    // Fetch matches
    const { data: matches, error: matchesError } = await supabase
      .from('collaboration_matches')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (matchesError) throw matchesError;

    // Calculate analytics
    const analytics = {
      summary: {
        totalOpportunities: opportunities?.length || 0,
        totalApplications: applications?.length || 0,
        totalMatches: matches?.length || 0,
        acceptedApplications: applications?.filter(a => a.status === 'accepted').length || 0,
        pendingApplications: applications?.filter(a => a.status === 'pending').length || 0,
        avgMatchScore: matches?.reduce((acc, m) => acc + (m.match_score || 0), 0) / (matches?.length || 1) || 0,
      },
      byType: opportunities?.reduce((acc, opp) => {
        acc[opp.type] = (acc[opp.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byStatus: opportunities?.reduce((acc, opp) => {
        acc[opp.status] = (acc[opp.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byPriority: opportunities?.reduce((acc, opp) => {
        acc[opp.priority] = (acc[opp.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      topOpportunities: opportunities
        ?.sort((a, b) => (b.applications_count || 0) - (a.applications_count || 0))
        .slice(0, 10) || [],
      applicationFunnel: {
        viewed: opportunities?.reduce((acc, o) => acc + (o.views_count || 0), 0) || 0,
        applied: applications?.length || 0,
        accepted: applications?.filter(a => a.status === 'accepted').length || 0,
        completed: opportunities?.filter(o => o.status === 'completed').length || 0,
      },
      matchQuality: {
        high: matches?.filter(m => (m.match_score || 0) >= 75).length || 0,
        medium: matches?.filter(m => (m.match_score || 0) >= 50 && (m.match_score || 0) < 75).length || 0,
        low: matches?.filter(m => (m.match_score || 0) < 50).length || 0,
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    logger.error('Error fetching collaboration analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
