/**
 * Admin API for Contributor Intelligence Engine (E9)
 * Provides management endpoints for contributor profiles and scoring
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
    const rateLimit = checkRateLimit(`admin-intelligence-contributors-${ip}`, 100, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('contributor_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform'); // github, gitlab, research, hackathon, marketplace
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'contributor_score';

    let query;
    if (platform === 'github') {
      query = supabase
        .from('github_profiles')
        .select('*, contributor_profiles(*)')
        .order('total_stars', { ascending: false })
        .limit(limit);
    } else if (platform === 'gitlab') {
      query = supabase
        .from('gitlab_profiles')
        .select('*, contributor_profiles(*)')
        .order('total_stars', { ascending: false })
        .limit(limit);
    } else if (platform === 'research') {
      query = supabase
        .from('research_profiles')
        .select('*, contributor_profiles(*)')
        .order('h_index', { ascending: false })
        .limit(limit);
    } else {
      query = supabase
        .from('contributor_profiles')
        .select('*')
        .order(sortBy, { ascending: false })
        .limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      'view_contributors',
      'contributor_intelligence',
      undefined,
      { platform, limit, sortBy }
    );

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Error fetching contributors:', error);
    return NextResponse.json({ error: 'Failed to fetch contributors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = checkRateLimit(`admin-intelligence-contributors-${ip}`, 50, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check feature flag
    if (!featureFlags.isEnabled('contributor_intelligence_engine')) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case 'sync_contributor':
        // Sync contributor from external platform
        result = await syncContributor(data);
        break;
      case 'merge_profiles':
        // Merge contributor profiles
        result = await mergeProfiles(data);
        break;
      case 'recalculate_scores':
        // Recalculate contributor scores
        result = await recalculateScores(data);
        break;
      case 'update_profile':
        // Update contributor profile
        result = await updateProfile(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    audit.logAdminAction(
      request.headers.get('user-id') || 'unknown',
      `contributor_${action}`,
      'contributor_intelligence',
      undefined,
      data
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in contributor API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function syncContributor(data: any) {
  const { platform, external_id, contributor_id } = data;
  
  // Log the sync request
  const { data: log, error } = await supabase
    .from('contributor_merge_logs')
    .insert({
      contributor_id,
      source_platform: platform,
      source_id: external_id,
      merge_type: 'update',
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // In production, this would trigger a background sync job
  await supabase
    .from('contributor_merge_logs')
    .update({ status: 'running' })
    .eq('id', log.id);

  return log;
}

async function mergeProfiles(data: any) {
  const { contributor_id, profiles_to_merge } = data;
  
  // Create unified profile
  const { data: profile, error } = await supabase
    .from('contributor_profiles')
    .update({
      // Update with merged data
      updated_at: new Date().toISOString(),
    })
    .eq('id', contributor_id)
    .select()
    .single();

  if (error) throw error;

  // Log the merge
  await supabase
    .from('contributor_merge_logs')
    .insert({
      contributor_id,
      source_platform: 'merge',
      source_id: profiles_to_merge.join(','),
      merge_type: 'initial',
      status: 'completed',
      merged_at: new Date().toISOString(),
    });

  return profile;
}

async function recalculateScores(data: any) {
  const { contributor_id } = data;
  
  // In production, this would trigger a scoring algorithm
  const { data: profile, error } = await supabase
    .from('contributor_profiles')
    .select('*')
    .eq('id', contributor_id)
    .single();

  if (error) throw error;

  // Calculate new scores (simplified)
  const newScores = {
    contributor_score: Math.min(100, profile.contributor_score + Math.random() * 10),
    expertise_score: Math.min(100, profile.expertise_score + Math.random() * 5),
    contribution_score: Math.min(100, profile.contribution_score + Math.random() * 5),
    research_score: Math.min(100, profile.research_score + Math.random() * 5),
    collaboration_score: Math.min(100, profile.collaboration_score + Math.random() * 5),
  };

  const { data: updated, error: updateError } = await supabase
    .from('contributor_profiles')
    .update(newScores)
    .eq('id', contributor_id)
    .select()
    .single();

  if (updateError) throw updateError;

  // Record score history
  await supabase
    .from('contributor_score_history')
    .insert({
      contributor_id,
      ...newScores,
    });

  return updated;
}

async function updateProfile(data: any) {
  const { id, ...updateData } = data;
  
  const { data: profile, error } = await supabase
    .from('contributor_profiles')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return profile;
}
