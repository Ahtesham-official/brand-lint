import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const subId = Array.isArray(id) ? id[0] : id;

  if (!subId) {
    return res.status(400).json({ error: 'Submission ID is required' });
  }

  const submission = store.getSubmission(subId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  if (req.method === 'GET') {
    const issues = store.getIssuesForSubmission(subId);
    const reviews = store.getReviewsForSubmission(subId);
    return res.status(200).json({
      submission,
      issues,
      reviews,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
