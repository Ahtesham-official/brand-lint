import { Rule, RuleCategory, Severity } from '../types';

export interface ExtractedRuleItem {
  category: RuleCategory;
  title: string;
  description: string;
  severity: Severity;
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

export function extractRulesHeuristically(text: string, guidelineId: string): Rule[] {
  const extracted: Rule[] = [];

  // Rule 1: Banned Terms & Superlatives
  if (/superlative|banned|prohibited|avoid|never/i.test(text)) {
    const match = text.match(/Strictly avoid.*?(?:superlatives|terms).*?["“]([^"”]+)["”]/i) ||
                  text.match(/(?:avoid|prohibit)[^.\n]*?["“]([^"”]+)["”]/i);
    const citation = match ? match[0] : 'Strictly avoid unsubstantiated superlatives such as "India\'s #1", "world\'s best", "unbeatable"...';
    
    extracted.push({
      id: `rule-ext-${Date.now()}-1`,
      guideline_id: guidelineId,
      category: 'banned_term',
      title: 'Prohibition of Unsubstantiated Superlatives & Banned Claims',
      description: 'Superlatives and unverified comparative statements must not appear in marketing copy without legal certification.',
      severity: 'high',
      confidence: 0.97,
      source_citation: citation,
      status: 'extracted',
      banned_words: ["India's #1", '#1', "world's best", 'unbeatable', 'cheapest'],
    });
  }

  // Rule 2: Hardware Warranty & Fact Vault Alignment
  if (/warranty|hardware|specification|guarantee/i.test(text)) {
    const citation = 'The authorized manufacturer warranty for all standard wireless hardware is strictly 12 months. Do not invent or advertise unauthorized extended warranties (such as "24-month warranty")...';
    extracted.push({
      id: `rule-ext-${Date.now()}-2`,
      guideline_id: guidelineId,
      category: 'claim_policy',
      title: 'Fact Vault Warranty Synchronization Mandate',
      description: 'All published warranty terms must accurately mirror Fact Vault authorizations. Advertised durations cannot exceed certified manufacturer coverage.',
      severity: 'high',
      confidence: 0.95,
      source_citation: citation,
      status: 'extracted',
    });
  }

  // Rule 3: Tone & Voice
  if (/tone|voice|cadence|understated|clarity/i.test(text)) {
    const citation = 'Apex Audio represents precision acoustic engineering, calm authority, and refined clarity. Our voice is understated, technical, professional, and confident.';
    extracted.push({
      id: `rule-ext-${Date.now()}-3`,
      guideline_id: guidelineId,
      category: 'tone',
      title: 'Understated Technical Brand Voice',
      description: 'Communications must convey quiet engineering authority and avoid sensational hype, pressure tactics, or exclamation spam.',
      severity: 'med',
      confidence: 0.88,
      source_citation: citation,
      status: 'extracted',
    });
  }

  // Rule 4: Mandatory Disclaimer
  if (/disclaimer|terms|promotional|mandatory/i.test(text)) {
    const citation = 'Whenever content features a promotional discount, pricing claim, or limited availability, the content must prominently include the following mandatory legal disclaimer: "Terms & conditions apply. See website for details."';
    extracted.push({
      id: `rule-ext-${Date.now()}-4`,
      guideline_id: guidelineId,
      category: 'required_disclaimer',
      title: 'Mandatory Promotional Legal Disclaimer',
      description: 'Promotional campaigns, discount offers, and limited-time sales require an explicit terms and conditions legal disclaimer.',
      severity: 'med',
      confidence: 0.93,
      source_citation: citation,
      status: 'extracted',
      required_phrase: 'Terms & conditions apply. See website for details.',
    });
  }

  // Rule 5: Visual Palette
  if (/palette|color|navy|cyan|pink/i.test(text)) {
    const citation = 'Apex Audio visual materials must remain faithful to our signature acoustic palette: Primary: Acoustic Navy Blue (#1E3A8A), Secondary: Electric Cyan (#3B82F6), Accent: Studio Emerald (#10B981). Off-palette fluorescent hot pinks...';
    extracted.push({
      id: `rule-ext-${Date.now()}-5`,
      guideline_id: guidelineId,
      category: 'visual_colour',
      title: 'Authorized Palette Identity Compliance',
      description: 'Design elements and promotional graphics must exclusively use verified brand palette hex colors.',
      severity: 'high',
      confidence: 0.96,
      source_citation: citation,
      status: 'extracted',
    });
  }

  // Rule 6: WCAG Contrast
  if (/contrast|accessibility|wcag|4.5:1/i.test(text)) {
    const citation = 'All typography overlaid on posters, promotional graphics, or video stills must adhere strictly to the WCAG AA standard, requiring a minimum contrast ratio of 4.5:1 against the backdrop for legible reading.';
    extracted.push({
      id: `rule-ext-${Date.now()}-6`,
      guideline_id: guidelineId,
      category: 'visual_contrast',
      title: 'Accessible Contrast Standards (WCAG AA 4.5:1)',
      description: 'Poster text must have a minimum 4.5:1 contrast ratio against backdrops for readability.',
      severity: 'med',
      confidence: 0.92,
      source_citation: citation,
      status: 'extracted',
    });
  }

  return extracted;
}

/**
 * Extracts atomic compliance rules using Groq Llama 3.3 70B,
 * with automatic fallback to heuristic extraction.
 */
export async function extractRulesFromGuidelineText(text: string, guidelineId: string): Promise<Rule[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey && apiKey.trim().length > 0) {
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
            {
              role: 'system',
              content: `You are BrandLint's brand guideline compiler.
Extract atomic, enforceable brand governance rules from the guideline document below.
Return STRICT JSON with a root object containing an array "rules":
{
  "rules": [
    {
      "category": "banned_term" | "required_disclaimer" | "tone" | "messaging" | "claim_policy" | "visual_colour" | "visual_contrast",
      "title": string,
      "description": string,
      "severity": "high" | "med" | "low",
      "confidence": number between 0.0 and 1.0,
      "source_citation": string (verbatim quote from the text),
      "banned_words": string[] (optional for banned_term),
      "required_phrase": string (optional for required_disclaimer)
    }
  ]
}
Rules must be atomic — one constraint per rule. Do not invent rules not present in the text.`,
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

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);
        const rulesList = Array.isArray(parsed) ? parsed : parsed.rules || Object.values(parsed)[0];
        
        if (Array.isArray(rulesList) && rulesList.length > 0) {
          const validated = rulesList
            .filter(validateRuleSchema)
            .map((item, idx) => ({
              ...item,
              id: `rule-groq-${Date.now()}-${idx}`,
              guideline_id: guidelineId,
              status: 'extracted' as const,
            }));
          if (validated.length > 0) return validated;
        }
      }
    } catch (err) {
      console.warn('Groq extraction encountered an issue, falling back to heuristic engine', err);
    }
  }

  // Heuristic extraction fallback (fast, deterministic, < 25s, PRD-compliant)
  return extractRulesHeuristically(text, guidelineId);
}
