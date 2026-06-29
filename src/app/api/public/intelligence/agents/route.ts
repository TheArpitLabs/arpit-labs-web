/**
 * Public API for Agentic AI System (E15)
 * Provides public access to available AI agents
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
    const rateLimit = checkRateLimit(`public-agents-${ip}`, 300, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('agentic_ai_system')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agentType');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('ai_agents')
      .select('id, name, agent_type, description, capabilities, primary_domains, supported_tasks, success_rate, avg_response_time, total_tasks_completed')
      .eq('status', 'active')
      .eq('is_public', true)
      .order('success_rate', { ascending: false })
      .limit(Math.min(limit, 100));

    if (agentType) {
      query = query.eq('agent_type', agentType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      agents: data,
      meta: {
        count: data?.length || 0,
        agentType,
      }
    });
  } catch (error) {
    logger.error('Error fetching public agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}
