import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { createAuthenticatedSupabaseClient, getUserTokenFromRequest, getUserRefreshTokenFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getUserTokenFromRequest(request);
    const refreshToken = getUserRefreshTokenFromRequest(request);
    const supabase = token ? await createAuthenticatedSupabaseClient(token, refreshToken || undefined) : null;
    if (!supabase) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const ip = request.headers.get('x-forwarded-for') || userId;
    const rl = checkRateLimit(`community_vote:${ip}`, 120, 60_000);
    if (!rl.allowed) return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });

    const body = await request.json();
    const postId = sanitizeText(body.postId);
    const voteType = sanitizeText(body.voteType || 'upvote');
    if (!postId) return NextResponse.json({ success: false, error: 'Missing postId' }, { status: 400 });

    const { data: existing } = await supabase
      .from('community_votes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        await supabase.from('community_votes').delete().eq('id', existing.id);
        try {
          await supabaseServer.rpc('decrement_post_upvote_count', { p_id: postId });
        } catch (e) {
          // ignore
        }
        return NextResponse.json({ success: true, action: 'removed' }, { status: 200 });
      }

      await supabase.from('community_votes').update({ vote_type: voteType }).eq('id', existing.id);
      return NextResponse.json({ success: true, action: 'updated' }, { status: 200 });
    }

    const { data, error } = await supabase
      .from('community_votes')
      .insert([{ post_id: postId, user_id: userId, vote_type: voteType }])
      .select()
      .single();
    if (error) {
      console.error('Failed to insert vote', error);
      return NextResponse.json({ success: false, error: 'Failed to vote' }, { status: 500 });
    }

    try {
      await supabaseServer.rpc('increment_post_upvote_count', { p_id: postId });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, vote: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/community/vote error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
