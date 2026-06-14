/**
 * Analytics API for Contributor Intelligence Engine (E9)
 * Provides metrics and analytics for contributor profiles
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
    const rateLimit = checkRateLimit(`analytics-contributors-${ip}`, 200, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('contributor_intelligence_engine')) {
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

    // Fetch contributor profiles
    const { data: contributors, error: contributorsError } = await supabase
      .from('contributor_profiles')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (contributorsError) throw contributorsError;

    // Fetch platform profiles
    const { data: githubProfiles, error: githubError } = await supabase
      .from('github_profiles')
      .select('*, contributor_profiles(*)')
      .gte('created_at', startDate.toISOString());

    if (githubError) throw githubError;

    // Fetch score history
    const { data: scoreHistory, error: historyError } = await supabase
      .from('contributor_score_history')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (historyError) throw historyError;

    // Calculate analytics
    const analytics = {
      summary: {
        totalContributors: contributors?.length || 0,
        totalGithubProfiles: githubProfiles?.length || 0,
        avgContributorScore: contributors?.reduce((acc, c) => acc + (c.contributor_score || 0), 0) / (contributors?.length || 1) || 0,
        avgExpertiseScore: contributors?.reduce((acc, c) => acc + (c.expertise_score || 0), 0) / (contributors?.length || 1) || 0,
        activeContributors: contributors?.filter(c => c.activity_level === 'high' || c.activity_level === 'very_high').length || 0,
      },
      byActivityLevel: contributors?.reduce((acc, contributor) => {
        acc[contributor.activity_level] = (acc[contributor.activity_level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      topContributors: contributors
        ?.sort((a, b) => (b.contributor_score || 0) - (a.contributor_score || 0))
        .slice(0, 10) || [],
      scoreDistribution: {
        low: contributors?.filter(c => (c.contributor_score || 0) < 25).length || 0,
        medium: contributors?.filter(c => (c.contributor_score || 0) >= 25 && (c.contributor_score || 0) < 75).length || 0,
        high: contributors?.filter(c => (c.contributor_score || 0) >= 75).length || 0,
      },
      platformBreakdown: {
        github: githubProfiles?.length || 0,
        gitlab: 0, // Would fetch from gitlab_profiles
        research: 0, // Would fetch from research_profiles
        hackathon: 0, // Would fetch from hackathon_profiles
        marketplace: 0, // Would fetch from marketplace_profiles
      },
      scoreTrends: scoreHistory?.slice(0, 100).map(h => ({
        timestamp: h.recorded_at,
        contributorScore: h.contributor_score,
        expertiseScore: h.expertise_score,
      })) || [],
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching contributor analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
