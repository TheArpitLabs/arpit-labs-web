import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth";
import { handleDatabaseError } from "@/lib/errors";

// GET /api/gamification/user-progress - Get user's gamification progress
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user gamification summary from view
    const { data: summary, error: summaryError } = await supabaseServer
      .from('user_gamification_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (summaryError) {
      throw handleDatabaseError(summaryError);
    }

    // Get user's badges
    const { data: userBadges, error: badgesError } = await supabaseServer
      .from('user_badges')
      .select(`
        *,
        badges (*)
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (badgesError) {
      throw handleDatabaseError(badgesError);
    }

    // Get user's achievements with progress
    const { data: userAchievements, error: achievementsError } = await supabaseServer
      .from('user_achievements')
      .select(`
        *,
        achievements (*)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (achievementsError) {
      throw handleDatabaseError(achievementsError);
    }

    // Get recent point transactions
    const { data: recentTransactions, error: transactionsError } = await supabaseServer
      .from('point_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) {
      throw handleDatabaseError(transactionsError);
    }

    return NextResponse.json({
      summary,
      badges: userBadges || [],
      achievements: userAchievements || [],
      recentTransactions: recentTransactions || []
    });

  } catch (error) {
    console.error('Error in GET /api/gamification/user-progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    );
  }
}
