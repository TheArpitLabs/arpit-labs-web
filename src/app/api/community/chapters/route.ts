import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch active chapters with statistics
    const { data: chapters, error } = await supabase
      .from('community_chapters')
      .select(`
        *,
        profiles:ambassador_id (
          username,
          avatar_url,
          full_name
        )
      `)
      .eq('is_active', true)
      .order('member_count', { ascending: false })
      .limit(12);

    if (error) throw error;

    return NextResponse.json({ data: chapters });
  } catch (error) {
    console.error('Error in community chapters API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
