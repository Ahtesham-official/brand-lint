-- ==============================================================================
-- BrandLint Database Schema (Supabase Postgres)
-- Conforming to BrandLint PRD v1.0 Section 10 (Data Model) & Section 9 Architecture
-- ==============================================================================

-- 1. Enable pgvector extension (for future Round 3 semantic retrieval, PRD Section 9)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Brands Table (FR-2.1)
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  logo_url TEXT,
  palette JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users Table (FR-1.2, FR-1.3)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'creator', 'reviewer')),
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Guidelines Table (FR-2.2, FR-3.1, FR-3.2)
CREATE TABLE IF NOT EXISTS guidelines (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT,
  raw_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'extracted', 'confirmed')) DEFAULT 'pending',
  rules_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extracted_at TIMESTAMPTZ
);

-- 5. Rules Table (FR-3.4, FR-3.6, FR-3.7, FR-4.1 - 4.5)
CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  guideline_id TEXT NOT NULL REFERENCES guidelines(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'banned_term',
    'required_disclaimer',
    'tone',
    'messaging',
    'claim_policy',
    'visual_colour',
    'visual_contrast'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'med', 'high')),
  confidence NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  source_citation TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'extracted', 'confirmed')) DEFAULT 'extracted',
  banned_words TEXT[],
  required_phrase TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Fact Vault Table (FR-5.1 - 5.4)
CREATE TABLE IF NOT EXISTS facts (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  claim TEXT NOT NULL,
  source_document TEXT NOT NULL,
  source_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'deprecated')) DEFAULT 'active',
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Submissions Table (FR-6.1 - 6.4)
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  creator_name TEXT,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'analyzing', 'analyzed', 'reviewed')) DEFAULT 'analyzing',
  risk_score INT NOT NULL DEFAULT 0,
  risk_level TEXT CHECK (risk_level IN ('Low', 'Moderate', 'High', 'Critical')),
  review_status TEXT CHECK (review_status IN ('pending', 'approved', 'changes_requested')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ
);

-- 8. Submission Text & Provenance Table (FR-7.2, FR-7.3)
CREATE TABLE IF NOT EXISTS submission_text (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Issues Table (FR-8.9, FR-8.10, FR-9.1 - 9.5)
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  rule_id TEXT,
  fact_id TEXT,
  rule_title TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'med', 'high')),
  confidence NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  source_citation TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  suggested_text TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'fixed', 'dismissed')) DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Reviews Table (FR-11.3)
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'request_changes')),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Minimal Audit Logs Table (FR-11.4)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Indexes (PRD Section 10)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_rules_guideline_id ON rules(guideline_id);
CREATE INDEX IF NOT EXISTS idx_issues_submission_id ON issues(submission_id);
CREATE INDEX IF NOT EXISTS idx_facts_brand_id ON facts(brand_id);
CREATE INDEX IF NOT EXISTS idx_submissions_creator_id ON submissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_submissions_brand_id ON submissions(brand_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_text ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for demo / prototype mode (or authenticate via Anon Key)
CREATE POLICY "Public full access on brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on guidelines" ON guidelines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on rules" ON rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on facts" ON facts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on submission_text" ON submission_text FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on issues" ON issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

