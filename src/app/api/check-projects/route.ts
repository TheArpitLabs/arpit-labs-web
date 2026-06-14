import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key to bypass RLS policies
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const anonSupabase = createClient(supabaseUrl, anonKey);

export async function GET() {
  try {
    // Check all projects with service role (bypasses RLS)
    const { data: serviceProjects, error: serviceError } = await serviceSupabase
      .from('projects')
      .select('*');
    
    // Check projects with anon key (subject to RLS)
    const { data: anonProjects, error: anonError } = await anonSupabase
      .from('projects')
      .select('*')
      .eq('status', 'published');
    
    return NextResponse.json({ 
      success: true, 
      serviceProjectsCount: serviceProjects?.length || 0,
      anonProjectsCount: anonProjects?.length || 0,
      serviceError: serviceError?.message,
      anonError: anonError?.message,
      firstServiceProject: serviceProjects?.[0] || null,
      firstAnonProject: anonProjects?.[0] || null
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: 'Unexpected error'
    }, { status: 500 });
  }
}
