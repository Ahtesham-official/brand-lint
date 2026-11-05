import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const guidelineId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'GET') {
    const rules = serverDb.getRules(guidelineId);
    return res.status(200).json(rules);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
