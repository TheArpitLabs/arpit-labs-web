import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getAdminUserFromRequest } from "@/lib/auth";
import { mediaRepository } from "@/lib/repositories/media.repository";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { z } from "zod";

const updateMediaSchema = z.object({
  file_url: z.string().url().optional(),
  file_name: z.string().optional(),
  alt_text: z.string().optional(),
  caption: z.string().optional(),
  order_index: z.number().optional(),
});

// DELETE /api/projects/[slug]/media/[mediaId] - Remove media
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; mediaId: string }> }
) {
  try {
    const { slug, mediaId } = await params;
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

    // Remove media
    await mediaRepository.removeMedia(mediaId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/projects/[slug]/media/[mediaId]:', error);
    return NextResponse.json(
      { error: 'Failed to remove media' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[slug]/media/[mediaId] - Update media
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; mediaId: string }> }
) {
  try {
    const { slug, mediaId } = await params;
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
    const validatedData = updateMediaSchema.parse(body);

    // Update media
    const media = await mediaRepository.updateMedia(mediaId, validatedData);

    return NextResponse.json({ data: media });
  } catch (error) {
    console.error('Error in PATCH /api/projects/[slug]/media/[mediaId]:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}
