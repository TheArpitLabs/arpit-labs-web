import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { autonomousDiscoveryEngine } from "@/lib/intelligence/autonomous-discovery";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const status = searchParams.get("status") || "discovered";
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "20");

    switch (action) {
      case "items":
        const items = await autonomousDiscoveryEngine.getAllDiscoveryItems(status, limit);
        return NextResponse.json({ success: true, result: items });

      case "item":
        const itemId = searchParams.get("itemId");
        if (!itemId) {
          return NextResponse.json({ success: false, error: "itemId is required" }, { status: 400 });
        }
        const item = await autonomousDiscoveryEngine.getDiscoveryItem(itemId);
        return NextResponse.json({ success: true, result: item });

      case "sources":
        const sources = await autonomousDiscoveryEngine.getDiscoverySources();
        return NextResponse.json({ success: true, result: sources });

      case "pipeline":
        if (!source) {
          return NextResponse.json({ success: false, error: "source is required" }, { status: 400 });
        }
        const pipeline = await autonomousDiscoveryEngine.getDiscoveryPipeline(source);
        return NextResponse.json({ success: true, result: pipeline });

      case "statistics":
        const stats = await supabaseServer.rpc("get_discovery_statistics");
        return NextResponse.json({ success: true, result: stats });

      case "pipeline-stats":
        const pipelineStats = await supabaseServer.rpc("get_pipeline_statistics", {
          source_param: source || null,
        });
        return NextResponse.json({ success: true, result: pipelineStats });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Discovery API failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Discovery API failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "discover":
        const { discoverSource } = body;
        if (!discoverSource) {
          return NextResponse.json({ success: false, error: "discoverSource is required" }, { status: 400 });
        }
        const discoveredItems = await autonomousDiscoveryEngine.discoverFromSource(discoverSource);
        return NextResponse.json({ success: true, result: discoveredItems });

      case "analyze":
        const { analyzeItemId } = body;
        if (!analyzeItemId) {
          return NextResponse.json({ success: false, error: "analyzeItemId is required" }, { status: 400 });
        }
        const analyzedItem = await autonomousDiscoveryEngine.analyzeItem(analyzeItemId);
        return NextResponse.json({ success: true, result: analyzedItem });

      case "deduplicate":
        const { deduplicateItemId } = body;
        if (!deduplicateItemId) {
          return NextResponse.json({ success: false, error: "deduplicateItemId is required" }, { status: 400 });
        }
        const deduplicatedItem = await autonomousDiscoveryEngine.deduplicateItem(deduplicateItemId);
        return NextResponse.json({ success: true, result: deduplicatedItem });

      case "score":
        const { scoreItemId } = body;
        if (!scoreItemId) {
          return NextResponse.json({ success: false, error: "scoreItemId is required" }, { status: 400 });
        }
        const scoredItem = await autonomousDiscoveryEngine.scoreItem(scoreItemId);
        return NextResponse.json({ success: true, result: scoredItem });

      case "queue":
        const { queueItemId } = body;
        if (!queueItemId) {
          return NextResponse.json({ success: false, error: "queueItemId is required" }, { status: 400 });
        }
        const queuedItem = await autonomousDiscoveryEngine.queueItem(queueItemId);
        return NextResponse.json({ success: true, result: queuedItem });

      case "approve":
        const { approveItemId } = body;
        if (!approveItemId) {
          return NextResponse.json({ success: false, error: "approveItemId is required" }, { status: 400 });
        }
        const approvedItem = await autonomousDiscoveryEngine.approveItem(approveItemId);
        return NextResponse.json({ success: true, result: approvedItem });

      case "publish":
        const { publishItemId } = body;
        if (!publishItemId) {
          return NextResponse.json({ success: false, error: "publishItemId is required" }, { status: 400 });
        }
        const publishedItem = await autonomousDiscoveryEngine.publishItem(publishItemId);
        return NextResponse.json({ success: true, result: publishedItem });

      case "reject":
        const { rejectItemId } = body;
        if (!rejectItemId) {
          return NextResponse.json({ success: false, error: "rejectItemId is required" }, { status: 400 });
        }
        const rejectedItem = await autonomousDiscoveryEngine.rejectItem(rejectItemId);
        return NextResponse.json({ success: true, result: rejectedItem });

      case "run-workflow":
        const { workflowSource } = body;
        if (!workflowSource) {
          return NextResponse.json({ success: false, error: "workflowSource is required" }, { status: 400 });
        }
        await autonomousDiscoveryEngine.runDiscoveryWorkflow(workflowSource);
        return NextResponse.json({ success: true, message: "Workflow completed" });

      case "initialize-sources":
        await supabaseServer.rpc("initialize_discovery_sources");
        return NextResponse.json({ success: true, message: "Discovery sources initialized" });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Discovery API POST failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Discovery API POST failed" },
      { status: 500 }
    );
  }
}
