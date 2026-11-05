import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { guideline_id } = req.query;
    const rules = serverDb.getRules(guideline_id as string | undefined);
    return res.status(200).json(rules);
  }

  if (req.method === 'POST') {
    const {
      guideline_id,
      category,
      title,
      description,
      severity,
      confidence,
      source_citation,
      status,
      banned_words,
      required_phrase,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, category, and description are required' });
    }

    const firstGl = serverDb.getGuidelines()[0];
    const newRule = serverDb.createRule({
      guideline_id: guideline_id || firstGl?.id || 'gl-01',
      category,
      title,
      description,
      severity: severity || 'med',
      confidence: confidence !== undefined ? Number(confidence) : 0.9,
      source_citation: source_citation || 'Manual brand policy addition',
      status: status || 'confirmed',
      banned_words,
      required_phrase,
    });

    return res.status(201).json(newRule);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

