import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/errors";
import { getUserFromRequest, getAdminUserFromRequest } from "@/lib/auth";
import { projectSchema } from "@/lib/validation/project.schema";
import { projectsRepository } from "@/lib/repositories/projects.repository";

// GET /api/projects/[slug] - Get single project by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const { data, error } = await supabaseServer
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      throw handleDatabaseError(error);
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/projects/[slug]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[slug] - Update entire project
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

    // Get existing project to verify ownership
    const existingProject = await projectsRepository.getProjectBySlug(slug);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Ownership validation: user must be owner or admin
    const isOwner = user?.id === existingProject.owner_id;
    const isAdmin = !!admin;
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    // Update project
    const updatedProject = await projectsRepository.updateProject(existingProject.id, validatedData);

    return NextResponse.json({ data: updatedProject });
  } catch (error) {
    console.error('Error in PUT /api/projects/[slug]:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[slug] - Partial update
export async function PATCH(
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

    // Get existing project to verify ownership
    const existingProject = await projectsRepository.getProjectBySlug(slug);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Ownership validation: user must be owner or admin
    const isOwner = user?.id === existingProject.owner_id;
    const isAdmin = !!admin;
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate only the fields being updated
    const partialSchema = projectSchema.partial();
    const validatedData = partialSchema.parse(body);

    // Update project with partial data
    const updatedProject = await projectsRepository.updateProject(existingProject.id, validatedData);

    return NextResponse.json({ data: updatedProject });
  } catch (error) {
    console.error('Error in PATCH /api/projects/[slug]:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[slug] - Delete project
export async function DELETE(
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

    // Get existing project to verify ownership
    const existingProject = await projectsRepository.getProjectBySlug(slug);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Ownership validation: user must be owner or admin
    const isOwner = user?.id === existingProject.owner_id;
    const isAdmin = !!admin;
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this project' },
        { status: 403 }
      );
    }

    // Delete project
    await projectsRepository.deleteProject(existingProject.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/projects/[slug]:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
