/**
 * Public API for Organization Intelligence Engine (E14)
 * Provides public access to organization profiles and rankings
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
    const rateLimit = checkRateLimit(`public-organizations-${ip}`, 300, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('organization_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const industry = searchParams.get('industry');
    const minScore = parseFloat(searchParams.get('minScore') || '50');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('organizations')
      .select('id, name, description, organization_type, industry, website_url, logo_url, innovation_score, research_score, overall_score, employee_count, founded_year')
      .eq('processing_status', 'completed')
      .eq('status', 'active')
      .gte('overall_score', minScore)
      .order('overall_score', { ascending: false })
      .limit(Math.min(limit, 100));

    if (type) {
      query = query.eq('organization_type', type);
    }
    if (industry) {
      query = query.eq('industry', industry);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      organizations: data,
      meta: {
        count: data?.length || 0,
        type,
        industry,
        minScore,
      }
    });
  } catch (error) {
    console.error('Error fetching public organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}
