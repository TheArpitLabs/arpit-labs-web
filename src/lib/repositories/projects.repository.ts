import { supabaseServer } from "@/lib/supabase/server";
import { Project } from "@/types/content";
import { ProjectInput } from "@/lib/validation/project.schema";
import { handleDatabaseError } from "@/lib/errors";

export const projectsRepository = {
  async getProjects() {
    const { data, error } = await supabaseServer
      .from("projects")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw handleDatabaseError(error);
    return data ?? [];
  },

  async getProjectBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async createProject(payload: ProjectInput) {
    const { data, error } = await supabaseServer
      .from("projects")
      .insert(payload)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async updateProject(id: string, payload: Partial<ProjectInput>) {
    const { data, error } = await supabaseServer
      .from("projects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async deleteProject(id: string) {
    const { error } = await supabaseServer.from("projects").delete().eq("id", id);
    if (error) throw handleDatabaseError(error);
    return true;
  }
};
