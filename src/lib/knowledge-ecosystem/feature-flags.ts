const truthy = new Set(["1", "true", "yes", "on", "enabled"]);

function envEnabled(name: string, fallback = false) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return truthy.has(value.toLowerCase());
}

export const knowledgeFeatureFlags = {
  acquisitionEngine: envEnabled("NEXT_PUBLIC_FEATURE_ACQUISITION_ENGINE", true),
  aiAnalysisEngine: envEnabled("NEXT_PUBLIC_FEATURE_AI_ANALYSIS_ENGINE", true),
  duplicateDetection: envEnabled("NEXT_PUBLIC_FEATURE_DUPLICATE_DETECTION", true),
  qualityEngine: envEnabled("NEXT_PUBLIC_FEATURE_QUALITY_ENGINE", true),
  trustEngine: envEnabled("NEXT_PUBLIC_FEATURE_TRUST_ENGINE", true),
  knowledgeGraph: envEnabled("NEXT_PUBLIC_FEATURE_KNOWLEDGE_GRAPH", true),
  recommendations: envEnabled("NEXT_PUBLIC_FEATURE_RECOMMENDATIONS", true),
  semanticSearch: envEnabled("NEXT_PUBLIC_FEATURE_SEMANTIC_SEARCH", true),
  trendIntelligence: envEnabled("NEXT_PUBLIC_FEATURE_TREND_INTELLIGENCE", true),
  aiReviewer: envEnabled("NEXT_PUBLIC_FEATURE_AI_REVIEWER", true),
  mediaGeneration: envEnabled("NEXT_PUBLIC_FEATURE_MEDIA_GENERATION", false),
  learningPaths: envEnabled("NEXT_PUBLIC_FEATURE_LEARNING_PATHS", true),
  hackathonIntelligence: envEnabled("NEXT_PUBLIC_FEATURE_HACKATHON_INTELLIGENCE", true),
  contributorResolution: envEnabled("NEXT_PUBLIC_FEATURE_CONTRIBUTOR_RESOLUTION", true),
  collaborationMarketplace: envEnabled("NEXT_PUBLIC_FEATURE_COLLABORATION_MARKETPLACE", true),
  observability: envEnabled("NEXT_PUBLIC_FEATURE_PLATFORM_OBSERVABILITY", true),
  scaling: envEnabled("NEXT_PUBLIC_FEATURE_PLATFORM_SCALING", true),
};

export function assertKnowledgeFeature(flag: keyof typeof knowledgeFeatureFlags) {
  if (!knowledgeFeatureFlags[flag]) {
    throw new Error(`Knowledge ecosystem feature disabled: ${flag}`);
  }
}
