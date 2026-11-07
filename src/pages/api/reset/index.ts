import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action } = req.body || {};
    if (action === 'load_demo') {
      const demoData = serverDb.loadDemoSeed();
      return res.status(200).json({ success: true, message: 'Loaded demo violation data', data: demoData });
    }
    // Protect shared database: reset is scoped to loading fresh demo seed
    const demoData = serverDb.loadDemoSeed();
    return res.status(200).json({ success: true, message: 'Demo sandbox reset preserved', data: demoData });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

