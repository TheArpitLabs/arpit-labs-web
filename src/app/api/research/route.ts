import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { researchIntelligenceEngine } from "@/lib/intelligence/research-intelligence";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "20");
    const domain = searchParams.get("domain");
    const technology = searchParams.get("technology");
    const paperId = searchParams.get("paperId");

    switch (action) {
      case "all":
        const papers = await researchIntelligenceEngine.getAllResearchPapers(limit);
        return NextResponse.json({ success: true, result: papers });

      case "paper":
        if (!paperId) {
          return NextResponse.json({ success: false, error: "paperId is required" }, { status: 400 });
        }
        const paper = await researchIntelligenceEngine.getResearchPaper(paperId);
        return NextResponse.json({ success: true, result: paper });

      case "domain":
        if (!domain) {
          return NextResponse.json({ success: false, error: "domain is required" }, { status: 400 });
        }
        const domainPapers = await researchIntelligenceEngine.getPapersByDomain(domain, limit);
        return NextResponse.json({ success: true, result: domainPapers });

      case "technology":
        if (!technology) {
          return NextResponse.json({ success: false, error: "technology is required" }, { status: 400 });
        }
        const techPapers = await researchIntelligenceEngine.getPapersByTechnology(technology, limit);
        return NextResponse.json({ success: true, result: techPapers });

      case "citations":
        if (!paperId) {
          return NextResponse.json({ success: false, error: "paperId is required" }, { status: 400 });
        }
        const citations = await researchIntelligenceEngine.getCitations(paperId);
        return NextResponse.json({ success: true, result: citations });

      case "similar":
        if (!paperId) {
          return NextResponse.json({ success: false, error: "paperId is required" }, { status: 400 });
        }
        const similar = await researchIntelligenceEngine.getSimilarPapers(paperId, limit);
        return NextResponse.json({ success: true, result: similar });

      case "graph":
        if (!paperId) {
          return NextResponse.json({ success: false, error: "paperId is required" }, { status: 400 });
        }
        const graph = await researchIntelligenceEngine.buildResearchGraph(paperId);
        return NextResponse.json({ success: true, result: graph });

      case "statistics":
        const stats = await supabaseServer.rpc("get_research_statistics");
        return NextResponse.json({ success: true, result: stats });

      case "recommendations":
        const domains = searchParams.get("domains")?.split(",") || [];
        const technologies = searchParams.get("technologies")?.split(",") || [];
        const recommendations = await researchIntelligenceEngine.getResearchRecommendations(domains, technologies, limit);
        return NextResponse.json({ success: true, result: recommendations });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Research API failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Research API failed" },
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
        const { paperData } = body;
        if (!paperData) {
          return NextResponse.json({ success: false, error: "paperData is required" }, { status: 400 });
        }
        const createdPaper = await researchIntelligenceEngine.createResearchPaper(paperData);
        return NextResponse.json({ success: true, result: createdPaper });

      case "generate-summary":
        const { summaryPaperId } = body;
        if (!summaryPaperId) {
          return NextResponse.json({ success: false, error: "summaryPaperId is required" }, { status: 400 });
        }
        const summarizedPaper = await researchIntelligenceEngine.generateResearchSummary(summaryPaperId);
        return NextResponse.json({ success: true, result: summarizedPaper });

      case "add-citation":
        const { citingPaperId, citedPaperId, citationType, context } = body;
        if (!citingPaperId || !citedPaperId || !citationType) {
          return NextResponse.json({ success: false, error: "citingPaperId, citedPaperId, and citationType are required" }, { status: 400 });
        }
        await researchIntelligenceEngine.addCitation(citingPaperId, citedPaperId, citationType, context || "");
        return NextResponse.json({ success: true, message: "Citation added" });

      case "calculate-similarity":
        const { paperId1, paperId2 } = body;
        if (!paperId1 || !paperId2) {
          return NextResponse.json({ success: false, error: "paperId1 and paperId2 are required" }, { status: 400 });
        }
        const similarity = await researchIntelligenceEngine.calculateSimilarity(paperId1, paperId2);
        return NextResponse.json({ success: true, result: similarity });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Research API POST failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Research API POST failed" },
      { status: 500 }
    );
  }
}
