import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const subId = Array.isArray(id) ? id[0] : id;

  if (!subId) {
    return res.status(400).json({ error: 'Submission ID is required' });
  }

  const submission = serverDb.getSubmissionById(subId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  if (req.method === 'GET') {
    const issues = serverDb.getIssues(subId);
    const reviews = serverDb.getReviews(subId);
    return res.status(200).json({
      submission,
      issues,
      reviews,
    });
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    const updated = serverDb.updateSubmission(subId, updates);
    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
