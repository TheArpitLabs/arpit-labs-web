/**
 * Repository Quality Engine
 * 
 * Calculates repository quality scores and grades based on multiple factors
 * to ensure only high-quality repositories enter the database.
 */

export interface RepositoryMetrics {
  stars: number;
  forks: number;
  contributors: number;
  hasLicense: boolean;
  hasHomepage: boolean;
  topics: string[];
  description: string;
  lastCommitAt?: string;
  createdAt?: string;
}

export interface QualityScore {
  score: number;
  grade: QualityGrade;
  factors: {
    stars: number;
    forks: number;
    contributors: number;
    license: number;
    homepage: number;
    topics: number;
    description: number;
    recentActivity: number;
  };
  metadata: {
    totalStars: number;
    totalForks: number;
    totalContributors: number;
    hasLicense: boolean;
    hasHomepage: boolean;
    topicCount: number;
    descriptionLength: number;
    daysSinceLastCommit?: number;
  };
}

export type QualityGrade = 'Excellent' | 'High Quality' | 'Good' | 'Average' | 'Reject' | 'Unknown';

/**
 * Calculate repository quality score (0-100)
 * 
 * Weights:
 * - Stars: 30%
 * - Forks: 15%
 * - Contributors: 15%
 * - License: 10%
 * - Homepage: 5%
 * - Topics: 10%
 * - Description Quality: 10%
 * - Recent Activity: 5%
 */
export function calculateRepositoryScore(metrics: RepositoryMetrics): QualityScore {
  const factors = {
    stars: calculateStarsScore(metrics.stars),
    forks: calculateForksScore(metrics.forks),
    contributors: calculateContributorsScore(metrics.contributors),
    license: calculateLicenseScore(metrics.hasLicense),
    homepage: calculateHomepageScore(metrics.hasHomepage),
    topics: calculateTopicsScore(metrics.topics),
    description: calculateDescriptionScore(metrics.description),
    recentActivity: calculateRecentActivityScore(metrics.lastCommitAt, metrics.createdAt),
  };

  // Calculate weighted score
  const score = Math.round(
    factors.stars * 0.30 +
    factors.forks * 0.15 +
    factors.contributors * 0.15 +
    factors.license * 0.10 +
    factors.homepage * 0.05 +
    factors.topics * 0.10 +
    factors.description * 0.10 +
    factors.recentActivity * 0.05
  );

  const grade = getQualityGrade(score);

  // Calculate days since last commit
  let daysSinceLastCommit: number | undefined;
  if (metrics.lastCommitAt) {
    const lastCommit = new Date(metrics.lastCommitAt);
    const now = new Date();
    daysSinceLastCommit = Math.floor((now.getTime() - lastCommit.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    score,
    grade,
    factors,
    metadata: {
      totalStars: metrics.stars,
      totalForks: metrics.forks,
      totalContributors: metrics.contributors,
      hasLicense: metrics.hasLicense,
      hasHomepage: metrics.hasHomepage,
      topicCount: metrics.topics.length,
      descriptionLength: metrics.description.length,
      daysSinceLastCommit,
    },
  };
}

/**
 * Get quality grade based on score
 */
export function getQualityGrade(score: number): QualityGrade {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'High Quality';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Reject';
}

/**
 * Calculate stars score (0-100)
 * - 1000+ stars: 100
 * - 500-999 stars: 80
 * - 100-499 stars: 60
 * - 50-99 stars: 40
 * - <50 stars: 20
 */
function calculateStarsScore(stars: number): number {
  if (stars >= 1000) return 100;
  if (stars >= 500) return 80;
  if (stars >= 100) return 60;
  if (stars >= 50) return 40;
  return 20;
}

/**
 * Calculate forks score (0-100)
 * - 100+ forks: 100
 * - 50-99 forks: 80
 * - 20-49 forks: 60
 * - 5-19 forks: 40
 * - <5 forks: 20
 */
function calculateForksScore(forks: number): number {
  if (forks >= 100) return 100;
  if (forks >= 50) return 80;
  if (forks >= 20) return 60;
  if (forks >= 5) return 40;
  return 20;
}

/**
 * Calculate contributors score (0-100)
 * - 10+ contributors: 100
 * - 5-9 contributors: 80
 * - 2-4 contributors: 60
 * - 1 contributor: 40
 * - 0 contributors: 20
 */
function calculateContributorsScore(contributors: number): number {
  if (contributors >= 10) return 100;
  if (contributors >= 5) return 80;
  if (contributors >= 2) return 60;
  if (contributors >= 1) return 40;
  return 20;
}

/**
 * Calculate license score (0-100)
 * - Has license: 100
 * - No license: 0
 */
function calculateLicenseScore(hasLicense: boolean): number {
  return hasLicense ? 100 : 0;
}

/**
 * Calculate homepage score (0-100)
 * - Has homepage: 100
 * - No homepage: 0
 */
function calculateHomepageScore(hasHomepage: boolean): number {
  return hasHomepage ? 100 : 0;
}

/**
 * Calculate topics score (0-100)
 * - 5+ topics: 100
 * - 3-4 topics: 80
 * - 1-2 topics: 60
 * - 0 topics: 20
 */
function calculateTopicsScore(topics: string[]): number {
  const count = topics.length;
  if (count >= 5) return 100;
  if (count >= 3) return 80;
  if (count >= 1) return 60;
  return 20;
}

/**
 * Calculate description quality score (0-100)
 * - 100+ characters: 100
 * - 50-99 characters: 80
 * - 20-49 characters: 60
 * - <20 characters: 20
 */
function calculateDescriptionScore(description: string): number {
  const length = description.trim().length;
  if (length >= 100) return 100;
  if (length >= 50) return 80;
  if (length >= 20) return 60;
  return 20;
}

/**
 * Calculate recent activity score (0-100)
 * - Last commit within 30 days: 100
 * - Last commit within 90 days: 80
 * - Last commit within 180 days: 60
 * - Last commit within 365 days: 40
 * - Last commit >365 days ago: 20
 * - Unknown: 50 (neutral)
 */
function calculateRecentActivityScore(lastCommitAt?: string, createdAt?: string): number {
  if (!lastCommitAt) return 50; // Neutral if unknown

  const lastCommit = new Date(lastCommitAt);
  const now = new Date();
  const daysSinceCommit = Math.floor((now.getTime() - lastCommit.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceCommit <= 30) return 100;
  if (daysSinceCommit <= 90) return 80;
  if (daysSinceCommit <= 180) return 60;
  if (daysSinceCommit <= 365) return 40;
  return 20;
}
