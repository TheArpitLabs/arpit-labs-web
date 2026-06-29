import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { contentGenerationService } from '@/lib/ai-services';
import { getUserFromRequest } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';

const newsletterSchema = z.object({
  period: z.enum(['weekly', 'monthly']).default('weekly'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { period } = newsletterSchema.parse(body);

    const newsletter = await contentGenerationService.generateNewsletter(period);

    return NextResponse.json({ success: true, newsletter }, { status: 200 });
  } catch (error) {
    logger.error('Error generating newsletter:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate newsletter' },
      { status: 500 }
    );
  }
}
