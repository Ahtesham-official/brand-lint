import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const users = serverDb.getUsers();
    const user = (userId && serverDb.getUserById(userId)) || users[0];
    return res.status(200).json({ user, users, demoMode: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
