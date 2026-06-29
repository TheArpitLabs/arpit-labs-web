import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/errors";
import { getAllBadges } from "@/lib/gamification/badge-system";
import { logger } from '@/lib/logger';

// GET /api/gamification/badges - Get all available badges
export async function GET(request: NextRequest) {
  try {
    const badges = await getAllBadges();

    return NextResponse.json({ data: badges });
  } catch (error) {
    logger.error('Error in GET /api/gamification/badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
