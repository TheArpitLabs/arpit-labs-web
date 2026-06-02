import { supabaseServer } from "@/lib/supabase/server";
import { Experiment } from "@/types/content";
import { ExperimentInput } from "@/lib/validation/experiment.schema";
import { handleDatabaseError } from "@/lib/errors";

export const experimentsRepository = {
  async getExperiments() {
    const { data, error } = await supabaseServer
      .from("experiments")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw handleDatabaseError(error);
    return data ?? [];
  },

  async getExperimentBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("experiments")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async createExperiment(payload: ExperimentInput) {
    const { data, error } = await supabaseServer
      .from("experiments")
      .insert(payload)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async updateExperiment(id: string, payload: Partial<ExperimentInput>) {
    const { data, error } = await supabaseServer
      .from("experiments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async deleteExperiment(id: string) {
    const { error } = await supabaseServer.from("experiments").delete().eq("id", id);
    if (error) throw handleDatabaseError(error);
    return true;
  }
};
