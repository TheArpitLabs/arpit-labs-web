/**
 * Admin API for Research Intelligence Engine (E12)
 * Provides management endpoints for research papers and analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limiting';
import { audit } from '@/lib/infrastructure/audit-logger';
import { featureFlags } from '@/lib/infrastructure/feature-flags';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-research-${ip}`, 100, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('research_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('research_papers')
      .select('*')
      .order('indexed_at', { ascending: false })
      .limit(limit);

    if (source) {
      query = query.eq('source', source);
    }
    if (status) {
      query = query.eq('processing_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      'view_research',
      'research_intelligence',
      undefined,
      { source, status, limit }
    );

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Error fetching research data:', error);
    return NextResponse.json({ error: 'Failed to fetch research data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-research-${ip}`, 50, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('research_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case 'index_paper':
        result = await indexPaper(data);
        break;
      case 'generate_summary':
        result = await generateSummary(data);
        break;
      case 'calculate_similarity':
        result = await calculateSimilarity(data);
        break;
      case 'update_paper':
        result = await updatePaper(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      `research_${action}`,
      'research_intelligence',
      undefined,
      data
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in research API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function indexPaper(data: any) {
  const { external_id, source, ...paperData } = data;
  
  const { data: paper, error } = await supabase
    .from('research_papers')
    .insert({
      external_id,
      source,
      ...paperData,
      processing_status: 'pending',
      indexed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // In production, this would trigger background processing
  return paper;
}

async function generateSummary(data: any) {
  const { paper_id, summary_type } = data;
  
  const { data: summary, error } = await supabase
    .from('research_summaries')
    .insert({
      paper_id,
      summary_type,
      summary_text: 'Generated summary placeholder', // In production, use AI to generate
      generated_by: 'ai',
      generated_at: new Date().toISOString(),
      review_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return summary;
}

async function calculateSimilarity(data: any) {
  const { paper1_id, paper2_id, similarity_type } = data;
  
  const { data: similarity, error } = await supabase
    .from('research_similarity')
    .insert({
      paper1_id,
      paper2_id,
      similarity_type,
      title_similarity: Math.random(),
      abstract_similarity: Math.random(),
      content_similarity: Math.random(),
      overall_similarity: Math.random(),
      calculated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return similarity;
}

async function updatePaper(data: any) {
  const { id, ...updateData } = data;
  
  const { data: paper, error } = await supabase
    .from('research_papers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return paper;
}
