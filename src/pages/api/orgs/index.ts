import type { NextApiRequest, NextApiResponse } from 'next';
import { createOrganization, getUserOrganizations } from '@/lib/orgService';
import { getRequestUserId } from '@/lib/orgPermissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Unknown or invalid demo profile ID.' });
  }

  if (req.method === 'GET') {
    try {
      const orgs = await getUserOrganizations(userId);
      return res.status(200).json({ organizations: orgs });
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch organisations.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body || {};

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Organisation name is required.' });
      }

      const result = await createOrganization({
        name,
        description,
        userId,
      });

      return res.status(201).json(result);
    } catch (err: any) {
      console.error('Error creating organization:', err);
      return res.status(500).json({ error: err.message || 'Failed to create organisation.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

