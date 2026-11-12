import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { runComplianceAgentBrain } from '@/lib/agent';
import { extractFromVideoAsync } from './extract-video';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const submissions = await serverDb.getSubmissions();
    return res.status(200).json(submissions);
  }

  if (req.method === 'POST') {
    const { title, caption, image_url, video_url, media_type, ocr_text, creator_id, brand_id } = req.body;
    const isVideo = media_type === 'video' || !!video_url;

    if (!isVideo && !caption) {
      return res.status(400).json({ error: 'Caption is required for static poster submissions' });
    }
    if (!image_url && !video_url) {
      return res.status(400).json({ error: 'Media URL (image_url or video_url) is required' });
    }

    // 1. Create submission record
    const submission = await serverDb.createSubmission({
      title: title || (isVideo ? 'Video Campaign Submission' : 'Campaign Submission'),
      caption: isVideo ? '' : (caption || ''),
      ocr_text: ocr_text || undefined,
      image_url: image_url || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      video_url: video_url || undefined,
      media_type: isVideo ? 'video' : 'image',
      creator_id,
      brand_id,
    });

    // 2. Fetch the active Admin rules and Fact Vault records
    const activeRules = await serverDb.getActiveRules();
    const brand = await serverDb.getBrand();
    const facts = await serverDb.getFacts();

    // 3. Run Agentic AI Brain (StateGraph with modular extraction & audit tools)
    let extractedVideoData: Awaited<ReturnType<typeof extractFromVideoAsync>> | null = null;
    let extractedFrames: any[] = [];

    if (isVideo) {
      extractedVideoData = await extractFromVideoAsync(
        video_url || '',
        submission.title,
        ocr_text,
        undefined,
        submission.title
      );
      extractedFrames = extractedVideoData.frames.map((f) => ({
        timestamp: f.timestamp,
        frameIndex: f.frameIndex,
        ocrText: f.ocrText,
        audioTranscript: f.audioTranscript,
        detectedColors: f.detectedColors || [brand.palette.primary || '#1E3A8A'],
        isBackground: f.isBackground,
      }));
    }

    const agentState = await runComplianceAgentBrain({
      inputMedia: {
        submissionId: submission.id,
        mediaType: isVideo ? 'video' : 'image',
        imageUrl: submission.image_url,
        videoUrl: submission.video_url,
        caption: isVideo ? '' : (caption || ''),
        ocrText: ocr_text || '',
      },
      brand,
      rules: activeRules,
      facts,
      frames: extractedFrames,
      audioTranscript: extractedVideoData ? extractedVideoData.audio_summary : undefined,
    });

    const analysis = {
      issues: agentState.issues,
      riskScore: agentState.decisionSummary.riskScore,
      riskLevel: agentState.decisionSummary.riskLevel,
      engineUsed: agentState.decisionSummary.engineUsed,
      summary: {
        totalIssues: agentState.decisionSummary.totalViolations,
        highSeverity: agentState.decisionSummary.highSeverityCount,
        medSeverity: agentState.decisionSummary.medSeverityCount,
        lowSeverity: agentState.decisionSummary.lowSeverityCount,
        autoFixableCount: agentState.decisionSummary.autoFixableCount,
      },
    };

    const videoViolations = agentState.videoViolations;

    // Synchronize video timeline violations into the issues list for unified reporting
    if (isVideo && videoViolations.length > 0) {
      videoViolations.forEach((v) => {
        analysis.issues.push({
          id: `iss-v-${v.id}`,
          submission_id: submission.id,
          rule_id: v.rule_id,
          rule_title: v.category.replace(/_/g, ' ').toUpperCase(),
          category: v.category as any,
          severity: v.severity,
          confidence: 0.95,
          source_citation: v.source_citation || 'Brand Compliance Standard',
          evidence: {
            matched_text: v.evidence,
            provenance: 'video_frame',
            timestamp: v.timestamp,
          },
          explanation: `[@${v.timestamp}s in video] ${v.explanation}`,
          suggestion: v.suggested_correction,
          status: 'open',
        });
      });
    }

    // 4. Build transcript segments from extraction output for display in VideoAuditReport
    const videoTranscript = extractedVideoData
      ? extractedVideoData.segments && extractedVideoData.segments.length > 0
        ? extractedVideoData.segments.map((s) => ({
            timestamp: s.start,
            text: s.text,
            ocr: '',
          }))
        : extractedVideoData.frames
            .filter((f) => f.ocrText || f.audioTranscript)
            .map((f) => ({
              timestamp: f.timestamp,
              text: f.audioTranscript || '',
              ocr: f.ocrText || '',
            }))
      : undefined;

    // 5. Build combined OCR+Audio summary string saved on the submission for quick display
    const fullOcrSummary = isVideo && extractedVideoData
      ? [extractedVideoData.ocr_summary, extractedVideoData.audio_summary].filter(Boolean).join('\n\n')
      : ocr_text;

    // 6. Save issues and update submission status
    await serverDb.saveSubmissionIssues(submission.id, analysis.issues);

    const updatedSub = await serverDb.updateSubmission(submission.id, {
      status: 'analyzed',
      risk_score: analysis.riskScore,
      risk_level: analysis.riskLevel,
      analyzed_at: new Date().toISOString(),
      ocr_text: fullOcrSummary,
      video_violations: isVideo ? videoViolations : undefined,
      video_metadata: isVideo
        ? {
            duration: extractedVideoData?.metadata.duration || 15,
            fps: extractedVideoData?.metadata.fps || 30,
            resolution: extractedVideoData?.metadata.resolution || '1920x1080',
            frames_analyzed: extractedVideoData?.frames.length || 0,
            transcript: videoTranscript,
          }
        : undefined,
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
        video_violations_count: videoViolations.length,
        risk_score: analysis.riskScore,
        engine_used: analysis.engineUsed,
        media_type: isVideo ? 'video' : 'image',
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
