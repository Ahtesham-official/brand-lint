import { 
  Brand, Guideline, Rule, Fact, User, Submission, Issue, Review, AuditLog, UserRole 
} from '../types';
import { 
  SEEDED_BRAND, SEEDED_USERS, SEEDED_RULES, SEEDED_FACTS, SEEDED_GUIDELINES 
} from '../data/seedData';
import { runCheckEngine } from './checkEngine';

const STORAGE_KEYS = {
  BRAND: 'brandlint_brand',
  USERS: 'brandlint_users',
  CURRENT_USER: 'brandlint_current_user',
  GUIDELINES: 'brandlint_guidelines',
  RULES: 'brandlint_rules',
  FACTS: 'brandlint_facts',
  SUBMISSIONS: 'brandlint_submissions',
  ISSUES: 'brandlint_issues',
  REVIEWS: 'brandlint_reviews',
  AUDIT_LOGS: 'brandlint_audit_logs',
  DEMO_MODE: 'brandlint_demo_mode',
};

class BrandLintStore {
  private brand: Brand = SEEDED_BRAND;
  private users: User[] = SEEDED_USERS;
  private currentUser: User = SEEDED_USERS[0]; // Admin by default
  private guidelines: Guideline[] = [];
  private rules: Rule[] = [];
  private facts: Fact[] = [];
  private submissions: Submission[] = [];
  private issues: Issue[] = [];
  private reviews: Review[] = [];
  private auditLogs: AuditLog[] = [];
  private demoMode: boolean = true;
  private initialized: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    if (typeof window !== 'undefined') {
      this.saveToStorage();
    }
    this.listeners.forEach((fn) => fn());
  }

  public initStore() {
    if (this.initialized) return;
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
    this.initialized = true;
  }

  private loadFromStorage() {
    try {
      const savedBrand = localStorage.getItem(STORAGE_KEYS.BRAND);
      if (savedBrand) this.brand = JSON.parse(savedBrand);

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) this.users = JSON.parse(savedUsers);

      const savedCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedCurrentUser) {
        this.currentUser = JSON.parse(savedCurrentUser);
      } else {
        this.currentUser = this.users[0];
      }

      const savedGuidelines = localStorage.getItem(STORAGE_KEYS.GUIDELINES);
      if (savedGuidelines) this.guidelines = JSON.parse(savedGuidelines);

      const savedRules = localStorage.getItem(STORAGE_KEYS.RULES);
      if (savedRules) this.rules = JSON.parse(savedRules);

      const savedFacts = localStorage.getItem(STORAGE_KEYS.FACTS);
      if (savedFacts) this.facts = JSON.parse(savedFacts);

      const savedSubmissions = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (savedSubmissions) this.submissions = JSON.parse(savedSubmissions);

      const savedIssues = localStorage.getItem(STORAGE_KEYS.ISSUES);
      if (savedIssues) this.issues = JSON.parse(savedIssues);

      const savedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (savedReviews) this.reviews = JSON.parse(savedReviews);

      const savedAuditLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (savedAuditLogs) this.auditLogs = JSON.parse(savedAuditLogs);

      const savedDemoMode = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
      if (savedDemoMode !== null) this.demoMode = JSON.parse(savedDemoMode);
    } catch (e) {
      console.warn('Error reading from localStorage, using seeded in-memory data', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.BRAND, JSON.stringify(this.brand));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      localStorage.setItem(STORAGE_KEYS.GUIDELINES, JSON.stringify(this.guidelines));
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(this.rules));
      localStorage.setItem(STORAGE_KEYS.FACTS, JSON.stringify(this.facts));
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(this.submissions));
      localStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(this.issues));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(this.reviews));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, JSON.stringify(this.demoMode));
    } catch (e) {
      console.warn('Error writing to localStorage', e);
    }
  }

  public resetToEmpty() {
    this.guidelines = [];
    this.rules = [];
    this.facts = [];
    this.submissions = [];
    this.issues = [];
    this.reviews = [];
    this.auditLogs = [];
    this.notify();
  }

  public loadDemoViolationSeed() {
    this.brand = { ...SEEDED_BRAND };
    this.guidelines = [...SEEDED_GUIDELINES];
    this.rules = [...SEEDED_RULES];
    this.facts = [...SEEDED_FACTS];
    this.notify();
  }

  public resetToDemoSeed() {
    this.loadDemoViolationSeed();
  }

  // --- Auth & Users ---
  public getCurrentUser(): User {
    return this.currentUser;
  }

  public getUsers(): User[] {
    return this.users;
  }

  public setRole(role: UserRole) {
    const user = this.users.find((u) => u.role === role) || this.users[0];
    this.currentUser = user;
    this.notify();
  }

  public loginAs(userId: string) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.currentUser = user;
      this.notify();
    }
  }

  public isDemoMode(): boolean {
    return this.demoMode;
  }

  public setDemoMode(val: boolean) {
    this.demoMode = val;
    this.notify();
  }

  // --- Brand Profile ---
  public getBrand(): Brand {
    return this.brand;
  }

  public updateBrand(updates: Partial<Brand>) {
    this.brand = { ...this.brand, ...updates };
    this.notify();
  }

  // --- Guidelines ---
  public getGuidelines(): Guideline[] {
    return this.guidelines;
  }

  public addGuideline(filename: string, raw_text: string): Guideline {
    const newGuideline: Guideline = {
      id: `gl-${Date.now()}`,
      brand_id: this.brand.id,
      filename,
      raw_text,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.guidelines.unshift(newGuideline);
    this.addAuditLog({
      action: 'guideline_extracted',
      entity: 'guideline',
      entity_id: newGuideline.id,
      meta: { filename, size: raw_text.length },
    });
    this.notify();
    return newGuideline;
  }

  public updateGuidelineStatus(id: string, status: Guideline['status']) {
    this.guidelines = this.guidelines.map((g) => (g.id === id ? { ...g, status } : g));
    this.notify();
  }

  public confirmGuideline(id: string) {
    this.guidelines = this.guidelines.map((g) => 
      g.id === id ? { ...g, status: 'confirmed' } : g
    );
    // Flip all rules of this guideline to confirmed
    this.rules = this.rules.map((r) => 
      r.guideline_id === id ? { ...r, status: 'confirmed' } : r
    );
    this.addAuditLog({
      action: 'guideline_confirmed',
      entity: 'guideline',
      entity_id: id,
      meta: { confirmed_rules_count: this.rules.filter((r) => r.guideline_id === id).length },
    });
    this.notify();
  }

  // --- Rules ---
  public getRules(guidelineId?: string): Rule[] {
    if (guidelineId) {
      return this.rules.filter((r) => r.guideline_id === guidelineId);
    }
    return this.rules;
  }

  public getActiveRules(): Rule[] {
    // PRD FR-4.5: Only confirmed rules are used by the check engine
    return this.rules.filter((r) => r.status === 'confirmed');
  }

  public addRule(ruleData: Omit<Rule, 'id'>): Rule {
    const newRule: Rule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
    };
    this.rules.push(newRule);
    this.addAuditLog({
      action: 'rule_updated',
      entity: 'rule',
      entity_id: newRule.id,
      meta: { type: 'created', title: newRule.title },
    });
    this.notify();
    return newRule;
  }

  public updateRule(id: string, updates: Partial<Rule>) {
    this.rules = this.rules.map((r) => (r.id === id ? { ...r, ...updates } : r));
    this.addAuditLog({
      action: 'rule_updated',
      entity: 'rule',
      entity_id: id,
      meta: { updates },
    });
    this.notify();
  }

  public deleteRule(id: string) {
    this.rules = this.rules.filter((r) => r.id !== id);
    this.addAuditLog({
      action: 'rule_updated',
      entity: 'rule',
      entity_id: id,
      meta: { type: 'deleted' },
    });
    this.notify();
  }

  public setRulesForGuideline(guidelineId: string, rules: Rule[]) {
    // Remove existing rules for this guideline and append new ones
    this.rules = [...this.rules.filter((r) => r.guideline_id !== guidelineId), ...rules];
    this.guidelines = this.guidelines.map((g) => 
      g.id === guidelineId ? { ...g, rules_count: rules.length, status: 'extracted' } : g
    );
    this.notify();
  }

  // --- Fact Vault ---
  public getFacts(): Fact[] {
    return this.facts;
  }

  public addFact(factData: Omit<Fact, 'id' | 'brand_id'>): Fact {
    const newFact: Fact = {
      ...factData,
      id: `fact-${Date.now()}`,
      brand_id: this.brand.id,
    };
    this.facts.unshift(newFact);
    this.notify();
    return newFact;
  }

  public updateFact(id: string, updates: Partial<Fact>) {
    this.facts = this.facts.map((f) => (f.id === id ? { ...f, ...updates } : f));
    this.notify();
  }

  public deleteFact(id: string) {
    this.facts = this.facts.filter((f) => f.id !== id);
    this.notify();
  }

  // --- Submissions & Check Engine ---
  public getSubmissions(): Submission[] {
    return this.submissions;
  }

  public getSubmission(id: string): Submission | undefined {
    return this.submissions.find((s) => s.id === id);
  }

  public getIssuesForSubmission(submissionId: string): Issue[] {
    return this.issues.filter((i) => i.submission_id === submissionId);
  }

  public createSubmission(data: {
    title: string;
    caption: string;
    image_url: string;
    ocr_text?: string;
    video_url?: string;
    media_type?: 'image' | 'video';
  }): Submission {
    const subId = `sub-${Date.now()}`;
    const newSubmission: Submission = {
      id: subId,
      brand_id: this.brand.id,
      creator_id: this.currentUser.id,
      creator_name: this.currentUser.name,
      title: data.title,
      caption: data.caption,
      image_url: data.image_url,
      video_url: data.video_url,
      media_type: data.media_type || (data.video_url ? 'video' : 'image'),
      ocr_text: data.ocr_text,
      status: 'analyzing',
      risk_score: 0,
      created_at: new Date().toISOString(),
      review_status: 'pending',
    };

    this.submissions.unshift(newSubmission);
    this.addAuditLog({
      action: 'submission_created',
      entity: 'submission',
      entity_id: subId,
      meta: { title: data.title },
    });
    this.notify();

    // Trigger analysis using the sequential check engine
    const activeRules = this.getActiveRules();
    const result = runCheckEngine({
      submissionId: subId,
      caption: data.caption,
      imageUrl: data.image_url,
      ocrText: data.ocr_text || '',
      brand: this.brand,
      rules: activeRules,
      facts: this.facts,
    });

    // Update submission with analysis results
    newSubmission.status = 'analyzed';
    newSubmission.risk_score = result.riskScore;
    newSubmission.risk_level = result.riskLevel;
    newSubmission.analyzed_at = new Date().toISOString();

    // Save issues
    this.issues = [...this.issues.filter((i) => i.submission_id !== subId), ...result.issues];

    this.addAuditLog({
      action: 'submission_analyzed',
      entity: 'submission',
      entity_id: subId,
      meta: { issues_count: result.issues.length, risk_score: result.riskScore },
    });

    this.notify();
    return newSubmission;
  }

  public applyFix(issueId: string, updatedCaption: string) {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return;

    // Mark issue as fixed
    this.issues = this.issues.map((i) => (i.id === issueId ? { ...i, status: 'fixed' } : i));

    // Update submission caption
    const submission = this.submissions.find((s) => s.id === issue.submission_id);
    if (submission) {
      submission.caption = updatedCaption;
      // Recalculate remaining open issues risk score
      const remainingOpenIssues = this.issues.filter(
        (i) => i.submission_id === submission.id && i.status === 'open'
      );
      const newScore = remainingOpenIssues.reduce((acc, curr) => {
        const weight = curr.severity === 'high' ? 35 : curr.severity === 'med' ? 18 : 8;
        return acc + weight * curr.confidence;
      }, 0);
      submission.risk_score = Math.min(100, Math.round(newScore));
      submission.risk_level =
        submission.risk_score > 75 ? 'Critical' :
        submission.risk_score > 50 ? 'High' :
        submission.risk_score > 25 ? 'Moderate' : 'Low';
    }

    this.addAuditLog({
      action: 'fix_applied',
      entity: 'issue',
      entity_id: issueId,
      meta: { submission_id: issue.submission_id, new_score: submission?.risk_score },
    });

    this.notify();
  }

  // --- Reviews ---
  public getReviewsForSubmission(submissionId: string): Review[] {
    return this.reviews.filter((r) => r.submission_id === submissionId);
  }

  public submitReview(submissionId: string, decision: Review['decision'], comment: string): Review {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      submission_id: submissionId,
      reviewer_id: this.currentUser.id,
      reviewer_name: this.currentUser.name,
      decision,
      comment,
      created_at: new Date().toISOString(),
    };

    this.reviews.push(newReview);

    // Update submission review status
    this.submissions = this.submissions.map((s) => 
      s.id === submissionId ? { 
        ...s, 
        status: 'reviewed', 
        review_status: decision === 'approve' ? 'approved' : 'changes_requested' 
      } : s
    );

    this.addAuditLog({
      action: 'submission_reviewed',
      entity: 'review',
      entity_id: newReview.id,
      meta: { submission_id: submissionId, decision, reviewer: this.currentUser.name },
    });

    this.notify();
    return newReview;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  private addAuditLog(data: {
    action: AuditLog['action'];
    entity: AuditLog['entity'];
    entity_id: string;
    meta: Record<string, any>;
  }) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actor_id: this.currentUser.id,
      actor_name: this.currentUser.name,
      actor_role: this.currentUser.role,
      action: data.action,
      entity: data.entity,
      entity_id: data.entity_id,
      meta: data.meta,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }
}

export const store = new BrandLintStore();
