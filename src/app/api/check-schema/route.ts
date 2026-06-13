import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  // Check actual schema by querying one project
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .limit(1);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (data && data.length > 0) {
    return NextResponse.json({ 
      columns: Object.keys(data[0]),
      sample: data[0]
    });
  }
  
  return NextResponse.json({ message: 'No projects found' });
}
