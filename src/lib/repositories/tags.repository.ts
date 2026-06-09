import { supabaseServer } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/errors";

export interface TagInput {
  project_id: string;
  tag: string;
}

export const tagsRepository = {
  async getTags(projectId: string) {
    const { data, error } = await supabaseServer
      .from("project_tags")
      .select("*")
      .eq("project_id", projectId)
      .order("tag", { ascending: true });

    if (error) {
      console.error("Database error in getTags:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async addTag(input: TagInput) {
    const { data, error } = await supabaseServer
      .from("project_tags")
      .insert({
        project_id: input.project_id,
        tag: input.tag,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error in addTag:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async removeTag(projectId: string, tag: string) {
    const { error } = await supabaseServer
      .from("project_tags")
      .delete()
      .eq("project_id", projectId)
      .eq("tag", tag);

    if (error) {
      console.error("Database error in removeTag:", error);
      throw handleDatabaseError(error);
    }
    return true;
  },

  async addTags(projectId: string, tags: string[]) {
    const tagsToInsert = tags.map(tag => ({
      project_id: projectId,
      tag,
    }));

    const { data, error } = await supabaseServer
      .from("project_tags")
      .insert(tagsToInsert)
      .select();

    if (error) {
      console.error("Database error in addTags:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async removeTags(projectId: string, tags: string[]) {
    const { error } = await supabaseServer
      .from("project_tags")
      .delete()
      .eq("project_id", projectId)
      .in("tag", tags);

    if (error) {
      console.error("Database error in removeTags:", error);
      throw handleDatabaseError(error);
    }
    return true;
  },

  async replaceTags(projectId: string, tags: string[]) {
    // Remove all existing tags
    await supabaseServer
      .from("project_tags")
      .delete()
      .eq("project_id", projectId);

    // Add new tags
    if (tags.length > 0) {
      const tagsToInsert = tags.map(tag => ({
        project_id: projectId,
        tag,
      }));

      const { data, error } = await supabaseServer
        .from("project_tags")
        .insert(tagsToInsert)
        .select();

      if (error) {
        console.error("Database error in replaceTags:", error);
        throw handleDatabaseError(error);
      }
      return data ?? [];
    }

    return [];
  }
};
