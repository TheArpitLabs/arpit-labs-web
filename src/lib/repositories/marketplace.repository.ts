import { supabaseServer } from "@/lib/supabase/server";

export interface MarketplaceItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string;
  price: number;
  currency: string;
  featured: boolean;
  published: boolean;
  seller_id: string;
  preview_image: string | null;
  download_url: string | null;
  views_count: number;
  downloads_count: number;
  sales_count: number;
  revenue: number;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    slug: string;
  };
}

export const marketplaceRepository = {
  async getAll(filters?: { category?: string; featured?: boolean; published?: boolean }) {
    const supabase = supabaseServer;
    let query = supabase
      .from("marketplace_items")
      .select("*, category:marketplace_categories(name, slug)");

    if (filters?.category) {
      query = query.eq("marketplace_categories.slug", filters.category);
    }
    if (filters?.featured !== undefined) {
      query = query.eq("featured", filters.featured);
    }
    if (filters?.published !== undefined) {
      query = query.eq("published", filters.published);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data as MarketplaceItem[];
  },

  async getBySlug(slug: string) {
    const supabase = supabaseServer;
    const { data, error } = await supabase
      .from("marketplace_items")
      .select("*, category:marketplace_categories(name, slug)")
      .eq("slug", slug)
      .single();

    if (error) return null;
    return data as MarketplaceItem;
  },

  async getCategories() {
    const supabase = supabaseServer;
    const { data, error } = await supabase
      .from("marketplace_categories")
      .select("*")
      .order("name");

    if (error) throw error;
    return data;
  },

  async getBySeller(sellerId: string) {
    const supabase = supabaseServer;
    const { data, error } = await supabase
      .from("marketplace_items")
      .select("*, category:marketplace_categories(name, slug)")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as MarketplaceItem[];
  },

  async getOrders(userId: string) {
    const supabase = supabaseServer;
    const { data, error } = await supabase
      .from("marketplace_orders")
      .select("*, item:marketplace_items(title, preview_image, slug)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }
};
