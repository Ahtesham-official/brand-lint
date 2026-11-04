import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    // Simulation for FR-1.1: Magic-link authentication
    return res.status(200).json({
      success: true,
      message: `Magic link dispatched to ${email}. In demo mode, you can also use fast 1-click role logins.`,
    });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

