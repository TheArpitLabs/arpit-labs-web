import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET() {
  try {
    // Fetch upcoming events
    const { data: events, error } = await supabase
      .from('community_events')
      .select(
        `
        id,
        title,
        slug,
        description,
        event_type,
        status,
        start_date,
        end_date,
        location,
        mode,
        online_url,
        max_attendees,
        current_attendees,
        cover_image,
        community_chapters (
          name,
          city,
          country_name
        )
      `
      )
      .eq('status', 'upcoming')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(6);

    if (error) throw error;

    const normalizedEvents = (events || []).map((event) => ({
      ...event,
      is_online: event.mode === 'online',
      max_seats: event.max_attendees,
      available_seats:
        typeof event.max_attendees === 'number' && typeof event.current_attendees === 'number'
          ? Math.max(0, event.max_attendees - event.current_attendees)
          : null,
    }));

    return NextResponse.json({ data: normalizedEvents });
  } catch (error) {
    console.error('Error in community events API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
