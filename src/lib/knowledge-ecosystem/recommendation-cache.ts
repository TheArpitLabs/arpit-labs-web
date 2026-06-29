import { supabaseServer } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * Recommendation Cache Service
 * Implements caching for recommendations to improve performance
 */
export class RecommendationCacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private defaultTTL = 3600000; // 1 hour in milliseconds
  private maxMemoryEntries = 1000;

  /**
   * Get cached recommendations from memory
   */
  getFromMemory(key: string): any | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Cache recommendations in memory
   */
  setInMemory(key: string, data: any, ttl: number = this.defaultTTL): void {
    // Evict oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get cached recommendations from database
   */
  async getFromDatabase(entityId: string, entityType: string = "project"): Promise<any[] | null> {
    const { data } = await supabaseServer
      .from("recommendation_cache")
      .select("recommendations")
      .eq("entity_id", entityId)
      .eq("entity_type", entityType)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!data) return null;

    return data.recommendations;
  }

  /**
   * Cache recommendations in database
   */
  async setInDatabase(
    entityId: string,
    entityType: string = "project",
    recommendations: any[],
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl).toISOString();

    const { error } = await supabaseServer.from("recommendation_cache").upsert({
      entity_id: entityId,
      entity_type: entityType,
      recommendations,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logger.error("Failed to cache recommendations in database:", error);
    }
  }

  /**
   * Get cached recommendations (memory first, then database)
   */
  async get(entityId: string, entityType: string = "project"): Promise<any[] | null> {
    // Try memory cache first
    const memoryKey = `${entityType}:${entityId}`;
    const memoryData = this.getFromMemory(memoryKey);
    if (memoryData) return memoryData;

    // Try database cache
    const dbData = await this.getFromDatabase(entityId, entityType);
    if (dbData) {
      // Store in memory for faster access
      this.setInMemory(memoryKey, dbData);
      return dbData;
    }

    return null;
  }

  /**
   * Cache recommendations (both memory and database)
   */
  async set(
    entityId: string,
    entityType: string = "project",
    recommendations: any[],
    ttl: number = this.defaultTTL
  ): Promise<void> {
    const memoryKey = `${entityType}:${entityId}`;
    
    // Cache in memory
    this.setInMemory(memoryKey, recommendations, ttl);
    
    // Cache in database
    await this.setInDatabase(entityId, entityType, recommendations, ttl);
  }

  /**
   * Clear cache for a specific entity
   */
  async clear(entityId: string, entityType: string = "project"): Promise<void> {
    const memoryKey = `${entityType}:${entityId}`;
    
    // Clear from memory
    this.memoryCache.delete(memoryKey);
    
    // Clear from database
    const { error } = await supabaseServer
      .from("recommendation_cache")
      .delete()
      .eq("entity_id", entityId)
      .eq("entity_type", entityType);

    if (error) {
      logger.error("Failed to clear cache from database:", error);
    }
  }

  /**
   * Clear all expired cache entries from database
   */
  async clearExpired(): Promise<void> {
    const { error } = await supabaseServer
      .from("recommendation_cache")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) {
      logger.error("Failed to clear expired cache entries:", error);
    }
  }

  /**
   * Clear all memory cache
   */
  clearMemory(): void {
    this.memoryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number;
    memoryMaxEntries: number;
    memoryUsage: number;
  } {
    return {
      memoryEntries: this.memoryCache.size,
      memoryMaxEntries: this.maxMemoryEntries,
      memoryUsage: (this.memoryCache.size / this.maxMemoryEntries) * 100,
    };
  }
}

// Singleton instance
export const recommendationCacheService = new RecommendationCacheService();
