import { supabaseServer } from "@/lib/supabase/server";
import { NewsletterSubscriber } from "@/types/content";
import { handleDatabaseError } from "@/lib/errors";

export const newsletterRepository = {
  async subscribeNewsletter(email: string) {
    const { data, error } = await supabaseServer
      .from("newsletter_subscribers")
      .insert({ email })
      .select()
      .single();

    if (error) {
      console.error("Database error in subscribeNewsletter:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async getSubscribers() {
    const { data, error } = await supabaseServer
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });

    if (error) {
      console.error("Database error in getSubscribers:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async deleteSubscriber(id: string) {
    const { error } = await supabaseServer.from("newsletter_subscribers").delete().eq("id", id);
    if (error) {
      console.error("Database error in deleteSubscriber:", error);
      throw handleDatabaseError(error);
    }
    return true;
  }
};
