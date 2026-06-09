import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getAdminUserFromRequest } from "@/lib/auth";
import { contributorsRepository } from "@/lib/repositories/contributors.repository";
import { projectsRepository } from "@/lib/repositories/projects.repository";
import { z } from "zod";

const addContributorSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'maintainer', 'contributor', 'collaborator']).default('contributor'),
  contribution_type: z.array(z.string()).default([]),
});

// GET /api/projects/[slug]/contributors - List contributors
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

    // Get contributors
    const contributors = await contributorsRepository.getContributors(project.id);

    return NextResponse.json({ data: contributors });
  } catch (error) {
    console.error('Error in GET /api/projects/[slug]/contributors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributors' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[slug]/contributors - Add contributor
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
    const validatedData = addContributorSchema.parse(body);

    // Add contributor
    const contributor = await contributorsRepository.addContributor({
      project_id: project.id,
      user_id: validatedData.user_id,
      role: validatedData.role,
      contribution_type: validatedData.contribution_type,
    });

    return NextResponse.json({ data: contributor }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/projects/[slug]/contributors:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add contributor' },
      { status: 500 }
    );
  }
}
