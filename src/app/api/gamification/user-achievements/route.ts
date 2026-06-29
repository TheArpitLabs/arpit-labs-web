import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/auth";
import { handleDatabaseError } from "@/lib/errors";
import { getUserAchievements, trackAchievementByType, checkAndCompleteAchievements } from "@/lib/gamification/achievement-system";
import { getUserStatsForBadges } from "@/lib/gamification/badge-system";
import { logger } from '@/lib/logger';

// GET /api/gamification/user-achievements - Get user's achievement progress
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const achievements = await getUserAchievements(user.id);

    return NextResponse.json({ data: achievements });
  } catch (error) {
    logger.error('Error in GET /api/gamification/user-achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user achievements' },
      { status: 500 }
    );
  }
}

// POST /api/gamification/user-achievements/track - Track achievement progress
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, increment } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Achievement type is required' },
        { status: 400 }
      );
    }

    await trackAchievementByType(user.id, type, increment || 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in POST /api/gamification/user-achievements:', error);
    return NextResponse.json(
      { error: 'Failed to track achievement' },
      { status: 500 }
    );
  }
}

// PUT /api/gamification/user-achievements/check - Check and complete achievements
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user stats
    const userStats = await getUserStatsForBadges(user.id);

    // Check and complete achievements
    const newlyCompleted = await checkAndCompleteAchievements(user.id, userStats);

    return NextResponse.json({
      success: true,
      newlyCompletedAchievements: newlyCompleted,
      totalNewlyCompleted: newlyCompleted.length
    });
  } catch (error) {
    logger.error('Error in PUT /api/gamification/user-achievements:', error);
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    );
  }
}
