import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const orgId = typeof req.query.orgId === 'string' ? req.query.orgId : undefined;
    const logs = await serverDb.getAuditLogs(orgId);
    return res.status(200).json(logs);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
