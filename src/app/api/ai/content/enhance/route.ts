import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { contentGenerationService } from '@/lib/ai-services';
import { getUserFromRequest } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';

const enhanceSchema = z.object({
  sourceType: z.enum(['project', 'blog', 'experiment']),
  sourceId: z.string().min(1),
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
    const { sourceType, sourceId } = enhanceSchema.parse(body);

    const enhancement = await contentGenerationService.enhanceContent(sourceType, sourceId);

    return NextResponse.json({ success: true, enhancement }, { status: 200 });
  } catch (error) {
    logger.error('Error enhancing content:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to enhance content' },
      { status: 500 }
    );
  }
}
