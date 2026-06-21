import { saasRepository } from "@/lib/repositories/saas.repository";
import { getCurrentUser } from "@/lib/auth";
import { OrganizationRole } from "@/types/saas";
import { logger } from "@/lib/logger";

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
  const user = await getCurrentUser();
  
  if (!user) {
    logger.debug('No user found in tenant context');
    return null;
  }

  const organizations = await saasRepository.getOrganizationsForUser(user.id);
  logger.debug('Tenant context retrieved', { 
    userId: user.id, 
    organizationCount: organizations.length 
  });
  
  return {
    user,
    organizations,
  };
}
