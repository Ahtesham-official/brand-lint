import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const factId = Array.isArray(id) ? id[0] : id;

  if (!factId) {
    return res.status(400).json({ error: 'Fact ID is required' });
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    store.updateFact(factId, updates);
    const updated = store.getFacts().find((f) => f.id === factId);
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    store.deleteFact(factId);
    return res.status(200).json({ success: true, message: `Fact ${factId} deleted` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

