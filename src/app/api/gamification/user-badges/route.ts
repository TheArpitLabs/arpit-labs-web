import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth/auth";
import { handleDatabaseError } from "@/lib/errors";
import { getUserBadges, getUserStatsForBadges, checkAndAwardBadges } from "@/lib/gamification/badge-system";
import { logger } from '@/lib/logger';

// GET /api/gamification/user-badges - Get user's earned badges
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const badges = await getUserBadges(user.id);

    return NextResponse.json({ data: badges });
  } catch (error) {
    logger.error('Error in GET /api/gamification/user-badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user badges' },
      { status: 500 }
    );
  }
}

// POST /api/gamification/user-badges/check - Check and award new badges
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
    const { forceCheck } = body;

    // Get user stats
    const userStats = await getUserStatsForBadges(user.id);

    // Check and award badges
    const newlyEarnedBadges = await checkAndAwardBadges(user.id, userStats);

    return NextResponse.json({
      success: true,
      newlyEarnedBadges,
      totalNewlyEarned: newlyEarnedBadges.length
    });
  } catch (error) {
    logger.error('Error in POST /api/gamification/user-badges:', error);
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    );
  }
}
