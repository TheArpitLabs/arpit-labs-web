/**
 * Public API for Dataset Intelligence Engine (E13)
 * Provides public access to datasets and quality metrics
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
    const rateLimit = checkRateLimit(`public-datasets-${ip}`, 300, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('dataset_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const domain = searchParams.get('domain');
    const taskType = searchParams.get('taskType');
    const minQuality = parseFloat(searchParams.get('minQuality') || '50');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('datasets')
      .select('id, name, title, description, domain, task_type, data_type, file_format, download_count, like_count, overall_quality_score, license_name, created_date')
      .eq('processing_status', 'completed')
      .gte('overall_quality_score', minQuality)
      .order('overall_quality_score', { ascending: false })
      .limit(Math.min(limit, 100));

    if (source) {
      query = query.eq('source', source);
    }
    if (domain) {
      query = query.eq('domain', domain);
    }
    if (taskType) {
      query = query.contains('task_type', [taskType]);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      datasets: data,
      meta: {
        count: data?.length || 0,
        source,
        domain,
        taskType,
        minQuality,
      }
    });
  } catch (error) {
    console.error('Error fetching public datasets:', error);
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
}
