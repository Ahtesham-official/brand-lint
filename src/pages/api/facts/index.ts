import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const facts = await serverDb.getFacts();
    return res.status(200).json(facts);
  }

  if (req.method === 'POST') {
    const { claim, source_document, expires_at, status, notes } = req.body;
    if (!claim || !source_document || !expires_at) {
      return res.status(400).json({ error: 'claim, source_document, and expires_at are required' });
    }
    const newFact = await serverDb.createFact({
      claim,
      source_document,
      expires_at,
      status: status || 'active',
      notes,
    });
    return res.status(201).json(newFact);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
