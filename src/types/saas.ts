export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  billing_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  created_at: string;
}

export interface SaaSStats {
  organizationsCount: number;
  workspacesCount: number;
  totalMembersCount: number;
  activeWorkspacesCount: number;
}
