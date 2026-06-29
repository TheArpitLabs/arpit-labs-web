/**
 * Public API for Research Intelligence Engine (E12)
 * Provides public access to research papers and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limiting';
import { featureFlags } from '@/lib/infrastructure/feature-flags';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`public-research-${ip}`, 300, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('research_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const category = searchParams.get('category');
    const minCitations = parseInt(searchParams.get('minCitations') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('research_papers')
      .select('id, title, abstract, authors, venue, year, doi, categories, keywords, citation_count, quality_score, impact_score, published_date')
      .eq('processing_status', 'completed')
      .gte('citation_count', minCitations)
      .order('citation_count', { ascending: false })
      .limit(Math.min(limit, 100));

    if (source) {
      query = query.eq('source', source);
    }
    if (category) {
      query = query.contains('categories', [category]);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      papers: data,
      meta: {
        count: data?.length || 0,
        source,
        category,
        minCitations,
      }
    });
  } catch (error) {
    logger.error('Error fetching public research papers:', error);
    return NextResponse.json({ error: 'Failed to fetch research papers' }, { status: 500 });
  }
}
