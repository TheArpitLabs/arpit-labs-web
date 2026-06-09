import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = supabaseServer;
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (userError) {
      return NextResponse.json({ error: 'User error', details: userError.message }, { status: 500 });
    }

    if (sessionError) {
      return NextResponse.json({ error: 'Session error', details: sessionError.message }, { status: 500 });
    }

    return NextResponse.json({
      userId: user?.id || null,
      email: user?.email || null,
      sessionId: session?.access_token || null,
      sessionUserId: session?.user?.id || null,
      hasUser: !!user,
      hasSession: !!session,
      userMatchesSession: user?.id === session?.user?.id
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
