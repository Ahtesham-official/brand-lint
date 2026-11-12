import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { getMongoDb } from '@/lib/server/mongodb';
import { UserRole } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, role } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const existing = await serverDb.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists. Please sign in.' });
  }

  const newUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name || email.split('@')[0],
    email: email.trim().toLowerCase(),
    role: (role as UserRole) || 'admin',
    brand_id: '',   // no brand until they join/create an org
  };

  // Persist to MongoDB
  try {
    const db = await getMongoDb();
    await db.collection('users').insertOne({ ...newUser, _id: newUser.id } as any);
  } catch (err) {
    console.error('MongoDB insert failed for new user:', err);
    // Non-fatal: user is still returned so the sign-up flow can continue
  }

  return res.status(201).json({
    success: true,
    user: newUser,
    message: 'Account registered successfully',
  });
}
