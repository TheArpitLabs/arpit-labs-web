import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { githubRateLimitService } from "@/lib/github/github-rate-limit.service";
import { githubCircuitBreaker } from "@/lib/github/github-circuit-breaker";
import { githubApiRecovery } from "@/lib/github/github-api-recovery";
import { logger } from '@/lib/logger';

// GET /api/admin/discovery/health - Check discovery system health
export async function GET(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    // Fetch latest rate limit status
    await githubRateLimitService.fetchRateLimitStatus();
    const rateLimitStatus = githubRateLimitService.getRateLimitStatus();
    
    // Get circuit breaker stats
    const circuitBreakerStats = githubCircuitBreaker.getStats();
    
    // Get API recovery stats
    const apiRecoveryStats = githubApiRecovery.getFailureStats();
    
    // Get last discovery run
    const { data: lastRun } = await supabaseServer
      .from("discovery_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();
    
    // Get last successful discovery run
    const { data: lastSuccessfulRun } = await supabaseServer
      .from("discovery_runs")
      .select("*")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();
    
    // Calculate failure rate
    let failureRate = 0;
    let averageRuntime = 0;
    
    if (lastRun) {
      const { data: recentRuns } = await supabaseServer
        .from("discovery_runs")
        .select("status, duration_ms")
        .order("started_at", { ascending: false })
        .limit(10);
      
      if (recentRuns && recentRuns.length > 0) {
        const failures = recentRuns.filter(run => run.status === "failed").length;
        failureRate = (failures / recentRuns.length) * 100;
        
        const completedRuns = recentRuns.filter(run => run.status === "completed" && run.duration_ms);
        if (completedRuns.length > 0) {
          const totalDuration = completedRuns.reduce((sum, run) => sum + (run.duration_ms || 0), 0);
          averageRuntime = totalDuration / completedRuns.length;
        }
      }
    }
    
    // Determine overall health status
    let overallStatus = "healthy";
    const issues: string[] = [];
    
    if (!rateLimitStatus || rateLimitStatus.remaining < 100) {
      overallStatus = "critical";
      issues.push("Rate limit critically low or unknown");
    } else if (rateLimitStatus.remaining < 500) {
      overallStatus = "warning";
      issues.push("Rate limit approaching threshold");
    }
    
    if (circuitBreakerStats.state === "open") {
      overallStatus = "critical";
      issues.push("Circuit breaker is open");
    } else if (circuitBreakerStats.state === "half_open") {
      overallStatus = "warning";
      issues.push("Circuit breaker in half-open state");
    }
    
    if (failureRate > 50) {
      overallStatus = "critical";
      issues.push("High failure rate");
    } else if (failureRate > 20) {
      overallStatus = "warning";
      issues.push("Elevated failure rate");
    }
    
    const healthData = {
      github_auth: true, // Assuming auth is working if we can check rate limits
      rate_limit_remaining: rateLimitStatus?.remaining || 0,
      rate_limit_limit: rateLimitStatus?.limit || 0,
      rate_limit_reset: rateLimitStatus?.reset || 0,
      rate_limit_reset_date: rateLimitStatus?.resetDate?.toISOString() || null,
      database: true, // Assuming database is healthy if we can query
      circuit_breaker_state: circuitBreakerStats.state,
      circuit_breaker_failure_count: circuitBreakerStats.failureCount,
      circuit_breaker_open_since: circuitBreakerStats.openSince?.toISOString() || null,
      api_recovery_failures: apiRecoveryStats.total,
      api_recovery_recent_failures: apiRecoveryStats.recent,
      last_run: lastRun?.started_at || null,
      last_run_status: lastRun?.status || null,
      last_successful_run: lastSuccessfulRun?.completed_at || null,
      failure_rate: Math.round(failureRate * 100) / 100,
      average_runtime_ms: Math.round(averageRuntime),
      status: overallStatus,
      issues,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    logger.error("Discovery health check failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          status: "error",
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}
