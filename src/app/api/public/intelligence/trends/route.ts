/**
 * Public API for Trend Intelligence Engine (E8)
 * Provides public access to trend analysis data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { featureFlags } from '@/lib/infrastructure/feature-flags';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check rate limit (more lenient for public API)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`public-trends-${ip}`, 300, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('trend_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const minScore = parseFloat(searchParams.get('minScore') || '0');

    let query = supabase
      .from('technology_trends')
      .select('*')
      .gte('trend_score', minScore)
      .order('trend_score', { ascending: false })
      .limit(Math.min(limit, 100));

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      trends: data,
      meta: {
        count: data?.length || 0,
        category,
        minScore,
      }
    });
  } catch (error) {
    console.error('Error fetching public trends:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
