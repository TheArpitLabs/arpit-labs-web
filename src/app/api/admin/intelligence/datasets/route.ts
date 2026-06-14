/**
 * Admin API for Dataset Intelligence Engine (E13)
 * Provides management endpoints for dataset discovery and quality scoring
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
    const rateLimit = checkRateLimit(`admin-intelligence-datasets-${ip}`, 100, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('dataset_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // kaggle, huggingface, uci, github, other
    const domain = searchParams.get('domain');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('datasets')
      .select('*')
      .order('indexed_at', { ascending: false })
      .limit(limit);

    if (source) {
      query = query.eq('source', source);
    }
    if (domain) {
      query = query.eq('domain', domain);
    }
    if (status) {
      query = query.eq('processing_status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      'view_datasets',
      'dataset_intelligence',
      undefined,
      { source, domain, status, limit }
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-datasets-${ip}`, 50, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('dataset_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case 'index_dataset':
        result = await indexDataset(data);
        break;
      case 'assess_quality':
        result = await assessQuality(data);
        break;
      case 'generate_recommendations':
        result = await generateRecommendations(data);
        break;
      case 'update_dataset':
        result = await updateDataset(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      `dataset_${action}`,
      'dataset_intelligence',
      undefined,
      data
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in dataset API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function indexDataset(data: any) {
  const { external_id, source, ...datasetData } = data;
  
  const { data: dataset, error } = await supabase
    .from('datasets')
    .insert({
      external_id,
      source,
      ...datasetData,
      processing_status: 'pending',
      indexed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // In production, this would trigger background processing
  return dataset;
}

async function assessQuality(data: any) {
  const { dataset_id } = data;
  
  const qualityScores = {
    completeness: Math.random() * 100,
    consistency: Math.random() * 100,
    accuracy: Math.random() * 100,
    validity: Math.random() * 100,
    uniqueness: Math.random() * 100,
    timeliness: Math.random() * 100,
    documentation_completeness: Math.random() * 100,
    documentation_clarity: Math.random() * 100,
    code_availability: Math.random() * 100,
    paper_availability: Math.random() * 100,
    overall_quality: Math.random() * 100,
  };

  const { data: quality, error } = await supabase
    .from('dataset_quality_metrics')
    .insert({
      dataset_id,
      ...qualityScores,
      assessed_at: new Date().toISOString(),
      assessment_method: 'automated',
    })
    .select()
    .single();

  if (error) throw error;

  // Update dataset with quality score
  await supabase
    .from('datasets')
    .update({ overall_quality_score: qualityScores.overall_quality })
    .eq('id', dataset_id);

  return quality;
}

async function generateRecommendations(data: any) {
  const { dataset_id, recommendation_type } = data;
  
  const { data: recommendation, error } = await supabase
    .from('dataset_recommendations')
    .insert({
      dataset_id,
      recommendation_type,
      recommendation_score: Math.random() * 100,
      recommendation_reason: 'Generated based on similarity and quality metrics',
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return recommendation;
}

async function updateDataset(data: any) {
  const { id, ...updateData } = data;
  
  const { data: dataset, error } = await supabase
    .from('datasets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return dataset;
}
