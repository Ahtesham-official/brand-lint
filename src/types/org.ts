export type OrgRole = 'admin' | 'creator' | 'reviewer';

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  role?: OrgRole;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  joined_at: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

export interface OrganizationInvite {
  id: string;
  org_id: string;
  token: string;
  role: OrgRole;
  expires_at: string;
  max_uses: number;
  uses_count: number;
  created_by: string;
  revoked: boolean;
  created_at: string;
  org_name?: string;
}

