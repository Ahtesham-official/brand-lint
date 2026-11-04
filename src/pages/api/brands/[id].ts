import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const brand = store.getBrand();

  if (req.method === 'GET') {
    return res.status(200).json(brand);
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    store.updateBrand(updates);
    return res.status(200).json(store.getBrand());
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

