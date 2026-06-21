import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type UserRole = "admin" | "moderator" | "creator" | "user";

export const ADMIN_EMAIL = "arpitkumar0211@gmail.com";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  moderator: 3,
  creator: 2,
  user: 1,
};

/**
 * Get user role from profiles table
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const { data: profile, error } = await supabaseServer
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      logger.warn("Failed to fetch user role", { userId, error: error?.message });
      return "user";
    }

    return (profile.role as UserRole) || "user";
  } catch (error) {
    logger.error("Error fetching user role", { userId, error });
    return "user";
  }
}

/**
 * Check if user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "admin";
}

/**
 * Check if user has moderator or higher role
 */
export async function isModerator(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.moderator;
}

/**
 * Check if user has creator or higher role
 */
export async function isCreator(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.creator;
}

/**
 * Check if user has at least the specified role level
 */
export async function hasRoleLevel(userId: string, minRole: UserRole): Promise<boolean> {
  const role = await getUserRole(userId);
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}

/**
 * Set user role in profiles table
 */
export async function setUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      logger.error("Failed to set user role", { userId, role, error: error.message });
      return false;
    }

    logger.info("User role updated successfully", { userId, role });
    return true;
  } catch (error) {
    logger.error("Error setting user role", { userId, role, error });
    return false;
  }
}

/**
 * Get all users with a specific role
 */
export async function getUsersByRole(role: UserRole): Promise<Array<{ id: string; email: string; full_name: string | null }>> {
  try {
    const { data, error } = await supabaseServer
      .from("profiles")
      .select("id, email, full_name")
      .eq("role", role);

    if (error) {
      logger.error("Failed to fetch users by role", { role, error: error.message });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error("Error fetching users by role", { role, error });
    return [];
  }
}

/**
 * Require admin role - throws error if user is not admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  const role = await getUserRole(userId);
  if (role !== "admin") {
    throw new Error("Admin access required");
  }
}

/**
 * Require moderator or higher role - throws error if user is not moderator/admin
 */
export async function requireModerator(userId: string): Promise<void> {
  const hasAccess = await isModerator(userId);
  if (!hasAccess) {
    throw new Error("Moderator access required");
  }
}
