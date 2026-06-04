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
      .order("year", { ascending: false });

    if (error) {
      console.error("Database error in getJourneyTimeline:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async createJourneyEntry(payload: JourneyInput) {
    const { data, error } = await supabaseServer
      .from("journey")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Database error in createJourneyEntry:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async updateJourneyEntry(id: string, payload: Partial<JourneyInput>) {
    const { data, error } = await supabaseServer
      .from("journey")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error in updateJourneyEntry:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async deleteJourneyEntry(id: string) {
    const { error } = await supabaseServer.from("journey").delete().eq("id", id);
    if (error) {
      console.error("Database error in deleteJourneyEntry:", error);
      throw handleDatabaseError(error);
    }
    return true;
  },

  async updateOrder(items: { id: string; display_order: number }[]) {
    // Supabase doesn't support bulk update with different values easily in one call without a function
    // We'll use a loop for now or a single rpc if we had one.
    // For production CMS, we'll do it sequentially or use Promise.all
    const promises = items.map(item => 
      supabaseServer
        .from("journey")
        .update({ display_order: item.display_order })
        .eq("id", item.id)
    );
    
    const results = await Promise.all(promises);
    const firstError = results.find(r => r.error);
    if (firstError) {
      throw handleDatabaseError(firstError.error);
    }
    return true;
  }
};
