/**
 * API Route: AI Analytics Predictions
 * GET /api/ai/analytics/predictions
 * Return AI-powered predictions for visitor interests, content, and technologies
 */

import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/ai-services';
import { getUserFromRequest } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const predictions = [
      await analyticsService.predictVisitorInterests(user.id),
      await analyticsService.predictPopularContent(),
      await analyticsService.predictTrendingTechnologies(),
    ];

    return NextResponse.json(
      {
        success: true,
        predictions,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching analytics predictions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
