/**
 * Recommendation Engine Types
 * 
 * Defines the interfaces and types for personalized content recommendations
 */

export interface UserProfile {
  userId: string;
  interests: string[];
  skills: string[];
  viewedContent: string[];
  bookmarkedContent: string[];
  interactionHistory: InteractionEvent[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface InteractionEvent {
  contentId: string;
  contentType: string;
  action: 'view' | 'bookmark' | 'share' | 'download' | 'fork' | 'cite';
  timestamp: Date;
  duration?: number; // for views
  context?: Record<string, unknown>;
}

export interface UserPreferences {
  contentTypes: string[];
  topics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  languages: string[];
  updateFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface RecommendationContext {
  userId?: string;
  currentContentId?: string;
  contentType?: string;
  sessionContext?: Record<string, unknown>;
  timeContext?: {
    hourOfDay: number;
    dayOfWeek: number;
    isWeekend: boolean;
  };
}

export interface RecommendationRequest {
  context: RecommendationContext;
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
  algorithm?: 'collaborative' | 'content-based' | 'hybrid' | 'trending' | 'similar';
}

export interface RecommendationResult {
  contentId: string;
  contentType: string;
  score: number;
  confidence: number;
  reason: string;
  metadata: Record<string, unknown>;
}

export interface RecommendationResponse {
  results: RecommendationResult[];
  total: number;
  algorithm: string;
  metadata: {
    userId?: string;
    context: RecommendationContext;
    generatedAt: Date;
  };
}

export interface RecommendationConfig {
  enableCollaborativeFiltering: boolean;
  enableContentBasedFiltering: boolean;
  enableTrending: boolean;
  enableSimilarity: boolean;
  weights: {
    collaborative: number;
    contentBased: number;
    trending: number;
    similarity: number;
  };
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
  minConfidence: number;
  maxRecommendations: number;
}
