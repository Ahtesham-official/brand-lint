import { Fact, GuidelineAnalysis, Rule, RuleCategory, Severity } from '@/types';
import { normalizeRuleItem, ExtractedRuleItem } from './ruleExtractor';
import { ExtractedFactCandidate } from './guidelineEnhancer';

const NOT_SPECIFIED = 'Not specified in document';

/**
 * Prepares raw text to fit comfortably within Groq's 8,000 TPM limit.
 * 12,000 characters is ~3,000 tokens, leaving ample budget for response.
 */
export function prepareGuidelineText(rawText: string, maxChars = 10000): string {
  const clean = (rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (clean.length <= maxChars) return clean;
  // Give 85% to head (where brand foundation, copy rules, fact vault, visual colors are located)
  const headChars = Math.floor(maxChars * 0.85);
  const tailChars = maxChars - headChars;
  return `${clean.slice(0, headChars)}\n\n[... content truncated for compliance analysis ...]\n\n${clean.slice(-tailChars)}`;
}

/**
 * Executes a Groq completion request with automatic retry across available models
 * (openai/gpt-oss-120b -> openai/gpt-oss-20b -> qwen/qwen3.8-27b) and 429 backoff.
 */
export async function callGroqWithSmartRetry(apiKey: string, body: any): Promise<Response> {
  const modelsToTry = [
    body.model || 'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
  ];

  let lastErrorText = '';

  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({ ...body, model }),
      });

      if (response.ok) {
        return response;
      }

      const status = response.status;
      lastErrorText = await response.text().catch(() => response.statusText);

      // If rate limited (429), parse retry-after or wait intelligently before trying the next model
      if (status === 429) {
        let waitMs = 5000;
        const match = lastErrorText.match(/try again in ([\d.]+)s/i);
        if (match && match[1]) {
          waitMs = Math.ceil(parseFloat(match[1]) * 1000) + 500;
        }
        console.warn(`Groq model ${model} reached 429 rate limit. Waiting ${waitMs}ms before retry...`);
        await new Promise((r) => setTimeout(r, Math.min(waitMs, 10000)));
        continue;
      }

      // If model not found (404) or server error (5xx), try next model
      if (status === 404 || status >= 500) {
        console.warn(`Groq model ${model} returned ${status}. Retrying with next model...`);
        continue;
      }

      // Other 4xx error (e.g. 400 bad payload), do not retry
      break;
    } catch (e: any) {
      lastErrorText = e?.message || 'Network error';
    }
  }

  throw new Error(`Groq extraction API failed: ${lastErrorText}`);
}

export function generateEnhancedMarkdown(
  analysis: GuidelineAnalysis,
  rules: Rule[]
): string {
  const brandName = analysis.brand_name || 'Brand';
  const lines: string[] = [
    `# ${brandName} Brand Governance & Compliance Policy`,
    '',
    `## 1. Brand Identity & Overview`,
    analysis.summary || 'Official brand compliance rules and guidelines.',
    '',
    `**Brand Identity:** ${analysis.brand_identity || NOT_SPECIFIED}`,
    `**Voice & Tone:** ${analysis.tone_profile || NOT_SPECIFIED}`,
    `**Target Audience:** ${analysis.target_audience || NOT_SPECIFIED}`,
    `**Strictness Level:** ${analysis.strictness_level || 'Balanced'}`,
    '',
    `## 2. Enforceable Brand Rules`,
  ];

  if (rules.length === 0) {
    lines.push('No explicit enforceable rules were identified in this document.');
  } else {
    rules.forEach((r, idx) => {
      lines.push(`### ${idx + 1}. ${r.title} (${r.category})`);
      lines.push(`- **Severity:** ${r.severity.toUpperCase()}`);
      lines.push(`- **Enforcement:** ${r.enforcement_type || 'automated'}`);
      lines.push(`- **Description:** ${r.description}`);
      if (r.source_citation) {
        lines.push(`- **Citation:** *"${r.source_citation}"*`);
      }
      lines.push('');
    });
  }

  if (analysis.key_takeaways && analysis.key_takeaways.length > 0) {
    lines.push(`## 3. Core Constraints`);
    analysis.key_takeaways.forEach((k) => lines.push(`- ${k}`));
    lines.push('');
  }

  if (analysis.document_requirements && analysis.document_requirements.length > 0) {
    lines.push(`## 4. Document-Specific Requirements`);
    analysis.document_requirements.forEach((req) => lines.push(`- ${req}`));
    lines.push('');
  }

  return lines.join('\n');
}

