/**
 * Compliance Engine
 * 
 * Handles license checking, content validation, and policy enforcement
 */

import { ComplianceResult, ComplianceConfig, ComplianceCheckType, ComplianceStatus } from './types';
import { supabaseServer } from '@/lib/supabase/server';

export class ComplianceEngine {
  private config: ComplianceConfig;

  constructor(config: Partial<ComplianceConfig> = {}) {
    this.config = {
      requireLicense: true,
      allowedLicenses: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC', 'Unlicense'],
      blockedLicenses: ['GPL-3.0', 'AGPL-3.0'],
      requireOsiApproved: true,
      allowCommercialUse: true,
      enableSecurityCheck: true,
      enableContentPolicyCheck: true,
      enableQualityCheck: true,
      ...config,
    };
  }

  /**
   * Run compliance checks on content
   */
  async runComplianceCheck(contentId: string, content: {
    contentType: string;
    licenseType?: string;
    licenseUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ComplianceResult> {
    const checks: Record<ComplianceCheckType, {
      passed: boolean;
      details: Record<string, unknown>;
      notes: string;
    }> = {
      license: { passed: true, details: {}, notes: '' },
      content_policy: { passed: true, details: {}, notes: '' },
      security: { passed: true, details: {}, notes: '' },
      quality: { passed: true, details: {}, notes: '' },
    };

    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    // Run license check
    if (this.config.requireLicense) {
      const licenseResult = await this.checkLicense(content);
      checks.license = licenseResult;
      
      if (!licenseResult.passed) {
        blockingIssues.push(`License check failed: ${licenseResult.notes}`);
      }
    }

    // Run content policy check
    if (this.config.enableContentPolicyCheck) {
      const policyResult = await this.checkContentPolicy({
        title: content.metadata?.title as string || '',
        description: content.metadata?.description as string || '',
        rawContent: content.metadata?.rawContent as string || '',
      });
      checks.content_policy = policyResult;
      
      if (!policyResult.passed) {
        blockingIssues.push(`Content policy check failed: ${policyResult.notes}`);
      }
    }

    // Run security check
    if (this.config.enableSecurityCheck) {
      const securityResult = await this.checkSecurity({
        sourceUrl: content.metadata?.sourceUrl as string || '',
        repositoryUrl: content.metadata?.repositoryUrl as string || '',
        metadata: content.metadata,
      });
      checks.security = securityResult;
      
      if (!securityResult.passed) {
        blockingIssues.push(`Security check failed: ${securityResult.notes}`);
      }
    }

    // Run quality check
    if (this.config.enableQualityCheck) {
      const qualityResult = await this.checkQuality({
        title: content.metadata?.title as string || '',
        description: content.metadata?.description as string || '',
        rawContent: content.metadata?.rawContent as string || '',
        metadata: content.metadata,
      });
      checks.quality = qualityResult;
      
      if (!qualityResult.passed) {
        warnings.push(`Quality check warning: ${qualityResult.notes}`);
      }
    }

    // Calculate overall compliance
    const passedChecks = Object.values(checks).filter(c => c.passed).length;
    const totalChecks = Object.keys(checks).length;
    const overallScore = passedChecks / totalChecks;

    // Determine recommendation
    let recommendation: 'approve' | 'reject' | 'review' = 'approve';
    let status: ComplianceStatus = 'compliant';

    if (blockingIssues.length > 0) {
      recommendation = 'reject';
      status = 'non_compliant';
    } else if (warnings.length > 0) {
      recommendation = 'review';
      status = 'review_needed';
    }

    const result: ComplianceResult = {
      compliant: blockingIssues.length === 0,
      status,
      checks,
      overallScore,
      recommendation,
      blockingIssues,
      warnings,
    };

    // Store compliance check results in database
    await this.storeComplianceCheck(contentId, content.contentType, result);

    return result;
  }

  /**
   * Check license compliance
   */
  private async checkLicense(content: {
    licenseType?: string;
    licenseUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ passed: boolean; details: Record<string, unknown>; notes: string }> {
    const licenseType = content.licenseType || (content.metadata?.license as string) || '';
    
    if (!licenseType) {
      return {
        passed: false,
        details: { hasLicense: false },
        notes: 'No license specified',
      };
    }

    // Check if license is blocked
    if (this.config.blockedLicenses.includes(licenseType)) {
      return {
        passed: false,
        details: { licenseType, blocked: true },
        notes: `License ${licenseType} is blocked`,
      };
    }

    // Check if license is allowed
    if (this.config.allowedLicenses.length > 0 && !this.config.allowedLicenses.includes(licenseType)) {
      return {
        passed: false,
        details: { licenseType, allowed: false },
        notes: `License ${licenseType} is not in allowed list`,
      };
    }

    // Check OSI approval if required
    if (this.config.requireOsiApproved) {
      const licenseInfo = await this.getLicenseInfo(licenseType);
      
      if (!licenseInfo || !licenseInfo.isOsiApproved) {
        return {
          passed: false,
          details: { licenseType, osiApproved: false },
          notes: `License ${licenseType} is not OSI approved`,
        };
      }
    }

    // Check commercial use if required
    if (this.config.allowCommercialUse) {
      const licenseInfo = await this.getLicenseInfo(licenseType);
      
      if (!licenseInfo || !licenseInfo.canCommerciallyUse) {
        return {
          passed: false,
          details: { licenseType, commercialUse: false },
          notes: `License ${licenseType} does not allow commercial use`,
        };
      }
    }

    return {
      passed: true,
      details: { licenseType, compliant: true },
      notes: `License ${licenseType} is compliant`,
    };
  }

  /**
   * Check content policy compliance
   */
  private async checkContentPolicy(content: {
    title?: string;
    description?: string;
    rawContent?: string;
  }): Promise<{ passed: boolean; details: Record<string, unknown>; notes: string }> {
    const violations: string[] = [];
    const details: Record<string, unknown> = {};

    // Check for inappropriate content
    const inappropriateKeywords = ['spam', 'scam', 'fraud', 'illegal', 'hack', 'crack'];
    const textToCheck = [
      content.title,
      content.description,
      content.rawContent,
    ].join(' ').toLowerCase();

    for (const keyword of inappropriateKeywords) {
      if (textToCheck.includes(keyword)) {
        violations.push(`Contains inappropriate keyword: ${keyword}`);
      }
    }

    // Check for excessive capitalization (potential spam)
    if (content.title) {
      const upperCaseRatio = (content.title.match(/[A-Z]/g) || []).length / content.title.length;
      if (upperCaseRatio > 0.5) {
        violations.push('Title has excessive capitalization');
      }
    }

    details.violations = violations;
    details.violationCount = violations.length;

    if (violations.length > 0) {
      return {
        passed: false,
        details,
        notes: `Content policy violations: ${violations.join(', ')}`,
      };
    }

    return {
      passed: true,
      details,
      notes: 'Content policy check passed',
    };
  }

  /**
   * Check security compliance
   */
  private async checkSecurity(content: {
    sourceUrl?: string;
    repositoryUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ passed: boolean; details: Record<string, unknown>; notes: string }> {
    const issues: string[] = [];
    const details: Record<string, unknown> = {};

    // Check URL security
    const url = content.sourceUrl || content.repositoryUrl;
    if (url) {
      if (!url.startsWith('https://')) {
        issues.push('URL does not use HTTPS');
      }

      // Check for suspicious domains
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'goo.gl'];
      const urlObj = new URL(url);
      if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
        issues.push('URL uses URL shortener service');
      }
    }

    // Check for security metadata
    const metadata = content.metadata || {};
    if (metadata.hasSecurityPolicy === false) {
      issues.push('No security policy found');
    }

    details.issues = issues;
    details.issueCount = issues.length;

    if (issues.length > 0) {
      return {
        passed: false,
        details,
        notes: `Security issues: ${issues.join(', ')}`,
      };
    }

    return {
      passed: true,
      details,
      notes: 'Security check passed',
    };
  }

  /**
   * Check quality compliance
   */
  private async checkQuality(content: {
    title?: string;
    description?: string;
    rawContent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ passed: boolean; details: Record<string, unknown>; notes: string }> {
    const warnings: string[] = [];
    const details: Record<string, unknown> = {};

    // Check title quality
    if (!content.title || content.title.length < 3) {
      warnings.push('Title is too short or missing');
    }

    // Check description quality
    if (!content.description || content.description.length < 10) {
      warnings.push('Description is too short or missing');
    }

    // Check content quality
    if (!content.rawContent || content.rawContent.length < 50) {
      warnings.push('Content is too short or missing');
    }

    // Check for documentation
    const metadata = content.metadata || {};
    if (metadata.hasReadme === false) {
      warnings.push('No README documentation found');
    }

    details.warnings = warnings;
    details.warningCount = warnings.length;

    if (warnings.length > 2) {
      return {
        passed: false,
        details,
        notes: `Quality warnings: ${warnings.join(', ')}`,
      };
    }

    return {
      passed: true,
      details,
      notes: warnings.length > 0 ? `Quality warnings: ${warnings.join(', ')}` : 'Quality check passed',
    };
  }

  /**
   * Get license information from database
   */
  private async getLicenseInfo(spdxId: string): Promise<{
    spdxId: string;
    name: string;
    isOsiApproved: boolean;
    isFsfLibre: boolean;
    canCommerciallyUse: boolean;
    canModify: boolean;
    canDistribute: boolean;
    canSublicense: boolean;
    requiresAttribution: boolean;
    requiresSameLicense: boolean;
    requiresDocumentation: boolean;
    description: string;
    compatibility: Record<string, string[]>;
  } | null> {
    const { data, error } = await supabaseServer
      .from('license_registry')
      .select('*')
      .eq('spdx_id', spdxId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      spdxId: data.spdx_id,
      name: data.name,
      isOsiApproved: data.is_osi_approved,
      isFsfLibre: data.is_fsf_libre,
      canCommerciallyUse: data.can_commercially_use,
      canModify: data.can_modify,
      canDistribute: data.can_distribute,
      canSublicense: data.can_sublicense,
      requiresAttribution: data.requires_attribution,
      requiresSameLicense: data.requires_same_license,
      requiresDocumentation: data.requires_documentation,
      description: data.description,
      compatibility: data.compatibility as Record<string, string[]>,
    };
  }

  /**
   * Store compliance check results in database
   */
  private async storeComplianceCheck(
    contentId: string,
    contentType: string,
    result: ComplianceResult
  ): Promise<void> {
    const checkTypes: ComplianceCheckType[] = ['license', 'content_policy', 'security', 'quality'];

    for (const checkType of checkTypes) {
      const check = result.checks[checkType];
      
      const { error } = await supabaseServer
        .from('compliance_checks')
        .upsert({
          content_id: contentId,
          content_type: contentType,
          check_type: checkType,
          status: check.passed ? 'passed' : 'failed',
          result: check.details,
          notes: check.notes,
          checked_at: new Date().toISOString(),
          checked_by: 'system',
        }, {
          onConflict: 'content_id,content_type,check_type',
        });

      if (error) {
        console.error(`Failed to store compliance check: ${error.message}`);
      }
    }
  }

  /**
   * Process compliance check for a queue item
   */
  async processComplianceCheck(queueItemId: string): Promise<ComplianceResult> {
    // Load queue item
    const { data: item, error: itemError } = await supabaseServer
      .from('content_acquisition_queue')
      .select('*')
      .eq('id', queueItemId)
      .single();

    if (itemError || !item) {
      throw new Error(`Failed to load queue item: ${itemError?.message}`);
    }

    // Run compliance check
    const result = await this.runComplianceCheck(queueItemId, {
      contentType: item.content_type,
      licenseType: item.license_type || undefined,
      licenseUrl: item.license_url || undefined,
      metadata: item.metadata as Record<string, unknown> | undefined,
    });

    // Update queue item with compliance results
    await supabaseServer
      .from('content_acquisition_queue')
      .update({
        compliance_status: result.status,
        license_type: item.license_type,
        license_url: item.license_url,
        compliance_notes: result.blockingIssues.join('; ') || result.warnings.join('; ') || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueItemId);

    return result;
  }
}

// Singleton instance
let complianceEngineInstance: ComplianceEngine | null = null;

export function getComplianceEngine(config?: Partial<ComplianceConfig>): ComplianceEngine {
  if (!complianceEngineInstance || config) {
    complianceEngineInstance = new ComplianceEngine(config);
  }
  return complianceEngineInstance;
}
