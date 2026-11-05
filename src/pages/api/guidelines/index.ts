import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const guidelines = serverDb.getGuidelines();
    return res.status(200).json(guidelines);
  }

  if (req.method === 'POST') {
    const { filename, raw_text, brand_id } = req.body;
    if (!raw_text || !raw_text.trim()) {
      return res.status(400).json({ error: 'Guideline text is required' });
    }
    const guideline = serverDb.createGuideline(
      filename || 'Brand_Guidelines.pdf',
      raw_text.trim(),
      brand_id
    );
    return res.status(201).json(guideline);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
