import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/auth";
import { handleDatabaseError } from "@/lib/errors";
import { logger } from '@/lib/logger';

// GET /api/user/stats - Get user statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's projects with optimized query
    const { data: projects, error: projectsError } = await supabaseServer
      .from('projects')
      .select('id, title, status, views_count, likes_count, github_stars, updated_at')
      .eq('owner_id', user.id);

    if (projectsError) {
      throw handleDatabaseError(projectsError);
    }

    // Calculate project stats
    const totalViews = projects?.reduce((sum, project) => sum + (project.views_count || 0), 0) || 0;
    const totalLikes = projects?.reduce((sum, project) => sum + (project.likes_count || 0), 0) || 0;
    const totalStars = projects?.reduce((sum, project) => sum + (project.github_stars || 0), 0) || 0;
    const publishedCount = projects?.filter(p => p.status === 'published').length || 0;
    const draftCount = projects?.filter(p => p.status === 'draft').length || 0;
    const pendingCount = projects?.filter(p => p.status === 'pending').length || 0;

    // Get followers count (from profile_follows table if it exists)
    let followersCount = 0;
    const { data: followers, error: followersError } = await supabaseServer
      .from('profile_follows')
      .select('*')
      .eq('following_id', user.id);

    if (!followersError) {
      followersCount = followers?.length || 0;
    }

    // Get profile views (from profile_analytics or similar table if it exists)
    let profileViews = 0;
    const { data: profileAnalytics, error: analyticsError } = await supabaseServer
      .from('profile_analytics')
      .select('views_count')
      .eq('profile_id', user.id)
      .single();

    if (!analyticsError && profileAnalytics) {
      profileViews = profileAnalytics.views_count || 0;
    }

    // Calculate engineering score based on various factors
    const engineeringScore = Math.max(0, 
      (totalLikes * 4) + 
      (publishedCount * 120) + 
      (totalStars * 2) + 
      (followersCount * 5)
    );

    const response = NextResponse.json({
      data: {
        engineeringScore,
        totalProjects: projects?.length || 0,
        publishedProjects: publishedCount,
        draftProjects: draftCount,
        pendingProjects: pendingCount,
        totalViews,
        totalLikes,
        totalStars,
        followersCount,
        profileViews,
      }
    });
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=300');
    
    return response;

  } catch (error) {
    logger.error('Error in GET /api/user/stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
