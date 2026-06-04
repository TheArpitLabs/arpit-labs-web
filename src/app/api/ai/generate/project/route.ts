/**
 * API Route: AI Project Generator
 * POST /api/ai/generate/project
 * Generate a project idea based on selected category
 */

import { NextRequest, NextResponse } from 'next/server';
import { contentGenerationService } from '@/lib/ai-services';

export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json();

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Missing category' },
        { status: 400 }
      );
    }

    const project = await contentGenerationService.generateProject(category);

    return NextResponse.json(
      {
        success: true,
        project,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate project' },
      { status: 500 }
    );
  }
}
