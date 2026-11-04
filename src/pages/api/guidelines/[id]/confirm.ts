import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const guidelineId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    if (!guidelineId) {
      return res.status(400).json({ error: 'Guideline ID is required' });
    }
    store.confirmGuideline(guidelineId);
    return res.status(200).json({
      success: true,
      message: `Guideline ${guidelineId} confirmed. Extracted rules are now active for the check engine.`,
      activeRulesCount: store.getActiveRules().length,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
