/**
 * Feature Flags Configuration for PHASE E8-E15 Intelligence Engines
 * All intelligence engines are feature-flagged for controlled rollout
 */

import { featureFlags } from './infrastructure/feature-flags';

// Initialize feature flags for all intelligence engines
export function initializeIntelligenceFeatureFlags() {
  // E8 - Trend Intelligence Engine
  featureFlags.setFlag({
    name: 'trend_intelligence_engine',
    description: 'Trend Intelligence Engine - Technology trend detection and analysis',
    enabled: true,
    rolloutPercentage: 100,
    allowedRoles: ['admin', 'moderator'],
  });

  // E9 - Contributor Intelligence Engine
  featureFlags.setFlag({
    name: 'contributor_intelligence_engine',
    description: 'Contributor Intelligence Engine - Contributor expertise tracking and analysis',
    enabled: true,
    rolloutPercentage: 100,
    allowedRoles: ['admin', 'moderator'],
  });

  // E10 - Collaboration Marketplace
  featureFlags.setFlag({
    name: 'collaboration_marketplace',
    description: 'Collaboration Marketplace - Matchmaking for collaboration opportunities',
    enabled: true,
    rolloutPercentage: 100,
    allowedRoles: ['admin', 'moderator', 'creator'],
  });

  // E11 - Autonomous Discovery Engine
  featureFlags.setFlag({
    name: 'autonomous_discovery_engine',
    description: 'Autonomous Discovery Engine - Automated content discovery from external sources',
    enabled: true,
    rolloutPercentage: 50, // Gradual rollout
    allowedRoles: ['admin'],
  });

  // E12 - Research Intelligence Engine
  featureFlags.setFlag({
    name: 'research_intelligence_engine',
    description: 'Research Intelligence Engine - Research paper indexing and analysis',
    enabled: true,
    rolloutPercentage: 100,
    allowedRoles: ['admin', 'moderator'],
  });

  // E13 - Dataset Intelligence Engine
  featureFlags.setFlag({
    name: 'dataset_intelligence_engine',
    description: 'Dataset Intelligence Engine - Dataset indexing and quality assessment',
    enabled: true,
    rolloutPercentage: 100,
    allowedRoles: ['admin', 'moderator'],
  });

  // E14 - Organization Intelligence Engine
  featureFlags.setFlag({
    name: 'organization_intelligence_engine',
    description: 'Organization Intelligence Engine - Organization tracking and ranking',
    enabled: true,
    rolloutPercentage: 100,
    allowedRoles: ['admin', 'moderator'],
  });

  // E15 - Agentic AI System
  featureFlags.setFlag({
    name: 'agentic_ai_system',
    description: 'Agentic AI System - AI agents for autonomous task execution',
    enabled: true,
    rolloutPercentage: 25, // Very gradual rollout for AI agents
    allowedRoles: ['admin'],
  });

  // Public dashboards
  featureFlags.setFlag({
    name: 'public_intelligence_dashboards',
    description: 'Public-facing intelligence dashboards',
    enabled: true,
    rolloutPercentage: 100,
  });

  // Analytics dashboards
  featureFlags.setFlag({
    name: 'analytics_intelligence_dashboards',
    description: 'Analytics dashboards for intelligence engines',
    enabled: true,
    rolloutPercentage: 100,
    allowedRoles: ['admin', 'moderator'],
  });
}

// Helper function to check if an intelligence engine is enabled
export function isIntelligenceEngineEnabled(engineName: string, userId?: string, userRoles?: string[]): boolean {
  const flagName = `${engineName}_engine`;
  return featureFlags.isEnabled(flagName, userId, userRoles);
}

// Helper function to check if public dashboards are enabled
export function arePublicDashboardsEnabled(userId?: string, userRoles?: string[]): boolean {
  return featureFlags.isEnabled('public_intelligence_dashboards', userId, userRoles);
}

// Helper function to check if analytics dashboards are enabled
export function areAnalyticsDashboardsEnabled(userId?: string, userRoles?: string[]): boolean {
  return featureFlags.isEnabled('analytics_intelligence_dashboards', userId, userRoles);
}

// Initialize on import
initializeIntelligenceFeatureFlags();
