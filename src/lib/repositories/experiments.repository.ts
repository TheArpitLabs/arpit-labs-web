import { supabaseServer } from "@/lib/supabase/server";
import { Experiment } from "@/types/content";
import { ExperimentInput } from "@/lib/validation/experiment.schema";
import { handleDatabaseError } from "@/lib/errors";

export const experimentsRepository = {
  async getExperiments(filters?: { published?: boolean; status?: string; search?: string }) {
    let query = supabaseServer
      .from("experiments")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.published !== undefined) {
      query = query.eq("published", filters.published);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error in getExperiments:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async getExperimentBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("experiments")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (error) {
      console.error("Database error in getExperimentBySlug:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async createExperiment(payload: ExperimentInput) {
    const { data, error } = await supabaseServer
      .from("experiments")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Database error in createExperiment:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async updateExperiment(id: string, payload: Partial<ExperimentInput>) {
    const { data, error } = await supabaseServer
      .from("experiments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error in updateExperiment:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async deleteExperiment(id: string) {
    const { error } = await supabaseServer.from("experiments").delete().eq("id", id);
    if (error) {
      console.error("Database error in deleteExperiment:", error);
      throw handleDatabaseError(error);
    }
    return true;
  }
};
