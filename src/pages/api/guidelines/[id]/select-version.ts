import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { extractRulesFromGuidelineText } from '@/lib/ruleExtractor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const guidelineId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const { version } = req.body; // 'original' | 'enhanced'
    if (!version || (version !== 'original' && version !== 'enhanced')) {
      return res.status(400).json({ error: 'Valid version ("original" or "enhanced") is required' });
    }

    const guideline = serverDb.getGuidelineById(guidelineId as string);
    if (!guideline) {
      return res.status(404).json({ error: 'Guideline not found' });
    }

    const textToUse = version === 'enhanced' && guideline.enhanced_version
      ? guideline.enhanced_version
      : guideline.raw_text;

    // Re-extract rules from the chosen version
    const updatedRules = await extractRulesFromGuidelineText(textToUse, guideline.id);
    serverDb.replaceRulesForGuideline(guideline.id, updatedRules);

    const updatedGuideline = serverDb.updateGuideline(guideline.id, {
      selected_version: version,
      rules_count: updatedRules.length,
    });

    serverDb.createAuditLog({
      actor_id: 'usr-admin-01',
      actor_name: 'Sarah Chen',
      actor_role: 'admin',
      action: 'guideline_extracted',
      entity: 'guideline',
      entity_id: guideline.id,
      meta: {
        selected_version: version,
        active_rules_count: updatedRules.length,
      },
    });

    return res.status(200).json({
      success: true,
      selected_version: version,
      guideline: updatedGuideline,
      rules: updatedRules,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

