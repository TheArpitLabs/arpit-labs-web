import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get all profiles to find the expected user
    const { data: profiles } = await supabaseServer
      .from('profiles')
      .select('id, email')
      .limit(10);

    // Get all projects
    const { data: allProjects } = await supabaseServer
      .from('projects')
      .select('id, title, owner_id');

    // Try to query as each user to see which one returns results
    const results = [];
    
    for (const profile of profiles || []) {
      // Note: This won't actually work with server client since it doesn't have user context
      // But we can check the data directly
      const matchingProjects = allProjects?.filter(p => p.owner_id === profile.id) || [];
      results.push({
        userId: profile.id,
        email: profile.email,
        matchingProjectCount: matchingProjects.length,
        matchingProjects: matchingProjects.map(p => p.title)
      });
    }

    return NextResponse.json({
      profiles: profiles?.length || 0,
      totalProjects: allProjects?.length || 0,
      userProjectMatches: results,
      expectedOwnerId: '4b45bed4-7b73-4044-a845-f1952b59904f',
      expectedOwnerEmail: 'arpitkumar0211@gmail.com'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
