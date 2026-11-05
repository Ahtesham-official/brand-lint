-- ==============================================================================
-- BrandLint Initial Seed Data (Supabase Postgres)
-- Matches demo brand, guideline, rules, facts, and users
-- ==============================================================================

-- 1. Seed Brand
INSERT INTO brands (id, name, tagline, logo_url, palette)
VALUES (
  'brand-apex-01',
  'Apex Audio',
  'Precision Acoustic Engineering',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=128&auto=format&fit=crop&q=80',
  '{
    "primary": "#1E3A8A",
    "primary_name": "Acoustic Navy",
    "secondary": "#3B82F6",
    "secondary_name": "Electric Cyan",
    "accent": "#10B981",
    "accent_name": "Studio Emerald",
    "neutral_dark": "#111827",
    "neutral_light": "#F9FAFB",
    "forbidden_colors": ["#E11D48", "#EC4899", "#EF4444", "#F43F5E"],
    "wcag_min_contrast": 4.5
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  logo_url = EXCLUDED.logo_url,
  palette = EXCLUDED.palette;

-- 2. Seed Users
INSERT INTO users (id, email, name, title, role, brand_id, avatar)
VALUES
  (
    'usr-admin-01',
    'admin@brandlint.io',
    'Sarah Chen',
    'Brand Governance Director',
    'admin',
    'brand-apex-01',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  ),
  (
    'usr-creator-01',
    'creator@brandlint.io',
    'Alex Rivera',
    'Campaign Content Specialist',
    'creator',
    'brand-apex-01',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  ),
  (
    'usr-reviewer-01',
    'reviewer@brandlint.io',
    'Marcus Vance',
    'Head of Brand Compliance',
    'reviewer',
    'brand-apex-01',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  role = EXCLUDED.role,
  avatar = EXCLUDED.avatar;

-- 3. Seed Guideline
INSERT INTO guidelines (id, brand_id, filename, file_url, raw_text, status, rules_count)
VALUES (
  'gl-01',
  'brand-apex-01',
  'Apex_Brand_Guidelines_v2.4.pdf',
  '/guidelines/Apex_Brand_Guidelines_v2.4.pdf',
  'APEX AUDIO BRAND & CONTENT COMPLIANCE GUIDELINES
Document Revision: 2.4 — Global Marketing & Communications Division

1. BRAND VOICE & TONE PRINCIPLES
Apex Audio represents precision acoustic engineering, calm authority, and refined clarity.
Our voice is understated, technical, professional, and confident.
Never employ aggressive hype, exaggerated claims, exclamation point spam, or street slang.
Strictly avoid unsubstantiated superlatives such as "India''s #1", "world''s best", "unbeatable", or "cheapest in class" unless explicitly backed by a certified national market audit.

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
All typography overlaid on posters, promotional graphics, or video stills must adhere strictly to the WCAG AA standard, requiring a minimum contrast ratio of 4.5:1 against the backdrop for legible reading.',
  'confirmed',
  8
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  rules_count = EXCLUDED.rules_count;

-- 4. Seed Rules
INSERT INTO rules (id, guideline_id, category, title, description, severity, confidence, source_citation, status, banned_words, required_phrase)
VALUES
  (
    'rule-001',
    'gl-01',
    'banned_term',
    'Prohibition of Unsubstantiated Superlatives',
    'Words such as "India''s #1", "world''s best", or "unbeatable" are strictly prohibited in brand communications without independent legal certification.',
    'high',
    0.98,
    'Strictly avoid unsubstantiated superlatives such as "India''s #1", "world''s best", "unbeatable"...',
    'confirmed',
    ARRAY['India''s #1', 'unbeatable', 'world''s best', '#1', 'cheapest'],
    NULL
  ),
  (
    'rule-002',
    'gl-01',
    'claim_policy',
    'Mandatory Fact Vault Hardware Warranty Alignment',
    'Hardware warranty commitments must be verified against current Fact Vault records and must not exceed certified periods (12 months standard).',
    'high',
    0.96,
    'All promotional or social media content making commitments regarding hardware performance... The authorized manufacturer warranty for all standard wireless hardware is strictly 12 months. Do not invent or advertise unauthorized extended warranties (such as "24-month warranty")...',
    'confirmed',
    NULL,
    NULL
  ),
  (
    'rule-003',
    'gl-01',
    'tone',
    'Understated Professional Acoustic Tone',
    'Brand communications should reflect understated, technical confidence rather than sensational hype, exclamation point spam, or aggressive sales jargon.',
    'med',
    0.89,
    'Apex Audio represents precision acoustic engineering, calm authority, and refined clarity. Our voice is understated, technical, professional, and confident. Never employ aggressive hype, exaggerated claims, exclamation point spam...',
    'confirmed',
    NULL,
    NULL
  ),
  (
    'rule-004',
    'gl-01',
    'required_disclaimer',
    'Mandatory Promotional Terms Disclaimer',
    'Promotional campaigns or limited-time offers must contain the mandatory disclaimer phrase: "Terms & conditions apply. See website for details."',
    'med',
    0.93,
    'Whenever content features a promotional discount, pricing claim, or limited availability, the content must prominently include the following mandatory legal disclaimer: "Terms & conditions apply. See website for details."',
    'confirmed',
    NULL,
    'Terms & conditions apply. See website for details.'
  ),
  (
    'rule-005',
    'gl-01',
    'visual_colour',
    'Approved Apex Acoustic Palette Compliance',
    'Graphics and poster designs must only utilize approved brand colors (#1E3A8A, #3B82F6, #10B981). Off-palette fluorescent hot pink (#E11D48) or neon reds are rejected.',
    'high',
    0.95,
    'Apex Audio visual materials must remain faithful to our signature acoustic palette... Off-palette fluorescent hot pinks (e.g., #E11D48 or #EC4899) and loud neon reds are strictly prohibited...',
    'confirmed',
    NULL,
    NULL
  ),
  (
    'rule-006',
    'gl-01',
    'visual_contrast',
    'WCAG AA Text Contrast Ratio (4.5:1)',
    'Text overlaid on posters must maintain at least a 4.5:1 contrast ratio against the background for readability and brand visual clarity.',
    'med',
    0.92,
    'All typography overlaid on posters, promotional graphics, or video stills must adhere strictly to the WCAG AA standard, requiring a minimum contrast ratio of 4.5:1...',
    'confirmed',
    NULL,
    NULL
  ),
  (
    'rule-007',
    'gl-01',
    'messaging',
    'Sound Quality & Precision First Messaging',
    'Promotional messaging should emphasize acoustic fidelity, driver technology, and listening comfort rather than generic commoditized electronics tropes.',
    'low',
    0.81,
    'Apex Audio represents precision acoustic engineering, calm authority, and refined clarity.',
    'confirmed',
    NULL,
    NULL
  ),
  (
    'rule-008',
    'gl-01',
    'banned_term',
    'Provisional Constraint on Colloquial Slang',
    'Informal youth slang should be avoided in official product announcements.',
    'low',
    0.54,
    'Never employ aggressive hype, exaggerated claims, exclamation point spam, or street slang.',
    'extracted',
    ARRAY['lit', 'fire', 'slaps'],
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Fact Vault
INSERT INTO facts (id, brand_id, claim, source_document, source_url, expires_at, status, category, notes)
VALUES
  (
    'fact-101',
    'brand-apex-01',
    '12-month standard manufacturer warranty on all audio hardware',
    'Product Warranty Policy 2024 (Section 3.1)',
    'https://apex-audio.internal/docs/warranty-2024.pdf',
    '2027-12-31T23:59:59Z',
    'active',
    'Warranty & Support',
    'Standard across all North America and European channels.'
  ),
  (
    'fact-102',
    'brand-apex-01',
    'Titanium 40mm dynamic drivers with 20Hz - 40kHz acoustic frequency response',
    'Apex Acoustic Engineering Whitepaper v2',
    'https://apex-audio.internal/docs/tech-whitepaper-2024.pdf',
    '2028-06-30T23:59:59Z',
    'active',
    'Hardware Specs',
    'Certified Hi-Res Wireless compliant.'
  ),
  (
    'fact-103',
    'brand-apex-01',
    '65% post-consumer recycled aluminum alloy housing',
    'Apex Sustainability Audit Q1 2024',
    'https://apex-audio.internal/docs/sustainability-2024.pdf',
    '2024-03-31T00:00:00Z',
    'expired',
    'Sustainability',
    'Audit period expired; pending 2025 re-certification.'
  )
ON CONFLICT (id) DO NOTHING;
