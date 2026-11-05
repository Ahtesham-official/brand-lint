import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { UserRole } from '@/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { role, userId } = req.body;
    const users = serverDb.getUsers();
    let target = users[0];

    if (userId) {
      const found = serverDb.getUserById(userId);
      if (found) target = found;
    } else if (role) {
      const found = users.find((u) => u.role === (role as UserRole));
      if (found) target = found;
    }

    return res.status(200).json({ success: true, user: target });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
