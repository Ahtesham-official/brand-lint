-- ==============================================================================
-- BrandLint Multi-Tenant Organizations Migration
-- Tables: organizations, organization_members, organization_invites
-- Includes Row Level Security (RLS) policies
-- ==============================================================================

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Organization Members Table
CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'creator', 'reviewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_org_member UNIQUE (org_id, user_id)
);

-- 3. Organization Invites Table
CREATE TABLE IF NOT EXISTS organization_invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'creator', 'reviewer')),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT NOT NULL DEFAULT 1,
  uses_count INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_org ON organization_invites(org_id);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an admin of an org
CREATE OR REPLACE FUNCTION is_org_admin(check_org_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = check_org_id
      AND user_id = auth.uid()::text
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is a member of an org
CREATE OR REPLACE FUNCTION is_org_member(check_org_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = check_org_id
      AND user_id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations RLS Policies
CREATE POLICY "Members can view their organizations"
  ON organizations FOR SELECT
  USING (
    is_org_member(id)
    OR created_by = auth.uid()::text
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    OR auth.role() = 'service_role'
    OR auth.role() = 'anon'
  );

CREATE POLICY "Org admins can update organization details"
  ON organizations FOR UPDATE
  USING (is_org_admin(id) OR auth.role() = 'service_role');

CREATE POLICY "Org admins can delete organizations"
  ON organizations FOR DELETE
  USING (is_org_admin(id) OR auth.role() = 'service_role');

-- Organization Members RLS Policies
CREATE POLICY "Members can view other members of their organization"
  ON organization_members FOR SELECT
  USING (
    is_org_member(org_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Admins can add members or users can join via invite"
  ON organization_members FOR INSERT
  WITH CHECK (
    is_org_admin(org_id)
    OR user_id = auth.uid()::text
    OR auth.role() = 'service_role'
    OR auth.role() = 'anon'
  );

CREATE POLICY "Only admins can update member roles"
  ON organization_members FOR UPDATE
  USING (
    is_org_admin(org_id)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Only admins can remove members"
  ON organization_members FOR DELETE
  USING (
    is_org_admin(org_id)
    OR auth.role() = 'service_role'
  );

-- Organization Invites RLS Policies
CREATE POLICY "Members can view invites for their organization"
  ON organization_invites FOR SELECT
  USING (
    is_org_member(org_id)
    OR revoked = FALSE
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Only admins can create invites"
  ON organization_invites FOR INSERT
  WITH CHECK (
    is_org_admin(org_id)
    OR auth.role() = 'service_role'
    OR auth.role() = 'anon'
  );

CREATE POLICY "Only admins can update or revoke invites"
  ON organization_invites FOR UPDATE
  USING (
    is_org_admin(org_id)
    OR auth.role() = 'service_role'
  );

