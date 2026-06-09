import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { contentGenerationService } from '@/lib/ai-services';
import { getUserFromRequest } from '@/lib/auth';

const socialSchema = z.object({
  sourceType: z.enum(['project', 'blog', 'experiment']),
  sourceId: z.string().min(1),
  postType: z.enum(['linkedin', 'twitter', 'announcement', 'launch']),
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
    const { sourceType, sourceId, postType } = socialSchema.parse(body);

    const socialContent = await contentGenerationService.generateSocialContent(sourceType, sourceId, postType);

    return NextResponse.json({ success: true, socialContent }, { status: 200 });
  } catch (error) {
    console.error('Error generating social content:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate social content' },
      { status: 500 }
    );
  }
}
