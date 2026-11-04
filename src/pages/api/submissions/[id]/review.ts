import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';
import { ReviewDecision } from '@/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const subId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const { decision, comment } = req.body;
    if (!decision || !['approve', 'request_changes'].includes(decision)) {
      return res.status(400).json({ error: 'Valid decision ("approve" or "request_changes") is required' });
    }

    const review = store.submitReview(subId as string, decision as ReviewDecision, comment || '');
    return res.status(200).json({
      success: true,
      review,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
