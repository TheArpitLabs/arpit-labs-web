import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/auth";
import { handleDatabaseError } from "@/lib/errors";
import { logger } from '@/lib/logger';

// GET /api/user/activity - Get user's recent activity
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const activities: any[] = [];

    // Get recent project views
    const { data: projectViews } = await supabaseServer
      .from('project_analytics')
      .select('*, projects(title, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (projectViews) {
      projectViews.forEach(view => {
        activities.push({
          type: 'project_view',
          icon: 'Eye',
          text: `Your project ${view.projects?.title || 'Unknown'} got ${view.views_count || 0} views`,
          time: formatTimeAgo(view.created_at),
          createdAt: view.created_at
        });
      });
    }

    // Get recent likes on user's projects
    const { data: projectLikes } = await supabaseServer
      .from('project_likes')
      .select('*, projects(title, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (projectLikes) {
      projectLikes.forEach(like => {
        activities.push({
          type: 'project_like',
          icon: 'Heart',
          text: `You received a like on ${like.projects?.title || 'Unknown'}`,
          time: formatTimeAgo(like.created_at),
          createdAt: like.created_at
        });
      });
    }

    // Get new followers
    const { data: followers } = await supabaseServer
      .from('profile_follows')
      .select('*, profiles(full_name, username)')
      .eq('following_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (followers) {
      followers.forEach(follow => {
        activities.push({
          type: 'new_follower',
          icon: 'Users',
          text: `New follower ${follow.profiles?.full_name || follow.profiles?.username || 'Someone'} started following you`,
          time: formatTimeAgo(follow.created_at),
          createdAt: follow.created_at
        });
      });
    }

    // Get project updates/featured status
    const { data: featuredProjects } = await supabaseServer
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .eq('featured', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (featuredProjects) {
      featuredProjects.forEach(project => {
        activities.push({
          type: 'project_featured',
          icon: 'TrendingUp',
          text: `Your project ${project.title} got featured`,
          time: formatTimeAgo(project.updated_at),
          createdAt: project.updated_at
        });
      });
    }

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Return limited results with caching headers
    const response = NextResponse.json({
      data: activities.slice(0, limit)
    });
    
    // Add caching headers (shorter cache for activity)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=60');
    
    return response;

  } catch (error) {
    logger.error('Error in GET /api/user/activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return `${Math.floor(seconds / 604800)} weeks ago`;
}
