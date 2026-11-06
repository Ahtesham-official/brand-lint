import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrganizationMembers } from '@/lib/orgService';
import { requireOrgRole } from '@/lib/orgPermissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orgId = req.query.id as string;

  if (req.method === 'GET') {
    // Accessible to all members of this org
    const auth = await requireOrgRole(req, res, orgId, ['admin', 'creator', 'reviewer']);
    if (!auth.authorized) return;

    try {
      const members = await getOrganizationMembers(orgId);
      return res.status(200).json({ members });
    } catch (err: any) {
      console.error('Error fetching members:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch organisation members.' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

