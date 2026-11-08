import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const issueId = Array.isArray(id) ? id[0] : id;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { updated_caption, actor_id: actorId } = req.body || {};

  if (!updated_caption) {
    return res.status(400).json({ error: 'updated_caption is required' });
  }

  const result = await serverDb.applyFixToIssue(issueId as string, updated_caption, actorId);
  if (!result) {
    return res.status(404).json({ error: 'Issue not found or could not apply fix' });
  }

  return res.status(200).json({
    issue: result.issue,
    submission: result.submission,
    message: 'Fix applied successfully',
  });
}
