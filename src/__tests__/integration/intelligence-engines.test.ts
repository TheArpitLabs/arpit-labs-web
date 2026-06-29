/**
 * API Validation Script for Intelligence Engines (E8-E15)
 * Run this script to validate all intelligence engine APIs are working
 */

import { logger } from '@/lib/logger';

async function validateAPI(url: string, description: string) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      logger.info(`✅ ${description}: OK`);
      return true;
    } else {
      logger.info(`❌ ${description}: FAILED (${response.status})`);
      return false;
    }
  } catch (error) {
    logger.info(`❌ ${description}: ERROR`);
    return false;
  }
}

export async function validateIntelligenceEngines() {
  logger.info('\n=== Validating Intelligence Engines (E8-E15) ===\n');
  
  const results = [];
  
  // E8 - Trend Intelligence Engine
  results.push(await validateAPI('/api/public/intelligence/trends', 'E8 - Trends Public API'));
  results.push(await validateAPI('/api/analytics/intelligence/trends', 'E8 - Trends Analytics API'));

  // E9 - Contributor Intelligence Engine
  results.push(await validateAPI('/api/public/intelligence/contributors', 'E9 - Contributors Public API'));
  results.push(await validateAPI('/api/analytics/intelligence/contributors', 'E9 - Contributors Analytics API'));

  // E10 - Collaboration Marketplace
  results.push(await validateAPI('/api/public/intelligence/collaboration', 'E10 - Collaboration Public API'));
  results.push(await validateAPI('/api/analytics/intelligence/collaboration', 'E10 - Collaboration Analytics API'));

  // E11 - Autonomous Discovery Engine
  results.push(await validateAPI('/api/public/intelligence/discovery', 'E11 - Discovery Public API'));
  results.push(await validateAPI('/api/analytics/intelligence/discovery', 'E11 - Discovery Analytics API'));

  // E12 - Research Intelligence Engine
  results.push(await validateAPI('/api/public/intelligence/research', 'E12 - Research Public API'));
  results.push(await validateAPI('/api/analytics/intelligence/research', 'E12 - Research Analytics API'));

  // E13 - Dataset Intelligence Engine
  results.push(await validateAPI('/api/public/intelligence/datasets', 'E13 - Datasets Public API'));
  results.push(await validateAPI('/api/analytics/intelligence/datasets', 'E13 - Datasets Analytics API'));

  // E14 - Organization Intelligence Engine
  results.push(await validateAPI('/api/public/intelligence/organizations', 'E14 - Organizations Public API'));
  results.push(await validateAPI('/api/analytics/intelligence/organizations', 'E14 - Organizations Analytics API'));

  // E15 - Agentic AI System
  results.push(await validateAPI('/api/public/intelligence/agents', 'E15 - Agents Public API'));
  results.push(await validateAPI('/api/analytics/intelligence/agents', 'E15 - Agents Analytics API'));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  logger.info(`\n=== Results: ${passed}/${total} APIs validated ===\n`);
  
  return passed === total;
}

// Run validation if executed directly
if (typeof window === 'undefined') {
  validateIntelligenceEngines();
}
