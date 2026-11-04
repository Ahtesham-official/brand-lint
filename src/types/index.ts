export type UserRole = 'admin' | 'creator' | 'reviewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  brand_id: string;
  avatar?: string;
  title?: string;
}

export interface BrandPalette {
  primary: string;       // e.g. '#1E3A8A'
  primary_name?: string;
  secondary: string;     // e.g. '#3B82F6'
  secondary_name?: string;
  accent: string;        // e.g. '#10B981'
  accent_name?: string;
  neutral_dark: string;  // e.g. '#111827'
  neutral_light: string; // e.g. '#F9FAFB'
  forbidden_colors: string[]; // e.g. ['#EC4899', '#EF4444', '#F43F5E']
  wcag_min_contrast: number; // default 4.5
}

export interface Brand {
  id: string;
  name: string;
  tagline?: string;
  logo_url: string;
  palette: BrandPalette;
}

export type GuidelineStatus = 'pending' | 'extracted' | 'confirmed';

export interface Guideline {
  id: string;
  brand_id: string;
  filename: string;
  file_url?: string;
  raw_text: string;
  status: GuidelineStatus;
  created_at: string;
  extracted_at?: string;
  rules_count?: number;
}

export type RuleCategory = 
  | 'banned_term'
  | 'required_disclaimer'
  | 'tone'
  | 'messaging'
  | 'claim_policy'
  | 'visual_colour'
  | 'visual_contrast';

export type Severity = 'low' | 'med' | 'high';

export type RuleStatus = 'extracted' | 'confirmed' | 'draft';

export interface Rule {
  id: string;
  guideline_id: string;
  category: RuleCategory;
  title: string;
  description: string;
  severity: Severity;
  confidence: number; // 0.0 - 1.0
  source_citation: string; // verbatim quote from guideline
  status: RuleStatus;
  banned_words?: string[]; // for banned_term regex matching
  required_phrase?: string; // for required_disclaimer matching
}

export type FactStatus = 'active' | 'expired' | 'deprecated';

export interface Fact {
  id: string;
  brand_id: string;
  claim: string;
  source_document: string;
  source_url?: string;
  expires_at: string; // ISO date string
  status: FactStatus;
  category?: string;
  notes?: string;
}

export type SubmissionStatus = 'draft' | 'analyzing' | 'analyzed' | 'reviewed';

export interface TextSpanProvenance {
  start: number;
  end: number;
  text: string;
  source: 'caption' | 'ocr';
  bbox?: { x: number; y: number; width: number; height: number };
}

export interface SubmissionText {
  id: string;
  submission_id: string;
  content: string;
  provenance: TextSpanProvenance[];
}

export interface Submission {
  id: string;
  brand_id: string;
  creator_id: string;
  creator_name?: string;
  title: string;
  caption: string;
  image_url: string;
  status: SubmissionStatus;
  risk_score: number; // 0 - 100
  risk_level?: 'Low' | 'Moderate' | 'High' | 'Critical';
  created_at: string;
  analyzed_at?: string;
  review_status?: 'pending' | 'approved' | 'changes_requested';
}

export type IssueStatus = 'open' | 'fixed' | 'dismissed';

export interface IssueEvidence {
  matched_text?: string;
  span?: { start: number; end: number };
  detected_color?: string;
  target_palette?: string[];
  contrast_ratio?: number;
  required_contrast?: number;
  conflicting_fact?: string;
  fact_id?: string;
  fact_expiry?: string;
  delta_e?: number;
  provenance?: 'caption' | 'ocr';
}

export interface Issue {
  id: string;
  submission_id: string;
  rule_id?: string;
  fact_id?: string;
  rule_title?: string;
  category: RuleCategory;
  severity: Severity;
  confidence: number; // 0.0 - 1.0
  source_citation: string;
  evidence: IssueEvidence;
  explanation: string;
  suggestion: string;
  suggested_text?: string; // rewritten sentence
  status: IssueStatus;
}

export type ReviewDecision = 'approve' | 'request_changes';

export interface Review {
  id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer_name: string;
  decision: ReviewDecision;
  comment: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: 'guideline_extracted' | 'guideline_confirmed' | 'rule_updated' | 'submission_created' | 'submission_analyzed' | 'fix_applied' | 'submission_reviewed';
  entity: 'guideline' | 'rule' | 'fact' | 'submission' | 'issue' | 'review';
  entity_id: string;
  meta: Record<string, any>;
  created_at: string;
}

