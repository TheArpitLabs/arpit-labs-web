/**
 * Analytics API for Research Intelligence Engine (E12)
 * Provides metrics and analytics for research papers and analysis
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
    const rateLimit = checkRateLimit(`analytics-research-${ip}`, 200, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('research_intelligence_engine')) {
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

    // Fetch research papers
    const { data: papers, error: papersError } = await supabase
      .from('research_papers')
      .select('*')
      .gte('indexed_at', startDate.toISOString());

    if (papersError) throw papersError;

    // Fetch research summaries
    const { data: summaries, error: summariesError } = await supabase
      .from('research_summaries')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (summariesError) throw summariesError;

    // Fetch research similarity
    const { data: similarities, error: similaritiesError } = await supabase
      .from('research_similarity')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (similaritiesError) throw similaritiesError;

    // Calculate analytics
    const analytics = {
      summary: {
        totalPapers: papers?.length || 0,
        totalSummaries: summaries?.length || 0,
        totalSimilarities: similarities?.length || 0,
        avgCitationCount: papers?.reduce((acc, p) => acc + (p.citation_count || 0), 0) / (papers?.length || 1) || 0,
        avgQualityScore: papers?.reduce((acc, p) => acc + (p.quality_score || 0), 0) / (papers?.length || 1) || 0,
        approvedSummaries: summaries?.filter(s => s.review_status === 'approved').length || 0,
      },
      bySource: papers?.reduce((acc, paper) => {
        acc[paper.source] = (acc[paper.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      byYear: papers?.reduce((acc, paper) => {
        if (paper.year) {
          acc[paper.year] = (acc[paper.year] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>) || {},
      byCategory: papers?.reduce((acc, paper) => {
        paper.categories?.forEach((cat: string) => {
          acc[cat] = (acc[cat] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>) || {},
      topPapers: papers
        ?.sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0))
        .slice(0, 10) || [],
      summaryByType: summaries?.reduce((acc, summary) => {
        acc[summary.summary_type] = (acc[summary.summary_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      similarityDistribution: {
        high: similarities?.filter(s => (s.overall_similarity || 0) >= 0.75).length || 0,
        medium: similarities?.filter(s => (s.overall_similarity || 0) >= 0.5 && (s.overall_similarity || 0) < 0.75).length || 0,
        low: similarities?.filter(s => (s.overall_similarity || 0) < 0.5).length || 0,
      },
      impactDistribution: {
        high: papers?.filter(p => (p.impact_score || 0) >= 75).length || 0,
        medium: papers?.filter(p => (p.impact_score || 0) >= 50 && (p.impact_score || 0) < 75).length || 0,
        low: papers?.filter(p => (p.impact_score || 0) < 50).length || 0,
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching research analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
