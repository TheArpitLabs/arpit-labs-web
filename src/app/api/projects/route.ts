import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { projectSchema } from "@/lib/validation/project.schema";
import { handleDatabaseError } from "@/lib/errors";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/projects - List all projects with filters
export async function GET(request: NextRequest) {
  try {
    // Authentication is optional for GET requests - allow public access to published projects
    const user = await getUserFromRequest(request);

    const searchParams = request.nextUrl.searchParams;
    let status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null;
    const project_type = searchParams.get('project_type');
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');
    const owner_id = searchParams.get('owner_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const offset = (page - 1) * limit;

    // If user is not authenticated, only show published projects
    if (!user && !status) {
      status = 'published';
    }

    // Get count first
    let countQuery = supabaseServer
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (project_type) {
      countQuery = countQuery.eq('project_type', project_type);
    }
    if (featured) {
      countQuery = countQuery.eq('featured', true);
    }
    if (owner_id) {
      countQuery = countQuery.eq('owner_id', owner_id);
    }
    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      throw handleDatabaseError(countError);
    }

    // Get data with pagination
    let query = supabaseServer
      .from('projects')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (project_type) {
      query = query.eq('project_type', project_type);
    }
    if (featured) {
      query = query.eq('featured', true);
    }
    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw handleDatabaseError(error);
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({ 
      data, 
      meta: { 
        page,
        limit,
        offset,
        totalCount: totalCount || 0,
        totalPages,
        hasMore: page < totalPages
      } 
    });
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    // Set owner_id to authenticated user
    const payload = {
      ...validatedData,
      owner_id: user.id,
    };

    const { data, error } = await supabaseServer
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw handleDatabaseError(error);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
