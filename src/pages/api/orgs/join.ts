import type { NextApiRequest, NextApiResponse } from 'next';
import { getInviteByToken, joinOrganizationByToken } from '@/lib/orgService';
import { getRequestUserId } from '@/lib/orgPermissions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Unknown or invalid demo profile ID.' });
  }

  if (req.method === 'GET') {
    const token = (req.query.token as string) || '';
    if (!token) {
      return res.status(400).json({ error: 'Invite token is required.' });
    }

    try {
      const invite = await getInviteByToken(token);
      if (!invite) {
        return res.status(404).json({ error: 'Invitation not found or invalid.' });
      }

      const isExpired = new Date(invite.expires_at).getTime() < Date.now();
      const isMaxUsed = invite.uses_count >= invite.max_uses;

      return res.status(200).json({
        invite,
        valid: !invite.revoked && !isExpired && !isMaxUsed,
        reason: invite.revoked
          ? 'Revoked'
          : isExpired
          ? 'Expired'
          : isMaxUsed
          ? 'Max uses reached'
          : undefined,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to inspect invitation.' });
    }
  }

  if (req.method === 'POST') {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invite token is required.' });
    }

    try {
      const result = await joinOrganizationByToken({
        token,
        userId,
      });

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Unable to join organisation.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}

