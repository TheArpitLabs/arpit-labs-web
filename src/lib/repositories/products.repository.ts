import { supabaseServer } from "@/lib/supabase/server";
import { Product } from "@/types/content";
import { ProductInput } from "@/lib/validation/product.schema";
import { handleDatabaseError } from "@/lib/errors";

export const productsRepository = {
  async getProducts(filters?: { published?: boolean; featured?: boolean; search?: string; category?: string }) {
    let query = supabaseServer
      .from("products")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters?.published !== undefined) {
      query = query.eq("published", filters.published);
    }

    if (filters?.featured !== undefined) {
      query = query.eq("featured", filters.featured);
    }

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error in getProducts:", error);
      throw handleDatabaseError(error);
    }

    return data ?? [];
  },

  async getProductById(id: string) {
    const { data, error } = await supabaseServer
      .from("products")
      .select("*")
      .eq("id", id)
      .limit(1)
      .single();

    if (error) {
      console.error("Database error in getProductById:", error);
      throw handleDatabaseError(error);
    }

    return data;
  },

  async getProductBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("products")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .single();

    if (error) {
      console.error("Database error in getProductBySlug:", error);
      throw handleDatabaseError(error);
    }

    return data;
  },

  async createProduct(payload: ProductInput) {
    const { data, error } = await supabaseServer
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Database error in createProduct:", error);
      throw handleDatabaseError(error);
    }

    return data;
  },

  async updateProduct(id: string, payload: Partial<ProductInput>) {
    const { data, error } = await supabaseServer
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error in updateProduct:", error);
      throw handleDatabaseError(error);
    }

    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabaseServer.from("products").delete().eq("id", id);

    if (error) {
      console.error("Database error in deleteProduct:", error);
      throw handleDatabaseError(error);
    }

    return true;
  },
};
