import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// GET /api/debug-auth - Debug auth session
export async function GET() {
  try {
    const { data: { user } } = await supabaseServer.auth.getUser();

    return NextResponse.json({
      userId: user?.id,
      email: user?.email
    });
  } catch (error) {
    console.error('Error in GET /api/debug-auth:', error);
    return NextResponse.json(
      { error: 'Failed to get auth debug info' },
      { status: 500 }
    );
  }
}
