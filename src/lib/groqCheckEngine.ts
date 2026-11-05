import { Rule, Fact, Brand, Issue, Severity, RuleCategory } from '@/types';

export interface GroqAnalyzeInput {
  submissionId: string;
  caption: string;
  ocrText?: string;
  brand: Brand;
  rules: Rule[]; // Active rules defined and confirmed by Admin
  facts: Fact[]; // Fact vault records approved by Admin
}

export interface GroqIssueResponse {
  rule_id?: string;
  fact_id?: string;
  category: RuleCategory;
  severity: Severity;
  confidence: number;
  matched_text: string;
  source_citation: string;
  explanation: string;
  suggestion: string;
  suggested_text?: string;
}

/**
 * Runs GenAI compliance analysis using the Groq API.
 * Groq strictly evaluates the user submission against the Admin's active rulebook and approved Fact Vault.
 */
export async function runGroqAnalysis(input: GroqAnalyzeInput): Promise<Issue[] | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  const { submissionId, caption, ocrText = '', brand, rules, facts } = input;
  const combinedText = `CAPTION TEXT:\n${caption}\n\nPOSTER OCR GRAPHIC TEXT:\n${ocrText || '(No OCR text detected)'}`.trim();

  // Format admin rules cleanly for the prompt
  const adminRulesContext = rules.map((r, i) => ({
    rule_id: r.id,
    category: r.category,
    title: r.title,
    severity: r.severity,
    description: r.description,
    source_citation: r.source_citation,
    banned_words: r.banned_words,
    required_phrase: r.required_phrase,
  }));

  // Format approved facts cleanly for the prompt
  const factVaultContext = facts.map((f) => ({
    fact_id: f.id,
    claim: f.claim,
    source_document: f.source_document,
    expires_at: f.expires_at,
    is_expired: new Date(f.expires_at) < new Date() || f.status === 'expired',
    status: f.status,
  }));

  const systemPrompt = `You are BrandLint's core AI Brand Compliance Judge.
You must judge submitted marketing copy against ONLY the specific Admin-defined rules and Fact Vault records provided below.

CRITICAL INSTRUCTIONS:
1. ONLY judge against the provided Admin Rules and Fact Vault. Do not invent external rules.
2. For claim violations:
   - If a claim (e.g. warranty duration, specs, awards) contradicts a Fact Vault entry, cite the exact fact_id and rule_id, flag as high severity, and explain the mismatch.
   - If a claim relies on an expired Fact Vault entry, flag it with the expiry date.
3. For banned terms: If any term in an Admin rule or superlative like "India's #1", "#1", or "unbeatable" appears, cite the rule_id.
4. For tone & messaging: Compare the tone to the Admin's tone guidelines (e.g. understated authority vs hype/exclamation spam).
5. For required disclaimers: If promotional content is detected and a required disclaimer rule exists, check if the mandated phrase is present. If missing, flag it.
6. Provide an actionable suggested_text rewrite for auto-fixing caption text issues while preserving creative intent.
7. Return STRICT JSON with a root object containing an array of "issues".

SCHEMA FOR EACH ISSUE:
{
  "rule_id": string (must match an admin rule_id if applicable),
  "fact_id": string (must match a fact_id if this is a fact contradiction/expiry),
  "category": "banned_term" | "required_disclaimer" | "tone" | "messaging" | "claim_policy" | "visual_colour" | "visual_contrast",
  "severity": "high" | "med" | "low",
  "confidence": number between 0.0 and 1.0,
  "matched_text": string (the exact offending words from caption or OCR),
  "source_citation": string (quote from the Admin rule or fact source),
  "explanation": string (why this violates the admin constraint),
  "suggestion": string (how the creator can resolve it),
  "suggested_text": string (full revised caption with the fix applied)
}`;

  const userPrompt = `BRAND PROFILE:
Brand Name: ${brand.name}
Tagline: ${brand.tagline || ''}

ADMIN RULES & POLICIES:
${JSON.stringify(adminRulesContext, null, 2)}

ADMIN APPROVED FACT VAULT:
${JSON.stringify(factVaultContext, null, 2)}

CONTENT SUBMITTED BY CREATOR FOR JUDGING:
${combinedText}

Analyze the submission now. Return STRICT JSON: { "issues": [ ... ] }`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`Groq API error (${response.status}):`, errBody);
      return null;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const parsed = JSON.parse(rawContent);
    const rawIssues: GroqIssueResponse[] = Array.isArray(parsed)
      ? parsed
      : parsed.issues || parsed.violations || Object.values(parsed)[0];

    if (!Array.isArray(rawIssues)) return null;

    // Convert Groq output to typed Issues
    const issues: Issue[] = rawIssues.map((item, idx) => {
      // Find matching rule to populate rule_title
      const matchedRule = rules.find((r) => r.id === item.rule_id);
      const matchedFact = facts.find((f) => f.id === item.fact_id);

      return {
        id: `iss-groq-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        submission_id: submissionId,
        rule_id: item.rule_id || matchedRule?.id,
        fact_id: item.fact_id || matchedFact?.id,
        rule_title: matchedRule?.title || (item.fact_id ? 'Fact Vault Synchronization Mismatch' : `Rule Violation: ${item.category}`),
        category: item.category,
        severity: item.severity || 'med',
        confidence: typeof item.confidence === 'number' ? Math.min(1, Math.max(0, item.confidence)) : 0.92,
        source_citation: item.source_citation || matchedRule?.source_citation || 'Admin brand guideline constraint',
        evidence: {
          matched_text: item.matched_text,
          conflicting_fact: matchedFact?.claim,
          fact_id: matchedFact?.id,
          fact_expiry: matchedFact?.expires_at,
          provenance: ocrText && item.matched_text && ocrText.includes(item.matched_text) ? 'ocr' : 'caption',
        },
        explanation: item.explanation,
        suggestion: item.suggestion,
        suggested_text: item.suggested_text,
        status: 'open',
      };
    });

    return issues;
  } catch (err) {
    console.warn('Groq API invocation error, falling back to deterministic check engine:', err);
    return null;
  }
}

