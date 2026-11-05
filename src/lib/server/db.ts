import fs from 'fs';
import path from 'path';
import {
  Brand,
  Guideline,
  Rule,
  Fact,
  User,
  Submission,
  Issue,
  Review,
  AuditLog,
  SubmissionText,
} from '@/types';
import {
  SEEDED_BRAND,
  SEEDED_USERS,
  SEEDED_GUIDELINES,
  SEEDED_RULES,
  SEEDED_FACTS,
} from '@/data/seedData';

export interface DatabaseSchema {
  brand: Brand;
  users: User[];
  guidelines: Guideline[];
  rules: Rule[];
  facts: Fact[];
  submissions: Submission[];
  submission_texts: SubmissionText[];
  issues: Issue[];
  reviews: Review[];
  audit_logs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'brandlint.db.json');

function getDefaultData(): DatabaseSchema {
  return {
    brand: SEEDED_BRAND,
    users: SEEDED_USERS,
    guidelines: SEEDED_GUIDELINES,
    rules: SEEDED_RULES,
    facts: SEEDED_FACTS,
    submissions: [],
    submission_texts: [],
    issues: [],
    reviews: [],
    audit_logs: [
      {
        id: 'log-seed-1',
        actor_id: SEEDED_USERS[0].id,
        actor_name: SEEDED_USERS[0].name,
        actor_role: SEEDED_USERS[0].role,
        action: 'guideline_extracted',
        entity: 'guideline',
        entity_id: SEEDED_GUIDELINES[0].id,
        meta: { filename: SEEDED_GUIDELINES[0].filename },
        created_at: SEEDED_GUIDELINES[0].created_at,
      },
      {
        id: 'log-seed-2',
        actor_id: SEEDED_USERS[0].id,
        actor_name: SEEDED_USERS[0].name,
        actor_role: SEEDED_USERS[0].role,
        action: 'guideline_confirmed',
        entity: 'guideline',
        entity_id: SEEDED_GUIDELINES[0].id,
        meta: { confirmed_rules_count: SEEDED_RULES.length },
        created_at: SEEDED_GUIDELINES[0].created_at,
      },
    ],
  };
}

