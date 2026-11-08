import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { Rule } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const guidelineId = Array.isArray(id) ? id[0] : id;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { version, rules } = req.body;

  if (!version || (version !== 'original' && version !== 'enhanced')) {
    return res.status(400).json({ error: 'version must be either "original" or "enhanced"' });
  }

  const guideline = await serverDb.getGuidelineById(guidelineId as string);
  if (!guideline) {
    return res.status(404).json({ error: 'Guideline not found' });
  }

  let updatedRules: Rule[] = [];
  if (Array.isArray(rules) && rules.length > 0) {
    updatedRules = rules;
    await serverDb.replaceRulesForGuideline(guideline.id, updatedRules);
  } else {
    updatedRules = await serverDb.getRules(guideline.id);
  }

  const updatedGuideline = await serverDb.updateGuideline(guideline.id, {
    selected_version: version,
    rules_count: updatedRules.length,
  });

  await serverDb.createAuditLog({
    actor_id: 'system',
    actor_name: 'Admin',
    actor_role: 'admin',
    action: 'rule_updated',
    entity: 'guideline',
    entity_id: guideline.id,
    meta: {
      action: 'select_version',
      version,
      rules_count: updatedRules.length,
    },
  });

  return res.status(200).json({
    guideline: updatedGuideline,
    rules: updatedRules,
    message: `Active rule set switched to ${version} version (${updatedRules.length} rules)`,
  });
}
