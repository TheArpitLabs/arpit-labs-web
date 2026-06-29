import { supabaseServer } from "@/lib/supabase/server";
import { Hackathon, HackathonSubmission, HackathonTeam, HackathonTeamMember } from "@/types/content";
import { HackathonInput, HackathonTeamInput, HackathonSubmissionInput } from "@/lib/validation/hackathon.schema";
import { handleDatabaseError } from "@/lib/errors";
import { logger } from '@/lib/logger';

export const hackathonsRepository = {
  async getHackathons() {
    const { data, error } = await supabaseServer
      .from("hackathons")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) {
      logger.error("Database error in getHackathons:", error);
      throw handleDatabaseError(error);
    }

    return (data ?? []) as Hackathon[];
  },

  async getHackathonBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("hackathons")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (error) {
      logger.error("Database error in getHackathonBySlug:", error);
      throw handleDatabaseError(error);
    }

    return data as Hackathon | null;
  },

  async getHackathonTeams(hackathonId: string) {
    const { data, error } = await supabaseServer
      .from("hackathon_teams")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Database error in getHackathonTeams:", error);
      throw handleDatabaseError(error);
    }

    return (data ?? []) as HackathonTeam[];
  },

  async getHackathonTeamMembers(teamId: string) {
    const { data, error } = await supabaseServer
      .from("hackathon_team_members")
      .select("*")
      .eq("team_id", teamId)
      .order("id", { ascending: true });

    if (error) {
      logger.error("Database error in getHackathonTeamMembers:", error);
      throw handleDatabaseError(error);
    }

    return (data ?? []) as HackathonTeamMember[];
  },

  async getHackathonSubmissions(hackathonId: string) {
    const { data, error } = await supabaseServer
      .from("hackathon_submissions")
      .select("*")
      .eq("hackathon_id", hackathonId)
      .order("submitted_at", { ascending: false });

    if (error) {
      logger.error("Database error in getHackathonSubmissions:", error);
      throw handleDatabaseError(error);
    }

    return (data ?? []) as HackathonSubmission[];
  },

  async getLeaderboard(hackathonId?: string) {
    let query = supabaseServer.from("hackathon_submissions").select("*").order("score", { ascending: false }).order("submitted_at", { ascending: true });

    if (hackathonId) {
      query = query.eq("hackathon_id", hackathonId);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      logger.error("Database error in getLeaderboard:", error);
      throw handleDatabaseError(error);
    }

    return (data ?? []) as HackathonSubmission[];
  },

  async createHackathon(payload: HackathonInput) {
    const { data, error } = await supabaseServer.from("hackathons").insert(payload).select().single();
    if (error) {
      logger.error("Database error in createHackathon:", error);
      throw handleDatabaseError(error);
    }
    return data as Hackathon;
  },

  async updateHackathon(id: string, payload: Partial<HackathonInput>) {
    const { data, error } = await supabaseServer
      .from("hackathons")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Database error in updateHackathon:", error);
      throw handleDatabaseError(error);
    }
    return data as Hackathon;
  },

  async deleteHackathon(id: string) {
    const { error } = await supabaseServer.from("hackathons").delete().eq("id", id);
    if (error) {
      logger.error("Database error in deleteHackathon:", error);
      throw handleDatabaseError(error);
    }
    return true;
  },

  async createHackathonTeam(payload: HackathonTeamInput) {
    const { data, error } = await supabaseServer.from("hackathon_teams").insert(payload).select().single();
    if (error) {
      logger.error("Database error in createHackathonTeam:", error);
      throw handleDatabaseError(error);
    }
    return data as HackathonTeam;
  },

  async addTeamMember(teamId: string, userId: string) {
    const { data, error } = await supabaseServer
      .from("hackathon_team_members")
      .insert({ team_id: teamId, user_id: userId })
      .select()
      .single();

    if (error) {
      logger.error("Database error in addTeamMember:", error);
      throw handleDatabaseError(error);
    }
    return data as HackathonTeamMember;
  },

  async removeTeamMember(teamId: string, userId: string) {
    const { error } = await supabaseServer
      .from("hackathon_team_members")
      .delete()
      .match({ team_id: teamId, user_id: userId });

    if (error) {
      logger.error("Database error in removeTeamMember:", error);
      throw handleDatabaseError(error);
    }
    return true;
  },

  async createHackathonSubmission(payload: HackathonSubmissionInput) {
    const { data, error } = await supabaseServer
      .from("hackathon_submissions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error("Database error in createHackathonSubmission:", error);
      throw handleDatabaseError(error);
    }
    return data as HackathonSubmission;
  },

  async updateSubmissionScore(id: string, score: number) {
    const { data, error } = await supabaseServer
      .from("hackathon_submissions")
      .update({ score })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Database error in updateSubmissionScore:", error);
      throw handleDatabaseError(error);
    }
    return data as HackathonSubmission;
  },
};
