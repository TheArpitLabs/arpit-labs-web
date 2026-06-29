import { supabaseServer } from "@/lib/supabase/server";
import { ProductScreenshot } from "@/types/content";
import { handleDatabaseError } from "@/lib/errors";
import { logger } from '@/lib/logger';

export const productScreenshotsRepository = {
  async getScreenshotsByProductId(productId: string) {
    const { data, error } = await supabaseServer
      .from("product_screenshots")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("Database error in getScreenshotsByProductId:", error);
      throw handleDatabaseError(error);
    }

    return data ?? [];
  },

  async replaceScreenshots(productId: string, screenshots: Array<{ image_url: string; sort_order: number }>) {
    const { error: deleteError } = await supabaseServer
      .from("product_screenshots")
      .delete()
      .eq("product_id", productId);

    if (deleteError) {
      logger.error("Database error in replaceScreenshots delete:", deleteError);
      throw handleDatabaseError(deleteError);
    }

    if (screenshots.length === 0) {
      return [];
    }

    const payload = screenshots.map((s) => ({
      product_id: productId,
      image_url: s.image_url,
      sort_order: s.sort_order,
    }));

    const { data, error } = await supabaseServer
      .from("product_screenshots")
      .insert(payload)
      .select();

    if (error) {
      logger.error("Database error in replaceScreenshots insert:", error);
      throw handleDatabaseError(error);
    }

    return data ?? [];
  },
};
