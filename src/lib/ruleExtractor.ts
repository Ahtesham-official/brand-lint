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

export function normalizeRuleItem(item: any): ExtractedRuleItem | null {
  if (!item || typeof item !== 'object') return null;

  const title =
    typeof item.title === 'string' && item.title.trim().length > 0
      ? item.title.trim()
      : typeof item.rule === 'string' && item.rule.trim().length > 0
      ? item.rule.trim()
      : typeof item.description === 'string' && item.description.trim().length > 0
      ? item.description.trim().slice(0, 80)
      : '';

  const description =
    typeof item.description === 'string' && item.description.trim().length > 0
      ? item.description.trim()
      : title;

  if (!title || !description) return null;

  // Category normalization
  let category: RuleCategory = 'messaging';
  const rawCat = String(item.category || '').toLowerCase().replace(/[-\s]/g, '_');
  if (
    rawCat.includes('banned') ||
    rawCat.includes('prohibited') ||
    rawCat.includes('forbidden') ||
    rawCat.includes('superlative') ||
    rawCat.includes('word')
  ) {
    category = 'banned_term';
  } else if (
    rawCat.includes('disclaimer') ||
    rawCat.includes('required_phrase') ||
    rawCat.includes('mandatory')
  ) {
    category = 'required_disclaimer';
  } else if (rawCat.includes('tone') || rawCat.includes('voice')) {
    category = 'tone';
  } else if (
    rawCat.includes('color') ||
    rawCat.includes('colour') ||
    rawCat.includes('palette')
  ) {
    category = 'visual_colour';
  } else if (rawCat.includes('contrast') || rawCat.includes('wcag')) {
    category = 'visual_contrast';
  } else if (
    rawCat.includes('claim') ||
    rawCat.includes('proof') ||
    rawCat.includes('warranty') ||
    rawCat.includes('spec')
  ) {
    category = 'claim_policy';
  } else if (rawCat.includes('message') || rawCat.includes('copy') || rawCat.includes('headline')) {
    category = 'messaging';
  }

  // Severity normalization
  let severity: Severity = 'med';
  const rawSev = String(item.severity || '').toLowerCase();
  if (
    rawSev.includes('high') ||
    rawSev.includes('crit') ||
    rawSev.includes('zero') ||
    rawSev.includes('strict')
  ) {
    severity = 'high';
  } else if (rawSev.includes('low') || rawSev.includes('minor') || rawSev.includes('warn')) {
    severity = 'low';
  } else {
    severity = 'med';
  }

  // Enforcement type
  let enforcement_type: 'automated' | 'manual_review' =
    category === 'banned_term' ||
    category === 'required_disclaimer' ||
    category === 'visual_colour' ||
    category === 'visual_contrast'
      ? 'automated'
      : 'manual_review';
  if (item.enforcement_type === 'automated' || item.enforcement_type === 'manual_review') {
    enforcement_type = item.enforcement_type;
  }

  // Confidence
  let confidence = typeof item.confidence === 'number' ? item.confidence : parseFloat(item.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    confidence = 0.92;
  }

  // Source citation
  const source_citation =
    typeof item.source_citation === 'string' && item.source_citation.trim().length > 0
      ? item.source_citation.trim()
      : typeof item.citation === 'string' && item.citation.trim().length > 0
      ? item.citation.trim()
      : typeof item.quote === 'string' && item.quote.trim().length > 0
      ? item.quote.trim()
      : description;

  const banned_words = Array.isArray(item.banned_words)
    ? item.banned_words.filter((w: any) => typeof w === 'string' && w.trim().length > 0)
    : undefined;

  const required_phrase =
    typeof item.required_phrase === 'string' && item.required_phrase.trim().length > 0
      ? item.required_phrase.trim()
      : undefined;

  return {
    category,
    title,
    description,
    severity,
    enforcement_type,
    confidence,
    source_citation,
    banned_words,
    required_phrase,
  };
}

export function validateRuleSchema(item: any): item is ExtractedRuleItem {
  return normalizeRuleItem(item) !== null;
}

/**
 * Executes a Groq completion request with automatic fallback to llama-3.3-70b-versatile
 * if rate limit (429) occurs.
 */
async function callGroqWithFallback(apiKey: string, body: any): Promise<Response> {
  const primaryModel = body.model || 'openai/gpt-oss-120b';
  const fallbackModel = 'llama-3.3-70b-versatile';

  let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429 && primaryModel !== fallbackModel) {
    console.warn(`Groq model ${primaryModel} reached 429 rate limit. Seamlessly falling back to ${fallbackModel}...`);
    response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({ ...body, model: fallbackModel }),
    });
  }

  return response;
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

  const response = await callGroqWithFallback(apiKey, {
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

  const normalized = rulesList
    .map(normalizeRuleItem)
    .filter((r: any): r is ExtractedRuleItem => Boolean(r));

  return normalized.map((item: ExtractedRuleItem, idx: number) => ({
    ...item,
    id: `rule-groq-${Date.now()}-${idx}`,
    guideline_id: guidelineId,
    org_id: orgId,
    status: 'extracted' as const,
  }));
}
