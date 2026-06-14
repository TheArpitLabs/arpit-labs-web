import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { datasetIntelligenceEngine } from "@/lib/intelligence/dataset-intelligence";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "20");
    const domain = searchParams.get("domain");
    const technology = searchParams.get("technology");
    const datasetId = searchParams.get("datasetId");

    switch (action) {
      case "all":
        const datasets = await datasetIntelligenceEngine.getAllDatasets(limit);
        return NextResponse.json({ success: true, result: datasets });

      case "dataset":
        if (!datasetId) {
          return NextResponse.json({ success: false, error: "datasetId is required" }, { status: 400 });
        }
        const dataset = await datasetIntelligenceEngine.getDataset(datasetId);
        return NextResponse.json({ success: true, result: dataset });

      case "domain":
        if (!domain) {
          return NextResponse.json({ success: false, error: "domain is required" }, { status: 400 });
        }
        const domainDatasets = await datasetIntelligenceEngine.getDatasetsByDomain(domain, limit);
        return NextResponse.json({ success: true, result: domainDatasets });

      case "technology":
        if (!technology) {
          return NextResponse.json({ success: false, error: "technology is required" }, { status: 400 });
        }
        const techDatasets = await datasetIntelligenceEngine.getDatasetsByTechnology(technology, limit);
        return NextResponse.json({ success: true, result: techDatasets });

      case "quality":
        if (!datasetId) {
          return NextResponse.json({ success: false, error: "datasetId is required" }, { status: 400 });
        }
        const quality = await datasetIntelligenceEngine.getDatasetQuality(datasetId);
        return NextResponse.json({ success: true, result: quality });

      case "statistics":
        const stats = await supabaseServer.rpc("get_dataset_statistics");
        return NextResponse.json({ success: true, result: stats });

      case "recommendations":
        const domains = searchParams.get("domains")?.split(",") || [];
        const technologies = searchParams.get("technologies")?.split(",") || [];
        const recommendations = await datasetIntelligenceEngine.getDatasetRecommendations(domains, technologies, limit);
        return NextResponse.json({ success: true, result: recommendations });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Datasets API failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Datasets API failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create":
        const { datasetData } = body;
        if (!datasetData) {
          return NextResponse.json({ success: false, error: "datasetData is required" }, { status: 400 });
        }
        const createdDataset = await datasetIntelligenceEngine.createDataset(datasetData);
        return NextResponse.json({ success: true, result: createdDataset });

      case "calculate-quality":
        const { qualityDatasetId } = body;
        if (!qualityDatasetId) {
          return NextResponse.json({ success: false, error: "qualityDatasetId is required" }, { status: 400 });
        }
        const calculatedQuality = await datasetIntelligenceEngine.calculateDatasetQuality(qualityDatasetId);
        return NextResponse.json({ success: true, result: calculatedQuality });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Datasets API POST failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Datasets API POST failed" },
      { status: 500 }
    );
  }
}
