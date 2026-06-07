import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { projectSchema } from "@/lib/validation/project.schema";
import { handleDatabaseError } from "@/lib/errors";

// GET /api/projects - List all projects with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null;
    const project_type = searchParams.get('project_type');
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');
    const owner_id = searchParams.get('owner_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    return NextResponse.json({ data, meta: { limit, offset, total: data?.length || 0 } });
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
    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    const { data, error } = await supabaseServer
      .from('projects')
      .insert(validatedData)
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
