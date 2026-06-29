import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { adminAccessCookieName, adminRefreshCookieName, userAccessCookieName, userRefreshCookieName } from "@/lib/auth/auth-constants";
import { logger } from "@/lib/logger";
import { getUserRole } from "./admin";

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

async function setSessionCookies(accessToken: string, refreshToken: string, accessCookie: string, refreshCookie: string, maxAge?: number) {
  const cookieStore = await cookies();

  cookieStore.set(accessCookie, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAge || 60 * 60 * 24 * 7, // Default 7 days, or custom maxAge
  });

  cookieStore.set(refreshCookie, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAge || 60 * 60 * 24 * 30, // Default 30 days, or custom maxAge
  });
}

async function clearSessionCookies(accessCookie: string, refreshCookie: string) {
  const cookieStore = await cookies();
  cookieStore.delete(accessCookie);
  cookieStore.delete(refreshCookie);
}

export async function setUserSessionCookies(accessToken: string, refreshToken: string, maxAge?: number) {
  logger.debug('Setting user session cookies', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    maxAge,
  });
  await setSessionCookies(accessToken, refreshToken, userAccessCookieName, userRefreshCookieName, maxAge);
  logger.debug('User session cookies set successfully');
}

export async function clearUserSessionCookies() {
  await clearSessionCookies(userAccessCookieName, userRefreshCookieName);
}

export async function getUserSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userAccessCookieName)?.value;
  const refreshToken = cookieStore.get(userRefreshCookieName)?.value;

  if (!accessToken || !refreshToken) {
    logger.debug('Missing user session tokens');
    return null;
  }

  const authClient = createBrowserCompatibleSupabaseClient();
  const { data: sessionData, error: sessionError } = await authClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError || !sessionData.session) {
    logger.warn('User session error or no session', { error: sessionError?.message });
    return null;
  }

  const currentAccessToken = sessionData.session.access_token;
  const { data: userData, error: userError } = await supabaseServer.auth.getUser(currentAccessToken);

  if (userError || !userData.user) {
    logger.warn('User error or no user', { error: userError?.message });
    return null;
  }

  logger.debug('User session retrieved successfully', { email: userData.user.email });
  return {
    accessToken: currentAccessToken,
    refreshToken: sessionData.session.refresh_token,
    user: userData.user,
  };
}

export async function getCurrentUser() {
  const session = await getUserSession();
  return session?.user ?? null;
}

export async function requireUser() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  return session.user;
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

export async function hasAdminRole(user: { id?: string; email?: string | null; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
  // Check profiles.role first (primary source of truth)
  if (user.id) {
    try {
      const role = await getUserRole(user.id);
      if (role === "admin") {
        return true;
      }
    } catch (error) {
      logger.warn("Failed to check user role from profiles", { userId: user.id, error });
    }
  }

  // Fallback to app_metadata and user_metadata for backward compatibility
  const appRole = user.app_metadata?.role;
  const metadataRole = user.user_metadata?.role;
  return appRole === "admin" || metadataRole === "admin" || isAdminEmail(user.email);
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function getUserTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace("Bearer ", "").trim();

  if (token) {
    return token;
  }

  return getCookieValue(request.headers.get("cookie"), userAccessCookieName);
}

export function getUserRefreshTokenFromRequest(request: Request) {
  return getCookieValue(request.headers.get("cookie"), userRefreshCookieName);
}

export async function getUserFromRequest(request: Request) {
  const token = getUserTokenFromRequest(request);
  if (!token) return null;

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(token);
  if (userError || !userData.user) {
    return null;
  }

  return userData.user;
}

export async function createAuthenticatedSupabaseClient(accessToken: string, refreshToken?: string) {
  const authClient = createBrowserCompatibleSupabaseClient();
  const { data: sessionData, error: sessionError } = await authClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || accessToken,
  });

  if (sessionError || !sessionData.session) {
    return null;
  }

  return authClient;
}

export async function setAdminSessionCookies(accessToken: string, refreshToken: string, maxAge?: number) {
  const cookieStore = await cookies();

  cookieStore.set(adminAccessCookieName, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAge || 60 * 60 * 24 * 7,
  });

  cookieStore.set(adminRefreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAge || 60 * 60 * 24 * 30,
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

  if (userError || !userData.user || !(await hasAdminRole(userData.user))) {
    return null;
  }

  return {
    accessToken: currentAccessToken,
    refreshToken: sessionData.session.refresh_token,
    user: userData.user,
  };
}

export async function getAdminUserFromRequest(request: Request) {
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    getCookieValue(request.headers.get("cookie"), adminAccessCookieName);

  if (!token) {
    return null;
  }

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(token);

  if (userError || !userData.user || !(await hasAdminRole(userData.user))) {
    return null;
  }

  return userData.user;
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
