import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';
import { UserRole } from '@/types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { role, userId } = req.body;
    if (userId) {
      store.loginAs(userId);
    } else if (role) {
      store.setRole(role as UserRole);
    }
    const user = store.getCurrentUser();
    return res.status(200).json({ success: true, user });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

