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
    // Fetch approved ambassadors
    const { data: ambassadors, error } = await supabase
      .from('community_ambassadors')
      .select(
        `
        *,
        profiles:user_id (
          username,
          avatar_url,
          full_name,
          bio
        ),
        community_chapters:chapter_id (
          name,
          city,
          country_name
        )
      `
      )
      .eq('status', 'approved')
      .order('achievements', { ascending: false })
      .limit(6);

    if (error) throw error;

    const normalizedAmbassadors = (ambassadors || []).map((ambassador) => ({
      ...ambassador,
      members_recruited: ambassador.events_organized,
      events_hosted: ambassador.events_organized,
    }));

    return NextResponse.json({ data: normalizedAmbassadors });
  } catch (error) {
    console.error('Error in community ambassadors API:', error);
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
    const chapterId = sanitizeText(body.chapter_id);
    if (!chapterId)
      return NextResponse.json({ success: false, error: 'Chapter is required' }, { status: 400 });

    const { data, error } = await authedSupabase
      .from('community_ambassadors')
      .insert({
        user_id: userId,
        chapter_id: chapterId,
        title: sanitizeText(body.title),
        bio: sanitizeText(body.bio),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, application: data }, { status: 201 });
  } catch (error) {
    console.error('Error submitting ambassador application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit ambassador application' },
      { status: 500 }
    );
  }
}
