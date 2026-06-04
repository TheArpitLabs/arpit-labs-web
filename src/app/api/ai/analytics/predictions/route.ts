/**
 * API Route: AI Analytics Predictions
 * GET /api/ai/analytics/predictions
 * Return AI-powered predictions for visitor interests, content, and technologies
 */

import { NextResponse } from 'next/server';
import { analyticsService } from '@/lib/ai-services';

export async function GET() {
  try {
    const predictions = [
      await analyticsService.predictVisitorInterests(null),
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
    console.error('Error fetching analytics predictions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
