import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getAdminUserFromRequest } from "@/lib/auth/auth";
import { tagsRepository } from "@/lib/repositories/tags.repository";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { logger } from '@/lib/logger';

// DELETE /api/projects/[slug]/tags/[tag] - Remove single tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; tag: string }> }
) {
  try {
    const { slug, tag } = await params;
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

    // Remove tag
    await tagsRepository.removeTag(project.id, tag);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/projects/[slug]/tags/[tag]:', error);
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 }
    );
  }
}
