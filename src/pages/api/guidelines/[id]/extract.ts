import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';
import { extractRulesFromGuidelineText } from '@/lib/ruleExtractor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const guidelineId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const guideline = store.getGuidelines().find((g) => g.id === guidelineId);
    if (!guideline) {
      return res.status(404).json({ error: 'Guideline not found' });
    }

    const rules = await extractRulesFromGuidelineText(guideline.raw_text, guideline.id);
    store.setRulesForGuideline(guideline.id, rules);

    return res.status(200).json({
      success: true,
      guidelineId: guideline.id,
      extractedCount: rules.length,
      rules,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

