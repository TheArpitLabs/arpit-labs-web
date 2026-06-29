import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch upcoming events
    const { data: events, error } = await supabase
      .from('community_events')
      .select(`
        *,
        profiles:organizer_id (
          username,
          avatar_url,
          full_name
        ),
        community_chapters:chapter_id (
          name,
          city,
          country_name
        )
      `)
      .eq('status', 'upcoming')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(6);

    if (error) throw error;

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error('Error in community events API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
