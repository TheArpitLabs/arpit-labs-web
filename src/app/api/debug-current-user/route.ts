import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Create client with cookies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: {
          getItem: (key) => {
            const cookie = cookieStore.get(key);
            return cookie?.value ?? null;
          },
          setItem: (key, value) => {
            cookieStore.set(key, value);
          },
          removeItem: (key) => {
            cookieStore.delete(key);
          },
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    return NextResponse.json({
      authenticated: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      sessionId: session?.access_token?.substring(0, 20) + '...' || null,
      sessionUserId: session?.user?.id || null,
      userError: userError?.message || null,
      sessionError: sessionError?.message || null,
      userMatchesSession: user?.id === session?.user?.id,
      expectedProjectOwnerId: '4b45bed4-7b73-4044-a845-f1952b59904f',
      userMatchesExpectedOwner: user?.id === '4b45bed4-7b73-4044-a845-f1952b59904f'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
