import { supabaseServer } from "@/lib/supabase/server";
import { LabNote } from "@/types/content";
import { LabNoteInput } from "@/lib/validation/labnote.schema";
import { handleDatabaseError } from "@/lib/errors";

export const labNotesRepository = {
  async getLabNotes() {
    const { data, error } = await supabaseServer
      .from("lab_notes")
      .select("*")
      .order("published", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw handleDatabaseError(error);
    return data ?? [];
  },

  async getLabNoteBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("lab_notes")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async createLabNote(payload: LabNoteInput) {
    const { data, error } = await supabaseServer
      .from("lab_notes")
      .insert(payload)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async updateLabNote(id: string, payload: Partial<LabNoteInput>) {
    const { data, error } = await supabaseServer
      .from("lab_notes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async deleteLabNote(id: string) {
    const { error } = await supabaseServer.from("lab_notes").delete().eq("id", id);
    if (error) throw handleDatabaseError(error);
    return true;
  }
};
