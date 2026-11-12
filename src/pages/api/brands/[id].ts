import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const orgId = typeof req.query.orgId === 'string'
    ? req.query.orgId
    : typeof req.query.id === 'string'
    ? req.query.id
    : undefined;

  if (req.method === 'GET') {
    const brand = await serverDb.getBrand(orgId);
    return res.status(200).json(brand);
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const updates = req.body;
    const updated = await serverDb.updateBrand(updates, orgId);
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
