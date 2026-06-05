import { supabaseServer } from "@/lib/supabase/server";
import { saasRepository } from "@/lib/repositories/saas.repository";
import { OrganizationRole } from "@/types/saas";

export async function getCurrentOrganization(slug: string) {
  return saasRepository.getOrganizationBySlug(slug);
}

export async function getCurrentWorkspace(orgSlug: string, workspaceSlug: string) {
  return saasRepository.getWorkspaceBySlug(orgSlug, workspaceSlug);
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
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return null;

  const organizations = await saasRepository.getOrganizations();
  return {
    user,
    organizations
  };
}
