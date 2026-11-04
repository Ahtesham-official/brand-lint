import { Brand, Guideline, Rule, Fact, User, Submission, Issue } from '../types';

export const SEEDED_BRAND: Brand = {
  id: 'brand-apex-01',
  name: 'Apex Audio',
  tagline: 'Precision Acoustic Engineering',
  logo_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=128&auto=format&fit=crop&q=80',
  palette: {
    primary: '#1E3A8A',
    primary_name: 'Acoustic Navy',
    secondary: '#3B82F6',
    secondary_name: 'Electric Cyan',
    accent: '#10B981',
    accent_name: 'Studio Emerald',
    neutral_dark: '#111827',
    neutral_light: '#F9FAFB',
    forbidden_colors: ['#E11D48', '#EC4899', '#EF4444', '#F43F5E'],
    wcag_min_contrast: 4.5,
  },
};

export const SEEDED_USERS: User[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@brandlint.io',
    name: 'Sarah Chen',
    title: 'Brand Governance Director',
    role: 'admin',
    brand_id: SEEDED_BRAND.id,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-creator-01',
    email: 'creator@brandlint.io',
    name: 'Alex Rivera',
    title: 'Campaign Content Specialist',
    role: 'creator',
    brand_id: SEEDED_BRAND.id,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr-reviewer-01',
    email: 'reviewer@brandlint.io',
    name: 'Marcus Vance',
    title: 'Head of Brand Compliance',
    role: 'reviewer',
    brand_id: SEEDED_BRAND.id,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
];

export const RAW_GUIDELINE_SAMPLE = `APEX AUDIO BRAND & CONTENT COMPLIANCE GUIDELINES
Document Revision: 2.4 — Global Marketing & Communications Division

1. BRAND VOICE & TONE PRINCIPLES
Apex Audio represents precision acoustic engineering, calm authority, and refined clarity.
Our voice is understated, technical, professional, and confident.
Never employ aggressive hype, exaggerated claims, exclamation point spam, or street slang.
Strictly avoid unsubstantiated superlatives such as "India's #1", "world's best", "unbeatable", or "cheapest in class" unless explicitly backed by a certified national market audit.

2. HARDWARE SPECIFICATIONS & WARRANTY POLICIES
All promotional or social media content making commitments regarding hardware performance, driver sizing, or warranty duration must strictly align with official Fact Vault records.
The authorized manufacturer warranty for all standard wireless hardware is strictly 12 months. Do not invent or advertise unauthorized extended warranties (such as "24-month warranty") without formal director sign-off.

3. MANDATORY PROMOTIONAL DISCLAIMERS
Whenever content features a promotional discount, pricing claim, or limited availability, the content must prominently include the following mandatory legal disclaimer:
"Terms & conditions apply. See website for details."

4. VISUAL IDENTITY & COLOR GOVERNANCE
Apex Audio visual materials must remain faithful to our signature acoustic palette:
- Primary: Acoustic Navy Blue (#1E3A8A)
- Secondary: Electric Cyan (#3B82F6)
- Accent: Studio Emerald (#10B981)
Off-palette fluorescent hot pinks (e.g., #E11D48 or #EC4899) and loud neon reds are strictly prohibited as they dilute our premium industrial design identity.

5. ACCESSIBILITY & CONTRAST (WCAG AA)
All typography overlaid on posters, promotional graphics, or video stills must adhere strictly to the WCAG AA standard, requiring a minimum contrast ratio of 4.5:1 against the backdrop for legible reading.`;

