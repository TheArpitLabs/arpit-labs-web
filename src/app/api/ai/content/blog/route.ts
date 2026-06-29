import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { contentGenerationService } from '@/lib/ai-services';
import { getUserFromRequest } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';

const blogSchema = z.object({
  topic: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
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
    const { topic, category, difficulty } = blogSchema.parse(body);

    const blogContent = await contentGenerationService.generateBlogContent(topic, category, difficulty);

    return NextResponse.json({ success: true, blogContent }, { status: 200 });
  } catch (error) {
    logger.error('Error generating blog content:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate blog content' },
      { status: 500 }
    );
  }
}
