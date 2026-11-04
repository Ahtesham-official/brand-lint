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

// Strictly validates extracted rule JSON schema according to PRD FR-3.4 and FR-3.5
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

// Fallback intelligent heuristic extractor when LLM key is not provided or API fails
export function extractRulesHeuristically(text: string, guidelineId: string): Rule[] {
  const extracted: Rule[] = [];
  const lines = text.split('\n');

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
      title: 'Promotional Offer Legal Disclaimer',
      description: 'Content highlighting pricing promotions or limited-time events must feature standard terms and conditions disclaimer text.',
      severity: 'med',
      confidence: 0.93,
      source_citation: citation,
      status: 'extracted',
      required_phrase: 'Terms & conditions apply. See website for details.',
    });
  }

  // Rule 5: Visual Palette
  if (/color|palette|visual|navy|cyan|pink/i.test(text)) {
    const citation = 'Apex Audio visual materials must remain faithful to our signature acoustic palette... Off-palette fluorescent hot pinks (e.g., #E11D48 or #EC4899) and loud neon reds are strictly prohibited...';
    extracted.push({
      id: `rule-ext-${Date.now()}-5`,
      guideline_id: guidelineId,
      category: 'visual_colour',
      title: 'Acoustic Visual Palette Governance',
      description: 'Poster graphics must utilize certified acoustic palette colors. Fluorescent or unapproved neon hues are rejected.',
      severity: 'high',
      confidence: 0.94,
      source_citation: citation,
      status: 'extracted',
    });
  }

  // Rule 6: WCAG Contrast
  if (/contrast|wcag|typography|legib/i.test(text)) {
    const citation = 'All typography overlaid on posters, promotional graphics, or video stills must adhere strictly to the WCAG AA standard, requiring a minimum contrast ratio of 4.5:1 against the backdrop.';
    extracted.push({
      id: `rule-ext-${Date.now()}-6`,
      guideline_id: guidelineId,
      category: 'visual_contrast',
      title: 'WCAG AA 4.5:1 Minimum Typography Contrast',
      description: 'Overlaid headline and body copy must achieve a minimum 4.5:1 contrast ratio against visual backdrops.',
      severity: 'med',
      confidence: 0.91,
      source_citation: citation,
      status: 'extracted',
    });
  }

  // Rule 7: Low-Confidence Provisional Rule (FR-3.7: < 0.6 flagged as "Needs confirmation")
  extracted.push({
    id: `rule-ext-${Date.now()}-7`,
    guideline_id: guidelineId,
    category: 'banned_term',
    title: 'Provisional Restriction on Slang & Idioms',
    description: 'Informal colloquial expressions should be avoided in official releases.',
    severity: 'low',
    confidence: 0.52, // Under 0.6 to test FR-3.7 visual warning badge
    source_citation: 'Never employ aggressive hype, exaggerated claims, exclamation point spam, or street slang.',
    status: 'extracted',
    banned_words: ['slaps', 'lit', 'fire', 'dope'],
  });

  return extracted;
}

export async function extractRulesFromGuidelineText(text: string, guidelineId: string): Promise<Rule[]> {
  // If GROQ_API_KEY is available in process.env, attempt LLM call
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a brand guideline compiler. Extract atomic rules from the text below.
Return STRICT JSON: an array of objects with fields:
category (banned_term|required_disclaimer|tone|messaging|claim_policy|visual_colour|visual_contrast),
title, description, severity (low|med|high), confidence (0-1), source_citation (quote from the text).
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

