/**
 * Quality Logger
 * 
 * Logs repository quality decisions to the discovery_logs table
 * for tracking and analytics purposes.
 */

import { supabaseServer } from "@/lib/supabase/server";

export interface QualityDecisionLog {
  repository: string;
  score: number;
  grade: string;
  status: 'accepted' | 'rejected';
  reason?: string;
  metadata?: {
    stars: number;
    forks: number;
    contributors: number;
    hasLicense: boolean;
    hasHomepage: boolean;
    topicCount: number;
    descriptionLength: number;
    daysSinceLastCommit?: number;
  };
}

/**
 * Log a quality decision to the discovery_logs table
 */
export async function logQualityDecision(decision: QualityDecisionLog): Promise<void> {
  try {
    const logEntry = {
      log_type: decision.status === 'accepted' ? 'quality_accepted' : 'quality_rejected',
      log_level: decision.status === 'accepted' ? 'info' : 'warning',
      message: decision.status === 'accepted' 
        ? `Repository accepted: ${decision.repository} (score: ${decision.score}, grade: ${decision.grade})`
        : `Repository rejected: ${decision.repository} (score: ${decision.score}, grade: ${decision.grade}, reason: ${decision.reason})`,
      context: {
        repository: decision.repository,
        score: decision.score,
        grade: decision.grade,
        status: decision.status,
        reason: decision.reason,
        metadata: decision.metadata,
      },
    };

    await supabaseServer.from('discovery_logs').insert(logEntry);
  } catch (error) {
    console.error('Failed to log quality decision:', error);
    // Don't throw - logging failures shouldn't break the discovery process
  }
}

/**
 * Log batch quality decisions
 */
export async function logBatchQualityDecisions(decisions: QualityDecisionLog[]): Promise<void> {
  try {
    const logEntries = decisions.map(decision => ({
      log_type: decision.status === 'accepted' ? 'quality_accepted' : 'quality_rejected',
      log_level: decision.status === 'accepted' ? 'info' : 'warning',
      message: decision.status === 'accepted' 
        ? `Repository accepted: ${decision.repository} (score: ${decision.score}, grade: ${decision.grade})`
        : `Repository rejected: ${decision.repository} (score: ${decision.score}, grade: ${decision.grade}, reason: ${decision.reason})`,
      context: {
        repository: decision.repository,
        score: decision.score,
        grade: decision.grade,
        status: decision.status,
        reason: decision.reason,
        metadata: decision.metadata,
      },
    }));

    await supabaseServer.from('discovery_logs').insert(logEntries);
  } catch (error) {
    console.error('Failed to log batch quality decisions:', error);
    // Don't throw - logging failures shouldn't break the discovery process
  }
}

/**
 * Get quality decision statistics
 */
export async function getQualityDecisionStats(): Promise<{
  totalAccepted: number;
  totalRejected: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
}> {
  try {
    const { data: acceptedLogs } = await supabaseServer
      .from('discovery_logs')
      .select('context')
      .eq('log_type', 'quality_accepted');

    const { data: rejectedLogs } = await supabaseServer
      .from('discovery_logs')
      .select('context')
      .eq('log_type', 'quality_rejected');

    const totalAccepted = acceptedLogs?.length || 0;
    const totalRejected = rejectedLogs?.length || 0;

    // Calculate average score
    const allLogs = [...(acceptedLogs || []), ...(rejectedLogs || [])];
    const scores = allLogs
      .map(log => log.context?.score)
      .filter((score): score is number => typeof score === 'number');
    
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    // Calculate grade distribution
    const gradeDistribution: Record<string, number> = {};
    allLogs.forEach(log => {
      const grade = log.context?.grade;
      if (grade) {
        gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
      }
    });

    return {
      totalAccepted,
      totalRejected,
      averageScore,
      gradeDistribution,
    };
  } catch (error) {
    console.error('Failed to get quality decision stats:', error);
    return {
      totalAccepted: 0,
      totalRejected: 0,
      averageScore: 0,
      gradeDistribution: {},
    };
  }
}
