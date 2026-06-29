import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { trendIntelligenceEngine } from "@/lib/intelligence/trend-engine";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const category = searchParams.get("category");
    const timeframe = searchParams.get("timeframe") || "weekly";
    const limit = parseInt(searchParams.get("limit") || "50");

    switch (action) {
      case "technology":
        const techTrends = await trendIntelligenceEngine.analyzeTechnologyTrends(timeframe as any);
        return NextResponse.json({ success: true, result: techTrends });

      case "domains":
        const domainTrends = await trendIntelligenceEngine.detectEmergingDomains();
        return NextResponse.json({ success: true, result: domainTrends });

      case "research":
        const researchTrends = await trendIntelligenceEngine.analyzeResearchTrends(timeframe as any);
        return NextResponse.json({ success: true, result: researchTrends });

      case "contributors":
        const contributorTrends = await trendIntelligenceEngine.analyzeContributorTrends(timeframe as any);
        return NextResponse.json({ success: true, result: contributorTrends });

      case "projects":
        const projectTrends = await trendIntelligenceEngine.analyzeProjectTrends(timeframe as any);
        return NextResponse.json({ success: true, result: projectTrends });

      case "all":
        const allTrends = await trendIntelligenceEngine.getAllTrends(category || undefined, limit);
        return NextResponse.json({ success: true, result: allTrends });

      case "report":
        const report = await trendIntelligenceEngine.generateTrendReport();
        return NextResponse.json({ success: true, result: report });

      case "history":
        const name = searchParams.get("name");
        const historyCategory = searchParams.get("category");
        if (!name || !historyCategory) {
          return NextResponse.json({ success: false, error: "name and category are required" }, { status: 400 });
        }
        const history = await supabaseServer.rpc("get_trend_history", {
          name_param: name,
          category_param: historyCategory,
          days_param: 30,
        });
        return NextResponse.json({ success: true, result: history });

      case "metrics":
        const metricsName = searchParams.get("name");
        const metricsCategory = searchParams.get("category");
        if (!metricsName || !metricsCategory) {
          return NextResponse.json({ success: false, error: "name and category are required" }, { status: 400 });
        }
        const metrics = await supabaseServer.rpc("calculate_trend_metrics", {
          name_param: metricsName,
          category_param: metricsCategory,
        });
        return NextResponse.json({ success: true, result: metrics });

      case "compare":
        const compareName = searchParams.get("name");
        const compareCategory = searchParams.get("category");
        if (!compareName || !compareCategory) {
          return NextResponse.json({ success: false, error: "name and category are required" }, { status: 400 });
        }
        const comparison = await supabaseServer.rpc("compare_trend_timeframes", {
          name_param: compareName,
          category_param: compareCategory,
        });
        return NextResponse.json({ success: true, result: comparison });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Trends API failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Trends API failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "store-trend":
        const { trend } = body;
        if (!trend) {
          return NextResponse.json({ success: false, error: "trend is required" }, { status: 400 });
        }
        const trendId = await trendIntelligenceEngine.storeTrend(trend);
        return NextResponse.json({ success: true, result: { id: trendId } });

      case "store-history":
        const { name, category, value, count } = body;
        if (!name || !category || value === undefined) {
          return NextResponse.json({ success: false, error: "name, category, and value are required" }, { status: 400 });
        }
        await trendIntelligenceEngine.storeTrendHistory(name, category, value, count || 0);
        return NextResponse.json({ success: true, message: "History stored" });

      case "analyze-all":
        const analyzeTimeframe = body.timeframe || "weekly";
        const [
          techTrends,
          domainTrends,
          researchTrends,
          contributorTrends,
          projectTrends,
        ] = await Promise.all([
          trendIntelligenceEngine.analyzeTechnologyTrends(analyzeTimeframe),
          trendIntelligenceEngine.detectEmergingDomains(),
          trendIntelligenceEngine.analyzeResearchTrends(analyzeTimeframe),
          trendIntelligenceEngine.analyzeContributorTrends(analyzeTimeframe),
          trendIntelligenceEngine.analyzeProjectTrends(analyzeTimeframe),
        ]);
        return NextResponse.json({
          success: true,
          result: {
            technology: techTrends,
            domains: domainTrends,
            research: researchTrends,
            contributors: contributorTrends,
            projects: projectTrends,
          },
        });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Trends API POST failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Trends API POST failed" },
      { status: 500 }
    );
  }
}
