import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getAdminUserFromRequest } from "@/lib/auth/auth";
import { mediaRepository } from "@/lib/repositories/media.repository";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { z } from "zod";
import { logger } from '@/lib/logger';

const addMediaSchema = z.object({
  media_type: z.enum(['image', 'document', 'video']),
  file_url: z.string().url(),
  file_name: z.string().optional(),
  file_size: z.number().optional(),
  mime_type: z.string().optional(),
  alt_text: z.string().optional(),
  caption: z.string().optional(),
  order_index: z.number().default(0),
});

// GET /api/projects/[slug]/media - List media
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const mediaType = searchParams.get('type') as 'image' | 'document' | 'video' | null;
    
    // Get project by slug
    const project = await projectsRepository.getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get media
    const media = await mediaRepository.getMedia(
      project.id,
      mediaType || undefined
    );

    return NextResponse.json({ data: media });
  } catch (error) {
    logger.error('Error in GET /api/projects/[slug]/media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[slug]/media - Add media
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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
    const validatedData = addMediaSchema.parse(body);

    // Add media
    const media = await mediaRepository.addMedia({
      project_id: project.id,
      ...validatedData,
    });

    return NextResponse.json({ data: media }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/projects/[slug]/media:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add media' },
      { status: 500 }
    );
  }
}
