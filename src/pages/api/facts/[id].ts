import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const factId = Array.isArray(id) ? id[0] : id;

  if (!factId) {
    return res.status(400).json({ error: 'Fact ID is required' });
  }

  if (req.method === 'GET') {
    const fact = serverDb.getFactById(factId);
    if (!fact) return res.status(404).json({ error: 'Fact not found' });
    return res.status(200).json(fact);
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    const updated = serverDb.updateFact(factId, updates);
    if (!updated) return res.status(404).json({ error: 'Fact not found' });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const success = serverDb.deleteFact(factId);
    if (!success) return res.status(404).json({ error: 'Fact not found' });
    return res.status(200).json({ success: true, message: `Fact ${factId} deleted` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
