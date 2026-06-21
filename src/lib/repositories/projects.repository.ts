import { supabaseServer } from "@/lib/supabase/server";
import { Project } from "@/types/content";
import { ProjectInput } from "@/lib/validation/project.schema";
import { handleDatabaseError } from "@/lib/errors";

export const projectsRepository = {
  async getProjects(filters?: { 
    status?: 'draft' | 'published' | 'archived'; 
    featured?: boolean; 
    search?: string; 
    category?: string; 
    branch?: string;
    project_type?: string;
    owner_id?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 24;
    const offset = (page - 1) * limit;

    // Get count first
    let countQuery = supabaseServer
      .from("projects")
      .select("*", { count: 'exact', head: true });

    if (filters?.status !== undefined) {
      countQuery = countQuery.eq("status", filters.status);
    }
    if (filters?.featured !== undefined) {
      countQuery = countQuery.eq("featured", filters.featured);
    }
    if (filters?.category) {
      countQuery = countQuery.eq("category", filters.category);
    }
    if (filters?.branch) {
      countQuery = countQuery.eq("branch", filters.branch);
    }
    if (filters?.project_type) {
      countQuery = countQuery.eq("project_type", filters.project_type);
    }
    if (filters?.search) {
      countQuery = countQuery.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.owner_id) {
      countQuery = countQuery.eq("owner_id", filters.owner_id);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Database error in getProjects count:", countError);
      throw handleDatabaseError(countError);
    }

    // Get data with pagination
    let query = supabaseServer
      .from("projects")
      .select("*")
      .range(offset, offset + limit - 1);

    switch (filters?.sort) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "views":
        query = query.order("views_count", { ascending: false, nullsFirst: false });
        break;
      case "likes":
        query = query.order("likes_count", { ascending: false, nullsFirst: false });
        break;
      default:
        query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
        break;
    }

    if (filters?.status !== undefined) {
      query = query.eq("status", filters.status);
    }
    if (filters?.featured !== undefined) {
      query = query.eq("featured", filters.featured);
    }
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.branch) {
      query = query.eq("branch", filters.branch);
    }
    if (filters?.project_type) {
      query = query.eq("project_type", filters.project_type);
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

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return {
      data: data ?? [],
      meta: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages,
        hasMore: page < totalPages
      }
    };
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
