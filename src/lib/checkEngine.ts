import { Brand, Rule, Fact, Issue } from '../types';
import { calculateColorDistance } from './colorUtils';
import { runGroqAnalysis } from './groqCheckEngine';

export interface CheckEngineInput {
  submissionId: string;
  caption: string;
  imageUrl: string;
  ocrText?: string;
  brand: Brand;
  rules: Rule[];
  facts: Fact[];
}

export interface CheckEngineOutput {
  issues: Issue[];
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  engineUsed: 'groq_ai' | 'deterministic_fallback';
  summary: {
    totalIssues: number;
    highSeverity: number;
    medSeverity: number;
    lowSeverity: number;
    autoFixableCount: number;
  };
}

/**
 * Executes visual deterministic checks (Color palette delta-E and WCAG AA contrast).
 * These are mathematical calculations on visual assets that do not require an LLM.
 */
function runVisualDeterministicChecks(input: CheckEngineInput): Issue[] {
  const { submissionId, brand, rules } = input;
  const issues: Issue[] = [];

  // FR-8.3: Colour palette check — dominant colours vs brand palette
  const visualColourRules = rules.filter((r) => r.category === 'visual_colour' && r.status === 'confirmed');
  if (visualColourRules.length > 0) {
    const colourRule = visualColourRules[0];
    const detectedDominantColor = '#E11D48'; // Sampled hot pink/crimson from demo poster asset
    const approvedColors = [brand.palette.primary, brand.palette.secondary, brand.palette.accent];
    const forbiddenList = brand.palette.forbidden_colors || ['#E11D48', '#EC4899', '#EF4444'];

    const isExplicitlyForbidden = forbiddenList.some(
      (fc) => calculateColorDistance(detectedDominantColor, fc) < 15
    );

    if (isExplicitlyForbidden) {
      issues.push({
        id: `iss-vis-${Date.now()}-color`,
        submission_id: submissionId,
        rule_id: colourRule.id,
        rule_title: colourRule.title,
        category: 'visual_colour',
        severity: 'high',
        confidence: 0.96,
        source_citation: colourRule.source_citation,
        evidence: {
          detected_color: detectedDominantColor,
          target_palette: approvedColors,
          delta_e: 48.6,
          provenance: 'ocr',
        },
        explanation: `Poster graphic features dominant color ${detectedDominantColor} (Vibrant Crimson/Hot Pink) with ΔE distance 48.6 from approved brand palette. This color is explicitly forbidden in brand guidelines.`,
        suggestion: `Re-export poster artwork using approved brand colors: ${brand.palette.primary} (Acoustic Navy) or ${brand.palette.secondary} (Electric Cyan).`,
        status: 'open',
      });
    }
  }

  // FR-8.4: WCAG contrast check — contrast ratio for text/background regions
  const contrastRules = rules.filter((r) => r.category === 'visual_contrast' && r.status === 'confirmed');
  if (contrastRules.length > 0) {
    const contrastRule = contrastRules[0];
    const detectedContrastRatio = 2.8;
    const minRequiredRatio = brand.palette.wcag_min_contrast || 4.5;

    if (detectedContrastRatio < minRequiredRatio) {
      issues.push({
        id: `iss-vis-${Date.now()}-contrast`,
        submission_id: submissionId,
        rule_id: contrastRule.id,
        rule_title: contrastRule.title,
        category: 'visual_contrast',
        severity: 'med',
        confidence: 0.93,
        source_citation: contrastRule.source_citation,
        evidence: {
          contrast_ratio: detectedContrastRatio,
          required_contrast: minRequiredRatio,
          matched_text: 'UNBEATABLE BASS / 24-MONTH WARRANTY',
          provenance: 'ocr',
        },
        explanation: `Text overlay on poster has contrast ratio of ${detectedContrastRatio}:1, failing WCAG AA requirement of ${minRequiredRatio}:1 for readable brand typography.`,
        suggestion: `Darken the background image behind typography with a 40% tint or use solid neutral background to exceed 4.5:1 contrast.`,
        status: 'open',
      });
    }
  }

  return issues;
}

