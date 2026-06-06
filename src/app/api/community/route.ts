import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { createAuthenticatedSupabaseClient, getUserTokenFromRequest, getUserRefreshTokenFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const limit = Number(url.searchParams.get('limit') || '20');
    const offset = Number(url.searchParams.get('offset') || '0');

    // Basic rate limiting per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anon';
    const rl = checkRateLimit(`community_list:${ip}`, 120, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    let query = supabaseServer.from('community_posts').select('id,title,slug,content,category,tags,views,upvotes,created_at,updated_at').order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (q) query = query.ilike('title', `%${q}%`);

    const { data, error } = await query;

    if (error) {
      console.error('Community list error:', error);
      return NextResponse.json({ success: false, error: 'Failed to load posts' }, { status: 500 });
    }

    return NextResponse.json({ success: true, posts: data || [] }, { status: 200 });
  } catch (err) {
    console.error('GET /api/community error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getUserTokenFromRequest(request);
    const refreshToken = getUserRefreshTokenFromRequest(request);
    const supabase = token ? await createAuthenticatedSupabaseClient(token, refreshToken || undefined) : null;
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || userId;
    const rl = checkRateLimit(`community_create:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const title = sanitizeText(body.title);
    const content = sanitizeText(body.content);
    const category = sanitizeText(body.category || 'discussion');
    const tags = Array.isArray(body.tags) ? body.tags.map((t: any) => sanitizeText(t)).filter(Boolean) : [];

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'Missing title or content' }, { status: 400 });
    }

    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 160);
    const slug = `${slugBase}-${Date.now().toString(36).slice(-6)}`;

    const { data, error } = await supabase
      .from('community_posts')
      .insert([{ user_id: userId, title, slug, content, category, tags }])
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create community post:', error);
      return NextResponse.json({ success: false, error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/community error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
