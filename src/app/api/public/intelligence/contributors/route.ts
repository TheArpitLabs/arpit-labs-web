/**
 * Public API for Contributor Intelligence Engine (E9)
 * Provides public access to contributor profiles
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
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`public-contributors-${ip}`, 300, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('contributor_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const minScore = parseFloat(searchParams.get('minScore') || '0');
    const activityLevel = searchParams.get('activityLevel');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('contributor_profiles')
      .select('id, display_name, bio, avatar_url, primary_domains, skills, contributor_score, expertise_score, activity_level, total_contributions, total_projects')
      .gte('contributor_score', minScore)
      .order('contributor_score', { ascending: false })
      .limit(Math.min(limit, 100));

    if (activityLevel) {
      query = query.eq('activity_level', activityLevel);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      contributors: data,
      meta: {
        count: data?.length || 0,
        minScore,
        activityLevel,
      }
    });
  } catch (error) {
    console.error('Error fetching public contributors:', error);
    return NextResponse.json({ error: 'Failed to fetch contributors' }, { status: 500 });
  }
}
