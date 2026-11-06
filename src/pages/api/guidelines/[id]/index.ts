import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  // ---- DELETE: remove guideline + its rules ----
  if (req.method === 'DELETE') {
    try {
      const actorId = (req.headers['x-user-id'] as string) || undefined;
      const deleted = serverDb.deleteGuideline(id, actorId);
      if (!deleted) {
        return res.status(404).json({ error: 'Guideline not found' });
      }
      return res.status(200).json({ success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  }

  // ---- PATCH: toggle enable/disable ----
  if (req.method === 'PATCH') {
    try {
      const { enabled } = req.body as { enabled: boolean };
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: '`enabled` (boolean) is required in body' });
      }
      const actorId = (req.headers['x-user-id'] as string) || undefined;
      const updated = serverDb.toggleGuideline(id, enabled, actorId);
      if (!updated) {
        return res.status(404).json({ error: 'Guideline not found' });
      }
      return res.status(200).json({ success: true, guideline: updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  }

  // ---- GET: fetch single guideline ----
  if (req.method === 'GET') {
    try {
      const guidelines = serverDb.getGuidelines();
      const gl = guidelines.find((g) => g.id === id);
      if (!gl) return res.status(404).json({ error: 'Guideline not found' });
      return res.status(200).json(gl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: msg });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
