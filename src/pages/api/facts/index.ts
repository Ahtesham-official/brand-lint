import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const facts = store.getFacts();
    return res.status(200).json(facts);
  }

  if (req.method === 'POST') {
    const { claim, source_document, source_url, expires_at, status, category, notes } = req.body;
    if (!claim || !source_document || !expires_at) {
      return res.status(400).json({ error: 'Claim, source_document, and expires_at are required' });
    }
    const newFact = store.addFact({
      claim,
      source_document,
      source_url,
      expires_at,
      status: status || 'active',
      category,
      notes,
    });
    return res.status(201).json(newFact);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