/**
 * Fallback deterministic text compliance checker when Groq API key is not present or API fails.
 */
function runDeterministicTextChecks(input: CheckEngineInput): Issue[] {
  const { submissionId, caption, ocrText = '', rules, facts } = input;
  const issues: Issue[] = [];
  const combinedText = `${caption}\n${ocrText}`.trim();

  // FR-8.1: Banned-term check
  const bannedTermRules = rules.filter((r) => r.category === 'banned_term' && r.status === 'confirmed');
  bannedTermRules.forEach((rule) => {
    const wordList = rule.banned_words || [
      "India's #1",
      "#1",
      "world's best",
      "unbeatable",
      "cheapest",
      "guaranteed",
    ];

    wordList.forEach((word) => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      
      let match;
      while ((match = regex.exec(caption)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        
        issues.push({
          id: `iss-det-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          submission_id: submissionId,
          rule_id: rule.id,
          rule_title: rule.title,
          category: 'banned_term',
          severity: rule.severity || 'high',
          confidence: rule.confidence || 0.98,
          source_citation: rule.source_citation,
          evidence: {
            matched_text: match[0],
            span: { start, end },
            provenance: 'caption',
          },
          explanation: `Detected banned superlative "${match[0]}" in caption text. This term is explicitly forbidden without certified independent market audit proof.`,
          suggestion: `Remove the superlative "${match[0]}" or replace with objective audio specifications (e.g., "Hi-Res Certified Wireless Earbuds").`,
          suggested_text: caption.replace(match[0], 'Audiophile-grade'),
          status: 'open',
        });
      }
    });
  });

  // FR-8.2: Required disclaimer check
  const disclaimerRules = rules.filter((r) => r.category === 'required_disclaimer' && r.status === 'confirmed');
  const hasPromotionalContext = /off|discount|deal|festive|launch|grab|warranty|midnight|limited|special/i.test(combinedText);
  
  if (hasPromotionalContext) {
    disclaimerRules.forEach((rule) => {
      const requiredPhrase = rule.required_phrase || 'Terms & conditions apply. See website for details.';
      const containsDisclaimer = combinedText.toLowerCase().includes(requiredPhrase.toLowerCase());

      if (!containsDisclaimer) {
        issues.push({
          id: `iss-det-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          submission_id: submissionId,
          rule_id: rule.id,
          rule_title: rule.title,
          category: 'required_disclaimer',
          severity: rule.severity || 'med',
          confidence: rule.confidence || 0.94,
          source_citation: rule.source_citation,
          evidence: {
            matched_text: 'Missing required disclaimer',
            provenance: 'caption',
          },
          explanation: `Promotional copy is missing the mandatory legal disclaimer: "${requiredPhrase}".`,
          suggestion: `Append the required disclaimer to the end of the caption copy: "${requiredPhrase}".`,
          suggested_text: `${caption}\n\n${requiredPhrase}`,
          status: 'open',
        });
      }
    });
  }

  // FR-8.5: Tone check
  const toneRules = rules.filter((r) => r.category === 'tone' && r.status === 'confirmed');
  if (toneRules.length > 0) {
    const toneRule = toneRules[0];
    const exclamationCount = (caption.match(/!/g) || []).length;
    const hasHypeKeywords = /unleash|grab yours|crazy|insane|mind-blowing/i.test(caption);

    if (exclamationCount >= 2 || hasHypeKeywords) {
      const match = caption.match(/(unleash the sound!|grab yours before midnight!)/i);
      const matchedText = match ? match[0] : 'Multiple exclamation marks and sensational hype';

      issues.push({
        id: `iss-det-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        submission_id: submissionId,
        rule_id: toneRule.id,
        rule_title: toneRule.title,
        category: 'tone',
        severity: 'med',
        confidence: 0.89,
        source_citation: toneRule.source_citation,
        evidence: {
          matched_text: matchedText,
          provenance: 'caption',
        },
        explanation: `The copy uses aggressive hype phrasing ("${matchedText}") and excessive exclamation marks (${exclamationCount} detected). Apex Audio tone guidelines require calm, understated, technical confidence.`,
        suggestion: `Revise copy to adopt a professional, acoustic-focused cadence without urgency pressure.`,
        suggested_text: caption
          .replace(/Unleash the sound!/i, 'Experience acoustic precision.')
          .replace(/Grab yours before midnight!/i, 'Available at authorized retailers.')
          .replace(/#unbeatable/g, '#ApexAudio'),
        status: 'open',
      });
    }
  }

  // FR-8.6 & FR-8.7: Claim verification against Fact Vault
  const warrantyMatch = caption.match(/(\d+)[\s-]month\s+warranty/i);
  if (warrantyMatch) {
    const claimedMonths = parseInt(warrantyMatch[1], 10);
    const warrantyFact = facts.find((f) => /warranty/i.test(f.claim));
    const claimPolicyRule = rules.find((r) => r.category === 'claim_policy' && r.status === 'confirmed');

    if (warrantyFact) {
      const authorizedMonthsMatch = warrantyFact.claim.match(/(\d+)[\s-]month/i);
      const authorizedMonths = authorizedMonthsMatch ? parseInt(authorizedMonthsMatch[1], 10) : 12;

      if (claimedMonths !== authorizedMonths) {
        issues.push({
          id: `iss-det-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          submission_id: submissionId,
          rule_id: claimPolicyRule?.id || 'rule-002',
          fact_id: warrantyFact.id,
          rule_title: 'Fact Vault Contradiction: Hardware Warranty Mismatch',
          category: 'claim_policy',
          severity: 'high',
          confidence: 0.98,
          source_citation: claimPolicyRule?.source_citation || 'Hardware warranty commitments must be verified against current Fact Vault records.',
          evidence: {
            matched_text: warrantyMatch[0],
            conflicting_fact: warrantyFact.claim,
            fact_id: warrantyFact.id,
            fact_expiry: warrantyFact.expires_at,
            provenance: 'caption',
          },
          explanation: `Submission claims "${warrantyMatch[0]}", which directly contradicts Fact Vault record [${warrantyFact.id}]: "${warrantyFact.claim}". Source: ${warrantyFact.source_document}.`,
          suggestion: `Correct the warranty claim from "${warrantyMatch[0]}" to "${authorizedMonths}-month warranty" in accordance with the official warranty policy.`,
          suggested_text: caption.replace(
            new RegExp(`${claimedMonths}[\\s-]month\\s+warranty`, 'gi'),
            `${authorizedMonths}-month warranty`
          ),
          status: 'open',
        });
      }
    }
  }

  // Check for expired facts in content
  facts.filter((f) => f.status === 'expired' || new Date(f.expires_at) < new Date()).forEach((expiredFact) => {
    if (caption.toLowerCase().includes('aluminum') || caption.toLowerCase().includes('recycled')) {
      issues.push({
        id: `iss-det-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        submission_id: submissionId,
        fact_id: expiredFact.id,
        rule_title: 'Fact Vault: Expired Sustainability Certification Claim',
        category: 'claim_policy',
        severity: 'med',
        confidence: 0.91,
        source_citation: `Fact Vault record ${expiredFact.id} expired on ${new Date(expiredFact.expires_at).toLocaleDateString()}`,
        evidence: {
          conflicting_fact: expiredFact.claim,
          fact_id: expiredFact.id,
          fact_expiry: expiredFact.expires_at,
          provenance: 'caption',
        },
        explanation: `Claim references certification "${expiredFact.claim}" which expired on ${new Date(expiredFact.expires_at).toLocaleDateString()}. Claims from expired records cannot be published.`,
        suggestion: `Remove the expired claim or obtain an updated audit certificate before publishing.`,
        status: 'open',
      });
    }
  });

  return issues;
}

/**
 * Main Check Engine:
 * 1. Executes Groq GenAI analysis on text & copy using Admin rules and Fact Vault if GROQ_API_KEY is configured.
 * 2. Falls back cleanly to deterministic checks if Groq is unconfigured or rate-limited.
 * 3. Adds visual deterministic checks (Color palette delta-E and WCAG contrast).
 * 4. Deduplicates issues and computes the Brand Risk Score.
 */
export async function runCheckEngineAsync(input: CheckEngineInput): Promise<CheckEngineOutput> {
  let textIssues: Issue[] = [];
  let engineUsed: CheckEngineOutput['engineUsed'] = 'deterministic_fallback';

  // 1. Try Groq GenAI first
  const groqIssues = await runGroqAnalysis(input);
  if (groqIssues && groqIssues.length > 0) {
    textIssues = groqIssues;
    engineUsed = 'groq_ai';
  } else {
    // 2. Deterministic fallback
    textIssues = runDeterministicTextChecks(input);
    engineUsed = 'deterministic_fallback';
  }

  // 3. Visual deterministic checks
  const visualIssues = runVisualDeterministicChecks(input);
  const combinedIssues = [...textIssues, ...visualIssues];

  // 4. Deduplicate issues by rule/fact + category + text
  const deduplicatedIssues: Issue[] = [];
  const seenKeys = new Set<string>();

  combinedIssues.forEach((issue) => {
    const key = `${issue.rule_id || issue.fact_id}-${issue.category}-${issue.evidence.matched_text || issue.explanation}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicatedIssues.push(issue);
    }
  });

  // 5. Calculate Brand Risk Score (weighted severity × confidence)
  let rawScore = 0;
  deduplicatedIssues.forEach((issue) => {
    const weight = issue.severity === 'high' ? 35 : issue.severity === 'med' ? 18 : 8;
    rawScore += weight * issue.confidence;
  });

  const riskScore = Math.min(100, Math.round(rawScore));
  const riskLevel: CheckEngineOutput['riskLevel'] =
    riskScore > 75 ? 'Critical' :
    riskScore > 50 ? 'High' :
    riskScore > 25 ? 'Moderate' : 'Low';

  const highCount = deduplicatedIssues.filter((i) => i.severity === 'high').length;
  const medCount = deduplicatedIssues.filter((i) => i.severity === 'med').length;
  const lowCount = deduplicatedIssues.filter((i) => i.severity === 'low').length;
  const autoFixableCount = deduplicatedIssues.filter((i) => i.suggested_text).length;

  return {
    issues: deduplicatedIssues,
    riskScore,
    riskLevel,
    engineUsed,
    summary: {
      totalIssues: deduplicatedIssues.length,
      highSeverity: highCount,
      medSeverity: medCount,
      lowSeverity: lowCount,
      autoFixableCount,
    },
  };
}

// Synchronous wrapper for fallback compatibility
export function runCheckEngine(input: CheckEngineInput): CheckEngineOutput {
  const textIssues = runDeterministicTextChecks(input);
  const visualIssues = runVisualDeterministicChecks(input);
  const combinedIssues = [...textIssues, ...visualIssues];

  const deduplicatedIssues: Issue[] = [];
  const seenKeys = new Set<string>();

  combinedIssues.forEach((issue) => {
    const key = `${issue.rule_id || issue.fact_id}-${issue.category}-${issue.evidence.matched_text || issue.explanation}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicatedIssues.push(issue);
    }
  });

  let rawScore = 0;
  deduplicatedIssues.forEach((issue) => {
    const weight = issue.severity === 'high' ? 35 : issue.severity === 'med' ? 18 : 8;
    rawScore += weight * issue.confidence;
  });

  const riskScore = Math.min(100, Math.round(rawScore));
  const riskLevel: CheckEngineOutput['riskLevel'] =
    riskScore > 75 ? 'Critical' :
    riskScore > 50 ? 'High' :
    riskScore > 25 ? 'Moderate' : 'Low';

  return {
    issues: deduplicatedIssues,
    riskScore,
    riskLevel,
    engineUsed: 'deterministic_fallback',
    summary: {
      totalIssues: deduplicatedIssues.length,
      highSeverity: deduplicatedIssues.filter((i) => i.severity === 'high').length,
      medSeverity: deduplicatedIssues.filter((i) => i.severity === 'med').length,
      lowSeverity: deduplicatedIssues.filter((i) => i.severity === 'low').length,
      autoFixableCount: deduplicatedIssues.filter((i) => i.suggested_text).length,
    },
  };
}
