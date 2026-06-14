import { NextRequest, NextResponse } from "next/server";
import { enhancedSearch, getSearchSuggestions, saveSearchToHistory } from "@/lib/knowledge-ecosystem/enhanced-search";
import type { SearchOptions, SearchFilters } from "@/lib/knowledge-ecosystem/enhanced-search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const mode = (searchParams.get("mode") as "keyword" | "vector" | "fulltext" | "hybrid") || "hybrid";
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Parse filters
    const filters: SearchFilters = {};
    const technology = searchParams.get("technology");
    const domain = searchParams.get("domain");
    const difficulty = searchParams.get("difficulty");
    const author = searchParams.get("author");
    const organization = searchParams.get("organization");
    const minPopularity = searchParams.get("minPopularity");
    const minQuality = searchParams.get("minQuality");

    if (technology) filters.technology = technology.split(",");
    if (domain) filters.domain = domain.split(",");
    if (difficulty) filters.difficulty = difficulty.split(",");
    if (author) filters.author = author.split(",");
    if (organization) filters.organization = organization.split(",");
    if (minPopularity) filters.minPopularity = parseFloat(minPopularity);
    if (minQuality) filters.minQuality = parseFloat(minQuality);

    const options: SearchOptions = {
      query,
      mode,
      limit,
      offset,
      filters,
    };

    const { results, analytics } = await enhancedSearch(options);

    // Save to search history if user is authenticated
    const userId = request.headers.get("x-user-id");
    if (userId && query) {
      await saveSearchToHistory(userId, query);
    }

    return NextResponse.json({
      success: true,
      results,
      analytics,
    });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query, limit = 5 } = body;

    if (action === "suggestions") {
      const suggestions = await getSearchSuggestions(query, limit);
      return NextResponse.json({ success: true, suggestions });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Search action failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Search action failed" },
      { status: 500 }
    );
  }
}
