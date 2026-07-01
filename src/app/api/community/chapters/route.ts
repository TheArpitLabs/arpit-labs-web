import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeText } from '@/lib/utils/sanitize';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = sanitizeText(url.searchParams.get('q') || '').replace(/[%,]/g, '');
    const country = sanitizeText(url.searchParams.get('country') || '');

    // Fetch active chapters with statistics
    let query = supabase
      .from('community_chapters')
      .select(
        `
        *,
        profiles:ambassador_id (
          username,
          avatar_url,
          full_name
        ),
        community_events (
          id
        )
      `
      )
      .eq('is_active', true)
      .order('member_count', { ascending: false });

    if (q) query = query.or(`name.ilike.%${q}%,city.ilike.%${q}%,country_name.ilike.%${q}%`);
    if (country) query = query.eq('country_name', country);

    const { data: chapters, error } = await query.limit(12);

    if (error) throw error;

    const normalizedChapters = (chapters || []).map((chapter) => ({
      ...chapter,
      events_hosted: chapter.community_events?.length || 0,
      active_projects: 0,
    }));

    return NextResponse.json({ data: normalizedChapters });
  } catch (error) {
    console.error('Error in community chapters API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
