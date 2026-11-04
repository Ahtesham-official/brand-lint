import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';
import { runCheckEngine } from '@/lib/checkEngine';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const subId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const submission = store.getSubmission(subId as string);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const activeRules = store.getActiveRules();
    const result = runCheckEngine({
      submissionId: submission.id,
      caption: submission.caption,
      imageUrl: submission.image_url,
      brand: store.getBrand(),
      rules: activeRules,
      facts: store.getFacts(),
    });

    return res.status(200).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

