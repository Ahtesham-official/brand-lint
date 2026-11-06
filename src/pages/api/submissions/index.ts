import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { runCheckEngineAsync } from '@/lib/checkEngine';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const submissions = serverDb.getSubmissions();
    return res.status(200).json(submissions);
  }

  if (req.method === 'POST') {
    const { title, caption, image_url, ocr_text, creator_id, brand_id } = req.body;
    if (!caption || !image_url) {
      return res.status(400).json({ error: 'Caption and image_url are required' });
    }

    // 1. Create submission record
    const submission = serverDb.createSubmission({
      title: title || 'Campaign Submission',
      caption,
      image_url,
      creator_id,
      brand_id,
    });

    // 2. Fetch the active Admin rules and Fact Vault records
    const activeRules = serverDb.getActiveRules();
    const brand = serverDb.getBrand();
    const facts = serverDb.getFacts();

    // 3. Run Check Engine (Groq GenAI with deterministic fallback)
    const analysis = await runCheckEngineAsync({
      submissionId: submission.id,
      caption,
      imageUrl: image_url,
      ocrText: ocr_text || '',
      brand,
      rules: activeRules,
      facts,
    });

    // 4. Save issues and update submission status
    serverDb.saveSubmissionIssues(submission.id, analysis.issues);
    const updatedSub = serverDb.updateSubmission(submission.id, {
      status: 'analyzed',
      risk_score: analysis.riskScore,
      risk_level: analysis.riskLevel,
      analyzed_at: new Date().toISOString(),
    });

    serverDb.createAuditLog({
      actor_id: submission.creator_id,
      actor_name: submission.creator_name || 'Creator',
      actor_role: 'creator',
      action: 'submission_analyzed',
      entity: 'submission',
      entity_id: submission.id,
      meta: {
        issues_count: analysis.issues.length,
        risk_score: analysis.riskScore,
        engine_used: analysis.engineUsed,
      },
    });

    return res.status(201).json({
      submission: updatedSub || submission,
      issues: analysis.issues,
      analysis,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
