import { saasRepository } from "@/lib/repositories/saas.repository";
import { getCurrentUser } from "@/lib/auth";
import { OrganizationRole } from "@/types/saas";

export async function getCurrentOrganization(slug: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return saasRepository.getOrganizationBySlugForUser(slug, user.id);
}

export async function getCurrentWorkspace(workspaceSlug: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return saasRepository.getWorkspaceBySlugForUser(workspaceSlug, user.id);
}

export async function hasOrganizationPermission(
  organizationId: string,
  userId: string,
  requiredRoles: OrganizationRole[]
) {
  const role = await saasRepository.getOrganizationRole(organizationId, userId);
  return role ? requiredRoles.includes(role as OrganizationRole) : false;
}

export async function getTenantContext() {
  console.log('[getTenantContext] Starting...');
  const user = await getCurrentUser();
  console.log('[getTenantContext] getCurrentUser result:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
  });
  
  if (!user) {
    console.log('[getTenantContext] No user found, returning null');
    return null;
  }

  const organizations = await saasRepository.getOrganizationsForUser(user.id);
  console.log('[getTenantContext] Organizations fetched:', {
    count: organizations.length,
  });
  
  return {
    user,
    organizations,
  };
}
