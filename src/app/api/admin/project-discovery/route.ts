import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth/auth";
import { getProjectDiscoveryEngine, ProjectCategory, ProjectDiscoveryConfig } from "@/lib/discovery/project-discovery/project-discovery-engine";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const engine = getProjectDiscoveryEngine();

  try {
    if (action === "status") {
      return NextResponse.json({
        success: true,
        isActive: engine.isActive(),
        statistics: engine.getStatistics(),
        logs: engine.getLogs(),
        categories: engine.getCategories()
      });
    }

    if (action === "statistics") {
      return NextResponse.json({
        success: true,
        statistics: engine.getStatistics(),
        categories: engine.getCategories()
      });
    }

    if (action === "logs") {
      const limit = parseInt(searchParams.get("limit") || "100");
      const logs = engine.getLogs().slice(-limit);
      return NextResponse.json({
        success: true,
        logs
      });
    }

    return NextResponse.json({
      success: true,
      isActive: engine.isActive(),
      statistics: engine.getStatistics(),
      categories: engine.getCategories()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const engine = getProjectDiscoveryEngine();

  try {
    if (body.action === "start" || body.action === "runCategory") {
      if (engine.isActive()) {
        return NextResponse.json(
          { success: false, error: "Discovery is already running" },
          { status: 400 }
        );
      }

      const categories = engine.getCategories();
      const requestedCategories = body.action === "runCategory"
        ? [body.category]
        : body.categories;
      const selectedCategories = (requestedCategories || categories)
        .filter((category: string) => categories.includes(category as ProjectCategory));

      if (selectedCategories.length === 0) {
        return NextResponse.json(
          { success: false, error: "At least one valid category is required" },
          { status: 400 }
        );
      }

      const config: ProjectDiscoveryConfig = {
        categories: selectedCategories,
        maxResultsPerCategory: body.maxResultsPerCategory || body.limit || 24,
        minStars: body.minStars || 50,
        minForks: body.minForks || 0,
        page: body.page || 1,
        limit: body.limit || body.maxResultsPerCategory || 24,
        enabled: true
      };

      // Start discovery in background
      startDiscoveryInBackground(engine, config);

      return NextResponse.json({
        success: true,
        message: body.action === "runCategory" ? "Single category discovery started" : "Project discovery started",
        config
      });
    }

    if (body.action === "stop") {
      if (!engine.isActive()) {
        return NextResponse.json(
          { success: false, error: "Discovery is not running" },
          { status: 400 }
        );
      }

      engine.stopDiscovery();

      return NextResponse.json({
        success: true,
        message: "Discovery stop signal sent"
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function startDiscoveryInBackground(
  engine: any,
  config: ProjectDiscoveryConfig
): Promise<void> {
  try {
    await engine.startDiscovery(config);
  } catch (error) {
    logger.error("Background discovery failed:", error);
  }
}
