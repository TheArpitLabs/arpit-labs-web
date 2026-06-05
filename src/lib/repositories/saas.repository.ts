import { supabaseServer } from "@/lib/supabase/server";
import { Organization, Workspace, OrganizationMember, SaaSStats } from "@/types/saas";
import { handleDatabaseError } from "@/lib/errors";

export const saasRepository = {
  // Organizations
  async getOrganizations() {
    const { data, error } = await supabaseServer
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw handleDatabaseError(error);
    return data as Organization[];
  },

  async getOrganizationBySlug(slug: string) {
    const { data, error } = await supabaseServer
      .from("organizations")
      .select(`
        *,
        workspaces(*),
        members:organization_members(*)
      `)
      .eq("slug", slug)
      .single();

    if (error) throw handleDatabaseError(error);

    // Manually fetch profile info for members to avoid join complexity with auth.users/profiles
    if (data?.members) {
      const userIds = data.members.map((m: any) => m.user_id);
      const { data: profiles } = await supabaseServer
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      
      data.members = data.members.map((m: any) => ({
        ...m,
        user: profiles?.find(p => p.id === m.user_id)
      }));
    }

    return data;
  },

  async createOrganization(payload: { name: string; slug: string; billing_email?: string }) {
    const { data, error } = await supabaseServer
      .from("organizations")
      .insert(payload)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data as Organization;
  },

  async updateOrganization(id: string, payload: Partial<Organization>) {
    const { data, error } = await supabaseServer
      .from("organizations")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data as Organization;
  },

  // Workspaces
  async getWorkspaces(organizationId: string) {
    const { data, error } = await supabaseServer
      .from("workspaces")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });

    if (error) throw handleDatabaseError(error);
    return data as Workspace[];
  },

  async getWorkspaceBySlug(workspaceSlug: string) {
    const { data, error } = await supabaseServer
      .from("workspaces")
      .select("*, organization:organizations(*)")
      .eq("slug", workspaceSlug)
      .single();

    if (error) throw handleDatabaseError(error);
    return data;
  },

  async createWorkspace(payload: { organization_id: string; name: string; slug: string }) {
    const { data, error } = await supabaseServer
      .from("workspaces")
      .insert(payload)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data as Workspace;
  },

  // Membership
  async addOrganizationMember(payload: { organization_id: string; user_id: string; role: string }) {
    const { data, error } = await supabaseServer
      .from("organization_members")
      .insert(payload)
      .select()
      .single();

    if (error) throw handleDatabaseError(error);
    return data as OrganizationMember;
  },

  async removeOrganizationMember(organizationId: string, userId: string) {
    const { error } = await supabaseServer
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (error) throw handleDatabaseError(error);
    return true;
  },

  async getOrganizationRole(organizationId: string, userId: string) {
    const { data, error } = await supabaseServer
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw handleDatabaseError(error);
    return data?.role || null;
  },

  async getAdminStats(): Promise<SaaSStats> {
    const [orgs, ws, members] = await Promise.all([
      supabaseServer.from("organizations").select("id", { count: "exact", head: true }),
      supabaseServer.from("workspaces").select("id", { count: "exact", head: true }),
      supabaseServer.from("organization_members").select("id", { count: "exact", head: true }),
    ]);

    return {
      organizationsCount: orgs.count || 0,
      workspacesCount: ws.count || 0,
      totalMembersCount: members.count || 0,
      activeWorkspacesCount: ws.count || 0,
    };
  }
};
