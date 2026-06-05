import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest, { params }: any) {
  try {
    const { slug } = params;

    const rl = checkRateLimit(`community_get:${request.headers.get('x-forwarded-for') || 'anon'}`, 300, 60_000);
    if (!rl.allowed) return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });

    const { data, error } = await supabaseServer.from('community_posts').select('*').eq('slug', slug).single();
    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    // increment views (best-effort)
    try {
      await supabaseServer.from('community_posts').update({ views: (data.views || 0) + 1 }).eq('id', data.id);
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true, post: data }, { status: 200 });
  } catch (err) {
    console.error('GET /api/community/[slug] error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const { slug } = params;
    const auth = request.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '').trim();
    const { data: userData } = await supabaseServer.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const title = sanitizeText(body.title);
    const content = sanitizeText(body.content);
    const tags = Array.isArray(body.tags) ? body.tags.map((t: any) => sanitizeText(t)).filter(Boolean) : undefined;

    const { data: existing } = await supabaseServer.from('community_posts').select('*').eq('slug', slug).single();
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (existing.user_id !== userId) {
      // check admin
      const { data: userInfo } = await supabaseServer.auth.getUser(token);
      const isAdmin = Boolean(userInfo?.user?.app_metadata?.role === 'admin');
      if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (tags) updates.tags = tags;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer.from('community_posts').update(updates).eq('slug', slug).select().single();
    if (error) {
      console.error('Failed to update post:', error);
      return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data }, { status: 200 });
  } catch (err) {
    console.error('PUT /api/community/[slug] error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const { slug } = params;
    const auth = request.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '').trim();
    const { data: userData } = await supabaseServer.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: existing } = await supabaseServer.from('community_posts').select('*').eq('slug', slug).single();
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    if (existing.user_id !== userId) {
      const { data: userInfo } = await supabaseServer.auth.getUser(token);
      const isAdmin = Boolean(userInfo?.user?.app_metadata?.role === 'admin');
      if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseServer.from('community_posts').delete().eq('slug', slug);
    if (error) {
      console.error('Failed to delete post', error);
      return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('DELETE /api/community/[slug] error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
