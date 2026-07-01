import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET() {
  try {
    // Fetch gallery items with like counts
    const { data: gallery, error } = await supabase
      .from('community_gallery')
      .select(
        `
        *,
        profiles:uploaded_by (
          full_name,
          avatar_url,
          username
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;

    // Add likes count to each item
    const galleryWithCounts =
      gallery?.map((item) => ({
        ...item,
        likes_count: item.likes_count || 0,
      })) || [];

    return NextResponse.json({ data: galleryWithCounts });
  } catch (error) {
    console.error('Error in community gallery API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
