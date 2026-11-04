import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const user = store.getCurrentUser();
    return res.status(200).json({ user, demoMode: store.isDemoMode() });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
