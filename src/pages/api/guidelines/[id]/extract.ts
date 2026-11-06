import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { extractRulesFromGuidelineText } from '@/lib/ruleExtractor';
import { analyzeAndEnhanceGuideline } from '@/lib/guidelineEnhancer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const guidelineId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const guideline = serverDb.getGuidelineById(guidelineId as string);
    if (!guideline) {
      return res.status(404).json({ error: 'Guideline not found' });
    }

    // 1. Extract enforceable rules
    const rules = await extractRulesFromGuidelineText(guideline.raw_text, guideline.id);
    serverDb.replaceRulesForGuideline(guideline.id, rules);

    // 2. Generate AI Comprehension Analysis & Enhanced Guideline Version
    const { analysis, enhanced_version } = await analyzeAndEnhanceGuideline(guideline.raw_text);

    // 3. Update guideline in database
    const updated = serverDb.updateGuideline(guideline.id, {
      ai_analysis: analysis,
      enhanced_version: enhanced_version,
      selected_version: guideline.selected_version || 'original',
      status: 'extracted',
    });

    return res.status(200).json({
      success: true,
      guidelineId: guideline.id,
      extractedCount: rules.length,
      rules,
      analysis,
      enhanced_version,
      guideline: updated,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
