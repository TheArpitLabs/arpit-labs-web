/**
 * Admin API for Organization Intelligence Engine (E14)
 * Provides management endpoints for organization profiles and intelligence
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
    const rateLimit = checkRateLimit(`admin-intelligence-organizations-${ip}`, 100, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('organization_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const type = searchParams.get('type'); // company, university, research_lab, government, nonprofit, startup
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('organizations')
      .select('*')
      .order('indexed_at', { ascending: false })
      .limit(limit);

    if (source) {
      query = query.eq('source', source);
    }
    if (type) {
      query = query.eq('organization_type', type);
    }
    if (status) {
      query = query.eq('processing_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      'view_organizations',
      'organization_intelligence',
      undefined,
      { source, type, status, limit }
    );

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-organizations-${ip}`, 50, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('organization_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case 'index_organization':
        result = await indexOrganization(data);
        break;
      case 'calculate_rankings':
        result = await calculateRankings(data);
        break;
      case 'build_graph':
        result = await buildGraph(data);
        break;
      case 'update_organization':
        result = await updateOrganization(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      `organization_${action}`,
      'organization_intelligence',
      undefined,
      data
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in organization API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function indexOrganization(data: any) {
  const { external_id, source, ...orgData } = data;
  
  const { data: organization, error } = await supabase
    .from('organizations')
    .insert({
      external_id,
      source,
      ...orgData,
      processing_status: 'pending',
      indexed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // In production, this would trigger background processing
  return organization;
}

async function calculateRankings(data: any) {
  const { organization_id, ranking_type, ranking_category, ranking_period } = data;
  
  const rankingData = {
    organization_id,
    ranking_type,
    ranking_category,
    ranking_period,
    rank: Math.floor(Math.random() * 1000) + 1,
    percentile: Math.random() * 100,
    score: Math.random() * 100,
    innovation_score: Math.random() * 100,
    research_score: Math.random() * 100,
    open_source_score: Math.random() * 100,
    community_score: Math.random() * 100,
    business_score: Math.random() * 100,
    total_organizations: 1000,
    rank_change: Math.floor(Math.random() * 20) - 10,
    calculated_at: new Date().toISOString(),
  };

  const { data: ranking, error } = await supabase
    .from('organization_rankings')
    .insert(rankingData)
    .select()
    .single();

  if (error) throw error;
  return ranking;
}

async function buildGraph(data: any) {
  const { organization_id, graph_type } = data;
  
  // In production, this would build actual graphs based on data
  const graphData = {
    organization_id,
    graph_type,
    graph_name: `${graph_type} graph for organization`,
    description: `Automatically generated ${graph_type} graph`,
    nodes: [],
    edges: [],
    layout_config: {},
    node_count: 0,
    edge_count: 0,
    generated_at: new Date().toISOString(),
    generated_by: 'system',
  };

  const { data: graph, error } = await supabase
    .from('organization_technology_graph')
    .insert(graphData)
    .select()
    .single();

  if (error) throw error;
  return graph;
}

async function updateOrganization(data: any) {
  const { id, ...updateData } = data;
  
  const { data: organization, error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return organization;
}
