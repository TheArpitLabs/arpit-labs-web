import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get community statistics using RPC
    const { data: stats, error: statsError } = await supabase.rpc('get_community_statistics');

    if (statsError || !stats) {
      console.error('Error fetching community statistics:', statsError);
      // Return fallback data if RPC fails
      return NextResponse.json({
        data: {
          total_members: 0,
          total_countries: 0,
          active_chapters: 0,
          events_hosted: 0,
          projects_collaborated: 0,
          active_contributors: 0,
        },
      });
    }

    // stats is already an array with one row from RPC, extract first element
    const statsRow = Array.isArray(stats) ? stats[0] : stats;

    return NextResponse.json({
      data: {
        total_members: statsRow?.total_members || 0,
        total_countries: statsRow?.total_countries || 0,
        active_chapters: statsRow?.active_chapters || 0,
        events_hosted: statsRow?.events_hosted || 0,
        projects_collaborated: statsRow?.projects_collaborated || 0,
        active_contributors: statsRow?.active_contributors || 0,
      },
    });
  } catch (error) {
    console.error('Error in community statistics API:', error);
    return NextResponse.json({
      data: {
        total_members: 0,
        total_countries: 0,
        active_chapters: 0,
        events_hosted: 0,
        projects_collaborated: 0,
        active_contributors: 0,
      },
    });
  }
}
