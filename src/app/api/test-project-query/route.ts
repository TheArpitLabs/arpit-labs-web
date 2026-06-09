import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const expectedUserId = '4b45bed4-7b73-4044-a845-f1952b59904f';
    
    // Test query with expected user ID (bypassing RLS for debugging)
    const { data: projects, error } = await supabaseServer
      .from('projects')
      .select('*')
      .eq('owner_id', expectedUserId);

    // Also test without filter to see all projects
    const { data: allProjects } = await supabaseServer
      .from('projects')
      .select('*');

    return NextResponse.json({
      expectedUserId,
      queryResult: {
        count: projects?.length || 0,
        error: error?.message,
        projects: projects
      },
      allProjectsCount: allProjects?.length || 0,
      allProjects: allProjects
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
