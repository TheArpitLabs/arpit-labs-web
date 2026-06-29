import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch gallery items with like counts
    const { data: gallery, error } = await supabase
      .from('community_gallery')
      .select(`
        *,
        profiles:uploaded_by (
          username,
          avatar_url,
          full_name
        ),
        community_events:event_id (
          title,
          event_type
        ),
        community_chapters:chapter_id (
          name,
          city
        ),
        gallery_likes (id)
      `)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;

    // Add likes count to each item
    const galleryWithCounts = gallery?.map(item => ({
      ...item,
      likes_count: item.gallery_likes?.length || 0
    })) || [];

    return NextResponse.json({ data: galleryWithCounts });
  } catch (error) {
    console.error('Error in community gallery API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
