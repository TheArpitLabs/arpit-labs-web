import { NextResponse } from "next/server";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const item = await marketplaceRepository.getBySlug(slug);

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching marketplace item:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace item" },
      { status: 500 }
    );
  }
}
