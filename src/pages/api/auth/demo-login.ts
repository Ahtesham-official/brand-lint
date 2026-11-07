import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { UserRole } from '@/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { role, userId } = req.body || {};
    const users = serverDb.getUsers();

    if (userId) {
      const found = serverDb.getUserById(userId);
      if (!found) {
        return res.status(401).json({ error: 'Unauthorized: Unknown demo profile ID.' });
      }
      return res.status(200).json({ success: true, user: found });
    }

    if (role) {
      const found = users.find((u) => u.role === (role as UserRole));
      if (!found) {
        return res.status(400).json({ error: 'Invalid role.' });
      }
      return res.status(200).json({ success: true, user: found });
    }

    return res.status(200).json({ success: true, user: users[0] });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
