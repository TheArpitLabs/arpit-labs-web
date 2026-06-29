import { supabaseServer } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/errors";
import { logger } from '@/lib/logger';

export interface ContributorInput {
  project_id: string;
  user_id: string;
  role?: 'owner' | 'maintainer' | 'contributor' | 'collaborator';
  contribution_type?: string[];
}

export const contributorsRepository = {
  async getContributors(projectId: string) {
    const { data, error } = await supabaseServer
      .from("project_contributors")
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq("project_id", projectId)
      .order("joined_at", { ascending: false });

    if (error) {
      logger.error("Database error in getContributors:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async addContributor(input: ContributorInput) {
    const { data, error } = await supabaseServer
      .from("project_contributors")
      .insert({
        project_id: input.project_id,
        user_id: input.user_id,
        role: input.role || 'contributor',
        contribution_type: input.contribution_type || [],
      })
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      logger.error("Database error in addContributor:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async removeContributor(projectId: string, userId: string) {
    const { error } = await supabaseServer
      .from("project_contributors")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);

    if (error) {
      logger.error("Database error in removeContributor:", error);
      throw handleDatabaseError(error);
    }
    return true;
  },

  async updateContributorRole(projectId: string, userId: string, role: 'owner' | 'maintainer' | 'contributor' | 'collaborator') {
    const { data, error } = await supabaseServer
      .from("project_contributors")
      .update({ role })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      logger.error("Database error in updateContributorRole:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async isContributor(projectId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabaseServer
      .from("project_contributors")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (error) {
      // If error is "PGRST116" (not found), return false
      if (error.code === 'PGRST116') {
        return false;
      }
      logger.error("Database error in isContributor:", error);
      throw handleDatabaseError(error);
    }
    return !!data;
  }
};
