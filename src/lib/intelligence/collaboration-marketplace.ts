import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "../knowledge-ecosystem/feature-flags";

interface DatabaseOpportunityRecord {
  id: string;
  type: string;
  title: string;
  description: string;
  creator_id: string;
  creator_name: string;
  requirements: Record<string, unknown>;
  project_idea?: string;
  team_size?: number;
  roles?: string[];
  timeline?: string;
  expertise?: string[];
  mentorship_type?: string;
  duration?: string;
  commitment?: string;
  research_area?: string;
  paper_title?: string;
  collaboration_type?: string;
  institution?: string;
  startup_stage?: string;
  equity?: string;
  compensation?: string;
  hackathon_name?: string;
  hackathon_date?: string;
  team_role?: string;
  skills_needed?: string[];
  status: string;
  match_score: number;
  applicants: string[];
  created_at: string;
  updated_at: string;
}

interface DatabaseApplicationRecord {
  id: string;
  opportunity_id: string;
  applicant_id: string;
  applicant_name: string;
  message: string;
  status: string;
  created_at: string;
}

interface Application {
  id: string;
  opportunityId: string;
  applicantId: string;
  applicantName: string;
  message: string;
  status: string;
  createdAt: string;
}

interface TypeSpecificFields {
  projectIdea?: string;
  teamSize?: number;
  roles?: string[];
  timeline?: string;
  expertise?: string[];
  mentorshipType?: string;
  duration?: string;
  commitment?: string;
  researchArea?: string;
  paperTitle?: string;
  collaborationType?: string;
  institution?: string;
  startupStage?: string;
  equity?: string;
  compensation?: string;
  hackathonName?: string;
  hackathonDate?: string;
  teamRole?: string;
  skillsNeeded?: string[];
}

