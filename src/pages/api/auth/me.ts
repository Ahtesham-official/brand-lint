import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const users = serverDb.getUsers();
    if (userId) {
      const user = serverDb.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Unknown demo profile ID.' });
      }
      return res.status(200).json({ user, users, demoMode: true });
    }
    return res.status(200).json({ user: users[0], users, demoMode: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
