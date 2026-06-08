import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // First get the project ID from the slug
    const cookieStore = await cookies();
    const supabase = await supabaseServer({ cookieStore });
    
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const id = project.id;
    const body = await request.json();
    const { type } = body; // 'view', 'like', 'bookmark', 'unlike', 'unbookmark'

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Track view
    if (type === 'view') {
      // Project already verified above, proceed with view tracking

      // Record view (with or without user)
      await supabase.from('project_views').insert({
        project_id: id,
        user_id: user?.id || null,
        session_id: request.headers.get('x-session-id') || null,
        ip_address: request.headers.get('x-forwarded-for') || null,
        user_agent: request.headers.get('user-agent') || null,
      });

      return NextResponse.json({ success: true });
    }

    // Like/unlike (requires authentication)
    if (type === 'like' || type === 'unlike') {
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Project already verified above, proceed with like/unlike

      if (type === 'like') {
        await supabase.from('project_likes').insert({
          project_id: id,
          user_id: user.id,
        });
      } else {
        await supabase.from('project_likes').delete().eq('project_id', id).eq('user_id', user.id);
      }

      return NextResponse.json({ success: true });
    }

    // Bookmark/unbookmark (requires authentication)
    if (type === 'bookmark' || type === 'unbookmark') {
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Project already verified above, proceed with bookmark/unbookmark

      if (type === 'bookmark') {
        await supabase.from('project_bookmarks').insert({
          project_id: id,
          user_id: user.id,
        });
      } else {
        await supabase.from('project_bookmarks').delete().eq('project_id', id).eq('user_id', user.id);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const supabase = await supabaseServer({ cookieStore });
    
    // First get the project ID from the slug
    const { data: project } = await supabase
      .from('projects')
      .select('id, views_count, likes_count')
      .eq('slug', slug)
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const id = project.id;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Get project analytics (already fetched above)

    // Get user's interaction status if authenticated
    let userLiked = false;
    let userBookmarked = false;

    if (user) {
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase.from('project_likes').select('id').eq('project_id', id).eq('user_id', user.id).single(),
        supabase.from('project_bookmarks').select('id').eq('project_id', id).eq('user_id', user.id).single(),
      ]);

      userLiked = !!likeResult.data;
      userBookmarked = !!bookmarkResult.data;
    }

    return NextResponse.json({
      views_count: project.views_count || 0,
      likes_count: project.likes_count || 0,
      user_liked: userLiked,
      user_bookmarked: userBookmarked,
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
