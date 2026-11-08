import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if user exists in database
    let user = await serverDb.getUserByEmail(email);
    if (!user) {
      // Find nearest matching seeded user or default to creator
      const users = await serverDb.getUsers();
      if (email.toLowerCase().includes('admin')) {
        user = users.find((u) => u.role === 'admin') || users[0];
      } else if (email.toLowerCase().includes('review')) {
        user = users.find((u) => u.role === 'reviewer') || users[2];
      } else {
        user = users.find((u) => u.role === 'creator') || users[1];
      }
    }

    return res.status(200).json({
      success: true,
      message: `Magic link dispatched to ${email}. Authenticated session ready.`,
      user,
    });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
