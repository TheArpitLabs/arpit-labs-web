import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch open collaborations
    const { data: collaborations, error } = await supabase
      .from('community_collaborations')
      .select(`
        *,
        profiles:created_by (
          username,
          avatar_url,
          full_name
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    return NextResponse.json({ data: collaborations });
  } catch (error) {
    console.error('Error in community collaborations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
