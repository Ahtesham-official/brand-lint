import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrganizationById, deleteOrganization } from '@/lib/orgService';
import { requireOrgRole } from '@/lib/orgPermissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orgId = req.query.id as string;

  if (req.method === 'GET') {
    // Require membership (admin, creator, or reviewer)
    const auth = await requireOrgRole(req, res, orgId, ['admin', 'creator', 'reviewer']);
    if (!auth.authorized) return;

    try {
      const org = await getOrganizationById(orgId, auth.userId);
      if (!org) {
        return res.status(404).json({ error: 'Organisation not found.' });
      }

      return res.status(200).json({ organization: org });
    } catch (err: any) {
      console.error('Error fetching organization:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch organisation.' });
    }
  }

  if (req.method === 'DELETE') {
    // Strictly require Admin role in this specific organisation
    const auth = await requireOrgRole(req, res, orgId, ['admin']);
    if (!auth.authorized) return;

    try {
      const { confirmName } = req.body || {};
      await deleteOrganization({
        orgId,
        userId: auth.userId!,
        confirmName: typeof confirmName === 'string' ? confirmName.trim() : undefined,
      });

      return res.status(200).json({
        success: true,
        message: 'Organisation permanently deleted.',
        deletedOrgId: orgId,
      });
    } catch (err: any) {
      console.error('Error deleting organization:', err);
      const isNotFound = err.message?.toLowerCase().includes('not found');
      return res.status(isNotFound ? 404 : 400).json({
        error: err.message || 'Failed to delete organisation.',
      });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

