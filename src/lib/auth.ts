import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { adminAccessCookieName, adminRefreshCookieName } from "@/lib/auth-constants";

function createBrowserCompatibleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase auth environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getAllowedAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const allowedEmails = getAllowedAdminEmails();
  return allowedEmails.includes(email.toLowerCase());
}

function hasAdminRole(user: { email?: string | null; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
  const appRole = user.app_metadata?.role;
  const metadataRole = user.user_metadata?.role;
  return appRole === "admin" || metadataRole === "admin" || isAdminEmail(user.email);
}

export async function setAdminSessionCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(adminAccessCookieName, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  cookieStore.set(adminRefreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(adminAccessCookieName);
  cookieStore.delete(adminRefreshCookieName);
}

/**
 * Validates the current admin session.
 * Note: Next.js 15 does not allow setting cookies in Server Components.
 * Session refresh should be handled in Middleware or a Route Handler.
 */
export async function getAdminSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(adminAccessCookieName)?.value;
  const refreshToken = cookieStore.get(adminRefreshCookieName)?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  const authClient = createBrowserCompatibleSupabaseClient();
  const { data: sessionData, error: sessionError } = await authClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError || !sessionData.session) {
    return null;
  }

  const currentAccessToken = sessionData.session.access_token;
  const { data: userData, error: userError } = await supabaseServer.auth.getUser(currentAccessToken);

  if (userError || !userData.user || !hasAdminRole(userData.user)) {
    return null;
  }

  return {
    accessToken: currentAccessToken,
    refreshToken: sessionData.session.refresh_token,
    user: userData.user,
  };
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export function getAdminCookieNames() {
  return {
    accessCookieName: adminAccessCookieName,
    refreshCookieName: adminRefreshCookieName,
  };
}
