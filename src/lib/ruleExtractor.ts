import { Rule, RuleCategory, Severity } from '../types';

export interface ExtractedRuleItem {
  category: RuleCategory;
  title: string;
  description: string;
  severity: Severity;
  enforcement_type?: 'automated' | 'manual_review';
  confidence: number;
  source_citation: string;
  banned_words?: string[];
  required_phrase?: string;
}

export function validateRuleSchema(item: any): item is ExtractedRuleItem {
  const validCategories: RuleCategory[] = [
    'banned_term',
    'required_disclaimer',
    'tone',
    'messaging',
    'claim_policy',
    'visual_colour',
    'visual_contrast',
  ];
  const validSeverities: Severity[] = ['low', 'med', 'high'];

  return (
    typeof item === 'object' &&
    item !== null &&
    validCategories.includes(item.category) &&
    typeof item.title === 'string' && item.title.trim().length > 0 &&
    typeof item.description === 'string' && item.description.trim().length > 0 &&
    validSeverities.includes(item.severity) &&
    typeof item.confidence === 'number' && item.confidence >= 0 && item.confidence <= 1 &&
    typeof item.source_citation === 'string' && item.source_citation.trim().length > 0
  );
}

/**
 * Extracts atomic, document-grounded compliance rules using Groq LLM.
 * Never returns hardcoded or cross-brand fallback rules.
 * Throws an explicit error if GROQ_API_KEY is missing or the API request fails.
 */
export async function extractRulesFromGuidelineText(
  text: string,
  guidelineId: string,
  orgId?: string
): Promise<Rule[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('GROQ_API_KEY is not configured on the server. Rule extraction cannot proceed.');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Guideline text is empty.');
  }

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
          content: `You are BrandLint's brand guideline compiler.
Extract atomic, enforceable brand governance rules strictly from the uploaded guideline document below.
Return STRICT JSON with a root object containing an array "rules":
{
  "rules": [
    {
      "category": "banned_term" | "required_disclaimer" | "tone" | "messaging" | "claim_policy" | "visual_colour" | "visual_contrast",
      "title": string,
      "description": string,
      "severity": "high" | "med" | "low",
      "enforcement_type": "automated" | "manual_review",
      "confidence": number between 0.0 and 1.0,
      "source_citation": string (verbatim quote from the uploaded text),
      "banned_words": string[] (optional for banned_term),
      "required_phrase": string (optional for required_disclaimer)
    }
  ]
}
CRITICAL:
- Rules must be atomic — one constraint per rule.
- Every rule and source_citation MUST come verbatim from the provided document.
- Do NOT invent rules or copy rules from any other brand.
- If the document contains no enforceable rules, return {"rules": []}.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Groq rule extraction API failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq rule extraction returned an empty response.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Groq rule extraction returned invalid JSON.');
  }

  const rulesList = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.rules)
    ? parsed.rules
    : [];

  return rulesList
    .filter(validateRuleSchema)
    .map((item: ExtractedRuleItem, idx: number) => ({
      ...item,
      enforcement_type:
        item.enforcement_type === 'manual_review' || item.enforcement_type === 'automated'
          ? item.enforcement_type
          : item.category === 'banned_term' || item.category === 'required_disclaimer' || item.category === 'visual_colour' || item.category === 'visual_contrast'
          ? 'automated'
          : 'manual_review',
      id: `rule-groq-${Date.now()}-${idx}`,
      guideline_id: guidelineId,
      org_id: orgId,
      status: 'extracted' as const,
    }));
}