class ServerDatabase {
  private inMemoryData: DatabaseSchema | null = null;

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
      // Ignore if running in a read-only environment
    }
  }

  private readDb(): DatabaseSchema {
    this.ensureDataDir();
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading brandlint.db.json, falling back to memory/default:', e);
    }

    if (!this.inMemoryData) {
      this.inMemoryData = getDefaultData();
      this.writeDb(this.inMemoryData);
    }
    return this.inMemoryData;
  }

  private writeDb(data: DatabaseSchema): void {
    this.inMemoryData = data;
    this.ensureDataDir();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Error writing brandlint.db.json (persisting in memory):', e);
    }
  }

  // --- Reset to seed ---
  public resetToSeed(): DatabaseSchema {
    const data = getDefaultData();
    this.writeDb(data);
    return data;
  }

  // --- Brand ---
  public getBrand(): Brand {
    return this.readDb().brand;
  }

  public updateBrand(updates: Partial<Brand>): Brand {
    const data = this.readDb();
    data.brand = { ...data.brand, ...updates };
    this.writeDb(data);
    return data.brand;
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.readDb().users;
  }

  public getUserById(id: string): User | undefined {
    return this.readDb().users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.readDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  // --- Guidelines ---
  public getGuidelines(): Guideline[] {
    return this.readDb().guidelines;
  }

  public getGuidelineById(id: string): Guideline | undefined {
    return this.readDb().guidelines.find((g) => g.id === id);
  }

  public createGuideline(filename: string, raw_text: string, brand_id?: string): Guideline {
    const data = this.readDb();
    const newGl: Guideline = {
      id: `gl-${Date.now()}`,
      brand_id: brand_id || data.brand.id,
      filename,
      raw_text,
      status: 'pending',
      created_at: new Date().toISOString(),
      rules_count: 0,
    };
    data.guidelines.unshift(newGl);
    this.writeDb(data);

    this.createAuditLog({
      actor_id: data.users[0]?.id || 'system',
      actor_name: data.users[0]?.name || 'Admin',
      actor_role: 'admin',
      action: 'guideline_extracted',
      entity: 'guideline',
      entity_id: newGl.id,
      meta: { filename, size: raw_text.length },
    });

    return newGl;
  }

  public updateGuideline(id: string, updates: Partial<Guideline>): Guideline | undefined {
    const data = this.readDb();
    const index = data.guidelines.findIndex((g) => g.id === id);
    if (index === -1) return undefined;
    data.guidelines[index] = { ...data.guidelines[index], ...updates };
    this.writeDb(data);
    return data.guidelines[index];
  }

  public confirmGuideline(id: string, actorId?: string): { guideline: Guideline; rulesCount: number } | undefined {
    const data = this.readDb();
    const gl = data.guidelines.find((g) => g.id === id);
    if (!gl) return undefined;

    gl.status = 'confirmed';
    let count = 0;
    data.rules = data.rules.map((r) => {
      if (r.guideline_id === id) {
        count++;
        return { ...r, status: 'confirmed' };
      }
      return r;
    });

    this.writeDb(data);

    const actor = actorId ? this.getUserById(actorId) : data.users[0];
    this.createAuditLog({
      actor_id: actor?.id || 'admin',
      actor_name: actor?.name || 'Sarah Chen',
      actor_role: actor?.role || 'admin',
      action: 'guideline_confirmed',
      entity: 'guideline',
      entity_id: id,
      meta: { confirmed_rules_count: count },
    });

    return { guideline: gl, rulesCount: count };
  }

  // --- Rules ---
  public getRules(guidelineId?: string): Rule[] {
    const all = this.readDb().rules;
    if (guidelineId) {
      return all.filter((r) => r.guideline_id === guidelineId);
    }
    return all;
  }

  public getRuleById(id: string): Rule | undefined {
    return this.readDb().rules.find((r) => r.id === id);
  }

  public createRule(ruleData: Omit<Rule, 'id'>, actorId?: string): Rule {
    const data = this.readDb();
    const newRule: Rule = {
      ...ruleData,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    data.rules.push(newRule);

    // Update rules count on guideline
    const gl = data.guidelines.find((g) => g.id === newRule.guideline_id);
    if (gl) {
      gl.rules_count = data.rules.filter((r) => r.guideline_id === gl.id).length;
    }

    this.writeDb(data);

    const actor = actorId ? this.getUserById(actorId) : data.users[0];
    this.createAuditLog({
      actor_id: actor?.id || 'admin',
      actor_name: actor?.name || 'Sarah Chen',
      actor_role: actor?.role || 'admin',
      action: 'rule_updated',
      entity: 'rule',
      entity_id: newRule.id,
      meta: { type: 'created', title: newRule.title },
    });

    return newRule;
  }

  public updateRule(id: string, updates: Partial<Rule>, actorId?: string): Rule | undefined {
    const data = this.readDb();
    const idx = data.rules.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    data.rules[idx] = { ...data.rules[idx], ...updates };
    this.writeDb(data);

    const actor = actorId ? this.getUserById(actorId) : data.users[0];
    this.createAuditLog({
      actor_id: actor?.id || 'admin',
      actor_name: actor?.name || 'Sarah Chen',
      actor_role: actor?.role || 'admin',
      action: 'rule_updated',
      entity: 'rule',
      entity_id: id,
      meta: { updates },
    });

    return data.rules[idx];
  }

  public deleteRule(id: string, actorId?: string): boolean {
    const data = this.readDb();
    const target = data.rules.find((r) => r.id === id);
    if (!target) return false;

    data.rules = data.rules.filter((r) => r.id !== id);

    const gl = data.guidelines.find((g) => g.id === target.guideline_id);
    if (gl) {
      gl.rules_count = data.rules.filter((r) => r.guideline_id === gl.id).length;
    }

    this.writeDb(data);

    const actor = actorId ? this.getUserById(actorId) : data.users[0];
    this.createAuditLog({
      actor_id: actor?.id || 'admin',
      actor_name: actor?.name || 'Sarah Chen',
      actor_role: actor?.role || 'admin',
      action: 'rule_updated',
      entity: 'rule',
      entity_id: id,
      meta: { type: 'deleted', title: target.title },
    });

    return true;
  }

  public replaceRulesForGuideline(guidelineId: string, newRules: Rule[]): Rule[] {
    const data = this.readDb();
    data.rules = [...data.rules.filter((r) => r.guideline_id !== guidelineId), ...newRules];

    const gl = data.guidelines.find((g) => g.id === guidelineId);
    if (gl) {
      gl.status = 'extracted';
      gl.extracted_at = new Date().toISOString();
      gl.rules_count = newRules.length;
    }

    this.writeDb(data);
    return newRules;
  }

  // --- Fact Vault ---
  public getFacts(): Fact[] {
    return this.readDb().facts;
  }

  public getFactById(id: string): Fact | undefined {
    return this.readDb().facts.find((f) => f.id === id);
  }

  public createFact(factData: Omit<Fact, 'id' | 'brand_id'>, brandId?: string): Fact {
    const data = this.readDb();
    const newFact: Fact = {
      ...factData,
      id: `fact-${Date.now()}`,
      brand_id: brandId || data.brand.id,
      status: factData.status || 'active',
    };
    data.facts.unshift(newFact);
    this.writeDb(data);
    return newFact;
  }

  public updateFact(id: string, updates: Partial<Fact>): Fact | undefined {
    const data = this.readDb();
    const idx = data.facts.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;
    data.facts[idx] = { ...data.facts[idx], ...updates };
    this.writeDb(data);
    return data.facts[idx];
  }

  public deleteFact(id: string): boolean {
    const data = this.readDb();
    const initialLen = data.facts.length;
    data.facts = data.facts.filter((f) => f.id !== id);
    if (data.facts.length !== initialLen) {
      this.writeDb(data);
      return true;
    }
    return false;
  }

  // --- Submissions ---
  public getSubmissions(): Submission[] {
    return this.readDb().submissions;
  }

  public getSubmissionById(id: string): Submission | undefined {
    return this.readDb().submissions.find((s) => s.id === id);
  }

  public createSubmission(data: {
    title: string;
    caption: string;
    image_url: string;
    creator_id?: string;
    brand_id?: string;
  }): Submission {
    const db = this.readDb();
    const user = data.creator_id ? this.getUserById(data.creator_id) : db.users.find((u) => u.role === 'creator') || db.users[1];
    const subId = `sub-${Date.now()}`;

    const newSub: Submission = {
      id: subId,
      brand_id: data.brand_id || db.brand.id,
      creator_id: user?.id || 'usr-creator-01',
      creator_name: user?.name || 'Alex Rivera',
      title: data.title,
      caption: data.caption,
      image_url: data.image_url,
      status: 'analyzing',
      risk_score: 0,
      risk_level: 'Low',
      created_at: new Date().toISOString(),
      review_status: 'pending',
    };

    db.submissions.unshift(newSub);
    this.writeDb(db);

    this.createAuditLog({
      actor_id: newSub.creator_id,
      actor_name: newSub.creator_name || 'Creator',
      actor_role: 'creator',
      action: 'submission_created',
      entity: 'submission',
      entity_id: subId,
      meta: { title: data.title },
    });

    return newSub;
  }

  public updateSubmission(id: string, updates: Partial<Submission>): Submission | undefined {
    const data = this.readDb();
    const idx = data.submissions.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    data.submissions[idx] = { ...data.submissions[idx], ...updates };
    this.writeDb(data);
    return data.submissions[idx];
  }

  // --- Issues ---
  public getIssues(submissionId?: string): Issue[] {
    const all = this.readDb().issues;
    if (submissionId) {
      return all.filter((i) => i.submission_id === submissionId);
    }
    return all;
  }

  public getIssueById(id: string): Issue | undefined {
    return this.readDb().issues.find((i) => i.id === id);
  }

  public saveSubmissionIssues(submissionId: string, newIssues: Issue[]): Issue[] {
    const data = this.readDb();
    data.issues = [...data.issues.filter((i) => i.submission_id !== submissionId), ...newIssues];
    this.writeDb(data);
    return newIssues;
  }

  public applyFixToIssue(issueId: string, updatedCaption: string, actorId?: string): { issue: Issue; submission: Submission } | undefined {
    const data = this.readDb();
    const issue = data.issues.find((i) => i.id === issueId);
    if (!issue) return undefined;

    issue.status = 'fixed';

    const sub = data.submissions.find((s) => s.id === issue.submission_id);
    if (sub) {
      sub.caption = updatedCaption;
      // Recalculate risk score for remaining open issues
      const remainingOpen = data.issues.filter((i) => i.submission_id === sub.id && i.status === 'open');
      const newRaw = remainingOpen.reduce((acc, curr) => {
        const weight = curr.severity === 'high' ? 35 : curr.severity === 'med' ? 18 : 8;
        return acc + weight * curr.confidence;
      }, 0);

      sub.risk_score = Math.min(100, Math.round(newRaw));
      sub.risk_level =
        sub.risk_score > 75 ? 'Critical' :
        sub.risk_score > 50 ? 'High' :
        sub.risk_score > 25 ? 'Moderate' : 'Low';
    }

    this.writeDb(data);

    const actor = actorId ? this.getUserById(actorId) : data.users[1];
    this.createAuditLog({
      actor_id: actor?.id || 'usr-creator-01',
      actor_name: actor?.name || 'Alex Rivera',
      actor_role: actor?.role || 'creator',
      action: 'fix_applied',
      entity: 'issue',
      entity_id: issueId,
      meta: { submission_id: issue.submission_id, new_score: sub?.risk_score },
    });

    return sub ? { issue, submission: sub } : undefined;
  }

  // --- Reviews ---
  public getReviews(submissionId?: string): Review[] {
    const all = this.readDb().reviews;
    if (submissionId) {
      return all.filter((r) => r.submission_id === submissionId);
    }
    return all;
  }

  public createReview(data: {
    submission_id: string;
    reviewer_id: string;
    decision: 'approve' | 'request_changes';
    comment: string;
  }): Review {
    const db = this.readDb();
    const reviewer = this.getUserById(data.reviewer_id) || db.users.find((u) => u.role === 'reviewer') || db.users[2];

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      submission_id: data.submission_id,
      reviewer_id: reviewer?.id || 'usr-reviewer-01',
      reviewer_name: reviewer?.name || 'Marcus Vance',
      decision: data.decision,
      comment: data.comment,
      created_at: new Date().toISOString(),
    };

    db.reviews.push(newRev);

    // Update submission
    const sub = db.submissions.find((s) => s.id === data.submission_id);
    if (sub) {
      sub.status = 'reviewed';
      sub.review_status = data.decision === 'approve' ? 'approved' : 'changes_requested';
    }

    this.writeDb(db);

    this.createAuditLog({
      actor_id: newRev.reviewer_id,
      actor_name: newRev.reviewer_name,
      actor_role: 'reviewer',
      action: 'submission_reviewed',
      entity: 'submission',
      entity_id: data.submission_id,
      meta: { decision: data.decision, comment: data.comment },
    });

    return newRev;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.readDb().audit_logs;
  }

  public createAuditLog(entry: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const data = this.readDb();
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    data.audit_logs.unshift(log);
    // Keep max 200 logs
    if (data.audit_logs.length > 200) {
      data.audit_logs = data.audit_logs.slice(0, 200);
    }
    this.writeDb(data);
    return log;
  }
}

export const serverDb = new ServerDatabase();

