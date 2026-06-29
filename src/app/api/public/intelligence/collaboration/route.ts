/**
 * Public API for Collaboration Marketplace (E10)
 * Provides public access to collaboration opportunities
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
    const rateLimit = checkRateLimit(`public-collaboration-${ip}`, 300, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('collaboration_marketplace')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'open';
    const domain = searchParams.get('domain');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('collaboration_opportunities')
      .select('id, title, description, type, domain, skills_required, experience_level, time_commitment, duration, created_at, deadline_at')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100));

    if (type) {
      query = query.eq('type', type);
    }
    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      opportunities: data,
      meta: {
        count: data?.length || 0,
        type,
        status,
        domain,
      }
    });
  } catch (error) {
    logger.error('Error fetching public collaborations:', error);
    return NextResponse.json({ error: 'Failed to fetch collaborations' }, { status: 500 });
  }
}
