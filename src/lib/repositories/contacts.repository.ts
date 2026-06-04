import { supabaseServer } from "@/lib/supabase/server";
import { ContactMessage } from "@/types/content";
import { ContactFormInput } from "@/lib/validation/contact.schema";
import { handleDatabaseError } from "@/lib/errors";

export const contactsRepository = {
  async getContactMessages(filters?: { search?: string; isRead?: boolean }) {
    let query = supabaseServer
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.isRead !== undefined) {
      query = query.eq("is_read", filters.isRead);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error in getContactMessages:", error);
      throw handleDatabaseError(error);
    }
    return data ?? [];
  },

  async submitContactMessage(payload: ContactFormInput) {
    const { data, error } = await supabaseServer
      .from("contact_messages")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Database error in submitContactMessage:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async updateContactMessage(id: string, payload: Partial<ContactMessage>) {
    const { data, error } = await supabaseServer
      .from("contact_messages")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error in updateContactMessage:", error);
      throw handleDatabaseError(error);
    }
    return data;
  },

  async deleteContactMessage(id: string) {
    const { error } = await supabaseServer.from("contact_messages").delete().eq("id", id);
    if (error) {
      console.error("Database error in deleteContactMessage:", error);
      throw handleDatabaseError(error);
    }
    return true;
  }
};
