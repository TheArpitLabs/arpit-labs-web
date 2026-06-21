/**
 * Repository Data Validator
 * 
 * Phase 5: Data Validation Layer
 * Ensures every discovered repository is complete, useful, and display-ready before insertion.
 */

export interface RepositoryDataInput {
  title?: string;
  description?: string;
  github_url?: string;
  category?: string;
  language?: string;
  // Legacy field names (for backward compatibility)
  stars?: number;
  topics?: string[];
  owner?: string;
  // Database field names (actual schema)
  github_stars?: number;
  repository_topics?: string[];
  github_owner?: string;
  // Other fields
  archived?: boolean;
  disabled?: boolean;
  homepage_url?: string;
  avatar_url?: string;
  repository_url?: string;
}

export interface ValidationResult {
  isValid: boolean;
  shouldReject: boolean;
  validationScore: number;
  validationStatus: 'passed' | 'failed' | 'skipped';
  errors: string[];
  warnings: string[];
  metadata: {
    requiredFields: {
      title: boolean;
      description: boolean;
      github_url: boolean;
      category: boolean;
      language: boolean;
    };
    rejectionRules: {
      descriptionTooShort: boolean;
      starsTooLow: boolean;
      isArchived: boolean;
      isDisabled: boolean;
      emptyTopics: boolean;
      missingOwner: boolean;
    };
    urlValidation: {
      homepageValid: boolean;
      avatarValid: boolean;
      repositoryValid: boolean;
    };
  };
}

/**
 * Validate repository data against Phase 5 requirements
 * 
 * Required fields:
 * - title
 * - description
 * - github_url
 * - category
 * - language
 * 
 * Rejection criteria:
 * - description < 50 characters
 * - stars < 50
 * - archived
 * - disabled
 * - empty topics
 * - missing owner
 * 
 * URL validation:
 * - homepage URL
 * - avatar URL
 * - repository URL
 */
