import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { collaborationMarketplaceEngine } from "@/lib/intelligence/collaboration-marketplace";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const type = searchParams.get("type");
    const status = searchParams.get("status") || "open";
    const limit = parseInt(searchParams.get("limit") || "20");
    const creatorId = searchParams.get("creatorId");
    const applicantId = searchParams.get("applicantId");

    switch (action) {
      case "all":
        const opportunities = await collaborationMarketplaceEngine.getAllOpportunities(type || undefined, status, limit);
        return NextResponse.json({ success: true, result: opportunities });

      case "opportunity":
        const opportunityId = searchParams.get("opportunityId");
        if (!opportunityId) {
          return NextResponse.json({ success: false, error: "opportunityId is required" }, { status: 400 });
        }
        const opportunity = await collaborationMarketplaceEngine.getOpportunity(opportunityId);
        return NextResponse.json({ success: true, result: opportunity });

      case "applications":
        const appsOpportunityId = searchParams.get("opportunityId");
        if (!appsOpportunityId) {
          return NextResponse.json({ success: false, error: "opportunityId is required" }, { status: 400 });
        }
        const applications = await collaborationMarketplaceEngine.getOpportunityApplications(appsOpportunityId);
        return NextResponse.json({ success: true, result: applications });

      case "creator":
        if (!creatorId) {
          return NextResponse.json({ success: false, error: "creatorId is required" }, { status: 400 });
        }
        const creatorOpportunities = await collaborationMarketplaceEngine.getOpportunitiesByCreator(creatorId);
        return NextResponse.json({ success: true, result: creatorOpportunities });

      case "applicant":
        if (!applicantId) {
          return NextResponse.json({ success: false, error: "applicantId is required" }, { status: 400 });
        }
        const applicantOpportunities = await collaborationMarketplaceEngine.getOpportunitiesByApplicant(applicantId);
        return NextResponse.json({ success: true, result: applicantOpportunities });

      case "match":
        const skills = searchParams.get("skills")?.split(",") || [];
        const domains = searchParams.get("domains")?.split(",") || [];
        const matched = await collaborationMarketplaceEngine.matchOpportunities(skills, domains);
        return NextResponse.json({ success: true, result: matched });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Collaboration API failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Collaboration API failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "team-formation":
        const { creatorId, creatorName, teamFormationData } = body;
        if (!creatorId || !creatorName || !teamFormationData) {
          return NextResponse.json({ success: false, error: "creatorId, creatorName, and teamFormationData are required" }, { status: 400 });
        }
        const teamFormation = await collaborationMarketplaceEngine.createTeamFormationRequest(creatorId, creatorName, teamFormationData);
        return NextResponse.json({ success: true, result: teamFormation });

      case "mentor-opportunity":
        const { mentorCreatorId, mentorCreatorName, mentorData } = body;
        if (!mentorCreatorId || !mentorCreatorName || !mentorData) {
          return NextResponse.json({ success: false, error: "creatorId, creatorName, and mentorData are required" }, { status: 400 });
        }
        const mentorOpportunity = await collaborationMarketplaceEngine.createMentorOpportunity(mentorCreatorId, mentorCreatorName, mentorData);
        return NextResponse.json({ success: true, result: mentorOpportunity });

      case "research-collaboration":
        const { researchCreatorId, researchCreatorName, researchData } = body;
        if (!researchCreatorId || !researchCreatorName || !researchData) {
          return NextResponse.json({ success: false, error: "creatorId, creatorName, and researchData are required" }, { status: 400 });
        }
        const researchCollaboration = await collaborationMarketplaceEngine.createResearchCollaboration(researchCreatorId, researchCreatorName, researchData);
        return NextResponse.json({ success: true, result: researchCollaboration });

      case "startup-collaboration":
        const { startupCreatorId, startupCreatorName, startupData } = body;
        if (!startupCreatorId || !startupCreatorName || !startupData) {
          return NextResponse.json({ success: false, error: "creatorId, creatorName, and startupData are required" }, { status: 400 });
        }
        const startupCollaboration = await collaborationMarketplaceEngine.createStartupCollaboration(startupCreatorId, startupCreatorName, startupData);
        return NextResponse.json({ success: true, result: startupCollaboration });

      case "hackathon-collaboration":
        const { hackathonCreatorId, hackathonCreatorName, hackathonData } = body;
        if (!hackathonCreatorId || !hackathonCreatorName || !hackathonData) {
          return NextResponse.json({ success: false, error: "creatorId, creatorName, and hackathonData are required" }, { status: 400 });
        }
        const hackathonCollaboration = await collaborationMarketplaceEngine.createHackathonCollaboration(hackathonCreatorId, hackathonCreatorName, hackathonData);
        return NextResponse.json({ success: true, result: hackathonCollaboration });

      case "apply":
        const { applyOpportunityId, applicantId, applicantName, message } = body;
        if (!applyOpportunityId || !applicantId || !applicantName) {
          return NextResponse.json({ success: false, error: "opportunityId, applicantId, and applicantName are required" }, { status: 400 });
        }
        await collaborationMarketplaceEngine.applyForOpportunity(applyOpportunityId, applicantId, applicantName, message || "");
        return NextResponse.json({ success: true, message: "Application submitted" });

      case "update-application-status":
        const { applicationId, applicationStatus } = body;
        if (!applicationId || !applicationStatus) {
          return NextResponse.json({ success: false, error: "applicationId and status are required" }, { status: 400 });
        }
        await collaborationMarketplaceEngine.updateApplicationStatus(applicationId, applicationStatus);
        return NextResponse.json({ success: true, message: "Application status updated" });

      case "update-opportunity-status":
        const { updateOpportunityId, opportunityStatus } = body;
        if (!updateOpportunityId || !opportunityStatus) {
          return NextResponse.json({ success: false, error: "opportunityId and status are required" }, { status: 400 });
        }
        await collaborationMarketplaceEngine.updateOpportunityStatus(updateOpportunityId, opportunityStatus);
        return NextResponse.json({ success: true, message: "Opportunity status updated" });

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Collaboration API POST failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Collaboration API POST failed" },
      { status: 500 }
    );
  }
}
