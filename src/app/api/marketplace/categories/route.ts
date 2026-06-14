import { NextResponse } from "next/server";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";

export async function GET() {
  try {
    const categories = await marketplaceRepository.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching marketplace categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace categories" },
      { status: 500 }
    );
  }
}
