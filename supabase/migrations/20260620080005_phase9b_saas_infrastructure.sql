-- Phase 9B: Multi-Tenant SaaS Infrastructure

-- 1. Core SaaS Tables
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    billing_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, slug)
);

DO $$ BEGIN
    CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role org_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- 2. Tenant Isolation - Adding organization_id to existing content tables
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE IF EXISTS experiments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE IF EXISTS lab_notes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 3. RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Helper: Check if user is super admin (using public.is_admin() from Phase 4)
-- Helper: Get user's org IDs
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF UUID AS $$
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organization Policies
DROP POLICY IF EXISTS "Org: Users can view their orgs" ON organizations;
CREATE POLICY "Org: Users can view their orgs" ON organizations
FOR SELECT USING (id IN (SELECT public.get_user_organizations()) OR public.is_admin());

DROP POLICY IF EXISTS "Org: Admins can update" ON organizations;
CREATE POLICY "Org: Admins can update" ON organizations
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR public.is_admin()
);

-- Workspace Policies
DROP POLICY IF EXISTS "WS: Users can view" ON workspaces;
CREATE POLICY "WS: Users can view" ON workspaces
FOR SELECT USING (organization_id IN (SELECT public.get_user_organizations()) OR public.is_admin());

DROP POLICY IF EXISTS "WS: Admins manage" ON workspaces;
CREATE POLICY "WS: Admins manage" ON workspaces
FOR ALL USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = workspaces.organization_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR public.is_admin()
);

-- Member Policies
DROP POLICY IF EXISTS "Members: View" ON organization_members;
CREATE POLICY "Members: View" ON organization_members
FOR SELECT USING (organization_id IN (SELECT public.get_user_organizations()) OR public.is_admin());

DROP POLICY IF EXISTS "Members: Owner manage" ON organization_members;
CREATE POLICY "Members: Owner manage" ON organization_members
FOR ALL USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organization_members.organization_id AND user_id = auth.uid() AND role = 'owner')
    OR public.is_admin()
);

-- 4. Multi-Tenant Content Isolation Policies
-- Applying tenant isolation to existing tables
DROP POLICY IF EXISTS "Projects: Tenant Isolation" ON projects;
CREATE POLICY "Projects: Tenant Isolation" ON projects
FOR ALL USING (
    (organization_id IN (SELECT public.get_user_organizations()))
    OR (organization_id IS NULL AND published = true) -- Allow public read for global items
    OR public.is_admin()
);

-- 5. Automation
CREATE OR REPLACE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