export interface ExtractedBrandProfile {
  name: string;
  tagline?: string;
  primary_color?: string;
  primary_color_name?: string;
  secondary_color?: string;
  secondary_color_name?: string;
  accent_color?: string;
  accent_color_name?: string;
  forbidden_colors?: string[];
  wcag_min_contrast?: number;
}

export interface UnifiedExtractionResult {
  rules: Rule[];
  analysis: GuidelineAnalysis;
  enhanced_version: string;
  extracted_facts: ExtractedFactCandidate[];
  brand_profile?: ExtractedBrandProfile;
  warnings: string[];
}

/**
 * Extracts rules, AI comprehension analysis, enhanced markdown, and facts
 * in a SINGLE unified request to Groq, preventing token rate limit spikes.
 */
export async function extractGuidelineIntelligence(
  rawText: string,
  filename: string,
  guidelineId: string,
  orgId?: string
): Promise<UnifiedExtractionResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('GROQ_API_KEY is not configured on the server. Rule extraction cannot proceed.');
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Guideline text is empty.');
  }

  const preparedText = prepareGuidelineText(rawText);

  const prompt = `You are BrandLint's Brand Governance Compiler.
Analyze the uploaded brand guideline document and extract:
1. "rules": Atomic, enforceable brand compliance rules (banned terms, required disclaimers, tone, visual colors, contrast, claim policies).
2. "analysis": Brand overview, identity, summary, key takeaways, tone profile, strictness level, target audience, recommended actions, document requirements.
3. "brand_profile": Brand name, primary tagline/motto, color palette (primary, secondary, accent with HEX codes and color names), forbidden/prohibited colors (HEX array), and minimum WCAG contrast ratio (e.g. 4.5).
4. "extracted_facts": ALL approved facts, factual claims, product specifications, dilution instructions/ratios, packaging details, scent options, warranties, guarantees, certifications, and verified company statements explicitly listed in the document (such as in "Approved Fact Vault", tables, or specification sections).

Return STRICT JSON with this exact structure:
{
  "rules": [
    {
      "category": "banned_term" | "required_disclaimer" | "tone" | "messaging" | "claim_policy" | "visual_colour" | "visual_contrast",
      "title": string,
      "description": string,
      "severity": "high" | "med" | "low",
      "enforcement_type": "automated" | "manual_review",
      "confidence": number between 0.0 and 1.0,
      "source_citation": string (verbatim quote from text),
      "banned_words": string[] (optional for banned_term),
      "required_phrase": string (optional for required_disclaimer)
    }
  ],
  "analysis": {
    "brand_name": string,
    "brand_identity": string,
    "summary": string,
    "key_takeaways": string[],
    "tone_profile": string,
    "strictness_level": "Permissive" | "Balanced" | "Strict" | "Zero-Tolerance",
    "target_audience": string,
    "recommended_actions": string[],
    "document_requirements": string[]
  },
  "brand_profile": {
    "name": string,
    "tagline": string,
    "primary_color": string (HEX e.g. "#173D32"),
    "primary_color_name": string (e.g. "Forest green"),
    "secondary_color": string (HEX e.g. "#E8F2E5"),
    "secondary_color_name": string (e.g. "Soft mint"),
    "accent_color": string (HEX e.g. "#7BBE63"),
    "accent_color_name": string (e.g. "Leaf green"),
    "forbidden_colors": string[],
    "wcag_min_contrast": number
  },
  "extracted_facts": [
    {
      "fact_title": string,
      "fact_value": string,
      "claim": string,
      "category": string,
      "notes": string
    }
  ]
}
CRITICAL RULES:
- Never invent information from other brands. If not specified, set string fields to "Not specified in document".
- For extracted_facts, include EVERY approved fact listed in the document. "claim" must be the full statement as a string.
- Every rule must be atomic and grounded in the document.`;

  const response = await callGroqWithSmartRetry(apiKey, {
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `Document Filename: ${filename}\n\nDocument Content:\n${preparedText}` },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4096,
    temperature: 0.1,
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq extraction returned an empty response.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Groq extraction returned invalid JSON.');
  }

  const rawRulesList = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.rules)
    ? parsed.rules
    : [];

  const normalizedRules = rawRulesList
    .map(normalizeRuleItem)
    .filter((r: any): r is ExtractedRuleItem => Boolean(r))
    .map((item: ExtractedRuleItem, idx: number) => ({
      ...item,
      id: `rule-groq-${Date.now()}-${idx}`,
      guideline_id: guidelineId,
      org_id: orgId,
      status: 'extracted' as const,
    }));

  const rawAnalysis = parsed.analysis || {};
  const rawBrandProfile = parsed.brand_profile || {};

  const strOrMissing = (val: unknown): string =>
    typeof val === 'string' && val.trim().length > 0 ? val.trim() : NOT_SPECIFIED;
  const arrOrEmpty = (val: unknown): string[] =>
    Array.isArray(val) ? val.filter((v) => typeof v === 'string' && v.trim().length > 0) : [];
  const strictness = ['Permissive', 'Balanced', 'Strict', 'Zero-Tolerance'].includes(
    rawAnalysis.strictness_level
  )
    ? rawAnalysis.strictness_level
    : 'Balanced';

  // Extract brand name from brand_profile or analysis with flexible keys
  const resolvedBrandName =
    strOrMissing(
      rawBrandProfile.brand_name ||
        rawBrandProfile.name ||
        rawAnalysis.brand_name ||
        rawAnalysis.name
    );

  // Extract tagline from brand_profile or analysis with flexible keys
  const resolvedTagline =
    strOrMissing(
      rawBrandProfile.primary_tagline ||
        rawBrandProfile.tagline ||
        rawBrandProfile.motto ||
        rawAnalysis.tagline ||
        rawAnalysis.primary_tagline
    );

  // Extract voice and tone profile with flexible keys
  const resolvedTone =
    strOrMissing(
      rawAnalysis.tone_profile ||
        rawAnalysis.voice_and_tone ||
        rawAnalysis.personality ||
        rawAnalysis.tone
    );

  // Extract brand identity with flexible keys
  const resolvedIdentity =
    strOrMissing(
      rawAnalysis.brand_identity ||
        rawAnalysis.purpose_and_positioning ||
        rawAnalysis.positioning ||
        rawAnalysis.identity
    );

  // Extract summary with flexible keys
  const resolvedSummary =
    strOrMissing(
      rawAnalysis.summary ||
        rawAnalysis.brand_overview ||
        rawAnalysis.overview ||
        rawAnalysis.positioning
    );

  const analysis: GuidelineAnalysis = {
    brand_name: resolvedBrandName,
    brand_identity: resolvedIdentity,
    summary: resolvedSummary,
    key_takeaways: arrOrEmpty(rawAnalysis.key_takeaways),
    tone_profile: resolvedTone,
    strictness_level: strictness,
    target_audience: strOrMissing(rawAnalysis.target_audience || rawAnalysis.audience),
    recommended_actions: arrOrEmpty(rawAnalysis.recommended_actions),
    document_requirements: arrOrEmpty(rawAnalysis.document_requirements),
  };

  const isHex = (h: unknown): string | undefined =>
    typeof h === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i.test(h.trim()) ? h.trim().toUpperCase() : undefined;

  const colorPalette = rawBrandProfile.color_palette || rawBrandProfile.palette || rawBrandProfile.colors || {};

  const primaryHex =
    isHex(rawBrandProfile.primary_color) ||
    isHex(colorPalette.primary?.hex) ||
    isHex(colorPalette.primary);

  const primaryName =
    typeof rawBrandProfile.primary_color_name === 'string'
      ? rawBrandProfile.primary_color_name.trim()
      : typeof colorPalette.primary?.name === 'string'
      ? colorPalette.primary.name.trim()
      : undefined;

  const secondaryHex =
    isHex(rawBrandProfile.secondary_color) ||
    isHex(colorPalette.secondary?.hex) ||
    isHex(colorPalette.secondary);

  const secondaryName =
    typeof rawBrandProfile.secondary_color_name === 'string'
      ? rawBrandProfile.secondary_color_name.trim()
      : typeof colorPalette.secondary?.name === 'string'
      ? colorPalette.secondary.name.trim()
      : undefined;

  const accentHex =
    isHex(rawBrandProfile.accent_color) ||
    isHex(colorPalette.accent?.hex) ||
    isHex(colorPalette.accent);

  const accentName =
    typeof rawBrandProfile.accent_color_name === 'string'
      ? rawBrandProfile.accent_color_name.trim()
      : typeof colorPalette.accent?.name === 'string'
      ? colorPalette.accent.name.trim()
      : undefined;

  const forbiddenRaw =
    rawBrandProfile.forbidden_colors ||
    colorPalette.forbidden_colors ||
    rawBrandProfile.prohibited_colors ||
    [];

  const forbiddenColors = Array.isArray(forbiddenRaw)
    ? (forbiddenRaw.map((c: any) => isHex(c)).filter(Boolean) as string[])
    : undefined;

  const contrastVal =
    typeof rawBrandProfile.wcag_min_contrast === 'number' && rawBrandProfile.wcag_min_contrast > 0
      ? rawBrandProfile.wcag_min_contrast
      : typeof rawBrandProfile.minimum_wcag_contrast_ratio === 'number' && rawBrandProfile.minimum_wcag_contrast_ratio > 0
      ? rawBrandProfile.minimum_wcag_contrast_ratio
      : 4.5;

  const brandProfile: ExtractedBrandProfile | undefined =
    resolvedBrandName !== NOT_SPECIFIED
      ? {
          name: resolvedBrandName,
          tagline: resolvedTagline !== NOT_SPECIFIED ? resolvedTagline : undefined,
          primary_color: primaryHex,
          primary_color_name: primaryName,
          secondary_color: secondaryHex,
          secondary_color_name: secondaryName,
          accent_color: accentHex,
          accent_color_name: accentName,
          forbidden_colors: forbiddenColors,
          wcag_min_contrast: contrastVal,
        }
      : undefined;

  const rawFacts = Array.isArray(parsed.extracted_facts)
    ? parsed.extracted_facts
    : Array.isArray(parsed.facts)
    ? parsed.facts
    : [];

  const extractedFacts: ExtractedFactCandidate[] = rawFacts
    .map((f: any) => {
      if (!f || typeof f !== 'object') return null;

      // Robustly extract factual claim text from any key the LLM might have used
      const claimText =
        typeof f.claim === 'string' && f.claim.trim().length > 0 && f.claim.toLowerCase() !== 'true'
          ? f.claim.trim()
          : typeof f.text === 'string' && f.text.trim().length > 0
          ? f.text.trim()
          : typeof f.fact_value === 'string' && f.fact_value.trim().length > 0
          ? f.fact_value.trim()
          : typeof f.statement === 'string' && f.statement.trim().length > 0
          ? f.statement.trim()
          : typeof f.approved_fact === 'string' && f.approved_fact.trim().length > 0
          ? f.approved_fact.trim()
          : typeof f.fact === 'string' && f.fact.trim().length > 0
          ? f.fact.trim()
          : typeof f.content === 'string' && f.content.trim().length > 0
          ? f.content.trim()
          : typeof f.description === 'string' && f.description.trim().length > 0
          ? f.description.trim()
          : typeof f.value === 'string' && f.value.trim().length > 0
          ? f.value.trim()
          : '';
      if (!claimText) return null;

      const factTitle =
        typeof f.fact_title === 'string' && f.fact_title.trim().length > 0
          ? f.fact_title.trim()
          : typeof f.title === 'string' && f.title.trim().length > 0
          ? f.title.trim()
          : typeof f.fact_id === 'string' && f.fact_id.trim().length > 0
          ? `${f.fact_id}: ${claimText.slice(0, 50)}`
          : typeof f.id === 'string' && f.id.trim().length > 0
          ? `${f.id}: ${claimText.slice(0, 50)}`
          : claimText.slice(0, 60);

      const factValue =
        typeof f.fact_value === 'string' && f.fact_value.trim().length > 0
          ? f.fact_value.trim()
          : claimText;

      const category =
        typeof f.category === 'string' && f.category.trim().length > 0
          ? f.category.trim()
          : typeof f.type === 'string' && f.type.trim().length > 0
          ? f.type.trim()
          : 'Verified Fact';

      const notes =
        typeof f.notes === 'string' && f.notes.trim().length > 0
          ? f.notes.trim()
          : typeof f.scope === 'string' && f.scope.trim().length > 0
          ? f.scope.trim()
          : typeof f.limitation === 'string' && f.limitation.trim().length > 0
          ? f.limitation.trim()
          : typeof f.scope_limitation === 'string' && f.scope_limitation.trim().length > 0
          ? f.scope_limitation.trim()
          : undefined;

      return {
        fact_title: factTitle,
        fact_value: factValue,
        claim: claimText,
        category,
        notes,
        expires_at: typeof f.expires_at === 'string' ? f.expires_at : undefined,
      };
    })
    .filter((f: any): f is ExtractedFactCandidate => Boolean(f));

  const enhancedVersion =
    typeof parsed.enhanced_version === 'string' && parsed.enhanced_version.trim().length > 0
      ? parsed.enhanced_version.trim()
      : generateEnhancedMarkdown(analysis, normalizedRules);

  const warnings: string[] = [];
  if (normalizedRules.length === 0) {
    warnings.push('No explicit enforceable rules were identified in this document.');
  }

  return {
    rules: normalizedRules,
    analysis,
    enhanced_version: enhancedVersion,
    extracted_facts: extractedFacts,
    brand_profile: brandProfile,
    warnings,
  };
}
