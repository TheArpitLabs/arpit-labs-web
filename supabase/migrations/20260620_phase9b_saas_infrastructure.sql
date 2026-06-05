-- Phase 9B: Multi-Tenant SaaS Infrastructure

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    billing_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workspaces (within Organizations)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, slug)
);

-- Organization Members
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role org_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS SETOF UUID AS $$
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = org_id AND user_id = auth.uid()
    );
$$ LANGUAGE plpgsql STABLE;

-- RLS Policies for Organizations
CREATE POLICY "Users can view organizations they belong to"
ON organizations FOR SELECT
USING (id IN (SELECT get_user_organizations()));

CREATE POLICY "Owners and Admins can update organizations"
ON organizations FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
));

-- RLS Policies for Workspaces
CREATE POLICY "Users can view workspaces in their organizations"
ON workspaces FOR SELECT
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Owners and Admins can manage workspaces"
ON workspaces FOR ALL
USING (EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = workspaces.organization_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
));

-- RLS Policies for Organization Members
CREATE POLICY "Members can see other members in their organization"
ON organization_members FOR SELECT
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Owners can manage organization members"
ON organization_members FOR ALL
USING (EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = organization_members.organization_id AND user_id = auth.uid() AND role = 'owner'
));

-- RLS Policies for Workspace Members
CREATE POLICY "Members can see other workspace members"
ON workspace_members FOR SELECT
USING (workspace_id IN (
    SELECT id FROM workspaces WHERE organization_id IN (SELECT get_user_organizations())
));

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
