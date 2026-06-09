import { supabaseServer } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/errors";

export interface MediaInput {
  project_id: string;
  media_type: 'image' | 'document' | 'video';
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  alt_text?: string;
  caption?: string;
  order_index?: number;
}

export const mediaRepository = {
  async getMedia(projectId: string, mediaType?: 'image' | 'document' | 'video') {
    let query = supabaseServer
      .from("project_media")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (mediaType) {
      query = query.eq("media_type", mediaType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error in getMedia:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async addMedia(input: MediaInput) {
    const { data, error } = await supabaseServer
      .from("project_media")
      .insert({
        project_id: input.project_id,
        media_type: input.media_type,
        file_url: input.file_url,
        file_name: input.file_name,
        file_size: input.file_size,
        mime_type: input.mime_type,
        alt_text: input.alt_text,
        caption: input.caption,
        order_index: input.order_index ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error in addMedia:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async removeMedia(mediaId: string) {
    const { error } = await supabaseServer
      .from("project_media")
      .delete()
      .eq("id", mediaId);

    if (error) {
      console.error("Database error in removeMedia:", error);
      throw handleDatabaseError(error);
    }
    return true;
  },

  async updateMedia(mediaId: string, updates: Partial<MediaInput>) {
    const { data, error } = await supabaseServer
      .from("project_media")
      .update(updates)
      .eq("id", mediaId)
      .select()
      .single();

    if (error) {
      console.error("Database error in updateMedia:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async reorderMedia(projectId: string, mediaItems: Array<{ id: string; order_index: number }>) {
    const updates = mediaItems.map(({ id, order_index }) =>
      supabaseServer
        .from("project_media")
        .update({ order_index })
        .eq("id", id)
    );

    const results = await Promise.all(updates);
    
    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error("Database error in reorderMedia:", result.error);
        throw handleDatabaseError(result.error);
      }
    }

    return true;
  }
};
