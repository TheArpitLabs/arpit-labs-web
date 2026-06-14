import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST() {
  try {
    // Since we can't execute raw SQL through the JS client,
    // return the SQL commands that need to be run manually
    const sqlCommands = `
-- Drop existing policies
DROP POLICY IF EXISTS "public can read published projects" ON public.projects;
DROP POLICY IF EXISTS "admins manage projects" ON public.projects;
DROP POLICY IF EXISTS "owners can manage their projects" ON public.projects;
DROP POLICY IF EXISTS "authenticated can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
DROP POLICY IF EXISTS "Admins have full access to projects" ON public.projects;

-- Create simplified public read policy
CREATE POLICY "public can read published projects"
ON public.projects
FOR SELECT
USING (status = 'published');

-- Create user-specific policies
CREATE POLICY "users can read own projects"
ON public.projects
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "users can insert own projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users can update own projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users can delete own projects"
ON public.projects
FOR DELETE
USING (auth.uid() = owner_id);
`;

    return NextResponse.json({ 
      success: false, 
      message: 'Please run these SQL commands manually in your Supabase SQL Editor',
      sqlCommands: sqlCommands.trim()
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
