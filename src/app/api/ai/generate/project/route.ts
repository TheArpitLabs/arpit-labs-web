/**
 * API Route: AI Project Generator
 * POST /api/ai/generate/project
 * Generate a project idea based on selected category
 */

import { NextRequest, NextResponse } from 'next/server';
import { contentGenerationService } from '@/lib/ai-services';
import { membershipRepository } from '@/lib/repositories/membership.repository';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const access = await membershipRepository.validateFeatureAccessFromRequest(request, 'ai_project_generator');

    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const { domain, difficulty, budget, techStack } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Missing domain' },
        { status: 400 }
      );
    }

    const project = await contentGenerationService.generateProject(domain, difficulty, budget, techStack);

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
