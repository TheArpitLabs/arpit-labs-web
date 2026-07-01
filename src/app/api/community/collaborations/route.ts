import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createAuthenticatedSupabaseClient,
  getUserRefreshTokenFromRequest,
  getUserTokenFromRequest,
} from '@/lib/auth/auth';
import { sanitizeText } from '@/lib/utils/sanitize';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET() {
  try {
    // Fetch open collaborations
    const { data: collaborations, error } = await supabase
      .from('community_collaborations')
      .select(
        `
        id,
        title,
        description,
        collaboration_type,
        status,
        skills_required,
        team_size_min,
        team_size_max,
        members_count,
        deadline_date,
        cover_image,
        repository_url,
        project_url,
        tags,
        visibility,
        created_at,
        updated_at,
        profiles:created_by (
          username,
          avatar_url,
          full_name
        )
      `
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    const normalizedCollaborations = (collaborations || []).map((collaboration) => ({
      ...collaboration,
      slug: collaboration.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 120),
      project_type: collaboration.collaboration_type,
      team_size: collaboration.team_size_max ?? collaboration.team_size_min,
      current_team_size: collaboration.members_count,
      deadline: collaboration.deadline_date,
    }));

    return NextResponse.json({ data: normalizedCollaborations });
  } catch (error) {
    console.error('Error in community collaborations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getUserTokenFromRequest(request);
    const refreshToken = getUserRefreshTokenFromRequest(request);
    const authedSupabase = token
      ? await createAuthenticatedSupabaseClient(token, refreshToken || undefined)
      : null;
    if (!authedSupabase)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await authedSupabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const title = sanitizeText(body.title);
    const description = sanitizeText(body.description);
    const collaborationType = sanitizeText(
      body.collaboration_type || body.project_type || 'open-source'
    );
    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 120);

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const { data, error } = await authedSupabase
      .from('community_collaborations')
      .insert({
        title,
        description,
        created_by: userId,
        collaboration_type: collaborationType,
        status: 'open',
        skills_required: Array.isArray(body.skills_required)
          ? body.skills_required.map((skill: unknown) => sanitizeText(skill)).filter(Boolean)
          : [],
        team_size_min: Number(body.team_size_min || 1),
        team_size_max: Number(body.team_size_max || 10),
        deadline_date: sanitizeText(body.deadline_date),
        repository_url: sanitizeText(body.repository_url),
        project_url: sanitizeText(body.project_url),
        tags: Array.isArray(body.tags)
          ? body.tags.map((tag: unknown) => sanitizeText(tag)).filter(Boolean)
          : [],
        visibility: 'public',
        difficulty: sanitizeText(body.difficulty || 'intermediate'),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, collaboration: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating community collaboration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create collaboration' },
      { status: 500 }
    );
  }
}
