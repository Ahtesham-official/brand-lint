import type { NextApiRequest, NextApiResponse } from 'next';
import { updateMemberRole, removeMember } from '@/lib/orgService';
import { requireOrgRole } from '@/lib/orgPermissions';
import { OrgRole } from '@/types/org';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orgId = req.query.id as string;
  const targetUserId = req.query.user_id as string;

  if (!orgId || !targetUserId) {
    return res.status(400).json({ error: 'Missing organisation ID or user ID.' });
  }

  // Both operations are strictly admin-only
  const auth = await requireOrgRole(req, res, orgId, ['admin']);
  if (!auth.authorized) return;

  if (req.method === 'PATCH') {
    try {
      const { role } = req.body || {};
      if (!role || !['admin', 'creator', 'reviewer'].includes(role)) {
        return res.status(400).json({
          error: "Invalid role. Role must be 'admin', 'creator', or 'reviewer'.",
        });
      }

      const updated = await updateMemberRole({
        orgId,
        targetUserId,
        newRole: role as OrgRole,
      });

      return res.status(200).json({ member: updated });
    } catch (err: any) {
      console.error('Error updating member role:', err);
      return res.status(400).json({ error: err.message || 'Failed to update member role.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await removeMember({
        orgId,
        targetUserId,
      });

      return res.status(200).json({ success: true, removedUserId: targetUserId });
    } catch (err: any) {
      console.error('Error removing member:', err);
      return res.status(400).json({ error: err.message || 'Failed to remove member.' });
    }
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

