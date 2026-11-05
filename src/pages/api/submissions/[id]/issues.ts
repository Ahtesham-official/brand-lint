import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const subId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'GET') {
    const issues = serverDb.getIssues(subId as string);
    return res.status(200).json(issues);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
