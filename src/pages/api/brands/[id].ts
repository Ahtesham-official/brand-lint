import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const brand = await serverDb.getBrand();
    return res.status(200).json(brand);
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const updates = req.body;
    const updated = await serverDb.updateBrand(updates);
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
