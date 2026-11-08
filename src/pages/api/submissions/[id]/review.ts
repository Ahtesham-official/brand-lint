import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { ReviewDecision } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const subId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const { decision, comment, reviewer_id } = req.body;
    if (!decision || !['approve', 'request_changes'].includes(decision)) {
      return res.status(400).json({ error: 'Valid decision ("approve" or "request_changes") is required' });
    }

    const review = await serverDb.createReview({
      submission_id: subId as string,
      reviewer_id: reviewer_id || 'usr-reviewer-01',
      decision: decision as ReviewDecision,
      comment: comment || '',
    });

    const sub = await serverDb.getSubmissionById(subId as string);

    return res.status(200).json({
      success: true,
      review,
      submission: sub,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
