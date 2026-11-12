import { AgentComplianceState, AgentInputMedia } from './types';
import { logAgentTrace } from './tools/base';
import { ocrExtractionTool } from './tools/ocrTool';
import { audioExtractionTool } from './tools/audioTool';
import { visualColorTool } from './tools/visualColorTool';
import { ruleFactVerificationTool } from './tools/ruleFactTool';
import { Brand, Rule, Fact, Issue, VideoSegmentViolation } from '@/types';
import { analyzeVideoCompliance } from '@/lib/videoEngine';

export interface RunAgentBrainParams {
  inputMedia: AgentInputMedia;
  brand: Brand;
  rules: Rule[];
  facts: Fact[];
  frames?: any[];
  audioTranscript?: string;
}

/**
 * StateGraph Agentic Brain
 *
 * Implements a native, cyclical DAG state machine:
 * [Input Media]
 *       │
 *       ▼
 * [Routing Agent Node]
 *       │
 *       ├── Video ──► [Frame / OCR Tool] ──► [Audio / Whisper Tool] ──► [Multi-frame Video Auditor]
 *       │
 *       └── Poster ─► [Visual OCR Tool] ──► [Color/Contrast Tool] ──► [Rule & Fact Vault Tool]
 *                             │
 *                             ▼
 *               [Synthesis & Risk Arbiter Brain Node]
 *                             │
 *                             ▼
 *                     [Final Verdict & Plan]
 */
export async function runComplianceAgentBrain(
  params: RunAgentBrainParams
): Promise<AgentComplianceState> {
  const { inputMedia, brand, rules, facts, frames = [], audioTranscript = '' } = params;

  // 1. Initialize State Machine
  const state: AgentComplianceState = {
    inputMedia,
    brand,
    rules,
    facts,
    evidence: {
      captionText: inputMedia.caption || '',
      ocrText: inputMedia.ocrText || '',
      detectedColors: [],
      contrastFindings: [],
      audioTranscript: audioTranscript || '',
      videoFrames: frames || [],
    },
    issues: [],
    videoViolations: [],
    trace: [],
    decisionSummary: {
      riskScore: 0,
      riskLevel: 'Low',
      engineUsed: 'agentic_state_graph',
      totalViolations: 0,
      highSeverityCount: 0,
      medSeverityCount: 0,
      lowSeverityCount: 0,
      autoFixableCount: 0,
      synthesisExplanation: '',
    },
  };

  logAgentTrace(
    state,
    'agent_supervisor_node',
    'invoked',
    `Supervisor initiated pipeline for media type: ${inputMedia.mediaType.toUpperCase()}`
  );

  // 2. Multimodal Execution Graph
  if (inputMedia.mediaType === 'video') {
    // 2a. OCR Keyframe extraction node
    const ocrResult = await ocrExtractionTool.execute(
      {
        mediaType: 'video',
        imageUrl: inputMedia.imageUrl,
        frames,
      },
      state
    );
    state.evidence.ocrText = ocrResult.extractedText;

    // 2b. Audio voiceover speech-to-text extraction node
    const audioResult = await audioExtractionTool.execute(
      {
        mediaType: 'video',
        videoUrl: inputMedia.videoUrl,
        existingTranscript: audioTranscript,
        frames,
      },
      state
    );
    state.evidence.audioTranscript = audioResult.fullTranscript;

    // 2c. Multi-frame chronological compliance auditing node
    try {
      const violations: VideoSegmentViolation[] = await analyzeVideoCompliance({
        videoDuration: frames.length > 0 ? frames[frames.length - 1].timestamp + 2 : 12,
        frames,
        fullTranscript: audioResult.fullTranscript,
        brand,
        rules,
        facts,
      });

      state.videoViolations = violations;
      logAgentTrace(
        state,
        'video_auditor_node',
        'success',
        `Video analysis identified ${violations.length} chronological timestamped violation(s).`,
        violations.length
      );
    } catch (err: any) {
      logAgentTrace(
        state,
        'video_auditor_node',
        'failed',
        `Video auditor encountered error: ${err?.message || 'Unknown'}`
      );
    }
  } else {
    // Static poster image branch:
    // 2a. OCR tool node
    const ocrResult = await ocrExtractionTool.execute(
      {
        mediaType: 'image',
        imageUrl: inputMedia.imageUrl,
        existingOcr: inputMedia.ocrText,
      },
      state
    );
    state.evidence.ocrText = ocrResult.extractedText;

    // 2b. Visual color palette & WCAG contrast node
    const visualResult = await visualColorTool.execute(
      {
        submissionId: inputMedia.submissionId,
        mediaType: 'image',
      },
      state
    );
    state.issues.push(...visualResult.issues);

    // 2c. Policy rule and Fact Vault verification node
    const ruleFactResult = await ruleFactVerificationTool.execute(
      {
        submissionId: inputMedia.submissionId,
        combinedText: `${inputMedia.caption || ''} ${state.evidence.ocrText}`,
        captionText: inputMedia.caption || '',
        ocrText: state.evidence.ocrText,
      },
      state
    );
    state.issues.push(...ruleFactResult.issues);
  }

  // 3. Synthesis & Risk Arbiter Brain Node
  // The supervisor synthesizes all tool findings and weights risk deterministically.
  const allIssues = state.issues;
  const allVideoViolations = state.videoViolations;

  const highCount =
    allIssues.filter((i) => i.severity === 'high').length +
    allVideoViolations.filter((v) => v.severity === 'high').length;
  const medCount =
    allIssues.filter((i) => i.severity === 'med').length +
    allVideoViolations.filter((v) => v.severity === 'med').length;
  const lowCount =
    allIssues.filter((i) => i.severity === 'low').length +
    allVideoViolations.filter((v) => v.severity === 'low').length;

  const totalViolations = allIssues.length + allVideoViolations.length;
  const autoFixableCount = allIssues.filter((i) => !!i.suggested_text).length;

  // Composite risk formula
  let computedRisk = highCount * 30 + medCount * 15 + lowCount * 5;
  computedRisk = Math.min(100, Math.max(0, computedRisk));

  let riskTier: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  if (computedRisk >= 75) riskTier = 'Critical';
  else if (computedRisk >= 45) riskTier = 'High';
  else if (computedRisk >= 20) riskTier = 'Moderate';

  const synthesisExplanation =
    totalViolations === 0
      ? 'All multimodal checks cleared successfully with zero policy or Fact Vault discrepancies.'
      : `Agent identified ${totalViolations} compliance violation(s) (${highCount} High, ${medCount} Med, ${lowCount} Low) requiring creator remediation before publication.`;

  state.decisionSummary = {
    riskScore: computedRisk,
    riskLevel: riskTier,
    engineUsed: 'agentic_state_graph',
    totalViolations,
    highSeverityCount: highCount,
    medSeverityCount: medCount,
    lowSeverityCount: lowCount,
    autoFixableCount,
    synthesisExplanation,
  };

  logAgentTrace(
    state,
    'agent_supervisor_node',
    'success',
    `Synthesis complete: Risk Score ${computedRisk}/100 (${riskTier}) with ${totalViolations} violation(s).`
  );

  return state;
}
