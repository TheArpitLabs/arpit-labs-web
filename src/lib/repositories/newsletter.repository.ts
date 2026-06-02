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

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async getSubscribers() {
    const { data, error } = await supabaseServer
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });

    if (error) throw handleDatabaseError(error);
    return data ?? [];
  }
};
