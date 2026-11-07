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

const VALID_DEMO_USER_IDS = new Set(SEEDED_USERS.map((u) => u.id));

/**
 * Extracts requesting user ID from headers, query, or body.
 * Strictly validates against allowed demo user IDs.
 * Rejects unknown demo profile IDs.
 */
export function getRequestUserId(req: NextApiRequest): string | null {
  const headerUser = req.headers['x-user-id'];
  if (typeof headerUser === 'string' && headerUser.trim()) {
    const id = headerUser.trim();
    return VALID_DEMO_USER_IDS.has(id) ? id : null;
  }

  const queryUser = req.query.userId;
  if (typeof queryUser === 'string' && queryUser.trim()) {
    const id = queryUser.trim();
    return VALID_DEMO_USER_IDS.has(id) ? id : null;
  }

  if (req.body && typeof req.body === 'object' && req.body.userId) {
    const id = String(req.body.userId).trim();
    return VALID_DEMO_USER_IDS.has(id) ? id : null;
  }

  // Fallback to primary demo admin user in local/demo environment if not specified
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

  if (!userId) {
    const error = 'Unauthorized: Unknown or invalid demo profile ID.';
    res.status(401).json({ error });
    return { authorized: false, error, statusCode: 401 };
  }

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

