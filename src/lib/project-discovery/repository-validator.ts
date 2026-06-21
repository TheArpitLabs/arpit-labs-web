/**
 * Repository Validator
 * 
 * Validates repositories against quality rules before insertion
 * to prevent low-quality repositories from entering the database.
 */

import { calculateRepositoryScore, getQualityGrade, type QualityGrade } from './repository-quality-engine';

export interface RepositoryValidationInput {
  fullName: string;
  archived?: boolean;
  fork?: boolean;
  description?: string | null;
  license?: string | null;
  stars: number;
  forks: number;
  contributors: number;
  homepage?: string | null;
  topics?: string[];
  lastCommitAt?: string;
  createdAt?: string;
}

export interface ValidationResult {
  isValid: boolean;
  shouldReject: boolean;
  rejectionReason?: string;
  score?: number;
  grade?: QualityGrade;
  metadata?: {
    ruleViolations: string[];
    qualityScore: number;
    qualityGrade: QualityGrade;
  };
}

/**
 * Validate repository against quality rules
 * 
 * Immediate rejection rules:
 * - archived = true
 * - fork = true
 * - description missing
 * - license missing
 * - stars < 50
 * 
 * Quality-based rejection:
 * - repository_score < 40
 */
export function validateRepository(repo: RepositoryValidationInput): ValidationResult {
  const ruleViolations: string[] = [];

  // Immediate rejection rules
  if (repo.archived) {
    ruleViolations.push('Repository is archived');
  }

  if (repo.fork) {
    ruleViolations.push('Repository is a fork');
  }

  if (!repo.description || repo.description.trim().length < 10) {
    ruleViolations.push('Missing or insufficient description');
  }

  if (!repo.license) {
    ruleViolations.push('Missing license');
  }

  if (repo.stars < 50) {
    ruleViolations.push(`Stars below threshold (${repo.stars} < 50)`);
  }

  // If any immediate rejection rules are violated, reject immediately
  if (ruleViolations.length > 0) {
    return {
      isValid: false,
      shouldReject: true,
      rejectionReason: ruleViolations.join(', '),
      metadata: {
        ruleViolations,
        qualityScore: 0,
        qualityGrade: 'Reject',
      },
    };
  }

  // Calculate quality score
  const qualityResult = calculateRepositoryScore({
    stars: repo.stars,
    forks: repo.forks,
    contributors: repo.contributors,
    hasLicense: !!repo.license,
    hasHomepage: !!repo.homepage,
    topics: repo.topics || [],
    description: repo.description || '',
    lastCommitAt: repo.lastCommitAt,
    createdAt: repo.createdAt,
  });

  // Quality-based rejection
  if (qualityResult.score < 40) {
    return {
      isValid: false,
      shouldReject: true,
      rejectionReason: `Quality score below threshold (${qualityResult.score} < 40)`,
      score: qualityResult.score,
      grade: qualityResult.grade,
      metadata: {
        ruleViolations: [`Quality score ${qualityResult.score} below threshold 40`],
        qualityScore: qualityResult.score,
        qualityGrade: qualityResult.grade,
      },
    };
  }

  // Repository passes all validation rules
  return {
    isValid: true,
    shouldReject: false,
    score: qualityResult.score,
    grade: qualityResult.grade,
    metadata: {
      ruleViolations: [],
      qualityScore: qualityResult.score,
      qualityGrade: qualityResult.grade,
    },
  };
}

/**
 * Check if repository should be rejected based on basic rules
 * (without calculating full quality score)
 */
export function shouldRejectImmediately(repo: RepositoryValidationInput): string | null {
  if (repo.archived) {
    return 'Repository is archived';
  }

  if (repo.fork) {
    return 'Repository is a fork';
  }

  if (!repo.description || repo.description.trim().length < 10) {
    return 'Missing or insufficient description';
  }

  if (!repo.license) {
    return 'Missing license';
  }

  if (repo.stars < 50) {
    return `Stars below threshold (${repo.stars} < 50)`;
  }

  return null;
}

/**
 * Get rejection reason for a repository
 */
export function getRejectionReason(repo: RepositoryValidationInput): string | null {
  const immediateRejection = shouldRejectImmediately(repo);
  if (immediateRejection) {
    return immediateRejection;
  }

  // Calculate quality score for quality-based rejection
  const qualityResult = calculateRepositoryScore({
    stars: repo.stars,
    forks: repo.forks,
    contributors: repo.contributors,
    hasLicense: !!repo.license,
    hasHomepage: !!repo.homepage,
    topics: repo.topics || [],
    description: repo.description || '',
    lastCommitAt: repo.lastCommitAt,
    createdAt: repo.createdAt,
  });

  if (qualityResult.score < 40) {
    return `Quality score below threshold (${qualityResult.score} < 40)`;
  }

  return null;
}
