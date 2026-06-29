/**
 * Admin API: Moderation Management
 * 
 * Provides endpoints for managing content moderation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getModerationEngine } from '@/lib/acquisition/moderation/moderation-engine';
import { logger } from '@/lib/logger';

// GET /api/admin/acquisition/moderation - Get moderation queue and stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    const moderationEngine = getModerationEngine({
      enableAutoModeration: true,
      enableMLModeration: false,
      enableKeywordFiltering: true,
      enablePatternMatching: true,
      autoApproveThreshold: 0.3,
      autoRejectThreshold: 0.8,
      flagThreshold: 0.5,
      reviewQueueSize: 100,
      enableHumanReview: true
    });

    const [queue, stats] = await Promise.all([
      moderationEngine.getModerationQueue(limit),
      moderationEngine.getModerationStats()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        queue,
        stats
      }
    });
  } catch (error) {
    logger.error('Error getting moderation data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get moderation data'
    }, { status: 500 });
  }
}

// POST /api/admin/acquisition/moderation - Review content or create policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, contentId, status, reviewerId, notes, policy } = body;

    const moderationEngine = getModerationEngine({
      enableAutoModeration: true,
      enableMLModeration: false,
      enableKeywordFiltering: true,
      enablePatternMatching: true,
      autoApproveThreshold: 0.3,
      autoRejectThreshold: 0.8,
      flagThreshold: 0.5,
      reviewQueueSize: 100,
      enableHumanReview: true
    });

    switch (action) {
      case 'review':
        if (!contentId || !status || !reviewerId) {
          return NextResponse.json({ 
            success: false, 
            error: 'contentId, status, and reviewerId required' 
          }, { status: 400 });
        }
        await moderationEngine.reviewContent(contentId, status, reviewerId, notes);
        return NextResponse.json({ success: true, message: 'Content reviewed' });

      case 'create-policy':
        if (!policy) {
          return NextResponse.json({ success: false, error: 'Policy data required' }, { status: 400 });
        }
        const newPolicy = await moderationEngine.createPolicy(policy);
        return NextResponse.json({ success: true, data: newPolicy });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error in moderation POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process moderation request'
    }, { status: 500 });
  }
}
