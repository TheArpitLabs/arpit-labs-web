import { supabaseServer } from "@/lib/supabase/server";
import { NewsletterSubscriber } from "@/types/content";
import { handleDatabaseError } from "@/lib/errors";
import { logger } from '@/lib/logger';

export const newsletterRepository = {
  async subscribeNewsletter(email: string) {
    const { data, error } = await supabaseServer
      .from("newsletter_subscribers")
      .insert({ email })
      .select()
      .single();

    if (error) {
      logger.error("Database error in subscribeNewsletter:", error);
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
      logger.error("Database error in getSubscribers:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async deleteSubscriber(id: string) {
    const { error } = await supabaseServer.from("newsletter_subscribers").delete().eq("id", id);
    if (error) {
      logger.error("Database error in deleteSubscriber:", error);
      throw handleDatabaseError(error);
    }
    return true;
  }
};
