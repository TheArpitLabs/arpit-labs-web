import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/errors";

// GET /api/gamification/leaderboard - Get global leaderboard
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category'); // points, badges, streaks, achievements

    let query;
    
    if (category === 'badges') {
      // Leaderboard by badges earned
      query = supabaseServer
        .from('user_gamification_summary')
        .select('*')
        .order('badges_earned', { ascending: false })
        .range(offset, offset + limit - 1);
    } else if (category === 'streaks') {
      // Leaderboard by current streak
      query = supabaseServer
        .from('user_gamification_summary')
        .select('*')
        .order('current_streak', { ascending: false })
        .range(offset, offset + limit - 1);
    } else if (category === 'achievements') {
      // Leaderboard by achievements completed
      query = supabaseServer
        .from('user_gamification_summary')
        .select('*')
        .order('achievements_completed', { ascending: false })
        .range(offset, offset + limit - 1);
    } else {
      // Default: leaderboard by points
      query = supabaseServer
        .from('gamification_leaderboard')
        .select('*')
        .range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw handleDatabaseError(error);
    }

    // Add rank if not already present
    const leaderboardWithRank = (data || []).map((entry, index) => ({
      ...entry,
      rank: entry.rank || offset + index + 1
    }));

    // Get total count
    const { count } = await supabaseServer
      .from('user_gamification_summary')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      data: leaderboardWithRank,
      meta: {
        limit,
        offset,
        total: count || 0,
        category: category || 'points'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/gamification/leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
