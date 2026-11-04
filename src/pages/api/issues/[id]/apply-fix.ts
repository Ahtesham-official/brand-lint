import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const issueId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const { updatedCaption } = req.body;
    if (!issueId || !updatedCaption) {
      return res.status(400).json({ error: 'issueId and updatedCaption are required' });
    }

    store.applyFix(issueId, updatedCaption);
    return res.status(200).json({
      success: true,
      message: 'Fix successfully applied and submission text updated',
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

