import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Brand, Guideline, Rule, Fact, Submission, Issue, Review, AuditLog } from '../types';

/**
 * Supabase Database Service
 * Provides typed database persistence for BrandLint.
 * Gracefully returns null if Supabase is not yet configured.
 */

// --- Brands ---
export async function getBrandFromDb(brandId: string): Promise<Brand | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .single();

  if (error || !data) return null;
  return data as Brand;
}

export async function upsertBrandInDb(brand: Brand): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('brands').upsert(brand);
  return !error;
}

// --- Guidelines ---
export async function getGuidelinesFromDb(brandId: string): Promise<Guideline[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('guidelines')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error || !data) return null;
  return data as Guideline[];
}

export async function insertGuidelineInDb(guideline: Guideline): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('guidelines').insert(guideline);
  return !error;
}

export async function updateGuidelineStatusInDb(
  id: string,
  status: Guideline['status'],
  rulesCount?: number
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const updates: Partial<Guideline> = { status };
  if (rulesCount !== undefined) updates.rules_count = rulesCount;
  const { error } = await supabase.from('guidelines').update(updates).eq('id', id);
  return !error;
}

// --- Rules ---
export async function getRulesFromDb(guidelineId?: string): Promise<Rule[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  let query = supabase.from('rules').select('*');
  if (guidelineId) {
    query = query.eq('guideline_id', guidelineId);
  }
  const { data, error } = await query;
  if (error || !data) return null;
  return data as Rule[];
}

export async function upsertRulesInDb(rules: Rule[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || rules.length === 0) return false;
  const { error } = await supabase.from('rules').upsert(rules);
  return !error;
}

export async function updateRuleInDb(id: string, updates: Partial<Rule>): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('rules').update(updates).eq('id', id);
  return !error;
}

export async function deleteRuleInDb(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('rules').delete().eq('id', id);
  return !error;
}

export async function confirmGuidelineRulesInDb(guidelineId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase
    .from('rules')
    .update({ status: 'confirmed' })
    .eq('guideline_id', guidelineId);
  return !error;
}

// --- Fact Vault ---
export async function getFactsFromDb(brandId: string): Promise<Fact[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('facts')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error || !data) return null;
  return data as Fact[];
}

export async function insertFactInDb(fact: Fact): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('facts').insert(fact);
  return !error;
}

export async function updateFactInDb(id: string, updates: Partial<Fact>): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('facts').update(updates).eq('id', id);
  return !error;
}

export async function deleteFactInDb(id: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('facts').delete().eq('id', id);
  return !error;
}

// --- Submissions ---
export async function getSubmissionsFromDb(brandId: string): Promise<Submission[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error || !data) return null;
  return data as Submission[];
}

export async function insertSubmissionInDb(submission: Submission): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('submissions').insert(submission);
  return !error;
}

export async function updateSubmissionInDb(
  id: string,
  updates: Partial<Submission>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('submissions').update(updates).eq('id', id);
  return !error;
}

// --- Issues ---
export async function getIssuesFromDb(submissionId: string): Promise<Issue[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('submission_id', submissionId);

  if (error || !data) return null;
  return data as Issue[];
}

export async function insertIssuesInDb(issues: Issue[]): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || issues.length === 0) return false;
  const { error } = await supabase.from('issues').insert(issues);
  return !error;
}

export async function updateIssueInDb(id: string, updates: Partial<Issue>): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('issues').update(updates).eq('id', id);
  return !error;
}

// --- Reviews ---
export async function getReviewsFromDb(submissionId: string): Promise<Review[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('submission_id', submissionId);

  if (error || !data) return null;
  return data as Review[];
}

export async function insertReviewInDb(review: Review): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('reviews').insert(review);
  return !error;
}

// --- Audit Logs ---
export async function getAuditLogsFromDb(): Promise<AuditLog[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return null;
  return data as AuditLog[];
}

export async function insertAuditLogInDb(log: AuditLog): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  const { error } = await supabase.from('audit_logs').insert(log);
  return !error;
}

