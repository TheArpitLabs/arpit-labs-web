import { supabaseServer } from "@/lib/supabase/server";
import { LabNote } from "@/types/content";
import { LabNoteInput } from "@/lib/validation/labnote.schema";
import { handleDatabaseError } from "@/lib/errors";

export const labNotesRepository = {
  async getLabNotes(filters?: { published?: boolean; search?: string; category?: string }) {
    let query = supabaseServer
      .from("lab_notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.published !== undefined) {
      query = query.eq("published", filters.published);
    }
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error in getLabNotes:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async getLabNoteBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("lab_notes")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (error) {
      console.error("Database error in getLabNoteBySlug:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async createLabNote(payload: LabNoteInput) {
    const { data, error } = await supabaseServer
      .from("lab_notes")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Database error in createLabNote:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async updateLabNote(id: string, payload: Partial<LabNoteInput>) {
    const { data, error } = await supabaseServer
      .from("lab_notes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error in updateLabNote:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async deleteLabNote(id: string) {
    const { error } = await supabaseServer.from("lab_notes").delete().eq("id", id);
    if (error) {
      console.error("Database error in deleteLabNote:", error);
      throw handleDatabaseError(error);
    }
    return true;
  }
};
