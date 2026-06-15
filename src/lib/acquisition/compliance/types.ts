/**
 * Compliance Engine Types
 * 
 * Defines the interfaces and types for compliance checking
 */

export type ComplianceStatus = 'pending' | 'checking' | 'compliant' | 'non_compliant' | 'review_needed';

export type ComplianceCheckType = 'license' | 'content_policy' | 'security' | 'quality';

export interface ComplianceCheck {
  id: string;
  contentId: string;
  contentType: string;
  checkType: ComplianceCheckType;
  status: ComplianceStatus;
  result: Record<string, unknown>;
  notes: string;
  checkedAt: Date;
  checkedBy: string;
}

export interface LicenseInfo {
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
}

export interface ComplianceResult {
  compliant: boolean;
  status: ComplianceStatus;
  checks: Record<ComplianceCheckType, {
    passed: boolean;
    details: Record<string, unknown>;
    notes: string;
  }>;
  overallScore: number;
  recommendation: 'approve' | 'reject' | 'review';
  blockingIssues: string[];
  warnings: string[];
}

export interface ComplianceConfig {
  requireLicense: boolean;
  allowedLicenses: string[];
  blockedLicenses: string[];
  requireOsiApproved: boolean;
  allowCommercialUse: boolean;
  enableSecurityCheck: boolean;
  enableContentPolicyCheck: boolean;
  enableQualityCheck: boolean;
}
