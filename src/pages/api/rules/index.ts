import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const orgId = typeof req.query.orgId === 'string' ? req.query.orgId : undefined;
    const rules = await serverDb.getRules(undefined, orgId);
    return res.status(200).json(rules);
  }

  if (req.method === 'POST') {
    const { guideline_id, category, title, description, severity, confidence, source_citation, status, banned_words, required_phrase } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    const guidelines = await serverDb.getGuidelines();
    const targetGuidelineId = guideline_id || (guidelines[0]?.id ?? 'gl-default');

    const newRule = await serverDb.createRule({
      guideline_id: targetGuidelineId,
      category: category || 'brand_identity',
      title,
      description,
      severity: severity || 'med',
      confidence: confidence || 0.9,
      source_citation: source_citation || '',
      status: status || 'draft',
      banned_words: banned_words || [],
      required_phrase: required_phrase,
    });

    return res.status(201).json(newRule);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
