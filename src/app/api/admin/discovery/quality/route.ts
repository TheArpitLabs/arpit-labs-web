import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * GET /api/admin/discovery/quality
 * 
 * Returns repository quality statistics from the database
 */
export async function GET(request: NextRequest) {
  try {
    // Get quality grade distribution from projects table
    const { data: projects, error: projectsError } = await supabaseServer
      .from('projects')
      .select('quality_grade, repository_score')
      .not('quality_grade', 'is', null);

    if (projectsError) {
      console.error('Error fetching quality data:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch quality data' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const gradeCounts: Record<string, number> = {
      'Excellent': 0,
      'High Quality': 0,
      'Good': 0,
      'Average': 0,
      'Reject': 0,
      'Unknown': 0,
    };

    let totalScore = 0;
    let scoredCount = 0;

    projects?.forEach(project => {
      const grade = project.quality_grade || 'Unknown';
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;

      if (project.repository_score !== null && project.repository_score !== undefined) {
        totalScore += project.repository_score;
        scoredCount++;
      }
    });

    const averageScore = scoredCount > 0 ? totalScore / scoredCount : 0;

    // Get rejection statistics from discovery_logs
    const { data: acceptedLogs, error: acceptedError } = await supabaseServer
      .from('discovery_logs')
      .select('context')
      .eq('log_type', 'quality_accepted');

    const { data: rejectedLogs, error: rejectedError } = await supabaseServer
      .from('discovery_logs')
      .select('context')
      .eq('log_type', 'quality_rejected');

    const totalAccepted = acceptedLogs?.length || 0;
    const totalRejected = rejectedLogs?.length || 0;

    return NextResponse.json({
      average_score: Math.round(averageScore),
      excellent: gradeCounts['Excellent'] || 0,
      high_quality: gradeCounts['High Quality'] || 0,
      good: gradeCounts['Good'] || 0,
      average: gradeCounts['Average'] || 0,
      rejected: gradeCounts['Reject'] || 0,
      unknown: gradeCounts['Unknown'] || 0,
      total_accepted: totalAccepted,
      total_rejected: totalRejected,
      total_scored: scoredCount,
    });
  } catch (error) {
    console.error('Error in quality API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