export interface CollaborationOpportunity {
  id: string;
  type: "team_formation" | "mentor_discovery" | "research_collaboration" | "startup_collaboration" | "hackathon_collaboration";
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  requirements: {
    skills: string[];
    experience: string;
    availability: string;
    location?: string;
  };
  status: "open" | "in_progress" | "completed" | "cancelled";
  matchScore: number;
  applicants: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamFormationRequest extends CollaborationOpportunity {
  type: "team_formation";
  projectIdea: string;
  teamSize: number;
  roles: string[];
  timeline: string;
}

export interface MentorOpportunity extends CollaborationOpportunity {
  type: "mentor_discovery";
  expertise: string[];
  mentorshipType: "career" | "technical" | "research" | "startup";
  duration: string;
  commitment: string;
}

export interface ResearchCollaboration extends CollaborationOpportunity {
  type: "research_collaboration";
  researchArea: string;
  paperTitle?: string;
  collaborationType: "co_authorship" | "data_sharing" | "peer_review" | "joint_research";
  institution?: string;
}

export interface StartupCollaboration extends CollaborationOpportunity {
  type: "startup_collaboration";
  startupStage: "idea" | "mvp" | "growth" | "scaling";
  collaborationType: "co_founder" | "advisory" | "investment" | "partnership";
  equity?: string;
  compensation?: string;
}

export interface HackathonCollaboration extends CollaborationOpportunity {
  type: "hackathon_collaboration";
  hackathonName: string;
  hackathonDate: string;
  teamRole: string;
  skillsNeeded: string[];
}

/**
 * Collaboration Marketplace Engine
* Manages team formation, mentor discovery, and collaboration opportunities
*/
export class CollaborationMarketplaceEngine {
  /**
   * Create team formation request
   */
  async createTeamFormationRequest(
    creatorId: string,
    creatorName: string,
    data: Omit<TeamFormationRequest, "id" | "type" | "creatorId" | "creatorName" | "status" | "matchScore" | "applicants" | "createdAt" | "updatedAt">
  ): Promise<TeamFormationRequest> {
    assertKnowledgeFeature("collaborationMarketplace");

    const { data: opportunity } = await supabaseServer
      .from("collaboration_opportunities")
      .insert({
        type: "team_formation",
        title: data.title,
        description: data.description,
        creator_id: creatorId,
        creator_name: creatorName,
        requirements: data.requirements,
        project_idea: data.projectIdea,
        team_size: data.teamSize,
        roles: data.roles,
        timeline: data.timeline,
        status: "open",
        match_score: 0,
        applicants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!opportunity) {
      throw new Error("Failed to create team formation request");
    }

    const result = await this.getOpportunity(opportunity.id);
    if (!result) {
      throw new Error("Failed to retrieve created opportunity");
    }

    return result as TeamFormationRequest;
  }

  /**
   * Create mentor opportunity
   */
  async createMentorOpportunity(
    creatorId: string,
    creatorName: string,
    data: Omit<MentorOpportunity, "id" | "type" | "creatorId" | "creatorName" | "status" | "matchScore" | "applicants" | "createdAt" | "updatedAt">
  ): Promise<MentorOpportunity> {
    assertKnowledgeFeature("collaborationMarketplace");

    const { data: opportunity } = await supabaseServer
      .from("collaboration_opportunities")
      .insert({
        type: "mentor_discovery",
        title: data.title,
        description: data.description,
        creator_id: creatorId,
        creator_name: creatorName,
        requirements: data.requirements,
        expertise: data.expertise,
        mentorship_type: data.mentorshipType,
        duration: data.duration,
        commitment: data.commitment,
        status: "open",
        match_score: 0,
        applicants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!opportunity) {
      throw new Error("Failed to create mentor opportunity");
    }

    const result = await this.getOpportunity(opportunity.id);
    if (!result) {
      throw new Error("Failed to retrieve created opportunity");
    }

    return result as MentorOpportunity;
  }

  /**
   * Create research collaboration
   */
  async createResearchCollaboration(
    creatorId: string,
    creatorName: string,
    data: Omit<ResearchCollaboration, "id" | "type" | "creatorId" | "creatorName" | "status" | "matchScore" | "applicants" | "createdAt" | "updatedAt">
  ): Promise<ResearchCollaboration> {
    assertKnowledgeFeature("collaborationMarketplace");

    const { data: opportunity } = await supabaseServer
      .from("collaboration_opportunities")
      .insert({
        type: "research_collaboration",
        title: data.title,
        description: data.description,
        creator_id: creatorId,
        creator_name: creatorName,
        requirements: data.requirements,
        research_area: data.researchArea,
        paper_title: data.paperTitle,
        collaboration_type: data.collaborationType,
        institution: data.institution,
        status: "open",
        match_score: 0,
        applicants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!opportunity) {
      throw new Error("Failed to create research collaboration");
    }

    const result = await this.getOpportunity(opportunity.id);
    if (!result) {
      throw new Error("Failed to retrieve created opportunity");
    }

    return result as ResearchCollaboration;
  }

  /**
   * Create startup collaboration
   */
  async createStartupCollaboration(
    creatorId: string,
    creatorName: string,
    data: Omit<StartupCollaboration, "id" | "type" | "creatorId" | "creatorName" | "status" | "matchScore" | "applicants" | "createdAt" | "updatedAt">
  ): Promise<StartupCollaboration> {
    assertKnowledgeFeature("collaborationMarketplace");

    const { data: opportunity } = await supabaseServer
      .from("collaboration_opportunities")
      .insert({
        type: "startup_collaboration",
        title: data.title,
        description: data.description,
        creator_id: creatorId,
        creator_name: creatorName,
        requirements: data.requirements,
        startup_stage: data.startupStage,
        collaboration_type: data.collaborationType,
        equity: data.equity,
        compensation: data.compensation,
        status: "open",
        match_score: 0,
        applicants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!opportunity) {
      throw new Error("Failed to create startup collaboration");
    }

    const result = await this.getOpportunity(opportunity.id);
    if (!result) {
      throw new Error("Failed to retrieve created opportunity");
    }

    return result as StartupCollaboration;
  }

  /**
   * Create hackathon collaboration
   */
  async createHackathonCollaboration(
    creatorId: string,
    creatorName: string,
    data: Omit<HackathonCollaboration, "id" | "type" | "creatorId" | "creatorName" | "status" | "matchScore" | "applicants" | "createdAt" | "updatedAt">
  ): Promise<HackathonCollaboration> {
    assertKnowledgeFeature("collaborationMarketplace");

    const { data: opportunity } = await supabaseServer
      .from("collaboration_opportunities")
      .insert({
        type: "hackathon_collaboration",
        title: data.title,
        description: data.description,
        creator_id: creatorId,
        creator_name: creatorName,
        requirements: data.requirements,
        hackathon_name: data.hackathonName,
        hackathon_date: data.hackathonDate,
        team_role: data.teamRole,
        skills_needed: data.skillsNeeded,
        status: "open",
        match_score: 0,
        applicants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!opportunity) {
      throw new Error("Failed to create hackathon collaboration");
    }

    const result = await this.getOpportunity(opportunity.id);
    if (!result) {
      throw new Error("Failed to retrieve created opportunity");
    }

    return result as HackathonCollaboration;
  }

  /**
   * Get opportunity by ID
   */
  async getOpportunity(opportunityId: string): Promise<CollaborationOpportunity | null> {
    const { data } = await supabaseServer
      .from("collaboration_opportunities")
      .select("*")
      .eq("id", opportunityId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      creatorId: data.creator_id,
      creatorName: data.creator_name,
      requirements: data.requirements || {},
      status: data.status,
      matchScore: data.match_score || 0,
      applicants: data.applicants || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      ...this.getTypeSpecificFields(data),
    };
  }

  /**
   * Get type-specific fields
   */
  private getTypeSpecificFields(data: DatabaseOpportunityRecord): TypeSpecificFields {
    switch (data.type) {
      case "team_formation":
        return {
          projectIdea: data.project_idea,
          teamSize: data.team_size,
          roles: data.roles,
          timeline: data.timeline,
        };
      case "mentor_discovery":
        return {
          expertise: data.expertise,
          mentorshipType: data.mentorship_type,
          duration: data.duration,
          commitment: data.commitment,
        };
      case "research_collaboration":
        return {
          researchArea: data.research_area,
          paperTitle: data.paper_title,
          collaborationType: data.collaboration_type,
          institution: data.institution,
        };
      case "startup_collaboration":
        return {
          startupStage: data.startup_stage,
          collaborationType: data.collaboration_type,
          equity: data.equity,
          compensation: data.compensation,
        };
      case "hackathon_collaboration":
        return {
          hackathonName: data.hackathon_name,
          hackathonDate: data.hackathon_date,
          teamRole: data.team_role,
          skillsNeeded: data.skills_needed,
        };
      default:
        return {};
    }
  }

  /**
   * Get all opportunities
   */
  async getAllOpportunities(type?: string, status?: string, limit: number = 50): Promise<CollaborationOpportunity[]> {
    let query = supabaseServer
      .from("collaboration_opportunities")
      .select("*")
      .order("match_score", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data } = await query.limit(limit);

    if (!data) return [];

    return data.map((d: DatabaseOpportunityRecord): CollaborationOpportunity => ({
      id: d.id,
      type: d.type as CollaborationOpportunity['type'],
      title: d.title,
      description: d.description,
      creatorId: d.creator_id,
      creatorName: d.creator_name,
      requirements: d.requirements as { skills: string[]; experience: string; availability: string; location?: string },
      status: d.status as CollaborationOpportunity['status'],
      matchScore: d.match_score || 0,
      applicants: d.applicants || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      ...this.getTypeSpecificFields(d),
    }));
  }

  /**
   * Apply for opportunity
   */
  async applyForOpportunity(opportunityId: string, applicantId: string, applicantName: string, message: string): Promise<void> {
    const opportunity = await this.getOpportunity(opportunityId);
    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    const applicants = [...opportunity.applicants, applicantId];

    await supabaseServer
      .from("collaboration_opportunities")
      .update({
        applicants,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunityId);

    // Create application record
    await supabaseServer.from("collaboration_applications").insert({
      opportunity_id: opportunityId,
      applicant_id: applicantId,
      applicant_name: applicantName,
      message,
      status: "pending",
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Get applications for opportunity
   */
  async getOpportunityApplications(opportunityId: string): Promise<Application[]> {
    const { data } = await supabaseServer
      .from("collaboration_applications")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false });

    if (!data) return [];

    return data.map((d: DatabaseApplicationRecord): Application => ({
      id: d.id,
      opportunityId: d.opportunity_id,
      applicantId: d.applicant_id,
      applicantName: d.applicant_name,
      message: d.message,
      status: d.status,
      createdAt: d.created_at,
    }));
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(applicationId: string, status: "pending" | "accepted" | "rejected"): Promise<void> {
    await supabaseServer
      .from("collaboration_applications")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);
  }

  /**
   * Match opportunities with contributors
   */
  async matchOpportunities(contributorSkills: string[], contributorDomains: string[]): Promise<CollaborationOpportunity[]> {
    const opportunities = await this.getAllOpportunities(undefined, "open", 50);

    const matched = opportunities.map((opportunity) => {
      const requiredSkills = opportunity.requirements.skills || [];
      const skillMatch = requiredSkills.filter((skill) => contributorSkills.includes(skill)).length;
      const skillScore = requiredSkills.length > 0 ? skillMatch / requiredSkills.length : 0;

      const requiredDomains = contributorDomains;
      const domainMatch = requiredDomains.filter((domain) => contributorDomains.includes(domain)).length;
      const domainScore = requiredDomains.length > 0 ? domainMatch / requiredDomains.length : 0;

      const matchScore = (skillScore * 0.7) + (domainScore * 0.3);

      return {
        ...opportunity,
        matchScore,
      };
    });

    matched.sort((a, b) => b.matchScore - a.matchScore);

    return matched.slice(0, 20);
  }

  /**
   * Update opportunity status
   */
  async updateOpportunityStatus(opportunityId: string, status: "open" | "in_progress" | "completed" | "cancelled"): Promise<void> {
    await supabaseServer
      .from("collaboration_opportunities")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunityId);
  }

  /**
   * Get opportunities by creator
   */
  async getOpportunitiesByCreator(creatorId: string): Promise<CollaborationOpportunity[]> {
    const { data } = await supabaseServer
      .from("collaboration_opportunities")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (!data) return [];

    return data.map((d: DatabaseOpportunityRecord): CollaborationOpportunity => ({
      id: d.id,
      type: d.type as CollaborationOpportunity['type'],
      title: d.title,
      description: d.description,
      creatorId: d.creator_id,
      creatorName: d.creator_name,
      requirements: d.requirements as { skills: string[]; experience: string; availability: string; location?: string },
      status: d.status as CollaborationOpportunity['status'],
      matchScore: d.match_score || 0,
      applicants: d.applicants || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      ...this.getTypeSpecificFields(d),
    }));
  }

  /**
   * Get opportunities by applicant
   */
  async getOpportunitiesByApplicant(applicantId: string): Promise<CollaborationOpportunity[]> {
    const { data } = await supabaseServer
      .from("collaboration_applications")
      .select("opportunity_id")
      .eq("applicant_id", applicantId);

    if (!data) return [];

    const opportunityIds = data.map((d: { opportunity_id: string }) => d.opportunity_id);

    const opportunities: CollaborationOpportunity[] = [];
    for (const id of opportunityIds) {
      const opportunity = await this.getOpportunity(id);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }

    return opportunities;
  }
}

// Singleton instance
export const collaborationMarketplaceEngine = new CollaborationMarketplaceEngine();
