/**
 * Admin API for Collaboration Marketplace (E10)
 * Provides management endpoints for collaboration opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import { audit } from '@/lib/infrastructure/audit-logger';
import { featureFlags } from '@/lib/infrastructure/feature-flags';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-collaboration-${ip}`, 100, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('collaboration_marketplace')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // team_formation, mentor_discovery, research_collaboration, startup_collaboration, hackathon_collaboration
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('collaboration_opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      'view_collaborations',
      'collaboration_marketplace',
      undefined,
      { type, status, limit }
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching collaborations:', error);
    return NextResponse.json({ error: 'Failed to fetch collaborations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-collaboration-${ip}`, 50, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('collaboration_marketplace')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case 'create_opportunity':
        result = await createOpportunity(data);
        break;
      case 'update_opportunity':
        result = await updateOpportunity(data);
        break;
      case 'match_collaborators':
        result = await matchCollaborators(data);
        break;
      case 'approve_application':
        result = await approveApplication(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      `collaboration_${action}`,
      'collaboration_marketplace',
      undefined,
      data
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in collaboration API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function createOpportunity(data: any) {
  const { data: opportunity, error } = await supabase
    .from('collaboration_opportunities')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return opportunity;
}

async function updateOpportunity(data: any) {
  const { id, ...updateData } = data;
  
  const { data: opportunity, error } = await supabase
    .from('collaboration_opportunities')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return opportunity;
}

async function matchCollaborators(data: any) {
  const { opportunity_id, candidate_ids } = data;
  
  // Create matches with scores
  const matches = candidate_ids.map((candidate_id: string) => ({
    opportunity_id,
    candidate_id,
    match_score: Math.random() * 100, // In production, use actual matching algorithm
    match_reasons: ['skills_match', 'experience_match', 'availability_match'],
    match_type: 'team',
    status: 'pending',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  const { data: created, error } = await supabase
    .from('collaboration_matches')
    .insert(matches)
    .select();

  if (error) throw error;
  return created;
}

async function approveApplication(data: any) {
  const { application_id, decision } = data;
  
  const { data: application, error } = await supabase
    .from('collaboration_applications')
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', application_id)
    .select()
    .single();

  if (error) throw error;
  return application;
}
