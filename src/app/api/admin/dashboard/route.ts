import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

// GET /api/admin/dashboard - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const [
      projectsResult,
      profilesResult,
      labNotesResult,
      experimentsResult,
      communityPostsResult,
      discoveredItemsResult,
      discoveryLogsResult
    ] = await Promise.all([
      supabaseServer.from("projects").select("*", { count: "exact", head: true }),
      supabaseServer.from("profiles").select("*", { count: "exact", head: true }),
      supabaseServer.from("lab_notes").select("*", { count: "exact", head: true }),
      supabaseServer.from("experiments").select("*", { count: "exact", head: true }),
      supabaseServer.from("community_posts").select("*", { count: "exact", head: true }),
      supabaseServer.from("discovered_items").select("processing_status, is_duplicate"),
      supabaseServer.from("discovery_logs").select("*").order("logged_at", { ascending: false }).limit(10)
    ]);

    const discoveredItems = discoveredItemsResult.data || [];
    const discoveryStats = {
      totalFetched: discoveredItems.length,
      totalInserted: discoveredItems.filter((item: any) => item.processing_status === 'completed').length,
      duplicatesSkipped: discoveredItems.filter((item: any) => item.is_duplicate).length,
      failures: discoveredItems.filter((item: any) => item.processing_status === 'failed').length
    };

    const statistics = {
      totalProjects: projectsResult.count || 0,
      totalUsers: profilesResult.count || 0,
      totalResearch: (labNotesResult.count || 0) + (experimentsResult.count || 0),
      totalCommunities: communityPostsResult.count || 0,
      discovery: discoveryStats,
      recentLogs: discoveryLogsResult.data || []
    };

    return NextResponse.json({ success: true, data: statistics });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
