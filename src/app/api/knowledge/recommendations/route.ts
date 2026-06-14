import { NextRequest, NextResponse } from "next/server";
import { getRelatedKnowledge } from "@/lib/knowledge-ecosystem";

export async function POST(request: NextRequest) {
  try {
    const { entityType, entityId, limit = 8 } = await request.json();
    if (!entityType || !entityId) {
      return NextResponse.json({ success: false, error: "Missing entityType or entityId" }, { status: 400 });
    }

    const recommendations = await getRelatedKnowledge(entityType, entityId, limit);
    return NextResponse.json({ success: true, recommendations });
  } catch (error) {
    console.error("Knowledge recommendations failed:", error);
    return NextResponse.json({ success: false, error: "Knowledge recommendations failed" }, { status: 500 });
  }
}
