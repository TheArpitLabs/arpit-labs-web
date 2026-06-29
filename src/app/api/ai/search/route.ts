/**
 * API Route: Semantic Search
 * POST /api/ai/search
 * Search content by semantic similarity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { query, limit = 5 } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Missing query' }, { status: 400 });
    }

    // Perform semantic search
    const { semanticSearchService } = await import('@/lib/ai-services');
    const results = await semanticSearchService.search(query, limit);

    return NextResponse.json(
      {
        success: true,
        query,
        results,
        count: results.length,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error performing search:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
