import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const guidelines = store.getGuidelines();
    return res.status(200).json(guidelines);
  }

  if (req.method === 'POST') {
    const { filename, raw_text } = req.body;
    if (!raw_text) {
      return res.status(400).json({ error: 'Guideline text is required' });
    }
    const guideline = store.addGuideline(filename || 'Brand_Guidelines.pdf', raw_text);
    return res.status(201).json(guideline);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

