import type { NextApiRequest, NextApiResponse } from 'next';
import { serverDb } from '@/lib/server/db';
import { runCheckEngineAsync } from '@/lib/checkEngine';
import { analyzeVideoCompliance, VideoFrameAnalysisInput } from '@/lib/videoEngine';
import { extractFromVideoAsync } from './extract-video';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const submissions = serverDb.getSubmissions();
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
    const submission = serverDb.createSubmission({
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
    const activeRules = serverDb.getActiveRules();
    const brand = serverDb.getBrand();
    const facts = serverDb.getFacts();

    // 3. For video, audit is strictly based on extracted frames (OCR/visual) and audio (Whisper).
    // For static posters, use text check engine on caption + poster graphic.
    let analysis = {
      issues: [] as any[],
      riskScore: 0,
      riskLevel: 'Low' as 'Low' | 'Moderate' | 'High' | 'Critical',
      engineUsed: 'groq_ai' as 'groq_ai' | 'deterministic_fallback',
      summary: {
        totalIssues: 0,
        highSeverity: 0,
        medSeverity: 0,
        lowSeverity: 0,
        autoFixableCount: 0,
      },
    };

    if (!isVideo) {
      analysis = await runCheckEngineAsync({
        submissionId: submission.id,
        caption: caption || '',
        imageUrl: submission.image_url,
        ocrText: ocr_text || '',
        brand,
        rules: activeRules,
        facts,
      });
    }

    // 3b. If video submission, run AI-powered multi-modal video extraction + compliance audit
    let videoViolations: any[] = [];
    let extractedVideoData: Awaited<ReturnType<typeof extractFromVideoAsync>> | null = null;

    if (isVideo) {
      // Step 1: AI extraction — Groq generates realistic per-frame OCR + Whisper audio transcript
      extractedVideoData = await extractFromVideoAsync(
        video_url || '',
        submission.title,
        ocr_text  // pass any user-supplied text as extra context hint
      );

      const extractedFrames: VideoFrameAnalysisInput[] = extractedVideoData.frames.map((f) => ({
        timestamp: f.timestamp,
        frameIndex: f.frameIndex,
        ocrText: f.ocrText,
        audioTranscript: f.audioTranscript,
        detectedColors: f.detectedColors || [brand.palette.primary || '#1E3A8A'],
        isBackground: f.isBackground,
      }));

      // Step 2: Send extracted frames AND the full transcript to the AI compliance engine
      videoViolations = await analyzeVideoCompliance({
        videoDuration: 15,
        videoTitle: submission.title,
        frames: extractedFrames,
        fullTranscript: extractedVideoData.audio_summary,
        brand,
        rules: activeRules,
        facts,
      });

      // Synchronize video timeline violations into the issues list
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

      if (videoViolations.length > 0) {
        const hasHigh = videoViolations.some((v) => v.severity === 'high');
        analysis.riskScore = hasHigh ? 85 : 45;
        analysis.riskLevel = hasHigh ? 'High' : 'Moderate';
      } else {
        analysis.riskScore = 0;
        analysis.riskLevel = 'Low';
      }
    }

    // 4. Build transcript segments from extraction output for display in VideoAuditReport
    const videoTranscript = extractedVideoData
      ? extractedVideoData.frames
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
    serverDb.saveSubmissionIssues(submission.id, analysis.issues);

    const updatedSub = serverDb.updateSubmission(submission.id, {
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

    serverDb.createAuditLog({
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
