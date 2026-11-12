import { Brand, Rule, Fact, Issue, VideoSegmentViolation } from '@/types';

/**
 * Modality inputs supported by the Agentic Compliance Brain
 */
export interface AgentInputMedia {
  submissionId: string;
  mediaType: 'image' | 'video';
  imageUrl: string;
  videoUrl?: string;
  caption?: string;
  ocrText?: string;
}

/**
 * Extracted multimodal evidence accumulated by tools
 */
export interface AgentExtractedEvidence {
  captionText: string;
  ocrText: string;
  detectedColors: {
    hex: string;
    isProminent: boolean;
    deltaE?: number;
    location?: 'graphic_overlay' | 'background';
  }[];
  contrastFindings: {
    ratio: number;
    required: number;
    textSample: string;
    passed: boolean;
  }[];
  audioTranscript: string;
  videoFrames: {
    timestamp: number;
    ocrText?: string;
    detectedColors?: string[];
    audioTranscript?: string;
    sceneDescription?: string;
  }[];
}

/**
 * Agent execution step record for full explainability and audit trail
 */
export interface AgentTraceStep {
  step: number;
  toolName: string;
  status: 'invoked' | 'success' | 'failed' | 'skipped';
  summary: string;
  timestamp: string;
  findingsCount?: number;
}

/**
 * The unified StateGraph state flowing across all tool nodes and the Brain
 */
export interface AgentComplianceState {
  inputMedia: AgentInputMedia;
  brand: Brand;
  rules: Rule[];
  facts: Fact[];
  evidence: AgentExtractedEvidence;
  issues: Issue[];
  videoViolations: VideoSegmentViolation[];
  trace: AgentTraceStep[];
  decisionSummary: {
    riskScore: number;
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    engineUsed: string;
    totalViolations: number;
    highSeverityCount: number;
    medSeverityCount: number;
    lowSeverityCount: number;
    autoFixableCount: number;
    synthesisExplanation: string;
  };
}

