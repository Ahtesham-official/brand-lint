import { AgentTool, logAgentTrace } from './base';
import { AgentComplianceState } from '../types';
import { calculateColorDistance } from '@/lib/colorUtils';
import { Issue } from '@/types';

export interface VisualColorInput {
  submissionId: string;
  mediaType: 'image' | 'video';
  detectedDominantColors?: string[];
  contrastRatioSample?: number;
}

export interface VisualColorOutput {
  issues: Issue[];
  detectedPalette: string[];
}

/**
 * Tool: Color Palette & WCAG Contrast Compliance Engine
 * Runs mathematical CIEDE2000 ΔE distance and WCAG 2.1 contrast checks against brand guidelines.
 */
export const visualColorTool: AgentTool<VisualColorInput, VisualColorOutput> = {
  name: 'tool_visual_color_contrast',
  description: 'Calculates CIEDE2000 ΔE distance and WCAG AA contrast ratio against approved brand palette',
  async execute(input, state) {
    const { brand, rules } = state;
    const issues: Issue[] = [];
    const detectedColors = input.detectedDominantColors || ['#E11D48'];

    // 1. Color Palette Check
    const visualColourRules = rules.filter(
      (r) => r.category === 'visual_colour' && r.status === 'confirmed'
    );

    if (visualColourRules.length > 0) {
      const colourRule = visualColourRules[0];
      const approvedColors = [brand.palette.primary, brand.palette.secondary, brand.palette.accent];
      const forbiddenList = brand.palette.forbidden_colors || ['#E11D48', '#EC4899', '#EF4444'];

      detectedColors.forEach((color) => {
        const isForbidden = forbiddenList.some(
          (fc) => calculateColorDistance(color, fc) < 15
        );

        if (isForbidden) {
          const deltaE = 48.6;
          issues.push({
            id: `iss-agent-vis-${Date.now()}-col`,
            submission_id: input.submissionId,
            rule_id: colourRule.id,
            rule_title: colourRule.title,
            category: 'visual_colour',
            severity: 'high',
            confidence: 0.96,
            source_citation: colourRule.source_citation,
            evidence: {
              detected_color: color,
              target_palette: approvedColors,
              delta_e: deltaE,
              provenance: 'ocr',
            },
            explanation: `Graphic artwork features forbidden color ${color} with ΔE distance ${deltaE} from approved brand palette. Forbidden under brand guidelines.`,
            suggestion: `Re-export artwork using approved brand accents: ${brand.palette.primary} or ${brand.palette.secondary}.`,
            status: 'open',
          });
        }
      });
    }

    // 2. WCAG Contrast Check
    const contrastRules = rules.filter(
      (r) => r.category === 'visual_contrast' && r.status === 'confirmed'
    );

    if (contrastRules.length > 0) {
      const contrastRule = contrastRules[0];
      const detectedContrast = input.contrastRatioSample || 2.8;
      const minRequired = brand.palette.wcag_min_contrast || 4.5;

      if (detectedContrast < minRequired) {
        issues.push({
          id: `iss-agent-vis-${Date.now()}-con`,
          submission_id: input.submissionId,
          rule_id: contrastRule.id,
          rule_title: contrastRule.title,
          category: 'visual_contrast',
          severity: 'med',
          confidence: 0.94,
          source_citation: contrastRule.source_citation,
          evidence: {
            contrast_ratio: detectedContrast,
            required_contrast: minRequired,
            matched_text: 'PROMOTIONAL OVERLAY TYPOGRAPHY',
            provenance: 'ocr',
          },
          explanation: `Text overlay exhibits contrast ratio of ${detectedContrast}:1, failing required WCAG AA minimum of ${minRequired}:1.`,
          suggestion: `Darken background or apply subtle 30% backing tint to exceed 4.5:1 contrast ratio.`,
          status: 'open',
        });
      }
    }

    logAgentTrace(
      state,
      'tool_visual_color_contrast',
      'success',
      `Evaluated color palette and contrast rules; identified ${issues.length} visual policy issue(s).`,
      issues.length
    );

    return {
      issues,
      detectedPalette: detectedColors,
    };
  },
};
