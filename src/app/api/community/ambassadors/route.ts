import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch approved ambassadors
    const { data: ambassadors, error } = await supabase
      .from('community_ambassadors')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url,
          full_name,
          bio
        ),
        community_chapters:chapter_id (
          name,
          city,
          country_name
        )
      `)
      .eq('status', 'approved')
      .order('achievements', { ascending: false })
      .limit(6);

    if (error) throw error;

    return NextResponse.json({ data: ambassadors });
  } catch (error) {
    console.error('Error in community ambassadors API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
