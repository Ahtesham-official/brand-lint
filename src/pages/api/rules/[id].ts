import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const ruleId = Array.isArray(id) ? id[0] : id;

  if (!ruleId) {
    return res.status(400).json({ error: 'Rule ID is required' });
  }

  if (req.method === 'GET') {
    const rule = await serverDb.getRuleById(ruleId);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    return res.status(200).json(rule);
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { actor_id: actorId, ...updates } = req.body || {};
    const updated = await serverDb.updateRule(ruleId, updates, actorId);
    if (!updated) return res.status(404).json({ error: 'Rule not found' });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const actorId = req.body?.actor_id;
    const success = await serverDb.deleteRule(ruleId, actorId);
    if (!success) return res.status(404).json({ error: 'Rule not found' });
    return res.status(200).json({ success: true, id: ruleId });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
