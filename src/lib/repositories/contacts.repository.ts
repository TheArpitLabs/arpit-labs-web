import { supabaseServer } from "@/lib/supabase/server";
import { ContactMessage } from "@/types/content";
import { ContactFormInput } from "@/lib/validation/contact.schema";
import { handleDatabaseError } from "@/lib/errors";

export const contactsRepository = {
  async submitContactMessage(payload: ContactFormInput) {
    const { data, error } = await supabaseServer
      .from("contact_messages")
      .insert(payload)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  }
};
