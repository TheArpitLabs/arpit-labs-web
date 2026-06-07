import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { handleDatabaseError } from "@/lib/errors";

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

    // Increment view count
    await supabaseServer
      .from('projects')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', data.id);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/projects/[slug]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
