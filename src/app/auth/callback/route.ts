import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { setUserSessionCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const provider = requestUrl.searchParams.get("provider") || "unknown";

  console.log(`[OAuth Callback] Received callback for provider: ${provider}`);

  if (code) {
    const supabase = supabaseServer;
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error(`[OAuth Callback] Error exchanging code for session:`, error);
        return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`);
      }

      console.log(`[OAuth Success] Session created for user: ${data.user?.id}`);
      
      // Set session cookies
      if (data.session) {
        await setUserSessionCookies(data.session.access_token, data.session.refresh_token);
        console.log(`[OAuth Success] Session cookies set`);
      }

      // Create profile if it doesn't exist
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (!existingProfile) {
          console.log(`[Profile Created] Creating profile for user: ${data.user.id}`);
          
          const fullName = data.user.user_metadata?.full_name || 
                          data.user.user_metadata?.name || 
                          data.user.email?.split("@")[0];
          
          const avatarUrl = data.user.user_metadata?.avatar_url || 
                           data.user.user_metadata?.picture;

          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email || "",
              full_name: fullName,
              avatar_url: avatarUrl || null,
            });

          if (profileError) {
            console.error(`[Profile Created] Error creating profile:`, profileError);
          } else {
            console.log(`[Profile Created] Profile created successfully`);
          }
        } else {
          console.log(`[Profile Created] Profile already exists, skipping creation`);
        }
      }

      console.log(`[Redirecting to Profile] Redirecting to /profile`);
      return NextResponse.redirect(`${requestUrl.origin}/profile`);
      
    } catch (error) {
      console.error(`[OAuth Callback] Unexpected error:`, error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_error`);
    }
  }

  console.log(`[OAuth Callback] No code found, redirecting to login`);
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
