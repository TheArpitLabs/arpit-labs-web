import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth/auth";
import { analyzeProjectEnhanced } from "@/lib/knowledge-ecosystem/enhanced-analysis";
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { queueItemId } = body;

    if (!queueItemId) {
      return NextResponse.json({ success: false, error: "queueItemId is required" }, { status: 400 });
    }

    const analysis = await analyzeProjectEnhanced(queueItemId);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    logger.error("Analysis failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
