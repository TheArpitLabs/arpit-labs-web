import { supabaseServer } from "@/lib/supabase/server";
import { ProductFeature } from "@/types/content";
import { handleDatabaseError } from "@/lib/errors";
import { logger } from '@/lib/logger';

export const productFeaturesRepository = {
  async getFeaturesByProductId(productId: string) {
    const { data, error } = await supabaseServer
      .from("product_features")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Database error in getFeaturesByProductId:", error);
      throw handleDatabaseError(error);
    }

    return data ?? [] as ProductFeature[];
  },

  async replaceFeatures(productId: string, features: Array<{ title: string; description: string }>) {
    const { error: deleteError } = await supabaseServer
      .from("product_features")
      .delete()
      .eq("product_id", productId);

    if (deleteError) {
      logger.error("Database error in replaceFeatures delete:", deleteError);
      throw handleDatabaseError(deleteError);
    }

    if (features.length === 0) {
      return [] as ProductFeature[];
    }

    const payload = features.map((feature) => ({
      product_id: productId,
      title: feature.title,
      description: feature.description,
    }));

    const { data, error } = await supabaseServer
      .from("product_features")
      .insert(payload)
      .select();

    if (error) {
      logger.error("Database error in replaceFeatures insert:", error);
      throw handleDatabaseError(error);
    }

    return data ?? [] as ProductFeature[];
  },
};
