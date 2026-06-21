import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

// GET /api/admin/health - Check system health status
export async function GET(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const healthChecks = {
      database: "unknown",
      storage: "unknown",
      api: "unknown",
      cron: "unknown"
    };

    // Check database health
    try {
      const { error } = await supabaseServer.from("projects").select("id").limit(1);
      healthChecks.database = error ? "unhealthy" : "healthy";
    } catch (error) {
      healthChecks.database = "unhealthy";
    }

    // Check storage health (try to list buckets)
    try {
      const { error } = await supabaseServer.storage.listBuckets();
      healthChecks.storage = error ? "unhealthy" : "healthy";
    } catch (error) {
      healthChecks.storage = "unhealthy";
    }

    // API health is always healthy if we're responding
    healthChecks.api = "healthy";

    // Check cron jobs by looking at recent discovery logs
    try {
      const { data: recentLogs } = await supabaseServer
        .from("discovery_logs")
        .select("logged_at")
        .order("logged_at", { ascending: false })
        .limit(1);
      
      if (recentLogs && recentLogs.length > 0) {
        const lastLog = new Date(recentLogs[0].logged_at);
        const hoursSinceLastLog = (Date.now() - lastLog.getTime()) / (1000 * 60 * 60);
        healthChecks.cron = hoursSinceLastLog < 24 ? "healthy" : "stale";
      } else {
        healthChecks.cron = "no_data";
      }
    } catch (error) {
      healthChecks.cron = "unhealthy";
    }

    const overallHealth = Object.values(healthChecks).every(status => 
      status === "healthy" || status === "no_data"
    );

    return NextResponse.json({ 
      success: true, 
      data: {
        overall: overallHealth ? "healthy" : "degraded",
        checks: healthChecks,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
