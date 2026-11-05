import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const brand = serverDb.getBrand();
    return res.status(200).json(brand);
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    const updated = serverDb.updateBrand(updates);
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
