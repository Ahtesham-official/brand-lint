import type { NextApiRequest, NextApiResponse } from 'next';
import { OrgRole } from '@/types/org';
import { getMemberRole } from './orgService';
import { SEEDED_USERS } from '@/data/seedData';

export interface PermissionCheckResult {
  authorized: boolean;
  userId?: string;
  role?: OrgRole;
  error?: string;
  statusCode?: number;
}

/**
 * Extracts requesting user ID from headers, query, or body.
 * Falls back to demo/local user 0 if not explicitly supplied.
 */
export function getRequestUserId(req: NextApiRequest): string {
  const headerUser = req.headers['x-user-id'];
  if (typeof headerUser === 'string' && headerUser.trim()) {
    return headerUser.trim();
  }

  const queryUser = req.query.userId;
  if (typeof queryUser === 'string' && queryUser.trim()) {
    return queryUser.trim();
  }

  if (req.body && typeof req.body === 'object' && req.body.userId) {
    return String(req.body.userId).trim();
  }

  // Fallback to primary demo admin user in local/demo environment
  return SEEDED_USERS[0].id;
}

/**
 * Reusable permission dependency/middleware: require_role(org_id, allowed_roles)
 * Returns { authorized: true, userId, role } if allowed, or false with error info.
 */
export async function requireOrgRole(
  req: NextApiRequest,
  res: NextApiResponse,
  orgId: string,
  allowedRoles: OrgRole[]
): Promise<PermissionCheckResult> {
  const userId = getRequestUserId(req);

  if (!orgId) {
    const error = 'Missing organisation ID.';
    res.status(400).json({ error });
    return { authorized: false, error, statusCode: 400 };
  }

  const role = await getMemberRole(orgId, userId);

  if (!role) {
    const error = 'Access denied: You are not a member of this organisation.';
    res.status(403).json({ error });
    return { authorized: false, error, statusCode: 403 };
  }

  if (!allowedRoles.includes(role)) {
    const error = `Forbidden: Action requires role [${allowedRoles.join(' or ')}]. Your role in this organisation is '${role}'.`;
    res.status(403).json({ error });
    return { authorized: false, error, statusCode: 403 };
  }

  return {
    authorized: true,
    userId,
    role,
  };
}

