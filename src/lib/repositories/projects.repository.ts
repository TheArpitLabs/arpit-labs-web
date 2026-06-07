import { supabaseServer } from "@/lib/supabase/server";
import { Project } from "@/types/content";
import { ProjectInput } from "@/lib/validation/project.schema";
import { handleDatabaseError } from "@/lib/errors";

export const projectsRepository = {
  async getProjects(filters?: { status?: 'draft' | 'published' | 'archived'; featured?: boolean; search?: string; category?: string; owner_id?: string }) {
    let query = supabaseServer
      .from("projects")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters?.status !== undefined) {
      query = query.eq("status", filters.status);
    }
    if (filters?.featured !== undefined) {
      query = query.eq("featured", filters.featured);
    }
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.owner_id) {
      query = query.eq("owner_id", filters.owner_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error in getProjects:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async getProjectBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (error) {
      console.error("Database error in getProjectBySlug:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async createProject(payload: ProjectInput) {
    const { data, error } = await supabaseServer
      .from("projects")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Database error in createProject:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async updateProject(id: string, payload: Partial<ProjectInput>) {
    const { data, error } = await supabaseServer
      .from("projects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error in updateProject:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async deleteProject(id: string) {
    const { error } = await supabaseServer.from("projects").delete().eq("id", id);
    if (error) {
      console.error("Database error in deleteProject:", error);
      throw handleDatabaseError(error);
    }
    return true;
  }
};
