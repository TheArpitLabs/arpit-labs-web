import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getAdminUserFromRequest } from "@/lib/auth";
import { tagsRepository } from "@/lib/repositories/tags.repository";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { z } from "zod";

const addTagSchema = z.object({
  tag: z.string().min(1).max(50),
});

const addTagsSchema = z.object({
  tags: z.array(z.string().min(1).max(50)).min(1),
});

// GET /api/projects/[slug]/tags - List tags
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get project by slug
    const project = await projectsRepository.getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get tags
    const tags = await tagsRepository.getTags(project.id);

    return NextResponse.json({ data: tags });
  } catch (error) {
    console.error('Error in GET /api/projects/[slug]/tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[slug]/tags - Add single tag
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
    const validatedData = addTagSchema.parse(body);

    // Add tag
    const tag = await tagsRepository.addTag({
      project_id: project.id,
      tag: validatedData.tag,
    });

    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/projects/[slug]/tags:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[slug]/tags - Replace all tags
export async function PUT(
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
    const validatedData = addTagsSchema.parse(body);

    // Replace all tags
    const tags = await tagsRepository.replaceTags(project.id, validatedData.tags);

    return NextResponse.json({ data: tags });
  } catch (error) {
    console.error('Error in PUT /api/projects/[slug]/tags:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to replace tags' },
      { status: 500 }
    );
  }
}
