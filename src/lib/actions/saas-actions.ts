"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { saasRepository } from "@/lib/repositories/saas.repository";
import { getUserSession } from "@/lib/auth/auth";
import { OrganizationRole } from "@/types/saas";
import { z } from "zod";

const organizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  billing_email: z.string().email().optional().or(z.literal("")),
});

const workspaceSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
});

const inviteMemberSchema = z.object({
  organization_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'member']),
});

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function getAuthenticatedUser() {
  const session = await getUserSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function requireOrganizationRole(
  organizationId: string,
  userId: string,
  allowedRoles: OrganizationRole[] = ["owner", "admin"]
) {
  const role = await saasRepository.getOrganizationRole(organizationId, userId);
  if (!role || !allowedRoles.includes(role as OrganizationRole)) {
    throw new Error("Insufficient permissions");
  }
  return role as OrganizationRole;
}

export async function createOrganizationAction(formData: FormData) {
  const user = await getAuthenticatedUser();

  const payload = organizationSchema.parse({
    name: asString(formData.get("name")),
    slug: asString(formData.get("slug")),
    billing_email: asString(formData.get("billing_email")),
  });

  const org = await saasRepository.createOrganization(payload);

  // Add creator as owner
  await saasRepository.addOrganizationMember({
    organization_id: org.id,
    user_id: user.id,
    role: "owner",
  });

  revalidatePath("/organizations");
  redirect(`/organizations/${org.slug}`);
}

export async function createWorkspaceAction(formData: FormData) {
  const user = await getAuthenticatedUser();

  const payload = workspaceSchema.parse({
    organization_id: asString(formData.get("organization_id")),
    name: asString(formData.get("name")),
    slug: asString(formData.get("slug")),
  });

  await requireOrganizationRole(payload.organization_id, user.id, ["owner", "admin"]);

  const workspace = await saasRepository.createWorkspace(payload);

  revalidatePath(`/organizations`);
  redirect(`/workspaces/${workspace.slug}`);
}

export async function updateOrganizationAction(formData: FormData) {
  const user = await getAuthenticatedUser();
  const id = asString(formData.get("id"));
  const payload = organizationSchema.partial().parse({
    name: asString(formData.get("name")),
    billing_email: asString(formData.get("billing_email")),
  });

  await requireOrganizationRole(id, user.id, ["owner", "admin"]);
  await saasRepository.updateOrganization(id, payload);
  revalidatePath(`/organizations`);
}

export async function inviteMemberAction(formData: FormData) {
  const user = await getAuthenticatedUser();
  const payload = inviteMemberSchema.parse({
    organization_id: asString(formData.get("organization_id")),
    email: asString(formData.get("email")),
    role: asString(formData.get("role")),
  });

  await requireOrganizationRole(payload.organization_id, user.id, ["owner", "admin"]);

  const { data: userData, error: userError } = await supabaseServer
    .from("profiles")
    .select("id")
    .eq("email", payload.email)
    .single();

  if (userError || !userData) {
    throw new Error("User not found. Invitations currently require an existing user account.");
  }

  await saasRepository.addOrganizationMember({
    organization_id: payload.organization_id,
    user_id: userData.id,
    role: payload.role,
  });

  revalidatePath(`/organizations`);
}

export async function removeMemberAction(formData: FormData) {
  const user = await getAuthenticatedUser();
  const organizationId = asString(formData.get("organization_id"));
  const userId = asString(formData.get("user_id"));

  await requireOrganizationRole(organizationId, user.id, ["owner", "admin"]);
  await saasRepository.removeOrganizationMember(organizationId, userId);
  revalidatePath(`/organizations`);
}
