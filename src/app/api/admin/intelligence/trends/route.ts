/**
 * Admin API for Trend Intelligence Engine (E8)
 * Provides management endpoints for trend analysis
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
    const rateLimit = checkRateLimit(`admin-intelligence-trends-${ip}`, 100, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('trend_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('technology_trends')
      .select('*')
      .order('trend_score', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      'view_trends',
      'trend_intelligence',
      undefined,
      { category, limit }
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-trends-${ip}`, 50, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('trend_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case 'trigger_analysis':
        // Trigger trend analysis job
        result = await triggerTrendAnalysis(data);
        break;
      case 'update_trend':
        // Update trend data
        result = await updateTrend(data);
        break;
      case 'add_trend':
        // Add new trend
        result = await addTrend(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      `trend_${action}`,
      'trend_intelligence',
      undefined,
      data
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in trend API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function triggerTrendAnalysis(data: any) {
  const { analysis_type } = data;
  
  // Log the analysis request
  const { data: log, error } = await supabase
    .from('trend_analysis_logs')
    .insert({
      analysis_type,
      status: 'pending',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // In production, this would trigger a background job
  // For now, we'll mark it as running
  await supabase
    .from('trend_analysis_logs')
    .update({ status: 'running' })
    .eq('id', log.id);

  return log;
}

async function updateTrend(data: any) {
  const { id, ...updateData } = data;
  
  const { data: trend, error } = await supabase
    .from('technology_trends')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return trend;
}

async function addTrend(data: any) {
  const { data: trend, error } = await supabase
    .from('technology_trends')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return trend;
}
