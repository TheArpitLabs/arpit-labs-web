import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUserFromRequest } from "@/lib/auth";
import { handleDatabaseError } from "@/lib/errors";
import { validatePointValue } from "@/lib/gamification";

// POST /api/gamification/award-points - Award points to user
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
    const { points, actionType, description, metadata } = body;

    // Validate points
    if (!points || typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Invalid points value' },
        { status: 400 }
      );
    }

    if (!validatePointValue(points)) {
      return NextResponse.json(
        { error: 'Points value out of valid range' },
        { status: 400 }
      );
    }

    if (!actionType) {
      return NextResponse.json(
        { error: 'Action type is required' },
        { status: 400 }
      );
    }

    // Call the database function to award points
    const { data: transactionData, error: transactionError } = await supabaseServer
      .rpc('award_points', {
        p_user_id: user.id,
        p_points: points,
        p_action_type: actionType,
        p_description: description || `Awarded ${points} points for ${actionType}`,
        p_metadata: metadata || {}
      });

    if (transactionError) {
      throw handleDatabaseError(transactionError);
    }

    // Get updated user points
    const { data: userPoints, error: pointsError } = await supabaseServer
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (pointsError) {
      throw handleDatabaseError(pointsError);
    }

    return NextResponse.json({
      success: true,
      transactionId: transactionData,
      points: userPoints.points,
      level: userPoints.level
    });

  } catch (error) {
    console.error('Error in POST /api/gamification/award-points:', error);
    return NextResponse.json(
      { error: 'Failed to award points' },
      { status: 500 }
    );
  }
}
