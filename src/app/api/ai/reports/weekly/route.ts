import { NextResponse } from 'next/server';
import { contentGenerationService } from '@/lib/ai-services';
import { getUserFromRequest } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const weeklyReport = await contentGenerationService.generateWeeklyReport();

    return NextResponse.json({ success: true, weeklyReport }, { status: 200 });
  } catch (error) {
    logger.error('Error generating weekly report:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate weekly report' },
      { status: 500 }
    );
  }
}
