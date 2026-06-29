import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/errors";
import { getAllAchievements } from "@/lib/gamification/achievement-system";
import { logger } from '@/lib/logger';

// GET /api/gamification/achievements - Get all available achievements
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    let query = supabaseServer
      .from('achievements')
      .select('*')
      .order('points_reward', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;

    if (error) {
      throw handleDatabaseError(error);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Error in GET /api/gamification/achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
