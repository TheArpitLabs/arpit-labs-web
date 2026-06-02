import { supabaseServer } from "@/lib/supabase/server";
import { JourneyItem } from "@/types/content";
import { JourneyInput } from "@/lib/validation/journey.schema";
import { handleDatabaseError } from "@/lib/errors";

export const journeyRepository = {
  async getJourneyTimeline() {
    const { data, error } = await supabaseServer
      .from("journey")
      .select("*")
      .order("display_order", { ascending: true })
      .order("year", { ascending: true });

    if (error) throw handleDatabaseError(error);
    return data ?? [];
  },

  async createJourneyEntry(payload: JourneyInput) {
    const { data, error } = await supabaseServer
      .from("journey")
      .insert(payload)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async updateJourneyEntry(id: string, payload: Partial<JourneyInput>) {
    const { data, error } = await supabaseServer
      .from("journey")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async deleteJourneyEntry(id: string) {
    const { error } = await supabaseServer.from("journey").delete().eq("id", id);
    if (error) throw handleDatabaseError(error);
    return true;
  }
};
