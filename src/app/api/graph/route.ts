import { NextRequest, NextResponse } from "next/server";
import { knowledgeGraphEngine } from "@/lib/knowledge-ecosystem/knowledge-graph";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");
    const relationshipType = searchParams.get("relationshipType");
    const query = searchParams.get("query");
    const limit = parseInt(searchParams.get("limit") || "10");

    switch (action) {
      case "entity":
        if (!entityId) {
          return NextResponse.json({ success: false, error: "entityId is required" }, { status: 400 });
        }
        const entity = await knowledgeGraphEngine.getEntity(entityId);
        return NextResponse.json({ success: true, result: entity });

      case "related":
        if (!entityId || !entityType) {
          return NextResponse.json({ success: false, error: "entityId and entityType are required" }, { status: 400 });
        }
        const related = await knowledgeGraphEngine.getRelatedEntities(
          entityId,
          relationshipType || undefined,
          limit
        );
        return NextResponse.json({ success: true, result: related });

      case "path":
        const fromEntityId = searchParams.get("fromEntityId");
        const toEntityId = searchParams.get("toEntityId");
        const maxDepth = parseInt(searchParams.get("maxDepth") || "5");
        
        if (!fromEntityId || !toEntityId) {
          return NextResponse.json({ success: false, error: "fromEntityId and toEntityId are required" }, { status: 400 });
        }
        
        const path = await knowledgeGraphEngine.findPath(fromEntityId, toEntityId, maxDepth);
        return NextResponse.json({ success: true, result: path });

      case "search":
        if (!query) {
          return NextResponse.json({ success: false, error: "query is required" }, { status: 400 });
        }
        const searchResults = await knowledgeGraphEngine.searchEntities(
          entityType || "project",
          query,
          limit
        );
        return NextResponse.json({ success: true, result: searchResults });

      case "stats":
        const stats = await knowledgeGraphEngine.getGraphStats();
        return NextResponse.json({ success: true, result: stats });

      case "most-connected":
        if (!entityType) {
          return NextResponse.json({ success: false, error: "entityType is required" }, { status: 400 });
        }
        const mostConnected = await knowledgeGraphEngine.getMostConnectedEntities(entityType, limit);
        return NextResponse.json({ success: true, result: mostConnected });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Graph API failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Graph API failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "build-graph":
        const { projectId } = body;
        if (!projectId) {
          return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
        }
        await knowledgeGraphEngine.buildProjectGraph(projectId);
        return NextResponse.json({ success: true, message: "Graph built successfully" });

      case "extract-entities":
        const { content, entityType } = body;
        if (!content) {
          return NextResponse.json({ success: false, error: "content is required" }, { status: 400 });
        }
        const entities = await knowledgeGraphEngine.extractEntities(content, entityType || "project");
        return NextResponse.json({ success: true, result: entities });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Graph API POST failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Graph API POST failed" },
      { status: 500 }
    );
  }
}