export const SEEDED_RULES: Rule[] = [
  {
    id: 'rule-001',
    guideline_id: 'gl-01',
    category: 'banned_term',
    title: 'Prohibition of Unsubstantiated Superlatives',
    description: 'Words such as "India\'s #1", "world\'s best", or "unbeatable" are strictly prohibited in brand communications without independent legal certification.',
    severity: 'high',
    confidence: 0.98,
    source_citation: 'Strictly avoid unsubstantiated superlatives such as "India\'s #1", "world\'s best", "unbeatable"...',
    status: 'confirmed',
    banned_words: ["India's #1", "unbeatable", "world's best", "#1", "cheapest"],
  },
  {
    id: 'rule-002',
    guideline_id: 'gl-01',
    category: 'claim_policy',
    title: 'Mandatory Fact Vault Hardware Warranty Alignment',
    description: 'Hardware warranty commitments must be verified against current Fact Vault records and must not exceed certified periods (12 months standard).',
    severity: 'high',
    confidence: 0.96,
    source_citation: 'All promotional or social media content making commitments regarding hardware performance... The authorized manufacturer warranty for all standard wireless hardware is strictly 12 months. Do not invent or advertise unauthorized extended warranties (such as "24-month warranty")...',
    status: 'confirmed',
  },
  {
    id: 'rule-003',
    guideline_id: 'gl-01',
    category: 'tone',
    title: 'Understated Professional Acoustic Tone',
    description: 'Brand communications should reflect understated, technical confidence rather than sensational hype, exclamation point spam, or aggressive sales jargon.',
    severity: 'med',
    confidence: 0.89,
    source_citation: 'Apex Audio represents precision acoustic engineering, calm authority, and refined clarity. Our voice is understated, technical, professional, and confident. Never employ aggressive hype, exaggerated claims, exclamation point spam...',
    status: 'confirmed',
  },
  {
    id: 'rule-004',
    guideline_id: 'gl-01',
    category: 'required_disclaimer',
    title: 'Mandatory Promotional Terms Disclaimer',
    description: 'Promotional campaigns or limited-time offers must contain the mandatory disclaimer phrase: "Terms & conditions apply. See website for details."',
    severity: 'med',
    confidence: 0.93,
    source_citation: 'Whenever content features a promotional discount, pricing claim, or limited availability, the content must prominently include the following mandatory legal disclaimer: "Terms & conditions apply. See website for details."',
    status: 'confirmed',
    required_phrase: 'Terms & conditions apply. See website for details.',
  },
  {
    id: 'rule-005',
    guideline_id: 'gl-01',
    category: 'visual_colour',
    title: 'Approved Apex Acoustic Palette Compliance',
    description: 'Graphics and poster designs must only utilize approved brand colors (#1E3A8A, #3B82F6, #10B981). Off-palette fluorescent hot pink (#E11D48) or neon reds are rejected.',
    severity: 'high',
    confidence: 0.95,
    source_citation: 'Apex Audio visual materials must remain faithful to our signature acoustic palette... Off-palette fluorescent hot pinks (e.g., #E11D48 or #EC4899) and loud neon reds are strictly prohibited...',
    status: 'confirmed',
  },
  {
    id: 'rule-006',
    guideline_id: 'gl-01',
    category: 'visual_contrast',
    title: 'WCAG AA Text Contrast Ratio (4.5:1)',
    description: 'Text overlaid on posters must maintain at least a 4.5:1 contrast ratio against the background for readability and brand visual clarity.',
    severity: 'med',
    confidence: 0.92,
    source_citation: 'All typography overlaid on posters, promotional graphics, or video stills must adhere strictly to the WCAG AA standard, requiring a minimum contrast ratio of 4.5:1...',
    status: 'confirmed',
  },
  {
    id: 'rule-007',
    guideline_id: 'gl-01',
    category: 'messaging',
    title: 'Sound Quality & Precision First Messaging',
    description: 'Promotional messaging should emphasize acoustic fidelity, driver technology, and listening comfort rather than generic commoditized electronics tropes.',
    severity: 'low',
    confidence: 0.81,
    source_citation: 'Apex Audio represents precision acoustic engineering, calm authority, and refined clarity.',
    status: 'confirmed',
  },
  {
    id: 'rule-008',
    guideline_id: 'gl-01',
    category: 'banned_term',
    title: 'Provisional Constraint on Colloquial Slang',
    description: 'Informal youth slang should be avoided in official product announcements.',
    severity: 'low',
    confidence: 0.54, // < 0.6 triggers "Needs confirmation"
    source_citation: 'Never employ aggressive hype, exaggerated claims, exclamation point spam, or street slang.',
    status: 'extracted',
    banned_words: ['lit', 'fire', 'slaps'],
  },
];

export const SEEDED_FACTS: Fact[] = [
  {
    id: 'fact-101',
    brand_id: SEEDED_BRAND.id,
    claim: '12-month standard manufacturer warranty on all audio hardware',
    source_document: 'Product Warranty Policy 2024 (Section 3.1)',
    source_url: 'https://apex-audio.internal/docs/warranty-2024.pdf',
    expires_at: '2027-12-31T23:59:59Z',
    status: 'active',
    category: 'Warranty & Support',
    notes: 'Standard across all North America and European channels.',
  },
  {
    id: 'fact-102',
    brand_id: SEEDED_BRAND.id,
    claim: 'Titanium 40mm dynamic drivers with 20Hz - 40kHz acoustic frequency response',
    source_document: 'Apex Acoustic Engineering Whitepaper v2',
    source_url: 'https://apex-audio.internal/docs/tech-whitepaper-2024.pdf',
    expires_at: '2028-06-30T23:59:59Z',
    status: 'active',
    category: 'Hardware Specs',
    notes: 'Certified Hi-Res Wireless compliant.',
  },
  {
    id: 'fact-103',
    brand_id: SEEDED_BRAND.id,
    claim: '65% post-consumer recycled aluminum alloy housing',
    source_document: 'Apex Sustainability Audit Q1 2024',
    source_url: 'https://apex-audio.internal/docs/sustainability-2024.pdf',
    expires_at: '2024-03-31T00:00:00Z', // Expired
    status: 'expired',
    category: 'Sustainability',
    notes: 'Audit period expired; pending 2025 re-certification.',
  },
];

export const SEEDED_GUIDELINES: Guideline[] = [
  {
    id: 'gl-01',
    brand_id: SEEDED_BRAND.id,
    filename: 'Apex_Brand_Guidelines_v2.4.pdf',
    file_url: '/guidelines/Apex_Brand_Guidelines_v2.4.pdf',
    raw_text: RAW_GUIDELINE_SAMPLE,
    status: 'confirmed',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    extracted_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    rules_count: 8,
  },
];

// Demo Submission from Section 17.2 of PRD:
// "India's #1 — 24-month warranty!" in an off-palette colour with low contrast.
export const DEMO_SUBMISSION_INITIAL = {
  title: 'Diwali Festive Launch Campaign — Wireless Earbuds Promo',
  caption: "Unleash the sound! India's #1 wireless earbuds now with 24-month warranty! Grab yours before midnight! #audio #unbeatable",
  image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
  ocr_text: "INDIA'S #1 SOUND\nNOW WITH 24-MONTH WARRANTY\nUNBEATABLE BASS",
};
