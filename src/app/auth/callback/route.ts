import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasAdminRole, setAdminSessionCookies, setUserSessionCookies } from "@/lib/auth/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const provider = requestUrl.searchParams.get("provider") || "unknown";

  logger.debug(`OAuth callback received for provider: ${provider}`);

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Missing Supabase environment variables');
      return NextResponse.redirect(`${requestUrl.origin}/login?error=config_error`);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`
        }
      }
    });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        logger.error('Error exchanging code for session', { error });
        return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`);
      }

      logger.debug(`Session created for user: ${data.user?.id}`);
      
      // Set session cookies
      if (data.session) {
        await setUserSessionCookies(data.session.access_token, data.session.refresh_token);
        if (data.user && await hasAdminRole(data.user)) {
          await setAdminSessionCookies(data.session.access_token, data.session.refresh_token);
        }
        logger.debug('Session cookies set');
      }

      // Create profile if it doesn't exist
      if (data.user) {
        try {
          const { data: existingProfile, error: selectError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (selectError && selectError.code !== 'PGRST116') {
            logger.error('Error checking profile', { error: selectError });
          }

          if (!existingProfile) {
            logger.debug(`Creating profile for user: ${data.user.id}`);
            
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
              logger.error('Error creating profile', { error: profileError });
              // Don't fail the entire flow if profile creation fails
            } else {
              logger.debug('Profile created successfully');
            }
          } else {
            logger.debug('Profile already exists, skipping creation');
          }
        } catch (profileError) {
          logger.error('Unexpected error during profile creation', { error: profileError });
          // Don't fail the entire flow if profile creation fails
        }
      }

      const redirectTo = data.user && await hasAdminRole(data.user) ? "/admin" : "/dashboard";
      logger.debug(`Redirecting to ${redirectTo}`);
      return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
      
    } catch (error) {
      logger.error('Unexpected OAuth callback error', { error });
      return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_error`);
    }
  }

  logger.debug('No code found, redirecting to login');
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
