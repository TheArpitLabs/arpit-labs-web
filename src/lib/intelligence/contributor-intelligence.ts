import { supabaseServer } from "@/lib/supabase/server";
import { assertKnowledgeFeature } from "../knowledge-ecosystem/feature-flags";

export interface ContributorProfile {
  id: string;
  unifiedId: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks: {
    github?: string;
    gitlab?: string;
    linkedin?: string;
    twitter?: string;
  };
  scores: {
    contributor: number;
    expertise: number;
    contribution: number;
    research: number;
    overall: number;
  };
  stats: {
    totalProjects: number;
    totalStars: number;
    totalForks: number;
    totalCommits: number;
    totalPullRequests: number;
    totalIssues: number;
    totalResearchPapers: number;
    totalHackathonParticipations: number;
    totalMarketplaceContributions: number;
  };
  expertise: string[];
  domains: string[];
  technologies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContributorSource {
  source: "github" | "gitlab" | "research" | "hackathon" | "marketplace";
  sourceId: string;
  username: string;
  metadata: Record<string, any>;
  syncedAt: string;
}

/**
 * Contributor Intelligence Engine
* Creates unified contributor profiles and calculates scores
 */
export class ContributorIntelligenceEngine {
  /**
   * Merge contributor from GitHub
   */
  async mergeGitHubContributor(githubUsername: string): Promise<ContributorProfile> {
    assertKnowledgeFeature("contributorIntelligence");

    // Fetch GitHub contributor data
    const githubData = await this.fetchGitHubContributor(githubUsername);

    // Check if unified profile exists
    const existingProfile = await this.getUnifiedProfileByUsername(githubUsername);

    if (existingProfile) {
      // Update existing profile
      return await this.updateContributorProfile(existingProfile.id, githubData, "github");
    } else {
      // Create new unified profile
      return await this.createContributorProfile(githubData, "github");
    }
  }

  /**
   * Merge contributor from GitLab
   */
  async mergeGitLabContributor(gitlabUsername: string): Promise<ContributorProfile> {
    assertKnowledgeFeature("contributorIntelligence");

    const gitlabData = await this.fetchGitLabContributor(gitlabUsername);
    const existingProfile = await this.getUnifiedProfileByUsername(gitlabUsername);

    if (existingProfile) {
      return await this.updateContributorProfile(existingProfile.id, gitlabData, "gitlab");
    } else {
      return await this.createContributorProfile(gitlabData, "gitlab");
    }
  }

  /**
   * Merge contributor from Research
   */
  async mergeResearchContributor(researcherName: string): Promise<ContributorProfile> {
    assertKnowledgeFeature("contributorIntelligence");

    const researchData = await this.fetchResearchContributor(researcherName);
    const existingProfile = await this.getUnifiedProfileByUsername(researcherName);

    if (existingProfile) {
      return await this.updateContributorProfile(existingProfile.id, researchData, "research");
    } else {
      return await this.createContributorProfile(researchData, "research");
    }
  }

  /**
   * Merge contributor from Hackathon
   */
  async mergeHackathonContributor(participantName: string): Promise<ContributorProfile> {
    assertKnowledgeFeature("contributorIntelligence");

    const hackathonData = await this.fetchHackathonContributor(participantName);
    const existingProfile = await this.getUnifiedProfileByUsername(participantName);

    if (existingProfile) {
      return await this.updateContributorProfile(existingProfile.id, hackathonData, "hackathon");
    } else {
      return await this.createContributorProfile(hackathonData, "hackathon");
    }
  }

  /**
   * Merge contributor from Marketplace
   */
  async mergeMarketplaceContributor(contributorName: string): Promise<ContributorProfile> {
    assertKnowledgeFeature("contributorIntelligence");

    const marketplaceData = await this.fetchMarketplaceContributor(contributorName);
    const existingProfile = await this.getUnifiedProfileByUsername(contributorName);

    if (existingProfile) {
      return await this.updateContributorProfile(existingProfile.id, marketplaceData, "marketplace");
    } else {
      return await this.createContributorProfile(marketplaceData, "marketplace");
    }
  }

