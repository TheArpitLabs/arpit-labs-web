import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: projects, error } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { count, error: countError } = await supabaseServer
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", status);

    if (countError) {
      logger.error("Error counting pending projects:", countError);
    }

    return NextResponse.json({
      success: true,
      projects,
      count: count || 0,
      limit,
      offset
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
