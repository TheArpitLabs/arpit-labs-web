/**
 * Admin API: Analytics and Statistics
 * 
 * Provides endpoints for acquisition pipeline analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/admin/acquisition/analytics - Get comprehensive analytics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '7d'; // 7d, 30d, 90d, all

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      case '7d':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    // Fetch analytics data
    const [
      contentStats,
      pipelineJobs,
      moderationStats,
      queueStats
    ] = await Promise.all([
      // Content acquisition stats
      supabase
        .from('content_acquisition_queue')
        .select('status, content_type, quality_score, created_at')
        .gte('created_at', startDate.toISOString()),
      
      // Pipeline job stats
      supabase
        .from('pipeline_jobs')
        .select('status, type, created_at, completed_at')
        .gte('created_at', startDate.toISOString()),
      
      // Moderation stats
      supabase
        .from('moderation_results')
        .select('status, score, created_at')
        .gte('created_at', startDate.toISOString()),
      
      // Queue health
      supabase
        .from('queue_health')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)
    ]);

    // Process content stats
    const contentByStatus: Record<string, number> = {};
    const contentByType: Record<string, number> = {};
    const qualityScores: number[] = [];
    
    (contentStats.data || []).forEach((item: any) => {
      contentByStatus[item.status] = (contentByStatus[item.status] || 0) + 1;
      contentByType[item.content_type] = (contentByType[item.content_type] || 0) + 1;
      if (item.quality_score) {
        qualityScores.push(item.quality_score);
      }
    });

    const avgQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;

    // Process pipeline job stats
    const jobsByStatus: Record<string, number> = {};
    const jobsByType: Record<string, number> = {};
    const jobDurations: number[] = [];
    
    (pipelineJobs.data || []).forEach((job: any) => {
      jobsByStatus[job.status] = (jobsByStatus[job.status] || 0) + 1;
      jobsByType[job.type] = (jobsByType[job.type] || 0) + 1;
      
      if (job.completed_at && job.created_at) {
        const duration = new Date(job.completed_at).getTime() - new Date(job.created_at).getTime();
        jobDurations.push(duration);
      }
    });

    const avgJobDuration = jobDurations.length > 0 
      ? jobDurations.reduce((sum, duration) => sum + duration, 0) / jobDurations.length 
      : 0;

    // Process moderation stats
    const moderationByStatus: Record<string, number> = {};
    const avgModerationScore = 0;
    
    (moderationStats.data || []).forEach((item: any) => {
      moderationByStatus[item.status] = (moderationByStatus[item.status] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        content: {
          total: contentStats.data?.length || 0,
          byStatus: contentByStatus,
          byType: contentByType,
          avgQualityScore
        },
        pipeline: {
          total: pipelineJobs.data?.length || 0,
          byStatus: jobsByStatus,
          byType: jobsByType,
          avgJobDuration
        },
        moderation: {
          total: moderationStats.data?.length || 0,
          byStatus: moderationByStatus,
          avgScore: avgModerationScore
        },
        queueHealth: queueStats.data || []
      }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get analytics'
    }, { status: 500 });
  }
}