export function validateRepositoryData(data: RepositoryDataInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validationScore = 100;

  // Normalization layer: map database field names to validation logic
  const stars =
    data.github_stars ??
    data.stars ??
    0;

  const topics =
    data.repository_topics ??
    data.topics ??
    [];

  const owner =
    data.github_owner ??
    data.owner ??
    null;

  // Debug logging
  console.log({
    title: data.title,
    stars,
    topicsCount: topics?.length || 0,
    owner,
  });

  // Check required fields
  const requiredFields = {
    title: !!data.title && data.title.trim().length > 0,
    description: !!data.description && data.description.trim().length > 0,
    github_url: !!data.github_url && data.github_url.trim().length > 0,
    category: !!data.category && data.category.trim().length > 0,
    language: !!data.language && data.language.trim().length > 0,
  };

  // Deduct points for missing required fields
  if (!requiredFields.title) {
    errors.push('Missing required field: title');
    validationScore -= 20;
  }
  if (!requiredFields.description) {
    errors.push('Missing required field: description');
    validationScore -= 20;
  }
  if (!requiredFields.github_url) {
    errors.push('Missing required field: github_url');
    validationScore -= 20;
  }
  if (!requiredFields.category) {
    errors.push('Missing required field: category');
    validationScore -= 10;
  }
  if (!requiredFields.language) {
    errors.push('Missing required field: language');
    validationScore -= 10;
  }

  // Check rejection rules
  const rejectionRules = {
    descriptionTooShort: false,
    starsTooLow: false,
    isArchived: false,
    isDisabled: false,
    emptyTopics: false,
    missingOwner: false,
  };

  // Description length check (minimum 50 characters)
  if (data.description && data.description.trim().length < 50) {
    rejectionRules.descriptionTooShort = true;
    errors.push(`Description too short (${data.description.trim().length} < 50 characters)`);
    validationScore -= 15;
  }

  // Stars check (minimum 50)
  if (stars < 50) {
    rejectionRules.starsTooLow = true;
    errors.push(`Stars below threshold (${stars} < 50)`);
    validationScore -= 15;
  }

  // Archived check
  if (data.archived) {
    rejectionRules.isArchived = true;
    errors.push('Repository is archived');
    validationScore -= 20;
  }

  // Disabled check
  if (data.disabled) {
    rejectionRules.isDisabled = true;
    errors.push('Repository is disabled');
    validationScore -= 20;
  }

  // Empty topics check
  if (!topics || topics.length === 0) {
    rejectionRules.emptyTopics = true;
    errors.push('Repository has no topics');
    validationScore -= 10;
  }

  // Missing owner check
  if (!owner || owner.trim().length === 0) {
    rejectionRules.missingOwner = true;
    errors.push('Repository owner is missing');
    validationScore -= 15;
  }

  // URL validation
  const urlValidation = {
    homepageValid: true,
    avatarValid: true,
    repositoryValid: true,
  };

  // Homepage URL validation
  if (data.homepage_url) {
    if (!isValidUrl(data.homepage_url)) {
      urlValidation.homepageValid = false;
      warnings.push('Invalid homepage URL format');
      validationScore -= 5;
    }
  }

  // Avatar URL validation
  if (data.avatar_url) {
    if (!isValidUrl(data.avatar_url)) {
      urlValidation.avatarValid = false;
      warnings.push('Invalid avatar URL format');
      validationScore -= 5;
    }
  }

  // Repository URL validation
  if (data.repository_url) {
    if (!isValidUrl(data.repository_url)) {
      urlValidation.repositoryValid = false;
      warnings.push('Invalid repository URL format');
      validationScore -= 5;
    }
  }

  // Ensure validation score doesn't go below 0
  validationScore = Math.max(0, validationScore);

  // Determine validation status
  let validationStatus: 'passed' | 'failed' | 'skipped' = 'passed';
  let shouldReject = false;

  // Auto-reject if any critical rejection rules are triggered
  if (rejectionRules.isArchived || rejectionRules.isDisabled || rejectionRules.starsTooLow) {
    validationStatus = 'failed';
    shouldReject = true;
  }

  // Fail if too many errors or score too low
  if (errors.length > 3 || validationScore < 50) {
    validationStatus = 'failed';
    shouldReject = true;
  }

  // Skip if missing critical required fields
  if (!requiredFields.title || !requiredFields.github_url) {
    validationStatus = 'skipped';
  }

  return {
    isValid: validationStatus === 'passed',
    shouldReject,
    validationScore,
    validationStatus,
    errors,
    warnings,
    metadata: {
      requiredFields,
      rejectionRules,
      urlValidation,
    },
  };
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(result: ValidationResult): {
  status: 'passed' | 'failed' | 'skipped';
  score: number;
  errorCount: number;
  warningCount: number;
  criticalIssues: string[];
} {
  const criticalIssues = result.errors.filter(error => 
    error.includes('archived') || 
    error.includes('disabled') || 
    error.includes('Stars below threshold') ||
    error.includes('Missing required field: title') ||
    error.includes('Missing required field: github_url')
  );

  return {
    status: result.validationStatus,
    score: result.validationScore,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    criticalIssues,
  };
}

/**
 * Batch validate multiple repositories
 */
export function batchValidateRepositories(dataArray: RepositoryDataInput[]): ValidationResult[] {
  return dataArray.map(data => validateRepositoryData(data));
}

/**
 * Get validation statistics from batch results
 */
export function getValidationStatistics(results: ValidationResult[]): {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  averageScore: number;
  mostCommonErrors: { error: string; count: number }[];
} {
  const total = results.length;
  const passed = results.filter(r => r.validationStatus === 'passed').length;
  const failed = results.filter(r => r.validationStatus === 'failed').length;
  const skipped = results.filter(r => r.validationStatus === 'skipped').length;
  
  const totalScore = results.reduce((sum, r) => sum + r.validationScore, 0);
  const averageScore = total > 0 ? totalScore / total : 0;

  // Count most common errors
  const errorCounts: Record<string, number> = {};
  results.forEach(result => {
    result.errors.forEach(error => {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
  });

  const mostCommonErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total,
    passed,
    failed,
    skipped,
    averageScore: Math.round(averageScore),
    mostCommonErrors,
  };
}
