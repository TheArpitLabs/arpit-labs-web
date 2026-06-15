import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth";
import { handleDatabaseError } from "@/lib/errors";
import { getStreakMilestone, getStreakBonus } from "@/lib/gamification";
import { POINT_VALUES } from "@/lib/gamification/points";

// POST /api/gamification/daily-login - Record daily login for streaks
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Update user streak
    const { error: streakError } = await supabaseServer
      .rpc('update_user_streak', {
        p_user_id: user.id
      });

    if (streakError) {
      throw handleDatabaseError(streakError);
    }

    // Get updated streak data
    const { data: streakData, error: streakFetchError } = await supabaseServer
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (streakFetchError) {
      throw handleDatabaseError(streakFetchError);
    }

    // Check if already logged in today
    const today = new Date();
    const lastActivity = new Date(streakData.last_activity_date);
    const isLoggedInToday = lastActivity.toDateString() === today.toDateString();

    let pointsAwarded = 0;
    let bonusPoints = 0;
    let milestoneMessage = null;

    // Only award points if first login of the day
    if (!isLoggedInToday) {
      const basePoints = POINT_VALUES.daily_login;
      const bonusMultiplier = getStreakBonus(streakData.current_streak);
      pointsAwarded = Math.floor(basePoints * bonusMultiplier);

      // Award points
      const { error: pointsError } = await supabaseServer
        .rpc('award_points', {
          p_user_id: user.id,
          p_points: pointsAwarded,
          p_action_type: 'daily_login',
          p_description: `Daily login bonus (streak: ${streakData.current_streak})`,
          p_metadata: { streak: streakData.current_streak, bonus_multiplier: bonusMultiplier }
        });

      if (pointsError) {
        throw handleDatabaseError(pointsError);
      }

      // Check for streak milestone
      const milestone = getStreakMilestone(streakData.current_streak);
      if (milestone) {
        bonusPoints = milestone.bonusPoints;
        milestoneMessage = milestone.message;

        // Award bonus points for milestone
        await supabaseServer.rpc('award_points', {
          p_user_id: user.id,
          p_points: bonusPoints,
          p_action_type: 'streak_milestone',
          p_description: milestoneMessage,
          p_metadata: { milestone_streak: streakData.current_streak }
        });
      }
    }

    return NextResponse.json({
      success: true,
      streak: {
        current: streakData.current_streak,
        longest: streakData.longest_streak,
        lastActivity: streakData.last_activity_date
      },
      pointsAwarded,
      bonusPoints,
      milestoneMessage,
      alreadyLoggedInToday: isLoggedInToday
    });

  } catch (error) {
    console.error('Error in POST /api/gamification/daily-login:', error);
    return NextResponse.json(
      { error: 'Failed to record daily login' },
      { status: 500 }
    );
  }
}
