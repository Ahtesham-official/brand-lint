import { Rule, Fact, Brand, Severity, RuleCategory, VideoSegmentViolation } from '@/types';

export interface VideoFrameAnalysisInput {
  timestamp: number;
  frameIndex?: number;
  ocrText?: string;
  detectedColors?: string[];
  audioTranscript?: string;
  sceneDescription?: string;
  isBackground?: boolean;
}

export interface VideoAnalysisInput {
  videoId?: string;
  videoDuration: number;
  videoTitle?: string;
  frames: VideoFrameAnalysisInput[];
  fullTranscript?: string;
  brand: Brand;
  rules: Rule[];
  facts: Fact[];
}

/**
 * Intelligent AI Video Compliance Analyzer.
 *
 * Designed specifically for video dynamics:
 * 1. Strict textual & regulatory compliance for on-screen typography (OCR) and spoken audio (Whisper).
 * 2. Pragmatic, context-aware visual color analysis:
 *    - Videos naturally contain environmental backgrounds, lighting shifts, and realistic footage.
 *    - Colors are ONLY flagged if prominent in primary graphic branding, title overlays, or logo elements,
 *      NOT incidental real-world natural background hues.
 * 3. Deep per-frame analysis correlating timestamps with rule citations.
 */
export async function analyzeVideoCompliance(input: VideoAnalysisInput): Promise<VideoSegmentViolation[]> {
  const { videoDuration, frames, fullTranscript = '', brand, rules, facts } = input;
  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey && apiKey.trim() !== '' && frames.length > 0) {
    try {
      const activeRules = rules.map((r) => ({
        id: r.id,
        category: r.category,
        title: r.title,
        severity: r.severity,
        citation: r.source_citation,
        banned_words: r.banned_words,
        required_phrase: r.required_phrase,
      }));

      const activeFacts = facts.map((f) => ({
        id: f.id,
        claim: f.claim,
        expires_at: f.expires_at,
      }));

      const prompt = `You are the BrandLint AI Video Auditor. Inspect the following chronological video frames and audio segments for brand guideline violations.

CRITICAL VIDEO AUDITING PRINCIPLES:
1. STRICT FRAME & AUDIO REFERENCE ONLY: Analyze the video EXCLUSIVELY using the provided chronological frame samples (on-screen OCR typography, detected overlay colors) and the extracted spoken audio transcript (Whisper). Do NOT rely on or invent external caption copy.
2. PER-FRAME RIGOR: Carefully inspect each chronological frame sample provided at its specified timestamp.
3. REALISTIC VIDEO COLOR TOLERANCE: In video media, do NOT strictly flag ambient background colors, natural daylight, real-world outdoor scenery, or clothing in b-roll. Only flag color violations if forbidden colors are prominently used in deliberate brand titles, lower-third overlays, logos, or hero product graphics.
4. STRICT TEXT & CLAIM SCRUTINY: Strictly flag banned terms, unverified superlative claims ("#1", "best", "unbeatable"), and missing mandatory warranty or legal disclaimers detected in either on-screen OCR text or spoken voiceover audio.
5. ACCURATE TIMESTAMPS: Each violation must link to the exact second (timestamp) where it occurs in the video.

BRAND CONTEXT:
- Brand Name: "${brand.name}"
- Approved Primary Palette: ${brand.palette.primary}, ${brand.palette.secondary}, ${brand.palette.accent}
- Forbidden Brand Colors: ${(brand.palette.forbidden_colors || []).join(', ')}

BRAND RULES TO ENFORCE:
${JSON.stringify(activeRules, null, 2)}

FACT VAULT:
${JSON.stringify(activeFacts, null, 2)}

VIDEO FRAMES & AUDIO EXTRACTED FOR ANALYSIS (FFmpeg / OpenCV / Tesseract OCR / Whisper):
${JSON.stringify(frames, null, 2)}

TASK:
Return ONLY a valid JSON array of violations matching this exact schema:
[
  {
    "timestamp": number, // exact timestamp in seconds
    "end_timestamp": number, // optional end timestamp
    "category": "banned_term" | "required_disclaimer" | "tone" | "messaging" | "claim_policy" | "visual_colour" | "visual_contrast" | "audio_transcript" | "on_screen_text",
    "severity": "low" | "med" | "high",
    "rule_id": string, // optional matching rule id
    "explanation": string, // context-aware explanation tailored to video
    "evidence": string, // exact words or graphic evidence detected
    "suggested_correction": string, // practical fix for video editor
    "source_citation": string // verbatim guideline quote
  }
]`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content: 'You are an expert brand compliance auditor specializing in video content. You exercise smart artistic nuance for ambient colors while enforcing strict standards for on-screen typography, claims, and spoken dialogue. Return ONLY raw JSON array without markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 2500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: `v-violation-${Date.now()}-${idx}`,
            timestamp: Number(item.timestamp) || 0,
            end_timestamp: item.end_timestamp ? Number(item.end_timestamp) : undefined,
            category: item.category || 'messaging',
            severity: (item.severity === 'high' || item.severity === 'med' || item.severity === 'low') ? item.severity : 'med',
            explanation: item.explanation || 'Brand compliance flag detected in video frame.',
            evidence: item.evidence || `Detected at ${item.timestamp}s`,
            suggested_correction: item.suggested_correction || 'Adjust visual or audio presentation to align with brand standards.',
            rule_id: item.rule_id,
            source_citation: item.source_citation || 'Brand Compliance Standard',
          }));
        }
      }
    } catch (err) {
      console.warn('Groq video analysis fallback to deterministic engine:', err);
    }
  }

  // Nuanced deterministic fallback analyzer
  return runDeterministicVideoAnalysis(input);
}