  /**
   * Calculate contributor scores
   */
  async calculateContributorScores(profileId: string): Promise<ContributorProfile["scores"]> {
    const profile = await this.getContributorProfile(profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const contributorScore = this.calculateContributorScore(profile.stats);
    const expertiseScore = this.calculateExpertiseScore(profile);
    const contributionScore = this.calculateContributionScore(profile.stats);
    const researchScore = this.calculateResearchScore(profile.stats);

    const overall = (contributorScore + expertiseScore + contributionScore + researchScore) / 4;

    const scores: ContributorProfile["scores"] = {
      contributor: contributorScore,
      expertise: expertiseScore,
      contribution: contributionScore,
      research: researchScore,
      overall,
    };

    // Update profile with new scores
    await supabaseServer
      .from("contributor_profiles")
      .update({
        contributor_score: contributorScore,
        expertise_score: expertiseScore,
        contribution_score: contributionScore,
        research_score: researchScore,
        overall_score: overall,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    return scores;
  }

  /**
   * Calculate contributor score based on activity
   */
  private calculateContributorScore(stats: ContributorProfile["stats"]): number {
    let score = 0;

    // Projects contribute
    score += Math.min(stats.totalProjects * 10, 100);

    // Stars contribute
    score += Math.min(stats.totalStars * 0.5, 50);

    // Forks contribute
    score += Math.min(stats.totalForks * 1, 50);

    // Commits contribute
    score += Math.min(stats.totalCommits * 0.1, 50);

    // Pull requests contribute
    score += Math.min(stats.totalPullRequests * 2, 50);

    // Issues contribute
    score += Math.min(stats.totalIssues * 1, 50);

    return Math.min(score, 100);
  }

  /**
   * Calculate expertise score based on domains and technologies
   */
  private calculateExpertiseScore(profile: ContributorProfile): number {
    let score = 0;

    // Number of domains
    score += Math.min(profile.domains.length * 10, 30);

    // Number of technologies
    score += Math.min(profile.technologies.length * 5, 30);

    // Expertise depth (based on projects per domain)
    const avgProjectsPerDomain = profile.domains.length > 0 
      ? profile.stats.totalProjects / profile.domains.length 
      : 0;
    score += Math.min(avgProjectsPerDomain * 5, 40);

    return Math.min(score, 100);
  }

  /**
   * Calculate contribution score based on contributions
   */
  private calculateContributionScore(stats: ContributorProfile["stats"]): number {
    let score = 0;

    // Marketplace contributions
    score += Math.min(stats.totalMarketplaceContributions * 10, 30);

    // Hackathon participations
    score += Math.min(stats.totalHackathonParticipations * 5, 30);

    // Pull requests
    score += Math.min(stats.totalPullRequests * 2, 20);

    // Issues
    score += Math.min(stats.totalIssues * 1, 20);

    return Math.min(score, 100);
  }

  /**
   * Calculate research score based on research activity
   */
  private calculateResearchScore(stats: ContributorProfile["stats"]): number {
    let score = 0;

    // Research papers
    score += Math.min(stats.totalResearchPapers * 20, 100);

    return Math.min(score, 100);
  }

  /**
   * Fetch GitHub contributor data
   */
  private async fetchGitHubContributor(username: string): Promise<Partial<ContributorProfile>> {
    // Fetch from contributors table
    const { data } = await supabaseServer
      .from("contributors")
      .select("*")
      .eq("username", username)
      .eq("provider", "github")
      .maybeSingle();

    if (!data) {
      throw new Error(`GitHub contributor ${username} not found`);
    }

    return {
      username: data.username,
      displayName: data.name || data.username,
      avatar: data.avatar_url,
      bio: data.bio,
      location: data.location,
      website: data.blog,
      socialLinks: {
        github: data.html_url,
      },
      stats: {
        totalProjects: data.public_repos || 0,
        totalStars: 0, // Would need to aggregate from projects
        totalForks: 0,
        totalCommits: 0,
        totalPullRequests: 0,
        totalIssues: 0,
        totalResearchPapers: 0,
        totalHackathonParticipations: 0,
        totalMarketplaceContributions: 0,
      },
      expertise: [],
      domains: [],
      technologies: [],
    };
  }

  /**
   * Fetch GitLab contributor data
   */
  private async fetchGitLabContributor(username: string): Promise<Partial<ContributorProfile>> {
    // Placeholder - would fetch from GitLab API
    return {
      username,
      displayName: username,
      socialLinks: {
        gitlab: `https://gitlab.com/${username}`,
      },
      stats: {
        totalProjects: 0,
        totalStars: 0,
        totalForks: 0,
        totalCommits: 0,
        totalPullRequests: 0,
        totalIssues: 0,
        totalResearchPapers: 0,
        totalHackathonParticipations: 0,
        totalMarketplaceContributions: 0,
      },
      expertise: [],
      domains: [],
      technologies: [],
    };
  }

  /**
   * Fetch Research contributor data
   */
  private async fetchResearchContributor(name: string): Promise<Partial<ContributorProfile>> {
    // Fetch from research table
    const { data } = await supabaseServer
      .from("research")
      .select("*")
      .ilike("authors", `%${name}%`)
      .maybeSingle();

    if (!data) {
      throw new Error(`Research contributor ${name} not found`);
    }

    return {
      username: name,
      displayName: name,
      bio: data.abstract,
      expertise: data.domains || [],
      domains: data.domains || [],
      technologies: [],
      stats: {
        totalProjects: 0,
        totalStars: 0,
        totalForks: 0,
        totalCommits: 0,
        totalPullRequests: 0,
        totalIssues: 0,
        totalResearchPapers: 1,
        totalHackathonParticipations: 0,
        totalMarketplaceContributions: 0,
      },
    };
  }

  /**
   * Fetch Hackathon contributor data
   */
  private async fetchHackathonContributor(name: string): Promise<Partial<ContributorProfile>> {
    // Placeholder - would fetch from hackathon data
    return {
      username: name,
      displayName: name,
      stats: {
        totalProjects: 0,
        totalStars: 0,
        totalForks: 0,
        totalCommits: 0,
        totalPullRequests: 0,
        totalIssues: 0,
        totalResearchPapers: 0,
        totalHackathonParticipations: 1,
        totalMarketplaceContributions: 0,
      },
      expertise: [],
      domains: [],
      technologies: [],
    };
  }

  /**
   * Fetch Marketplace contributor data
   */
  private async fetchMarketplaceContributor(name: string): Promise<Partial<ContributorProfile>> {
    // Placeholder - would fetch from marketplace data
    return {
      username: name,
      displayName: name,
      stats: {
        totalProjects: 0,
        totalStars: 0,
        totalForks: 0,
        totalCommits: 0,
        totalPullRequests: 0,
        totalIssues: 0,
        totalResearchPapers: 0,
        totalHackathonParticipations: 0,
        totalMarketplaceContributions: 1,
      },
      expertise: [],
      domains: [],
      technologies: [],
    };
  }

  /**
   * Create contributor profile
   */
  private async createContributorProfile(
    data: Partial<ContributorProfile>,
    source: string
  ): Promise<ContributorProfile> {
    const unifiedId = crypto.randomUUID();

    const { data: profile } = await supabaseServer
      .from("contributor_profiles")
      .insert({
        unified_id: unifiedId,
        username: data.username,
        display_name: data.displayName || data.username,
        avatar: data.avatar,
        bio: data.bio,
        location: data.location,
        website: data.website,
        social_links: data.socialLinks || {},
        expertise: data.expertise || [],
        domains: data.domains || [],
        technologies: data.technologies || [],
        stats: data.stats || {},
        contributor_score: 0,
        expertise_score: 0,
        contribution_score: 0,
        research_score: 0,
        overall_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!profile) {
      throw new Error("Failed to create contributor profile");
    }

    // Add source link
    await supabaseServer.from("contributor_sources").insert({
      contributor_id: profile.id,
      source: source,
      source_id: data.username,
      username: data.username,
      synced_at: new Date().toISOString(),
    });

    // Calculate initial scores
    await this.calculateContributorScores(profile.id);

    const createdProfile = await this.getContributorProfile(profile.id);
    if (!createdProfile) {
      throw new Error("Failed to retrieve created profile");
    }

    return createdProfile;
  }

  /**
   * Update contributor profile
   */
  private async updateContributorProfile(
    profileId: string,
    data: Partial<ContributorProfile>,
    source: string
  ): Promise<ContributorProfile> {
    // Update profile with new data
    await supabaseServer
      .from("contributor_profiles")
      .update({
        display_name: data.displayName || data.username,
        avatar: data.avatar,
        bio: data.bio,
        location: data.location,
        website: data.website,
        social_links: data.socialLinks || {},
        expertise: data.expertise || [],
        domains: data.domains || [],
        technologies: data.technologies || [],
        stats: data.stats || {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    // Check if source link exists
    const { data: existingSource } = await supabaseServer
      .from("contributor_sources")
      .select("*")
      .eq("contributor_id", profileId)
      .eq("source", source)
      .maybeSingle();

    if (!existingSource) {
      await supabaseServer.from("contributor_sources").insert({
        contributor_id: profileId,
        source: source,
        source_id: data.username,
        username: data.username,
        synced_at: new Date().toISOString(),
      });
    } else {
      await supabaseServer
        .from("contributor_sources")
        .update({
          synced_at: new Date().toISOString(),
        })
        .eq("id", existingSource.id);
    }

    // Recalculate scores
    await this.calculateContributorScores(profileId);

    const updatedProfile = await this.getContributorProfile(profileId);
    if (!updatedProfile) {
      throw new Error("Failed to retrieve updated profile");
    }

    return updatedProfile;
  }

  /**
   * Get contributor profile
   */
  async getContributorProfile(profileId: string): Promise<ContributorProfile | null> {
    const { data } = await supabaseServer
      .from("contributor_profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      unifiedId: data.unified_id,
      username: data.username,
      displayName: data.display_name,
      email: data.email,
      avatar: data.avatar,
      bio: data.bio,
      location: data.location,
      website: data.website,
      socialLinks: data.social_links || {},
      scores: {
        contributor: data.contributor_score,
        expertise: data.expertise_score,
        contribution: data.contribution_score,
        research: data.research_score,
        overall: data.overall_score,
      },
      stats: data.stats || {},
      expertise: data.expertise || [],
      domains: data.domains || [],
      technologies: data.technologies || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get unified profile by username
   */
  async getUnifiedProfileByUsername(username: string): Promise<ContributorProfile | null> {
    const { data } = await supabaseServer
      .from("contributor_profiles")
      .select("*")
      .ilike("username", username)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      unifiedId: data.unified_id,
      username: data.username,
      displayName: data.display_name,
      email: data.email,
      avatar: data.avatar,
      bio: data.bio,
      location: data.location,
      website: data.website,
      socialLinks: data.social_links || {},
      scores: {
        contributor: data.contributor_score,
        expertise: data.expertise_score,
        contribution: data.contribution_score,
        research: data.research_score,
        overall: data.overall_score,
      },
      stats: data.stats || {},
      expertise: data.expertise || [],
      domains: data.domains || [],
      technologies: data.technologies || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get all contributor profiles
   */
  async getAllContributorProfiles(limit: number = 100): Promise<ContributorProfile[]> {
    const { data } = await supabaseServer
      .from("contributor_profiles")
      .select("*")
      .order("overall_score", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      unifiedId: d.unified_id,
      username: d.username,
      displayName: d.display_name,
      email: d.email,
      avatar: d.avatar,
      bio: d.bio,
      location: d.location,
      website: d.website,
      socialLinks: d.social_links || {},
      scores: {
        contributor: d.contributor_score,
        expertise: d.expertise_score,
        contribution: d.contribution_score,
        research: d.research_score,
        overall: d.overall_score,
      },
      stats: d.stats || {},
      expertise: d.expertise || [],
      domains: d.domains || [],
      technologies: d.technologies || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Get top contributors by score
   */
  async getTopContributors(scoreType: "overall" | "contributor" | "expertise" | "contribution" | "research", limit: number = 10): Promise<ContributorProfile[]> {
    const { data } = await supabaseServer
      .from("contributor_profiles")
      .select("*")
      .order(`${scoreType}_score`, { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((d: any) => ({
      id: d.id,
      unifiedId: d.unified_id,
      username: d.username,
      displayName: d.display_name,
      email: d.email,
      avatar: d.avatar,
      bio: d.bio,
      location: d.location,
      website: d.website,
      socialLinks: d.social_links || {},
      scores: {
        contributor: d.contributor_score,
        expertise: d.expertise_score,
        contribution: d.contribution_score,
        research: d.research_score,
        overall: d.overall_score,
      },
      stats: d.stats || {},
      expertise: d.expertise || [],
      domains: d.domains || [],
      technologies: d.technologies || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  /**
   * Get contributor sources
   */
  async getContributorSources(profileId: string): Promise<ContributorSource[]> {
    const { data } = await supabaseServer
      .from("contributor_sources")
      .select("*")
      .eq("contributor_id", profileId);

    if (!data) return [];

    return data.map((d: any) => ({
      source: d.source,
      sourceId: d.source_id,
      username: d.username,
      metadata: d.metadata || {},
      syncedAt: d.synced_at,
    }));
  }
}

// Singleton instance
export const contributorIntelligenceEngine = new ContributorIntelligenceEngine();
