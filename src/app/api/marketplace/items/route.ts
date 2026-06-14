import { NextResponse } from "next/server";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const published = searchParams.get("published");

    const items = await marketplaceRepository.getAll({
      category: category || undefined,
      featured: featured === "true" ? true : featured === "false" ? false : undefined,
      published: published === "true" ? true : published === "false" ? false : undefined,
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching marketplace items:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace items" },
      { status: 500 }
    );
  }
}