/**
 * Intelligent deterministic video analyzer:
 * Checks OCR and audio transcript for rule matches, and performs contextual,
 * non-overzealous visual color validation.
 */
function runDeterministicVideoAnalysis(input: VideoAnalysisInput): VideoSegmentViolation[] {
  const { frames, rules, brand } = input;
  const violations: VideoSegmentViolation[] = [];

  frames.forEach((frame, idx) => {
    const textToCheck = `${frame.ocrText || ''} ${frame.audioTranscript || ''}`.trim();

    // 1. Check banned terms across each frame's text and audio
    rules.forEach((rule) => {
      if (rule.category === 'banned_term' && rule.banned_words && rule.banned_words.length > 0) {
        for (const word of rule.banned_words) {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          if (regex.test(textToCheck)) {
            const isOcr = frame.ocrText ? new RegExp(`\\b${word}\\b`, 'i').test(frame.ocrText) : false;
            violations.push({
              id: `det-v-banned-${idx}-${rule.id}`,
              timestamp: frame.timestamp,
              category: 'banned_term',
              severity: rule.severity,
              rule_id: rule.id,
              explanation: `Prohibited term "${word}" detected in frame @${frame.timestamp}s (${isOcr ? 'on-screen graphic overlay' : 'audio voiceover'}).`,
              evidence: word,
              suggested_correction: `Replace "${word}" with an approved brand synonym in the video cut.`,
              source_citation: rule.source_citation,
            });
            break;
          }
        }
      }

      // 2. Check claim policy & superlatives (requires factual verification/disclaimer)
      if (rule.category === 'claim_policy') {
        const claimMatches = textToCheck.match(/\b(#1|number one|best|guaranteed|unbeatable)\b/i);
        if (claimMatches) {
          violations.push({
            id: `det-v-claim-${idx}-${rule.id}`,
            timestamp: frame.timestamp,
            category: 'claim_policy',
            severity: 'high',
            rule_id: rule.id,
            explanation: `Superlative claim "${claimMatches[0]}" displayed at @${frame.timestamp}s without required substantiation footnote.`,
            evidence: claimMatches[0],
            suggested_correction: 'Overlay an asterisk disclaimer verifying claim methodology or remove the superlative.',
            source_citation: rule.source_citation,
          });
        }
      }

      // 3. Nuanced visual color evaluation:
      // Only flag forbidden colors if they appear in primary graphic overlays or lower thirds (not ambient background)
      if (
        !frame.isBackground &&
        frame.detectedColors &&
        frame.detectedColors.length > 0 &&
        rule.category === 'visual_colour'
      ) {
        const forbidden = brand.palette.forbidden_colors || ['#EF4444', '#EC4899', '#E11D48'];
        const matchedForbidden = frame.detectedColors.find((c) =>
          forbidden.some((f) => f.toUpperCase() === c.toUpperCase())
        );

        // Only trigger if color is in an on-screen title/graphic element (intelligent video rule)
        if (matchedForbidden && frame.ocrText) {
          violations.push({
            id: `det-v-col-${idx}`,
            timestamp: frame.timestamp,
            category: 'visual_colour',
            severity: 'med',
            explanation: `Title graphic overlay at @${frame.timestamp}s uses forbidden colorway tone ${matchedForbidden}. Natural video backgrounds are permitted, but graphic assets must adhere to brand palette.`,
            evidence: matchedForbidden,
            suggested_correction: `Recolor title banner to approved brand tone ${brand.palette.primary}.`,
            source_citation: rule.source_citation || 'Brand collateral and title cards must employ approved palette values.',
          });
        }
      }
    });
  });

  return violations;
}
