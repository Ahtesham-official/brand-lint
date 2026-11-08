import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { runCheckEngineAsync } from '@/lib/checkEngine';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const subId = Array.isArray(id) ? id[0] : id;

  if (req.method === 'POST') {
    const submission = await serverDb.getSubmissionById(subId as string);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const activeRules = await serverDb.getActiveRules();
    const brand = await serverDb.getBrand();
    const facts = await serverDb.getFacts();

    const analysis = await runCheckEngineAsync({
      submissionId: submission.id,
      caption: submission.caption,
      imageUrl: submission.image_url,
      ocrText: req.body?.ocr_text || '',
      brand,
      rules: activeRules,
      facts,
    });

    await serverDb.saveSubmissionIssues(submission.id, analysis.issues);
    const updated = await serverDb.updateSubmission(submission.id, {
      status: 'analyzed',
      risk_score: analysis.riskScore,
      risk_level: analysis.riskLevel,
      analyzed_at: new Date().toISOString(),
    });

    await serverDb.createAuditLog({
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

    return res.status(200).json({
      submission: updated || submission,
      issues: analysis.issues,
      analysis,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
