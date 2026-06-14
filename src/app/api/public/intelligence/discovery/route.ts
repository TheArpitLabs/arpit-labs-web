/**
 * Public API for Autonomous Discovery Engine (E11)
 * Provides public access to discovered and published items
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
    const rateLimit = checkRateLimit(`public-discovery-${ip}`, 300, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('autonomous_discovery_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const itemType = searchParams.get('itemType');
    const minScore = parseFloat(searchParams.get('minScore') || '50');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('discovered_items')
      .select('id, title, description, url, item_type, tags, categories, technologies, quality_score, relevance_score, overall_score, discovered_at, published_at')
      .eq('publish_status', 'published')
      .gte('overall_score', minScore)
      .order('overall_score', { ascending: false })
      .limit(Math.min(limit, 100));

    if (source) {
      query = query.eq('source_id', source);
    }
    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      items: data,
      meta: {
        count: data?.length || 0,
        source,
        itemType,
        minScore,
      }
    });
  } catch (error) {
    console.error('Error fetching public discovery items:', error);
    return NextResponse.json({ error: 'Failed to fetch discovery items' }, { status: 500 });
  }
}
