import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const guidelineId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const actorId = req.body?.actor_id;
    const result = await serverDb.confirmGuideline(guidelineId as string, actorId);
    if (!result) {
      return res.status(404).json({ error: 'Guideline not found' });
    }

    const allRules = await serverDb.getRules();
    const activeRules = allRules.filter((r) => r.status === 'confirmed');

    return res.status(200).json({
      guideline: result.guideline,
      confirmed_rules_count: result.rulesCount,
      active_rules_count: activeRules.length,
      message: `Guideline confirmed. ${result.rulesCount} rules are now active in the check engine.`,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
