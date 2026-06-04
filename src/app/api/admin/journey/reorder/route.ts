import { NextResponse } from "next/server";
import { journeyRepository } from "@/lib/repositories/journey.repository";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const items = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await journeyRepository.updateOrder(items);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reorder" },
      { status: 500 }
    );
  }
}
