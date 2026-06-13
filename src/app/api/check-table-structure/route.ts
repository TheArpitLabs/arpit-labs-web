import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  // Try to insert a minimal project to see what columns are required
  const testProject = {
    title: 'Test',
    slug: 'test-' + Date.now(),
    description: 'Test description'
  };
  
  const { data, error } = await supabase
    .from('projects')
    .insert(testProject)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message, details: error });
  }
  
  // Clean up
  if (data) {
    await supabase.from('projects').delete().eq('id', data.id);
  }
  
  return NextResponse.json({ 
    success: true,
    insertedData: data,
    columns: data ? Object.keys(data) : []
  });
}
