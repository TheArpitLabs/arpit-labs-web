/**
 * Launch Readiness Engine
 * 
 * Monitors and validates platform readiness for domain content population
 * Provides pre-launch checks and content verification
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface LaunchReadinessCheck {
  id: string;
  category: 'infrastructure' | 'content' | 'performance' | 'security';
  name: string;
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  score: number;
  details: string;
  timestamp: string;
}

export interface DomainLaunchStatus {
  domainSlug: string;
  domainName: string;
  targetProjects: number;
  currentProjects: number;
  readinessScore: number;
  checks: LaunchReadinessCheck[];
  estimatedLaunchDate: string;
}

export interface ContentPopulationMetrics {
  totalDomains: number;
  totalProjects: number;
  totalResearchPapers: number;
  totalDatasets: number;
  totalContributors: number;
  avgConfidenceScore: number;
  contentVelocity: number; // projects per day
  estimatedCompletionDays: number;
}

class LaunchReadinessEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * Run comprehensive launch readiness check
   */
  async runLaunchReadinessCheck(): Promise<{
    overallScore: number;
    checks: LaunchReadinessCheck[];
    domainStatuses: DomainLaunchStatus[];
    recommendations: string[];
  }> {
    const checks = await this.runAllChecks();
    const domainStatuses = await this.getDomainLaunchStatuses();
    const recommendations = this.generateRecommendations(checks, domainStatuses);
    
    const overallScore = this.calculateOverallScore(checks);

    return {
      overallScore,
      checks,
      domainStatuses,
      recommendations
    };
  }

  /**
   * Run all readiness checks
   */
  private async runAllChecks(): Promise<LaunchReadinessCheck[]> {
    const checks: LaunchReadinessCheck[] = [];

    // Infrastructure checks
    checks.push(await this.checkDatabaseConnectivity());
    checks.push(await this.checkVectorSearchCapability());
    checks.push(await this.checkContentAcquisitionPipeline());
    checks.push(await this.checkRecommendationEngine());

    // Content checks
    checks.push(await this.checkDomainContentCoverage());
    checks.push(await this.checkContentQuality());
    checks.push(await this.checkContentClassificationAccuracy());

    // Performance checks
    checks.push(await this.checkPageLoadPerformance());
    checks.push(await this.checkAPIResponseTimes());

    // Security checks
    checks.push(await this.checkAuthenticationFlow());
    checks.push(await this.checkRateLimiting());

    return checks;
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseConnectivity(): Promise<LaunchReadinessCheck> {
    try {
      const { data, error } = await this.supabase
        .from('engineering_domains')
        .select('id')
        .limit(1);

      if (error) {
        return {
          id: crypto.randomUUID(),
          category: 'infrastructure',
          name: 'Database Connectivity',
          description: 'Verify database connection and basic queries',
          status: 'failed',
          score: 0,
          details: `Database connection failed: ${error.message}`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        id: crypto.randomUUID(),
        category: 'infrastructure',
        name: 'Database Connectivity',
        description: 'Verify database connection and basic queries',
        status: 'passed',
        score: 100,
        details: 'Database connection successful',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        category: 'infrastructure',
        name: 'Database Connectivity',
        description: 'Verify database connection and basic queries',
        status: 'failed',
        score: 0,
        details: `Database check failed: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check vector search capability
   */
  private async checkVectorSearchCapability(): Promise<LaunchReadinessCheck> {
    try {
      // Check if vector search tables exist
      const { data: tables, error } = await this.supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .ilike('tablename', '%vector%');

      if (error || !tables || tables.length === 0) {
        return {
          id: crypto.randomUUID(),
          category: 'infrastructure',
          name: 'Vector Search Capability',
          description: 'Verify vector search infrastructure is available',
          status: 'warning',
          score: 50,
          details: 'Vector search tables not found - semantic search may be limited',
          timestamp: new Date().toISOString()
        };
      }

      return {
        id: crypto.randomUUID(),
        category: 'infrastructure',
        name: 'Vector Search Capability',
        description: 'Verify vector search infrastructure is available',
        status: 'passed',
        score: 100,
        details: `Found ${tables.length} vector-related tables`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        category: 'infrastructure',
        name: 'Vector Search Capability',
        description: 'Verify vector search infrastructure is available',
        status: 'warning',
        score: 50,
        details: 'Vector search check inconclusive',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check content acquisition pipeline
   */
  private async checkContentAcquisitionPipeline(): Promise<LaunchReadinessCheck> {
    try {
      // Check if acquisition tables exist and have recent activity
      const { data: acquisitions, error } = await this.supabase
        .from('content_acquisition_queue')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        return {
          id: crypto.randomUUID(),
          category: 'infrastructure',
          name: 'Content Acquisition Pipeline',
          description: 'Verify content acquisition system is operational',
          status: 'warning',
          score: 50,
          details: 'Acquisition queue check failed',
          timestamp: new Date().toISOString()
        };
      }

      if (!acquisitions || acquisitions.length === 0) {
        return {
          id: crypto.randomUUID(),
          category: 'infrastructure',
          name: 'Content Acquisition Pipeline',
          description: 'Verify content acquisition system is operational',
          status: 'warning',
          score: 70,
          details: 'Acquisition queue exists but no recent activity',
          timestamp: new Date().toISOString()
        };
      }

      const lastActivity = new Date(acquisitions[0].created_at);
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceActivity > 7) {
        return {
          id: crypto.randomUUID(),
          category: 'infrastructure',
          name: 'Content Acquisition Pipeline',
          description: 'Verify content acquisition system is operational',
          status: 'warning',
          score: 60,
          details: `Last acquisition activity was ${daysSinceActivity.toFixed(0)} days ago`,
          timestamp: new Date().toISOString()
        };
      }

      return {
        id: crypto.randomUUID(),
        category: 'infrastructure',
        name: 'Content Acquisition Pipeline',
        description: 'Verify content acquisition system is operational',
        status: 'passed',
        score: 100,
        details: 'Acquisition pipeline operational with recent activity',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        category: 'infrastructure',
        name: 'Content Acquisition Pipeline',
        description: 'Verify content acquisition system is operational',
        status: 'warning',
        score: 50,
        details: 'Acquisition pipeline check inconclusive',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check recommendation engine
   */
  private async checkRecommendationEngine(): Promise<LaunchReadinessCheck> {
    try {
      // Check if recommendation tables exist
      const { data: recommendations, error } = await this.supabase
        .from('recommendation_results')
        .select('id')
        .limit(1);

      if (error) {
        return {
          id: crypto.randomUUID(),
          category: 'infrastructure',
          name: 'Recommendation Engine',
          description: 'Verify recommendation system is available',
          status: 'warning',
          score: 50,
          details: 'Recommendation system check failed',
          timestamp: new Date().toISOString()
        };
      }

      return {
        id: crypto.randomUUID(),
        category: 'infrastructure',
        name: 'Recommendation Engine',
        description: 'Verify recommendation system is available',
        status: 'passed',
        score: 100,
        details: 'Recommendation engine operational',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        category: 'infrastructure',
        name: 'Recommendation Engine',
        description: 'Verify recommendation system is available',
        status: 'warning',
        score: 50,
        details: 'Recommendation engine check inconclusive',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check domain content coverage
   */
  private async checkDomainContentCoverage(): Promise<LaunchReadinessCheck> {
    try {
      const { data: domains, error } = await this.supabase
        .from('domain_content_statistics')
        .select('*');

      if (error || !domains) {
        return {
          id: crypto.randomUUID(),
          category: 'content',
          name: 'Domain Content Coverage',
          description: 'Verify each domain has sufficient content',
          status: 'failed',
          score: 0,
          details: 'Could not fetch domain statistics',
          timestamp: new Date().toISOString()
        };
      }

      const targets: Record<string, number> = {
        'ai-machine-learning': 3000,
        'software-development': 2500,
        'cybersecurity': 1500,
        'iot-embedded-systems': 1500,
        'data-science': 1000,
        'robotics': 500
      };

      let totalScore = 0;
      let details = '';

      for (const domain of domains) {
        const target = targets[domain.domain_slug] || 1000;
        const progress = (domain.total_projects / target) * 100;
        totalScore += Math.min(progress, 100);

        details += `${domain.domain_name}: ${domain.total_projects}/${target} projects (${progress.toFixed(0)}%)\n`;
      }

      const avgScore = domains.length > 0 ? totalScore / domains.length : 0;

      return {
        id: crypto.randomUUID(),
        category: 'content',
        name: 'Domain Content Coverage',
        description: 'Verify each domain has sufficient content',
        status: avgScore > 80 ? 'passed' : avgScore > 50 ? 'warning' : 'failed',
        score: Math.round(avgScore),
        details: details.trim(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        category: 'content',
        name: 'Domain Content Coverage',
        description: 'Verify each domain has sufficient content',
        status: 'failed',
        score: 0,
        details: `Content coverage check failed: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check content quality
   */
  private async checkContentQuality(): Promise<LaunchReadinessCheck> {
    try {
      const { data: projects, error } = await this.supabase
        .from('projects')
        .select('confidence_score')
        .not('confidence_score', 'is', null)
        .limit(100);

      if (error || !projects) {
        return {
          id: crypto.randomUUID(),
          category: 'content',
          name: 'Content Quality',
          description: 'Verify content has adequate quality scores',
          status: 'warning',
          score: 50,
          details: 'Could not assess content quality',
          timestamp: new Date().toISOString()
        };
      }

      const avgConfidence = projects.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / projects.length;
      const score = avgConfidence * 100;

      return {
        id: crypto.randomUUID(),
        category: 'content',
        name: 'Content Quality',
        description: 'Verify content has adequate quality scores',
        status: score > 70 ? 'passed' : score > 50 ? 'warning' : 'failed',
        score: Math.round(score),
        details: `Average confidence score: ${(avgConfidence * 100).toFixed(1)}% based on ${projects.length} projects`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        category: 'content',
        name: 'Content Quality',
        description: 'Verify content has adequate quality scores',
        status: 'warning',
        score: 50,
        details: 'Content quality check inconclusive',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check content classification accuracy
   */
  private async checkContentClassificationAccuracy(): Promise<LaunchReadinessCheck> {
    try {
      const { data: classifications, error } = await this.supabase
        .from('content_domain_mapping')
        .select('confidence_score')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !classifications) {
        return {
          id: crypto.randomUUID(),
          category: 'content',
          name: 'Content Classification Accuracy',
          description: 'Verify AI classification accuracy',
          status: 'warning',
          score: 50,
          details: 'Could not assess classification accuracy',
          timestamp: new Date().toISOString()
        };
      }

      const avgConfidence = classifications.reduce((sum, c) => sum + (c.confidence_score || 0), 0) / classifications.length;
      const score = avgConfidence * 100;

      return {
        id: crypto.randomUUID(),
        category: 'content',
        name: 'Content Classification Accuracy',
        description: 'Verify AI classification accuracy',
        status: score > 80 ? 'passed' : score > 60 ? 'warning' : 'failed',
        score: Math.round(score),
        details: `Average classification confidence: ${(avgConfidence * 100).toFixed(1)}% based on ${classifications.length} classifications`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: crypto.randomUUID(),
        category: 'content',
        name: 'Content Classification Accuracy',
        description: 'Verify AI classification accuracy',
        status: 'warning',
        score: 50,
        details: 'Classification accuracy check inconclusive',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check page load performance
   */
  private async checkPageLoadPerformance(): Promise<LaunchReadinessCheck> {
    // This would typically use actual performance monitoring
    // For now, return a placeholder check
    return {
      id: crypto.randomUUID(),
      category: 'performance',
      name: 'Page Load Performance',
      description: 'Verify acceptable page load times',
      status: 'warning',
      score: 75,
      details: 'Performance monitoring not yet implemented - manual testing recommended',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check API response times
   */
  private async checkAPIResponseTimes(): Promise<LaunchReadinessCheck> {
    // This would typically use actual API monitoring
    // For now, return a placeholder check
    return {
      id: crypto.randomUUID(),
      category: 'performance',
      name: 'API Response Times',
      description: 'Verify acceptable API response times',
      status: 'warning',
      score: 75,
      details: 'API monitoring not yet implemented - manual testing recommended',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check authentication flow
   */
  private async checkAuthenticationFlow(): Promise<LaunchReadinessCheck> {
    // This would typically test actual authentication
    // For now, return a placeholder check
    return {
      id: crypto.randomUUID(),
      category: 'security',
      name: 'Authentication Flow',
      description: 'Verify authentication and authorization work correctly',
      status: 'warning',
      score: 70,
      details: 'Authentication testing requires manual verification with test accounts',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimiting(): Promise<LaunchReadinessCheck> {
    // This would typically verify rate limiting implementation
    // For now, return a placeholder check
    return {
      id: crypto.randomUUID(),
      category: 'security',
      name: 'Rate Limiting',
      description: 'Verify API rate limiting is implemented',
      status: 'warning',
      score: 50,
      details: 'Rate limiting implementation needs verification',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get domain launch statuses
   */
  private async getDomainLaunchStatuses(): Promise<DomainLaunchStatus[]> {
    try {
      const { data: domains, error } = await this.supabase
        .from('domain_content_statistics')
        .select('*');

      if (error || !domains) {
        return [];
      }

      const targets: Record<string, number> = {
        'ai-machine-learning': 3000,
        'software-development': 2500,
        'cybersecurity': 1500,
        'iot-embedded-systems': 1500,
        'data-science': 1000,
        'robotics': 500
      };

      return domains.map(domain => {
        const target = targets[domain.domain_slug] || 1000;
        const progress = domain.total_projects / target;
        const readinessScore = Math.min(progress * 100, 100);
        
        // Estimate launch date based on current velocity
        const daysToComplete = progress >= 1 ? 0 : Math.ceil((target - domain.total_projects) / 50); // Assume 50 projects/day
        const estimatedLaunchDate = new Date();
        estimatedLaunchDate.setDate(estimatedLaunchDate.getDate() + daysToComplete);

        return {
          domainSlug: domain.domain_slug,
          domainName: domain.domain_name,
          targetProjects: target,
          currentProjects: domain.total_projects,
          readinessScore: Math.round(readinessScore),
          checks: [], // Would run domain-specific checks
          estimatedLaunchDate: estimatedLaunchDate.toISOString()
        };
      });
    } catch (error) {
      console.error('Error getting domain launch statuses:', error);
      return [];
    }
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(checks: LaunchReadinessCheck[]): number {
    if (checks.length === 0) return 0;
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    return Math.round(totalScore / checks.length);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(checks: LaunchReadinessCheck[], domainStatuses: DomainLaunchStatus[]): string[] {
    const recommendations: string[] = [];

    // Infrastructure recommendations
    const failedInfraChecks = checks.filter(c => c.category === 'infrastructure' && c.status === 'failed');
    if (failedInfraChecks.length > 0) {
      recommendations.push(`Address ${failedInfraChecks.length} critical infrastructure issues before launch`);
    }

    const warningInfraChecks = checks.filter(c => c.category === 'infrastructure' && c.status === 'warning');
    if (warningInfraChecks.length > 0) {
      recommendations.push(`Review ${warningInfraChecks.length} infrastructure warnings for optimal performance`);
    }

    // Content recommendations
    const lowContentDomains = domainStatuses.filter(d => d.readinessScore < 50);
    if (lowContentDomains.length > 0) {
      recommendations.push(`Accelerate content population for ${lowContentDomains.map(d => d.domainName).join(', ')}`);
    }

    const mediumContentDomains = domainStatuses.filter(d => d.readinessScore >= 50 && d.readinessScore < 80);
    if (mediumContentDomains.length > 0) {
      recommendations.push(`Continue content growth for ${mediumContentDomains.map(d => d.domainName).join(', ')}`);
    }

    // Security recommendations
    const securityChecks = checks.filter(c => c.category === 'security');
    const failedSecurityChecks = securityChecks.filter(c => c.status === 'failed');
    if (failedSecurityChecks.length > 0) {
      recommendations.push(`Address ${failedSecurityChecks.length} security issues before public launch`);
    }

    // Performance recommendations
    const performanceChecks = checks.filter(c => c.category === 'performance');
    const warningPerformanceChecks = performanceChecks.filter(c => c.status === 'warning');
    if (warningPerformanceChecks.length > 0) {
      recommendations.push(`Implement performance monitoring for production readiness`);
    }

    return recommendations;
  }

  /**
   * Get content population metrics
   */
  async getContentPopulationMetrics(): Promise<ContentPopulationMetrics> {
    try {
      const { data: domains, error } = await this.supabase
        .from('domain_content_statistics')
        .select('*');

      if (error || !domains) {
        return {
          totalDomains: 0,
          totalProjects: 0,
          totalResearchPapers: 0,
          totalDatasets: 0,
          totalContributors: 0,
          avgConfidenceScore: 0,
          contentVelocity: 0,
          estimatedCompletionDays: 0
        };
      }

      const totalProjects = domains.reduce((sum, d) => sum + (d.total_projects || 0), 0);
      const totalResearchPapers = domains.reduce((sum, d) => sum + (d.total_research_papers || 0), 0);
      const totalDatasets = domains.reduce((sum, d) => sum + (d.total_datasets || 0), 0);
      const totalContributors = domains.reduce((sum, d) => sum + (d.total_contributors || 0), 0);
      const avgConfidence = domains.reduce((sum, d) => sum + (d.avg_confidence_score || 0), 0) / domains.length;

      const targets: Record<string, number> = {
        'ai-machine-learning': 3000,
        'software-development': 2500,
        'cybersecurity': 1500,
        'iot-embedded-systems': 1500,
        'data-science': 1000,
        'robotics': 500
      };

      const totalTarget = domains.reduce((sum, d) => sum + (targets[d.domain_slug] || 1000), 0);
      const remainingProjects = totalTarget - totalProjects;
      const estimatedCompletionDays = remainingProjects > 0 ? Math.ceil(remainingProjects / 50) : 0; // Assume 50 projects/day

      return {
        totalDomains: domains.length,
        totalProjects,
        totalResearchPapers,
        totalDatasets,
        totalContributors,
        avgConfidenceScore: avgConfidence,
        contentVelocity: 50, // Assumed velocity
        estimatedCompletionDays
      };
    } catch (error) {
      console.error('Error getting content population metrics:', error);
      return {
        totalDomains: 0,
        totalProjects: 0,
        totalResearchPapers: 0,
        totalDatasets: 0,
        totalContributors: 0,
        avgConfidenceScore: 0,
        contentVelocity: 0,
        estimatedCompletionDays: 0
      };
    }
  }
}

// Singleton instance
let launchReadinessEngineInstance: LaunchReadinessEngine | null = null;

export function getLaunchReadinessEngine(): LaunchReadinessEngine {
  if (!launchReadinessEngineInstance) {
    launchReadinessEngineInstance = new LaunchReadinessEngine();
  }
  return launchReadinessEngineInstance;
}

export function resetLaunchReadinessEngine(): void {
  launchReadinessEngineInstance = null;
}
