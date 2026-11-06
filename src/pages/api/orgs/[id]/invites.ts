import type { NextApiRequest, NextApiResponse } from 'next';
import { createInvite } from '@/lib/orgService';
import { requireOrgRole } from '@/lib/orgPermissions';
import { OrgRole } from '@/types/org';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orgId = req.query.id as string;

  if (req.method === 'POST') {
    // Admin only
    const auth = await requireOrgRole(req, res, orgId, ['admin']);
    if (!auth.authorized) return;

    try {
      const { role, expires_in_hours, max_uses } = req.body || {};

      const inviteRole: OrgRole = ['admin', 'creator', 'reviewer'].includes(role)
        ? role
        : 'creator';

      const expiresInHours = Number(expires_in_hours) || 48;
      const maxUses = Number(max_uses) || 5;

      const invite = await createInvite({
        orgId,
        role: inviteRole,
        expiresInHours,
        maxUses,
        userId: auth.userId!,
      });

      // Construct join link relative or absolute
      const host = req.headers.host || 'localhost:3000';
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const joinUrl = `${protocol}://${host}/orgs/join?token=${invite.token}`;

      return res.status(201).json({
        invite,
        joinUrl,
      });
    } catch (err: any) {
      console.error('Error generating invite:', err);
      return res.status(500).json({ error: err.message || 'Failed to create invitation.' });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

