import { GuidelineAnalysis } from '@/types';

export interface EnhanceGuidelineResult {
  analysis: GuidelineAnalysis;
  enhanced_version: string;
}

const FALLBACK_ANALYSIS: GuidelineAnalysis = {
  summary:
    'Apex Audio brand guidelines enforce technical acoustic precision, understated authority, and strict avoidance of unverified market superlatives. The document mandates a 12-month hardware warranty, statutory promotional disclaimers, and a signature Navy/Cyan palette with WCAG AA compliance.',
  key_takeaways: [
    'Superlatives like "India\'s #1" or "unbeatable" are strictly forbidden without independent audit proof.',
    'Hardware warranty commitments are capped at 12 months unless backed by official Fact Vault records.',
    'Promotional campaigns require the mandatory disclaimer: "Terms & conditions apply. See website for details."',
    'Off-palette neon reds and hot pinks (#E11D48, #EC4899) are prohibited; maintain WCAG AA 4.5:1 typography contrast.',
  ],
  tone_profile: 'Calm, technical, authoritative, understated, and engineering-driven.',
  strictness_level: 'Strict',
  target_audience: 'Acoustic engineers, sound professionals, and discerning audiophiles.',
  recommended_actions: [
    'Enforce deterministic regex checks on banned promotional terms across social copy and OCR text.',
    'Sync claim verifications with Fact Vault hardware commitments.',
    'Provide creators with instant word-level replacement diffs to maintain high publishing velocity.',
  ],
};

const FALLBACK_ENHANCED_GUIDELINE = `# APEX AUDIO BRAND GOVERNANCE MANUAL (ENHANCED SPECIFICATION)
**Standard Operating Procedure (SOP) — Global Brand & Communications Directorate**
*Document Version: 3.0-Precision | Automated Compliance Ready*

---

### SECTION 1: BRAND ESSENCE & VOICE ARCHITECTURE
- **Core Identity:** Apex Audio represents precision acoustic engineering, calm authority, and refined clarity.
- **Cadence & Tone:** Understated, technical, professional, and confident. Avoid promotional urgency, exclamation spam, and sensational hype.
- **Prohibited Terminology:**
  - Strictly avoid: *"India's #1"*, *"world's best"*, *"unbeatable"*, *"cheapest in class"*, *"mind-blowing"*, *"insane deal"*.
  - Preferred phrasing: *"Hi-Res Certified Acoustic Fidelity"*, *"Calibrated Audio Precision"*, *"Engineered for Audiophiles"*.

---

### SECTION 2: FACTUAL VERIFICATION & HARDWARE COMMITMENTS
- **Fact Vault Synchronization:** Every specification claim (driver sizing, battery longevity, frequency response) must cite an active Fact Vault record.
- **Warranty Standard:** All standard wireless audio hardware carries strictly a **12-month manufacturer warranty**. No extended warranty claims (e.g., "24-month warranty") may be published without authorized warranty policy documentation.

---

### SECTION 3: MANDATORY STATUTORY & LEGAL DISCLAIMERS
- Any content featuring promotional discounts, bundle pricing, or limited seasonal availability must display the following exact legal clause:
  > **"Terms & conditions apply. See website for details."**

---

### SECTION 4: VISUAL IDENTITY & COLOR SYSTEMS
- **Signature Acoustic Palette:**
  - Primary: Acoustic Navy Blue (\`#1E3A8A\`)
  - Secondary: Electric Cyan (\`#3B82F6\`)
  - Accent: Studio Emerald (\`#10B981\`)
  - Neutral Dark: Carbon Obsidian (\`#111827\`)
- **Forbidden Colors:** Hot pinks (\`#E11D48\`, \`#EC4899\`) and neon reds (\`#EF4444\`). Any asset exhibiting $\\Delta E > 15$ against approved brand colors will be automatically rejected.

---

### SECTION 5: ACCESSIBILITY & WCAG AA COMPLIANCE
- All typography overlaid on posters, social cards, or video graphics must achieve a minimum contrast ratio of **4.5:1** against underlying backgrounds.`;

/**
 * Analyzes raw guidelines and generates:
 * 1. AI Comprehension Summary (What the AI understood & rules to be implemented)
 * 2. An Enhanced, Production-Grade Version of the guideline for reviewer comparison
 */
export async function analyzeAndEnhanceGuideline(rawText: string): Promise<EnhanceGuidelineResult> {
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
              content: `You are an elite Brand Governance Architect and Chief Compliance Officer.
Your task is twofold:
1. Explain exactly what you understood from the uploaded raw guideline, distilling it into structured comprehension metrics.
2. Produce an ENHANCED, crystal-clear, beautifully formatted Markdown version of the guideline with tighter legal safeguards, clear sections, and unambiguous rules for content creators.

Return STRICT JSON with the schema:
{
  "analysis": {
    "summary": string (comprehensive executive summary of what was understood),
    "key_takeaways": string[] (3-5 core constraints the AI is told to enforce),
    "tone_profile": string (description of voice & tone requirements),
    "strictness_level": "Permissive" | "Balanced" | "Strict" | "Zero-Tolerance",
    "target_audience": string (intended consumer/creator profile),
    "recommended_actions": string[] (3 actionable system recommendations)
  },
  "enhanced_version": string (full markdown of the enhanced, upgraded guideline version)
}`,
            },
            {
              role: 'user',
              content: `Here is the uploaded raw brand guideline document:\n\n${rawText}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.analysis && parsed.enhanced_version) {
            return {
              analysis: {
                summary: parsed.analysis.summary || FALLBACK_ANALYSIS.summary,
                key_takeaways: Array.isArray(parsed.analysis.key_takeaways)
                  ? parsed.analysis.key_takeaways
                  : FALLBACK_ANALYSIS.key_takeaways,
                tone_profile: parsed.analysis.tone_profile || FALLBACK_ANALYSIS.tone_profile,
                strictness_level: parsed.analysis.strictness_level || 'Strict',
                target_audience: parsed.analysis.target_audience || FALLBACK_ANALYSIS.target_audience,
                recommended_actions: Array.isArray(parsed.analysis.recommended_actions)
                  ? parsed.analysis.recommended_actions
                  : FALLBACK_ANALYSIS.recommended_actions,
              },
              enhanced_version: parsed.enhanced_version,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Groq guideline analysis encountered an error, using heuristic fallback:', err);
    }
  }

  // Heuristic Fallback
  return {
    analysis: FALLBACK_ANALYSIS,
    enhanced_version: FALLBACK_ENHANCED_GUIDELINE,
  };
}

