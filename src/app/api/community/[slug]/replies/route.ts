import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/utils/sanitize';
import { checkRateLimit } from '@/lib/rate-limiting';
import {
  createAuthenticatedSupabaseClient,
  getUserTokenFromRequest,
  getUserRefreshTokenFromRequest,
} from '@/lib/auth/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: any) {
  try {
    const { slug } = params;
    const rl = checkRateLimit(
      `community_replies:${request.headers.get('x-forwarded-for') || 'anon'}`,
      300,
      60_000
    );
    if (!rl.allowed)
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });

    const { data: post } = await supabaseServer
      .from('community_posts')
      .select('id')
      .eq('slug', slug)
      .single();
    if (!post)
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });

    const { data, error } = await supabaseServer
      .from('community_replies')
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const replies = (data || []).map((reply) => {
      const profile = Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles;
      return { ...reply, author: profile || null, profiles: undefined };
    });

    return NextResponse.json({ success: true, replies }, { status: 200 });
  } catch (err) {
    logger.error('GET /api/community/[slug]/replies error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: any) {
  try {
    const { slug } = params;
    const token = getUserTokenFromRequest(request);
    const refreshToken = getUserRefreshTokenFromRequest(request);
    const supabase = token
      ? await createAuthenticatedSupabaseClient(token, refreshToken || undefined)
      : null;
    if (!supabase)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const ip = request.headers.get('x-forwarded-for') || userId;
    const rl = checkRateLimit(`community_reply:${ip}`, 30, 60_000);
    if (!rl.allowed)
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });

    const { data: post } = await supabaseServer
      .from('community_posts')
      .select('id')
      .eq('slug', slug)
      .single();
    if (!post)
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });

    const body = await request.json();
    const content = sanitizeText(body.content);
    if (!content)
      return NextResponse.json({ success: false, error: 'Missing content' }, { status: 400 });

    const { data, error } = await supabase
      .from('community_replies')
      .insert([{ post_id: post.id, user_id: userId, content }])
      .select()
      .single();
    if (error) {
      logger.error('Failed to insert reply', error);
      return NextResponse.json({ success: false, error: 'Failed to add reply' }, { status: 500 });
    }

    return NextResponse.json({ success: true, reply: data }, { status: 201 });
  } catch (err) {
    logger.error('POST /api/community/[slug]/replies error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
