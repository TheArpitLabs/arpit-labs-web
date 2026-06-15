/**
 * Admin API: Job Management
 * 
 * Provides endpoints for managing individual pipeline jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPipelineOrchestrator } from '@/lib/acquisition/orchestration/pipeline-orchestrator';

// GET /api/admin/acquisition/jobs/[jobId] - Get job status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
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

    const job = await orchestrator.getJobStatus(jobId);

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get job status'
    }, { status: 500 });
  }
}

// POST /api/admin/acquisition/jobs/[jobId] - Cancel or retry job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { action } = body;

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
      case 'cancel':
        await orchestrator.cancelJob(jobId);
        return NextResponse.json({ success: true, message: 'Job cancelled' });

      case 'retry':
        await orchestrator.retryJob(jobId);
        return NextResponse.json({ success: true, message: 'Job retried' });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in job POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process job request'
    }, { status: 500 });
  }
}
