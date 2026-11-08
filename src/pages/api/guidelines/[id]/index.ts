import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: rawId } = req.query;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) {
    return res.status(400).json({ error: 'Guideline ID is required' });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const actorId = req.body?.actor_id;
    const deleted = await serverDb.deleteGuideline(id, actorId);
    if (!deleted) {
      return res.status(404).json({ error: 'Guideline not found' });
    }
    return res.status(200).json({ success: true, message: 'Guideline and associated rules deleted' });
  }

  // PATCH: toggle enabled/disabled
  if (req.method === 'PATCH') {
    const { enabled, actor_id: actorId } = req.body || {};
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled (boolean) is required' });
    }

    const updated = await serverDb.toggleGuideline(id, enabled, actorId);
    if (!updated) {
      return res.status(404).json({ error: 'Guideline not found' });
    }
    return res.status(200).json(updated);
  }

  // GET single
  if (req.method === 'GET') {
    const guidelines = await serverDb.getGuidelines();
    const found = guidelines.find((g) => g.id === id);
    if (!found) {
      return res.status(404).json({ error: 'Guideline not found' });
    }
    return res.status(200).json(found);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
