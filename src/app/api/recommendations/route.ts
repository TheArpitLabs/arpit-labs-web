import { NextRequest, NextResponse } from "next/server";
import { enhancedRecommendationEngine } from "@/lib/knowledge-ecosystem/enhanced-recommendations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const type = searchParams.get("type") || "all";
    const limit = parseInt(searchParams.get("limit") || "5");
    const minScore = parseInt(searchParams.get("minScore") || "30");
    const includeFactors = searchParams.get("includeFactors") === "true";

    if (!projectId) {
      return NextResponse.json({ success: false, error: "projectId is required" }, { status: 400 });
    }

    const options = { limit, minScore, includeFactors };

    let result;

    switch (type) {
      case "projects":
        result = await enhancedRecommendationEngine.getProjectRecommendations(projectId, options);
        break;
      case "research":
        result = await enhancedRecommendationEngine.getResearchRecommendations(projectId, options);
        break;
      case "resources":
        result = await enhancedRecommendationEngine.getResourceRecommendations(projectId, options);
        break;
      case "contributors":
        result = await enhancedRecommendationEngine.getContributorRecommendations(projectId, options);
        break;
      case "datasets":
        result = await enhancedRecommendationEngine.getDatasetRecommendations(projectId, options);
        break;
      case "organizations":
        result = await enhancedRecommendationEngine.getOrganizationRecommendations(projectId, options);
        break;
      case "all":
      default:
        result = await enhancedRecommendationEngine.getAllRecommendations(projectId, options);
        break;
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Recommendations failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Recommendations failed" },
      { status: 500 }
    );
  }
}
