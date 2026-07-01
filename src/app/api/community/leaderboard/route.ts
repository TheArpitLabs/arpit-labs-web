import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET() {
  try {
    // Fetch leaderboard entries
    const { data: leaderboard, error } = await supabase
      .from('community_leaderboard')
      .select(
        `
        id,
        user_id,
        contribution_score,
        rank_position,
        badges,
        discussions_created,
        replies_count,
        upvotes_received,
        events_attended,
        projects_count,
        profiles:user_id (
          full_name,
          avatar_url,
          username
        )
      `
      )
      .order('contribution_score', { ascending: false })
      .limit(10);

    if (error) throw error;

    const normalizedLeaderboard = (leaderboard || []).map((entry) => {
      const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;

      return {
        ...entry,
        username: profile?.username || '',
        avatar_url: profile?.avatar_url || null,
        full_name: profile?.full_name || null,
        contribution_score: entry.contribution_score,
        projects_count: entry.projects_count,
        discussions_created: entry.discussions_created,
        badges_count: Array.isArray(entry.badges) ? entry.badges.length : 0,
        followers_count: 0,
      };
    });

    return NextResponse.json({ data: normalizedLeaderboard });
  } catch (error) {
    console.error('Error in community leaderboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
