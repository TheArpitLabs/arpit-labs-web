import { NextResponse } from 'next/server';
import { knowledgeBaseService } from '@/lib/ai-services';
import { getAdminUserFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const adminUser = await getAdminUserFromRequest(request);
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 401 }
      );
    }

    const result = await knowledgeBaseService.refreshKnowledgeBase();

    return NextResponse.json(
      {
        success: true,
        count: result.count,
        timestamp: result.timestamp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to refresh knowledge base:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
