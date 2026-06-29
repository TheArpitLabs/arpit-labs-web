import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getAdminUserFromRequest } from "@/lib/auth/auth";
import { contributorsRepository } from "@/lib/repositories/contributors.repository";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { z } from "zod";
import { logger } from '@/lib/logger';

const updateContributorSchema = z.object({
  role: z.enum(['owner', 'maintainer', 'contributor', 'collaborator']),
});

// DELETE /api/projects/[slug]/contributors/[userId] - Remove contributor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const { slug, userId } = await params;
    const user = await getUserFromRequest(request);
    const admin = await getAdminUserFromRequest(request);

    if (!user && !admin) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get project by slug
    const project = await projectsRepository.getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Ownership validation: user must be owner or admin
    const isOwner = user?.id === project.owner_id;
    const isAdmin = !!admin;
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    // Remove contributor
    await contributorsRepository.removeContributor(project.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/projects/[slug]/contributors/[userId]:', error);
    return NextResponse.json(
      { error: 'Failed to remove contributor' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[slug]/contributors/[userId] - Update contributor role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  try {
    const { slug, userId } = await params;
    const user = await getUserFromRequest(request);
    const admin = await getAdminUserFromRequest(request);

    if (!user && !admin) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get project by slug
    const project = await projectsRepository.getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Ownership validation: user must be owner or admin
    const isOwner = user?.id === project.owner_id;
    const isAdmin = !!admin;
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateContributorSchema.parse(body);

    // Update contributor role
    const contributor = await contributorsRepository.updateContributorRole(
      project.id,
      userId,
      validatedData.role
    );

    return NextResponse.json({ data: contributor });
  } catch (error) {
    logger.error('Error in PATCH /api/projects/[slug]/contributors/[userId]:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update contributor' },
      { status: 500 }
    );
  }
}
