import { NextRequest, NextResponse } from "next/server";
import { hybridKnowledgeSearch } from "@/lib/knowledge-ecosystem";
import type { SearchMode } from "@/lib/knowledge-ecosystem";
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { query, mode = "hybrid", limit = 10 } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ success: false, error: "Missing query" }, { status: 400 });
    }

    const results = await hybridKnowledgeSearch(query, mode as SearchMode, limit);
    return NextResponse.json({ success: true, query, mode, results });
  } catch (error) {
    logger.error("Knowledge search failed:", error);
    return NextResponse.json({ success: false, error: "Knowledge search failed" }, { status: 500 });
  }
}
