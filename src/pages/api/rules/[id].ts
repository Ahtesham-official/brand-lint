import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const ruleId = Array.isArray(id) ? id[0] : id;

  if (!ruleId) {
    return res.status(400).json({ error: 'Rule ID is required' });
  }

  if (req.method === 'GET') {
    const rule = serverDb.getRuleById(ruleId);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    return res.status(200).json(rule);
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    const updated = serverDb.updateRule(ruleId, updates);
    if (!updated) return res.status(404).json({ error: 'Rule not found' });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const success = serverDb.deleteRule(ruleId);
    if (!success) return res.status(404).json({ error: 'Rule not found' });
    return res.status(200).json({ success: true, message: `Rule ${ruleId} deleted` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
