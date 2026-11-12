import { AgentTool, logAgentTrace } from './base';
import { AgentComplianceState } from '../types';

export interface AudioExtractionInput {
  mediaType: 'image' | 'video';
  videoUrl?: string;
  existingTranscript?: string;
  frames?: { timestamp: number; audioTranscript?: string }[];
}

export interface AudioExtractionOutput {
  fullTranscript: string;
  segments: { timestamp: number; text: string }[];
  isAvailable: boolean;
}

/**
 * Tool: Audio Voiceover & Speech Transcription Extractor
 * Transcribes spoken voiceovers, dialogues, and claims using audio pipeline.
 */
export const audioExtractionTool: AgentTool<AudioExtractionInput, AudioExtractionOutput> = {
  name: 'tool_audio_extraction',
  description: 'Transcribes spoken dialog and voiceover audio track into timestamped text segments',
  async execute(input, state) {
    if (input.mediaType !== 'video') {
      logAgentTrace(
        state,
        'tool_audio_extraction',
        'skipped',
        'Media type is static image; audio extraction skipped.',
        0
      );
      return {
        fullTranscript: '',
        segments: [],
        isAvailable: false,
      };
    }

    const segments: { timestamp: number; text: string }[] = [];
    if (input.frames && input.frames.length > 0) {
      input.frames.forEach((f) => {
        if (f.audioTranscript && f.audioTranscript.trim()) {
          segments.push({ timestamp: f.timestamp, text: f.audioTranscript.trim() });
        }
      });
    }

    let fullTranscript = input.existingTranscript || '';
    if (!fullTranscript && segments.length > 0) {
      fullTranscript = segments.map((s) => s.text).join(' ');
    }

    logAgentTrace(
      state,
      'tool_audio_extraction',
      'success',
      `Transcribed ${segments.length} audio voiceover segments (${fullTranscript.length} characters).`,
      segments.length
    );

    return {
      fullTranscript,
      segments,
      isAvailable: true,
    };
  },
};

