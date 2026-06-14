/**
 * Admin API for Autonomous Discovery Engine (E11)
 * Provides management endpoints for discovery pipelines
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
    const rateLimit = checkRateLimit(`admin-intelligence-discovery-${ip}`, 100, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('autonomous_discovery_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // github, gitlab, arxiv, kaggle, huggingface, devpost, hack2skill, unstop
    const status = searchParams.get('status');
    const pipeline_type = searchParams.get('pipeline_type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query;
    if (pipeline_type) {
      query = supabase
        .from('discovery_pipelines')
        .select('*, discovery_sources(*)')
        .order('last_run_at', { ascending: false })
        .limit(limit);
      
      if (pipeline_type) {
        query = query.eq('pipeline_type', pipeline_type);
      }
    } else {
      query = supabase
        .from('discovered_items')
        .select('*, discovery_sources(*)')
        .order('discovered_at', { ascending: false })
        .limit(limit);
      
      if (source) {
        query = query.eq('source_id', source);
      }
      if (status) {
        query = query.eq('processing_status', status);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      'view_discovery',
      'autonomous_discovery',
      undefined,
      { source, status, pipeline_type, limit }
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching discovery data:', error);
    return NextResponse.json({ error: 'Failed to fetch discovery data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-discovery-${ip}`, 50, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('autonomous_discovery_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case 'trigger_pipeline':
        result = await triggerPipeline(data);
        break;
      case 'add_source':
        result = await addSource(data);
        break;
      case 'approve_item':
        result = await approveItem(data);
        break;
      case 'update_pipeline':
        result = await updatePipeline(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      `discovery_${action}`,
      'autonomous_discovery',
      undefined,
      data
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in discovery API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function triggerPipeline(data: any) {
  const { pipeline_id } = data;
  
  const { data: pipeline, error } = await supabase
    .from('discovery_pipelines')
    .update({
      last_run_at: new Date().toISOString(),
    })
    .eq('id', pipeline_id)
    .select()
    .single();

  if (error) throw error;

  // In production, this would trigger the actual pipeline
  return pipeline;
}

async function addSource(data: any) {
  const { data: source, error } = await supabase
    .from('discovery_sources')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return source;
}

async function approveItem(data: any) {
  const { item_id, publish_to } = data;
  
  const { data: item, error } = await supabase
    .from('discovered_items')
    .update({
      publish_status: 'approved',
      published_to: publish_to,
      published_at: new Date().toISOString(),
    })
    .eq('id', item_id)
    .select()
    .single();

  if (error) throw error;
  return item;
}

async function updatePipeline(data: any) {
  const { id, ...updateData } = data;
  
  const { data: pipeline, error } = await supabase
    .from('discovery_pipelines')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return pipeline;
}
