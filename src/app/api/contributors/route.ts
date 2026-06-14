import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { contributorIntelligenceEngine } from "@/lib/intelligence/contributor-intelligence";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const scoreType = searchParams.get("scoreType") || "overall";
    const limit = parseInt(searchParams.get("limit") || "20");
    const unifiedId = searchParams.get("unifiedId");
    const domain = searchParams.get("domain");
    const technology = searchParams.get("technology");

    switch (action) {
      case "all":
        const profiles = await contributorIntelligenceEngine.getAllContributorProfiles(limit);
        return NextResponse.json({ success: true, result: profiles });

      case "top":
        const topContributors = await contributorIntelligenceEngine.getTopContributors(scoreType as any, limit);
        return NextResponse.json({ success: true, result: topContributors });

      case "unified":
        if (!unifiedId) {
          return NextResponse.json({ success: false, error: "unifiedId is required" }, { status: 400 });
        }
        const unifiedProfile = await supabaseServer.rpc("get_contributor_by_unified_id", {
          unified_id_param: unifiedId,
        });
        return NextResponse.json({ success: true, result: unifiedProfile });

      case "domain":
        if (!domain) {
          return NextResponse.json({ success: false, error: "domain is required" }, { status: 400 });
        }
        const domainContributors = await supabaseServer.rpc("get_contributors_by_domain", {
          domain_param: domain,
          limit_param: limit,
        });
        return NextResponse.json({ success: true, result: domainContributors });

      case "technology":
        if (!technology) {
          return NextResponse.json({ success: false, error: "technology is required" }, { status: 400 });
        }
        const techContributors = await supabaseServer.rpc("get_contributors_by_technology", {
          technology_param: technology,
          limit_param: limit,
        });
        return NextResponse.json({ success: true, result: techContributors });

      case "sources":
        const profileId = searchParams.get("profileId");
        if (!profileId) {
          return NextResponse.json({ success: false, error: "profileId is required" }, { status: 400 });
        }
        const sources = await contributorIntelligenceEngine.getContributorSources(profileId);
        return NextResponse.json({ success: true, result: sources });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Contributors API failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Contributors API failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "merge-github":
        const { githubUsername } = body;
        if (!githubUsername) {
          return NextResponse.json({ success: false, error: "githubUsername is required" }, { status: 400 });
        }
        const githubProfile = await contributorIntelligenceEngine.mergeGitHubContributor(githubUsername);
        return NextResponse.json({ success: true, result: githubProfile });

      case "merge-gitlab":
        const { gitlabUsername } = body;
        if (!gitlabUsername) {
          return NextResponse.json({ success: false, error: "gitlabUsername is required" }, { status: 400 });
        }
        const gitlabProfile = await contributorIntelligenceEngine.mergeGitLabContributor(gitlabUsername);
        return NextResponse.json({ success: true, result: gitlabProfile });

      case "merge-research":
        const { researcherName } = body;
        if (!researcherName) {
          return NextResponse.json({ success: false, error: "researcherName is required" }, { status: 400 });
        }
        const researchProfile = await contributorIntelligenceEngine.mergeResearchContributor(researcherName);
        return NextResponse.json({ success: true, result: researchProfile });

      case "merge-hackathon":
        const { participantName } = body;
        if (!participantName) {
          return NextResponse.json({ success: false, error: "participantName is required" }, { status: 400 });
        }
        const hackathonProfile = await contributorIntelligenceEngine.mergeHackathonContributor(participantName);
        return NextResponse.json({ success: true, result: hackathonProfile });

      case "merge-marketplace":
        const { contributorName } = body;
        if (!contributorName) {
          return NextResponse.json({ success: false, error: "contributorName is required" }, { status: 400 });
        }
        const marketplaceProfile = await contributorIntelligenceEngine.mergeMarketplaceContributor(contributorName);
        return NextResponse.json({ success: true, result: marketplaceProfile });

      case "recalculate-scores":
        const { profileId } = body;
        if (!profileId) {
          return NextResponse.json({ success: false, error: "profileId is required" }, { status: 400 });
        }
        const scores = await contributorIntelligenceEngine.calculateContributorScores(profileId);
        return NextResponse.json({ success: true, result: scores });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Contributors API POST failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Contributors API POST failed" },
      { status: 500 }
    );
  }
}
