import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check if owner_id column exists in projects table
    let columns = null;
    let columnError = null;
    try {
      const result = await supabaseServer.rpc('get_table_columns', { table_name: 'projects' });
      columns = result.data;
      columnError = result.error;
    } catch (e) {
      columnError = new Error('RPC not available');
    }

    // Alternative: Try to select a project and check its structure
    const { data: sampleProject, error: sampleError } = await supabaseServer
      .from('projects')
      .select('*')
      .limit(1);

    // Check all projects and their owner_id status
    const { data: allProjects, error: allError } = await supabaseServer
      .from('projects')
      .select('id, title, owner_id');

    // Check profiles table
    const { data: profiles, error: profilesError } = await supabaseServer
      .from('profiles')
      .select('id, email')
      .limit(5);

    return NextResponse.json({
      ownerColumnCheck: {
        hasData: !!sampleProject,
        sampleError: sampleError?.message,
        sampleStructure: sampleProject?.[0] ? Object.keys(sampleProject[0]) : [],
        hasOwnerId: sampleProject?.[0] ? 'owner_id' in sampleProject[0] : false
      },
      projectsCheck: {
        count: allProjects?.length || 0,
        error: allError?.message,
        projectsWithOwnerId: allProjects?.filter(p => p.owner_id).length || 0,
        projectsWithoutOwnerId: allProjects?.filter(p => !p.owner_id).length || 0,
        sampleProjects: allProjects?.slice(0, 3)
      },
      profilesCheck: {
        count: profiles?.length || 0,
        error: profilesError?.message,
        sampleProfiles: profiles
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
