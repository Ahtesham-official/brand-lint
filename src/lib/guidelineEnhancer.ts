import { GuidelineAnalysis } from '@/types';

export interface ExtractedFactCandidate {
  fact_title: string;
  fact_value: string;
  claim: string;
  category: string;
  expires_at?: string;
}

export interface EnhanceGuidelineResult {
  analysis: GuidelineAnalysis;
  enhanced_version: string;
  extracted_facts: ExtractedFactCandidate[];
  warnings?: string[];
}

const NOT_SPECIFIED = 'Not specified in document';

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
 * Analyzes raw guidelines using Groq LLM and generates:
 * 1. Document-grounded AI Comprehension Summary (using "Not specified in document" when omitted)
 * 2. An Enhanced, Production-Grade Markdown Version of THIS exact document
 * 3. Explicit factual claims found in the document (empty array if none exist)
 *
 * Throws an error if GROQ_API_KEY is missing or the API request fails.
 * Never returns hardcoded or cross-brand fallback content.
 */
export async function analyzeAndEnhanceGuideline(
  rawText: string,
  filename = 'Uploaded Guideline'
): Promise<EnhanceGuidelineResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('GROQ_API_KEY is not configured on the server. Extraction cannot proceed.');
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Guideline document text is empty.');
  }

  const response = await callGroqWithFallback(apiKey, {
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: `You are BrandLint's Brand Governance Architect.
Analyze ONLY the uploaded brand guideline document provided by the user.
CRITICAL RULES:
- Never invent, assume, or substitute information from any other brand or template.
- If a field (such as brand_name, brand_identity, tone_profile, or target_audience) is not explicitly stated or clearly described in the uploaded document, set its value to exactly "Not specified in document".
- Extract "extracted_facts" ONLY when the document explicitly states concrete factual claims, product specifications, warranty durations, certifications, or verified numerical commitments. If none are present, return an empty array [].
- Produce "enhanced_version" by restructuring and clarifying ONLY the rules, identity, and policies present in this uploaded document into clean Markdown.

Return STRICT JSON with this exact schema:
{
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
  "enhanced_version": string,
  "extracted_facts": [
    {
      "fact_title": string,
      "fact_value": string,
      "claim": string,
      "category": string
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Document Filename: ${filename}\n\nDocument Content:\n${rawText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Groq comprehension API failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq API returned an empty response for guideline comprehension.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Groq API returned invalid JSON for guideline comprehension.');
  }

  if (!parsed || !parsed.analysis) {
    throw new Error('Groq API response missing required analysis object.');
  }

  const rawAnalysis = parsed.analysis;
  const warnings: string[] = [];

  const strOrMissing = (val: unknown): string =>
    typeof val === 'string' && val.trim().length > 0 ? val.trim() : NOT_SPECIFIED;

  const arrOrEmpty = (val: unknown): string[] =>
    Array.isArray(val) ? val.filter((v) => typeof v === 'string' && v.trim().length > 0) : [];

  const strictness = ['Permissive', 'Balanced', 'Strict', 'Zero-Tolerance'].includes(
    rawAnalysis.strictness_level
  )
    ? rawAnalysis.strictness_level
    : 'Balanced';

  const enhancedVersion =
    typeof parsed.enhanced_version === 'string' && parsed.enhanced_version.trim().length > 0
      ? parsed.enhanced_version.trim()
      : '';

  if (!enhancedVersion) {
    warnings.push('AI enhanced version could not be generated for this document.');
  }

  const rawFacts = Array.isArray(parsed.extracted_facts)
    ? parsed.extracted_facts
    : Array.isArray(parsed.facts)
    ? parsed.facts
    : [];

  const extractedFacts: ExtractedFactCandidate[] = rawFacts
    .map((f: any) => {
      if (!f || typeof f !== 'object') return null;
      const claimText =
        typeof f.claim === 'string' && f.claim.trim().length > 0
          ? f.claim.trim()
          : typeof f.fact_value === 'string' && f.fact_value.trim().length > 0
          ? f.fact_value.trim()
          : typeof f.statement === 'string' && f.statement.trim().length > 0
          ? f.statement.trim()
          : typeof f.fact === 'string' && f.fact.trim().length > 0
          ? f.fact.trim()
          : typeof f.value === 'string' && f.value.trim().length > 0
          ? f.value.trim()
          : '';
      if (!claimText) return null;

      const factTitle =
        typeof f.fact_title === 'string' && f.fact_title.trim().length > 0
          ? f.fact_title.trim()
          : typeof f.title === 'string' && f.title.trim().length > 0
          ? f.title.trim()
          : claimText.slice(0, 60);

      const factValue =
        typeof f.fact_value === 'string' && f.fact_value.trim().length > 0
          ? f.fact_value.trim()
          : claimText;

      const category =
        typeof f.category === 'string' && f.category.trim().length > 0
          ? f.category.trim()
          : 'Verified Fact';

      return {
        fact_title: factTitle,
        fact_value: factValue,
        claim: claimText,
        category,
        expires_at: typeof f.expires_at === 'string' ? f.expires_at : undefined,
      };
    })
    .filter((f: any): f is ExtractedFactCandidate => Boolean(f));

  return {
    analysis: {
      brand_name: strOrMissing(rawAnalysis.brand_name),
      brand_identity: strOrMissing(rawAnalysis.brand_identity),
      summary: strOrMissing(rawAnalysis.summary),
      key_takeaways: arrOrEmpty(rawAnalysis.key_takeaways),
      tone_profile: strOrMissing(rawAnalysis.tone_profile),
      strictness_level: strictness,
      target_audience: strOrMissing(rawAnalysis.target_audience),
      recommended_actions: arrOrEmpty(rawAnalysis.recommended_actions),
      document_requirements: arrOrEmpty(rawAnalysis.document_requirements),
    },
    enhanced_version: enhancedVersion,
    extracted_facts: extractedFacts,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
