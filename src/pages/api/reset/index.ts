import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const freshData = serverDb.resetToSeed();
    return res.status(200).json({ success: true, message: 'Database reset to initial demo seed', data: freshData });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

