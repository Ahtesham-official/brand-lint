import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const ruleId = Array.isArray(id) ? id[0] : id;

  if (!ruleId) {
    return res.status(400).json({ error: 'Rule ID is required' });
  }

  if (req.method === 'PATCH') {
    const updates = req.body;
    store.updateRule(ruleId, updates);
    const updatedRule = store.getRules().find((r) => r.id === ruleId);
    return res.status(200).json(updatedRule);
  }

  if (req.method === 'DELETE') {
    store.deleteRule(ruleId);
    return res.status(200).json({ success: true, message: `Rule ${ruleId} deleted` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
