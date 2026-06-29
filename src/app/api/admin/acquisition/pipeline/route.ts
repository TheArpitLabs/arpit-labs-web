/**
 * Admin API: Pipeline Management
 * 
 * Provides endpoints for managing the content acquisition pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPipelineOrchestrator } from '@/lib/acquisition/orchestration/pipeline-orchestrator';
import { logger } from '@/lib/logger';

// GET /api/admin/acquisition/pipeline - Get pipeline status and stats
export async function GET(request: NextRequest) {
  try {
    const orchestrator = getPipelineOrchestrator({
      enableScheduling: true,
      enableRetry: true,
      maxConcurrentJobs: 10,
      jobTimeout: 3600000,
      heartbeatInterval: 60000,
      enableMetrics: true,
      enableLogging: true,
      logLevel: 'info'
    });

    const stats = await orchestrator.getPipelineStats();
    const activeJobs = await orchestrator.getActiveJobs();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        activeJobs
      }
    });
  } catch (error) {
    logger.error('Error getting pipeline status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get pipeline status'
    }, { status: 500 });
  }
}

// POST /api/admin/acquisition/pipeline - Start/stop pipeline or schedule job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, job } = body;

    const orchestrator = getPipelineOrchestrator({
      enableScheduling: true,
      enableRetry: true,
      maxConcurrentJobs: 10,
      jobTimeout: 3600000,
      heartbeatInterval: 60000,
      enableMetrics: true,
      enableLogging: true,
      logLevel: 'info'
    });

    switch (action) {
      case 'start':
        await orchestrator.start();
        return NextResponse.json({ success: true, message: 'Pipeline started' });

      case 'stop':
        await orchestrator.stop();
        return NextResponse.json({ success: true, message: 'Pipeline stopped' });

      case 'schedule':
        if (!job) {
          return NextResponse.json({ success: false, error: 'Job data required' }, { status: 400 });
        }
        const scheduledJob = await orchestrator.scheduleJob(job);
        return NextResponse.json({ success: true, data: scheduledJob });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error in pipeline POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process pipeline request'
    }, { status: 500 });
  }
}
