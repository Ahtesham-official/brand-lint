import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const user = await serverDb.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'No user account found with this email. Please create a new account.' });
  }

  return res.status(200).json({
    success: true,
    user,
    message: 'Signed in successfully',
  });
}
