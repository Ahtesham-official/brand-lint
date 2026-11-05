import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const issueId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const { updatedCaption, actorId } = req.body;
    if (!issueId || !updatedCaption) {
      return res.status(400).json({ error: 'issueId and updatedCaption are required' });
    }

    const result = serverDb.applyFixToIssue(issueId, updatedCaption, actorId);
    if (!result) {
      return res.status(404).json({ error: 'Issue or submission not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Fix successfully applied and submission text mutated',
      issue: result.issue,
      submission: result.submission,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
