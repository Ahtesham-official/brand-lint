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
    }),
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

  const rawFacts = Array.isArray(parsed.extracted_facts) ? parsed.extracted_facts : [];
  const extractedFacts: ExtractedFactCandidate[] = rawFacts
    .filter(
      (f: any) =>
        f &&
        typeof f.claim === 'string' &&
        f.claim.trim().length > 0
    )
    .map((f: any) => ({
      fact_title: typeof f.fact_title === 'string' && f.fact_title.trim() ? f.fact_title.trim() : f.claim.trim().slice(0, 60),
      fact_value: typeof f.fact_value === 'string' && f.fact_value.trim() ? f.fact_value.trim() : f.claim.trim(),
      claim: f.claim.trim(),
      category: typeof f.category === 'string' && f.category.trim() ? f.category.trim() : 'Document Fact',
    }));

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
