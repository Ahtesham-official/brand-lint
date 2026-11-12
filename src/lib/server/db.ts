import { getMongoDb, isMongoConfigured } from './mongodb';
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
import fs from 'fs';
import path from 'path';

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
    guidelines: [],
    rules: [],
    facts: [],
    submissions: [],
    submission_texts: [],
    issues: [],
    reviews: [],
    audit_logs: [],
  };
}

export function getDemoSeedData(): DatabaseSchema {
  return {
    brand: SEEDED_BRAND,
    users: SEEDED_USERS,
    guidelines: SEEDED_GUIDELINES.map((g) => ({ ...g, enabled: true })),
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

// Strip MongoDB internal _id before returning to frontend/callers
function stripId<T>(doc: any): T {
  if (!doc) return doc;
  if (Array.isArray(doc)) {
    return doc.map(stripId) as unknown as T;
  }
  const { _id, ...rest } = doc;
  return rest as T;
}

class ServerDatabase {
  private inMemoryData: DatabaseSchema | null = null;
  private mongoSeeded: boolean = false;

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch { }
  }

  private readDbLocal(): DatabaseSchema {
    if (this.inMemoryData) {
      return this.inMemoryData;
    }
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.inMemoryData = JSON.parse(raw);
        return this.inMemoryData!;
      }
    } catch { }

    this.inMemoryData = getDefaultData();
    this.writeDbLocal(this.inMemoryData);
    return this.inMemoryData;
  }

  private writeDbLocal(data: DatabaseSchema): void {
    this.inMemoryData = data;
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch { }
  }

  /**
   * Initializes MongoDB collections if first time running on Mongo.
   */
  public async initFromMongo(): Promise<void> {
    if (this.mongoSeeded || !isMongoConfigured()) return;
    try {
      const db = await getMongoDb();
      const collections = await db.listCollections().toArray();
      const names = collections.map((c) => c.name);

      // Seed brand collection if empty
      if (!names.includes('brand')) {
        await db.collection('brand').replaceOne({ id: SEEDED_BRAND.id }, { ...SEEDED_BRAND, _id: SEEDED_BRAND.id } as any, { upsert: true });
      }
      // Seed users collection if empty
      if (!names.includes('users')) {
        for (const u of SEEDED_USERS) {
          await db.collection('users').replaceOne({ id: u.id }, { ...u, _id: u.id } as any, { upsert: true });
        }
      }
      this.mongoSeeded = true;
    } catch (e) {
      console.warn('initFromMongo error:', (e as Error).message);
    }
  }

  // --- Reset to clean/empty state ---
  public async resetToSeed(): Promise<DatabaseSchema> {
    return this.clearAllData();
  }

  public async clearAllData(): Promise<DatabaseSchema> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await Promise.all([
          db.collection('guidelines').deleteMany({}),
          db.collection('rules').deleteMany({}),
          db.collection('facts').deleteMany({}),
          db.collection('submissions').deleteMany({}),
          db.collection('issues').deleteMany({}),
          db.collection('reviews').deleteMany({}),
          db.collection('audit_logs').deleteMany({}),
          db.collection('brand').replaceOne({ id: SEEDED_BRAND.id }, { ...SEEDED_BRAND, _id: SEEDED_BRAND.id } as any, { upsert: true }),
        ]);
      } catch (e) {
        console.warn('MongoDB clearAllData error:', (e as Error).message);
      }
    }
    const data = getDefaultData();
    this.writeDbLocal(data);
    return data;
  }

  // --- Load Demo Violation Seed ---
  public async loadDemoSeed(): Promise<DatabaseSchema> {
    const demoData = getDemoSeedData();
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await Promise.all([
          db.collection('brand').replaceOne({ id: demoData.brand.id }, { ...demoData.brand, _id: demoData.brand.id } as any, { upsert: true }),
          db.collection('guidelines').deleteMany({}),
          db.collection('rules').deleteMany({}),
          db.collection('facts').deleteMany({}),
          db.collection('audit_logs').deleteMany({}),
        ]);
        if (demoData.guidelines.length > 0) {
          await db.collection('guidelines').insertMany(demoData.guidelines.map((g) => ({ ...g, _id: g.id })) as any);
        }
        if (demoData.rules.length > 0) {
          await db.collection('rules').insertMany(demoData.rules.map((r) => ({ ...r, _id: r.id })) as any);
        }
        if (demoData.facts.length > 0) {
          await db.collection('facts').insertMany(demoData.facts.map((f) => ({ ...f, _id: f.id })) as any);
        }
        if (demoData.audit_logs.length > 0) {
          await db.collection('audit_logs').insertMany(demoData.audit_logs.map((l) => ({ ...l, _id: l.id })) as any);
        }
      } catch (e) {
        console.warn('MongoDB loadDemoSeed error:', (e as Error).message);
      }
    }
    this.writeDbLocal(demoData);
    return demoData;
  }

  // --- Brand ---
  public async getBrand(): Promise<Brand> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const brand = await db.collection<Brand>('brand').findOne({});
        if (brand) return stripId<Brand>(brand);
      } catch (e) {
        console.warn('getBrand mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().brand;
  }

  public async updateBrand(updates: Partial<Brand>): Promise<Brand> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const current = (await db.collection<Brand>('brand').findOne({})) || SEEDED_BRAND;
        const updated: Brand = { ...current, ...updates };
        delete (updated as any)._id;
        await db.collection('brand').replaceOne({}, { ...updated, _id: updated.id || 'b1' }, { upsert: true });
        return updated;
      } catch (e) {
        console.warn('updateBrand mongo error, falling back:', (e as Error).message);
      }
    }
    const data = this.readDbLocal();
    data.brand = { ...data.brand, ...updates };
    this.writeDbLocal(data);
    return data.brand;
  }

  // --- Users ---
  public async getUsers(): Promise<User[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const users = await db.collection<User>('users').find({}).toArray();
        if (users && users.length > 0) return stripId<User[]>(users);
      } catch (e) {
        console.warn('getUsers mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().users;
  }

  public async getUserById(id: string): Promise<User | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const user = await db.collection<User>('users').findOne({ id });
        if (user) return stripId<User>(user);
      } catch (e) {
        console.warn('getUserById mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().users.find((u) => u.id === id);
  }

  public async getUserByEmail(email: string): Promise<User | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const user = await db.collection<User>('users').findOne({
          email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
        });
        if (user) return stripId<User>(user);
      } catch (e) {
        console.warn('getUserByEmail mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  // --- Guidelines ---
  public async getGuidelines(): Promise<Guideline[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const list = await db.collection<Guideline>('guidelines').find({}).sort({ created_at: -1 }).toArray();
        return stripId<Guideline[]>(list).map((g) => ({ ...g, enabled: g.enabled !== false }));
      } catch (e) {
        console.warn('getGuidelines mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().guidelines;
  }

  public async getGuidelineById(id: string): Promise<Guideline | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const doc = await db.collection<Guideline>('guidelines').findOne({ id });
        if (doc) {
          const stripped = stripId<Guideline>(doc);
          return { ...stripped, enabled: stripped.enabled !== false };
        }
      } catch (e) {
        console.warn('getGuidelineById mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().guidelines.find((g) => g.id === id);
  }

  public async createGuideline(filename: string, raw_text: string, brand_id?: string): Promise<Guideline> {
    const brand = await this.getBrand();
    const newGl: Guideline = {
      id: `gl-${Date.now()}`,
      brand_id: brand_id || brand.id,
      filename,
      raw_text,
      status: 'pending',
      enabled: true,
      created_at: new Date().toISOString(),
      rules_count: 0,
    };

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('guidelines').insertOne({ ...newGl, _id: newGl.id } as any);
      } catch (e) {
        console.warn('createGuideline mongo error:', (e as Error).message);
      }
    }

    const local = this.readDbLocal();
    local.guidelines.unshift(newGl);
    this.writeDbLocal(local);

    const users = await this.getUsers();
    await this.createAuditLog({
      actor_id: users[0]?.id || 'system',
      actor_name: users[0]?.name || 'Admin',
      actor_role: 'admin',
      action: 'guideline_extracted',
      entity: 'guideline',
      entity_id: newGl.id,
      meta: { filename, size: raw_text.length },
    });

    return newGl;
  }

  public async updateGuideline(id: string, updates: Partial<Guideline>): Promise<Guideline | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const current = await db.collection<Guideline>('guidelines').findOne({ id });
        if (current) {
          const updated = { ...current, ...updates };
          delete (updated as any)._id;
          await db.collection('guidelines').replaceOne({ id }, { ...updated, _id: id } as any);
          return stripId<Guideline>(updated);
        }
      } catch (e) {
        console.warn('updateGuideline mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    const index = data.guidelines.findIndex((g) => g.id === id);
    if (index === -1) return undefined;
    data.guidelines[index] = { ...data.guidelines[index], ...updates };
    this.writeDbLocal(data);
    return data.guidelines[index];
  }

  public async deleteGuideline(id: string, actorId?: string): Promise<boolean> {
    let target = await this.getGuidelineById(id);
    if (!target) return false;

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('guidelines').deleteOne({ id });
        await db.collection('rules').deleteMany({ guideline_id: id });
      } catch (e) {
        console.warn('deleteGuideline mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    data.guidelines = data.guidelines.filter((g) => g.id !== id);
    data.rules = data.rules.filter((r) => r.guideline_id !== id);
    this.writeDbLocal(data);

    const actor = actorId ? await this.getUserById(actorId) : undefined;
    await this.createAuditLog({
      actor_id: actor?.id || 'admin',
      actor_name: actor?.name || 'Sarah Chen',
      actor_role: actor?.role || 'admin',
      action: 'rule_updated',
      entity: 'guideline',
      entity_id: id,
      meta: { type: 'deleted', filename: target.filename },
    });

    return true;
  }

  public async toggleGuideline(id: string, enabled: boolean, actorId?: string): Promise<Guideline | undefined> {
    const target = await this.getGuidelineById(id);
    if (!target) return undefined;

    const newStatus = enabled ? (target.status === 'disabled' ? 'confirmed' : target.status) : 'disabled';
    const updatedGl: Guideline = {
      ...target,
      enabled,
      status: newStatus,
    };

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('guidelines').replaceOne({ id }, { ...updatedGl, _id: id } as any);
        await db.collection('rules').updateMany(
          { guideline_id: id },
          { $set: { status: enabled ? 'confirmed' : 'draft' } }
        );
      } catch (e) {
        console.warn('toggleGuideline mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    const idx = data.guidelines.findIndex((g) => g.id === id);
    if (idx !== -1) {
      data.guidelines[idx] = updatedGl;
      data.rules = data.rules.map((r) => {
        if (r.guideline_id === id) {
          return { ...r, status: enabled ? 'confirmed' : 'draft' };
        }
        return r;
      });
      this.writeDbLocal(data);
    }

    const actor = actorId ? await this.getUserById(actorId) : undefined;
    await this.createAuditLog({
      actor_id: actor?.id || 'admin',
      actor_name: actor?.name || 'Sarah Chen',
      actor_role: actor?.role || 'admin',
      action: 'guideline_confirmed',
      entity: 'guideline',
      entity_id: id,
      meta: { enabled, action: enabled ? 'enabled' : 'disabled' },
    });

    return updatedGl;
  }

  public async confirmGuideline(id: string, actorId?: string): Promise<{ guideline: Guideline; rulesCount: number } | undefined> {
    const gl = await this.getGuidelineById(id);
    if (!gl) return undefined;

    gl.status = 'confirmed';
    gl.enabled = true;
    let count = 0;

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const rulesUpdate = await db.collection('rules').updateMany(
          { guideline_id: id },
          { $set: { status: 'confirmed' } }
        );
        count = rulesUpdate.matchedCount || 0;
        await db.collection('guidelines').replaceOne({ id }, { ...gl, _id: id } as any);
      } catch (e) {
        console.warn('confirmGuideline mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    const localGl = data.guidelines.find((g) => g.id === id);
    if (localGl) {
      localGl.status = 'confirmed';
      localGl.enabled = true;
    }
    data.rules = data.rules.map((r) => {
      if (r.guideline_id === id) {
        count = (count || 0) + 1;
        return { ...r, status: 'confirmed' };
      }
      return r;
    });
    this.writeDbLocal(data);

    const actor = actorId ? await this.getUserById(actorId) : undefined;
    await this.createAuditLog({
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
  public async getRules(guidelineId?: string): Promise<Rule[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const query = guidelineId ? { guideline_id: guidelineId } : {};
        const rules = await db.collection<Rule>('rules').find(query).toArray();
        return stripId<Rule[]>(rules);
      } catch (e) {
        console.warn('getRules mongo error, falling back:', (e as Error).message);
      }
    }
    const all = this.readDbLocal().rules;
    if (guidelineId) {
      return all.filter((r) => r.guideline_id === guidelineId);
    }
    return all;
  }

  public async getActiveRules(): Promise<Rule[]> {
    const guidelines = await this.getGuidelines();
    const enabledGuidelineIds = new Set(
      guidelines
        .filter((g) => g.enabled !== false && g.status !== 'disabled')
        .map((g) => g.id)
    );

    const allRules = await this.getRules();
    return allRules.filter(
      (r) => r.status === 'confirmed' && enabledGuidelineIds.has(r.guideline_id)
    );
  }

  public async getRuleById(id: string): Promise<Rule | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const rule = await db.collection<Rule>('rules').findOne({ id });
        if (rule) return stripId<Rule>(rule);
      } catch (e) {
        console.warn('getRuleById mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().rules.find((r) => r.id === id);
  }

  public async createRule(ruleData: Omit<Rule, 'id'>, actorId?: string): Promise<Rule> {
    const newRule: Rule = {
      ...ruleData,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('rules').insertOne({ ...newRule, _id: newRule.id } as any);
        const count = await db.collection('rules').countDocuments({ guideline_id: newRule.guideline_id });
        await db.collection('guidelines').updateOne({ id: newRule.guideline_id }, { $set: { rules_count: count } });
      } catch (e) {
        console.warn('createRule mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    data.rules.push(newRule);
    const gl = data.guidelines.find((g) => g.id === newRule.guideline_id);
    if (gl) {
      gl.rules_count = data.rules.filter((r) => r.guideline_id === gl.id).length;
    }
    this.writeDbLocal(data);

    const actor = actorId ? await this.getUserById(actorId) : undefined;
    await this.createAuditLog({
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

  public async updateRule(id: string, updates: Partial<Rule>, actorId?: string): Promise<Rule | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const current = await db.collection<Rule>('rules').findOne({ id });
        if (current) {
          const updated = { ...current, ...updates };
          delete (updated as any)._id;
          await db.collection('rules').replaceOne({ id }, { ...updated, _id: id } as any);
          return stripId<Rule>(updated);
        }
      } catch (e) {
        console.warn('updateRule mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    const idx = data.rules.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    data.rules[idx] = { ...data.rules[idx], ...updates };
    this.writeDbLocal(data);

    const actor = actorId ? await this.getUserById(actorId) : undefined;
    await this.createAuditLog({
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

  public async deleteRule(id: string, actorId?: string): Promise<boolean> {
    const target = await this.getRuleById(id);
    if (!target) return false;

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('rules').deleteOne({ id });
        const count = await db.collection('rules').countDocuments({ guideline_id: target.guideline_id });
        await db.collection('guidelines').updateOne({ id: target.guideline_id }, { $set: { rules_count: count } });
      } catch (e) {
        console.warn('deleteRule mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    data.rules = data.rules.filter((r) => r.id !== id);
    const gl = data.guidelines.find((g) => g.id === target.guideline_id);
    if (gl) {
      gl.rules_count = data.rules.filter((r) => r.guideline_id === gl.id).length;
    }
    this.writeDbLocal(data);

    const actor = actorId ? await this.getUserById(actorId) : undefined;
    await this.createAuditLog({
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

  public async replaceRulesForGuideline(guidelineId: string, newRules: Rule[]): Promise<Rule[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('rules').deleteMany({ guideline_id: guidelineId });
        if (newRules.length > 0) {
          await db.collection('rules').insertMany(newRules.map((r) => ({ ...r, _id: r.id })) as any);
        }
        await db.collection('guidelines').updateOne(
          { id: guidelineId },
          {
            $set: {
              status: 'extracted',
              extracted_at: new Date().toISOString(),
              rules_count: newRules.length,
            },
          }
        );
      } catch (e) {
        console.warn('replaceRulesForGuideline mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    data.rules = [...data.rules.filter((r) => r.guideline_id !== guidelineId), ...newRules];
    const gl = data.guidelines.find((g) => g.id === guidelineId);
    if (gl) {
      gl.status = 'extracted';
      gl.extracted_at = new Date().toISOString();
      gl.rules_count = newRules.length;
    }
    this.writeDbLocal(data);

    return newRules;
  }

  // --- Fact Vault ---
  public async getFacts(): Promise<Fact[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const facts = await db.collection<Fact>('facts').find({}).sort({ created_at: -1 }).toArray();
        return stripId<Fact[]>(facts);
      } catch (e) {
        console.warn('getFacts mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().facts;
  }

  public async getFactById(id: string): Promise<Fact | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const fact = await db.collection<Fact>('facts').findOne({ id });
        if (fact) return stripId<Fact>(fact);
      } catch (e) {
        console.warn('getFactById mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().facts.find((f) => f.id === id);
  }

  public async createFact(factData: Omit<Fact, 'id' | 'brand_id'>, brandId?: string): Promise<Fact> {
    const brand = await this.getBrand();
    const newFact: Fact = {
      ...factData,
      id: `fact-${Date.now()}`,
      brand_id: brandId || brand.id,
      status: factData.status || 'active',
    };

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('facts').insertOne({ ...newFact, _id: newFact.id } as any);
      } catch (e) {
        console.warn('createFact mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    data.facts.unshift(newFact);
    this.writeDbLocal(data);
    return newFact;
  }

  public async updateFact(id: string, updates: Partial<Fact>): Promise<Fact | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const current = await db.collection<Fact>('facts').findOne({ id });
        if (current) {
          const updated = { ...current, ...updates };
          delete (updated as any)._id;
          await db.collection('facts').replaceOne({ id }, { ...updated, _id: id } as any);
          return stripId<Fact>(updated);
        }
      } catch (e) {
        console.warn('updateFact mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    const idx = data.facts.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;
    data.facts[idx] = { ...data.facts[idx], ...updates };
    this.writeDbLocal(data);
    return data.facts[idx];
  }

  public async deleteFact(id: string): Promise<boolean> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const res = await db.collection('facts').deleteOne({ id });
        if (res.deletedCount && res.deletedCount > 0) {
          const data = this.readDbLocal();
          data.facts = data.facts.filter((f) => f.id !== id);
          this.writeDbLocal(data);
          return true;
        }
      } catch (e) {
        console.warn('deleteFact mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    const initialLen = data.facts.length;
    data.facts = data.facts.filter((f) => f.id !== id);
    if (data.facts.length !== initialLen) {
      this.writeDbLocal(data);
      return true;
    }
    return false;
  }

  // --- Submissions ---
  public async getSubmissions(): Promise<Submission[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const subs = await db.collection<Submission>('submissions').find({}).sort({ created_at: -1 }).toArray();
        return stripId<Submission[]>(subs);
      } catch (e) {
        console.warn('getSubmissions mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().submissions;
  }

  public async getSubmissionById(id: string): Promise<Submission | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const sub = await db.collection<Submission>('submissions').findOne({ id });
        if (sub) return stripId<Submission>(sub);
      } catch (e) {
        console.warn('getSubmissionById mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().submissions.find((s) => s.id === id);
  }

  public async createSubmission(data: {
    title: string;
    caption: string;
    image_url: string;
    ocr_text?: string;
    video_url?: string;
    media_type?: 'image' | 'video';
    video_metadata?: any;
    video_violations?: any[];
    creator_id?: string;
    brand_id?: string;
  }): Promise<Submission> {
    const brand = await this.getBrand();
    const users = await this.getUsers();
    const user = data.creator_id ? await this.getUserById(data.creator_id) : users.find((u) => u.role === 'creator') || users[1];
    const subId = `sub-${Date.now()}`;

    const newSub: Submission = {
      id: subId,
      brand_id: data.brand_id || brand.id,
      creator_id: user?.id || 'usr-creator-01',
      creator_name: user?.name || 'Alex Rivera',
      title: data.title,
      caption: data.caption,
      ocr_text: data.ocr_text,
      image_url: data.image_url,
      video_url: data.video_url,
      media_type: data.media_type || (data.video_url ? 'video' : 'image'),
      video_metadata: data.video_metadata,
      video_violations: data.video_violations,
      status: 'analyzing',
      risk_score: 0,
      risk_level: 'Low',
      created_at: new Date().toISOString(),
      review_status: 'pending',
    };

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('submissions').insertOne({ ...newSub, _id: subId } as any);
      } catch (e) {
        console.warn('createSubmission mongo error:', (e as Error).message);
      }
    }

    const localDb = this.readDbLocal();
    localDb.submissions.unshift(newSub);
    this.writeDbLocal(localDb);

    await this.createAuditLog({
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

  public async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const current = await db.collection<Submission>('submissions').findOne({ id });
        if (current) {
          const updated = { ...current, ...updates };
          delete (updated as any)._id;
          await db.collection('submissions').replaceOne({ id }, { ...updated, _id: id } as any);
          return stripId<Submission>(updated);
        }
      } catch (e) {
        console.warn('updateSubmission mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    const idx = data.submissions.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    data.submissions[idx] = { ...data.submissions[idx], ...updates };
    this.writeDbLocal(data);
    return data.submissions[idx];
  }

  // --- Issues ---
  public async getIssues(submissionId?: string): Promise<Issue[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const query = submissionId ? { submission_id: submissionId } : {};
        const issues = await db.collection<Issue>('issues').find(query).toArray();
        return stripId<Issue[]>(issues);
      } catch (e) {
        console.warn('getIssues mongo error, falling back:', (e as Error).message);
      }
    }
    const all = this.readDbLocal().issues;
    if (submissionId) {
      return all.filter((i) => i.submission_id === submissionId);
    }
    return all;
  }

  public async getIssueById(id: string): Promise<Issue | undefined> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const issue = await db.collection<Issue>('issues').findOne({ id });
        if (issue) return stripId<Issue>(issue);
      } catch (e) {
        console.warn('getIssueById mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().issues.find((i) => i.id === id);
  }

  public async saveSubmissionIssues(submissionId: string, newIssues: Issue[]): Promise<Issue[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('issues').deleteMany({ submission_id: submissionId });
        if (newIssues.length > 0) {
          await db.collection('issues').insertMany(newIssues.map((i) => ({ ...i, _id: i.id })) as any);
        }
      } catch (e) {
        console.warn('saveSubmissionIssues mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    data.issues = [...data.issues.filter((i) => i.submission_id !== submissionId), ...newIssues];
    this.writeDbLocal(data);
    return newIssues;
  }

  public async applyFixToIssue(issueId: string, updatedCaption: string, actorId?: string): Promise<{ issue: Issue; submission: Submission } | undefined> {
    const issue = await this.getIssueById(issueId);
    if (!issue) return undefined;

    issue.status = 'fixed';
    const sub = await this.getSubmissionById(issue.submission_id);

    if (sub) {
      sub.caption = updatedCaption;
      const issues = await this.getIssues(sub.id);
      const remainingOpen = issues.filter((i) => i.id !== issueId && i.status === 'open');
      const newRaw = remainingOpen.reduce((acc, curr) => {
        const weight = curr.severity === 'high' ? 35 : curr.severity === 'med' ? 18 : 8;
        return acc + weight * curr.confidence;
      }, 0);

      sub.risk_score = Math.min(100, Math.round(newRaw));
      sub.risk_level =
        sub.risk_score > 75 ? 'Critical' :
          sub.risk_score > 50 ? 'High' :
            sub.risk_score > 25 ? 'Moderate' : 'Low';

      await this.updateSubmission(sub.id, {
        caption: sub.caption,
        risk_score: sub.risk_score,
        risk_level: sub.risk_level,
      });
    }

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('issues').updateOne({ id: issueId }, { $set: { status: 'fixed' } });
      } catch (e) {
        console.warn('applyFixToIssue mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    const localIssue = data.issues.find((i) => i.id === issueId);
    if (localIssue) localIssue.status = 'fixed';
    const localSub = data.submissions.find((s) => s.id === issue.submission_id);
    if (localSub && sub) {
      localSub.caption = sub.caption;
      localSub.risk_score = sub.risk_score;
      localSub.risk_level = sub.risk_level;
    }
    this.writeDbLocal(data);

    const actor = actorId ? await this.getUserById(actorId) : undefined;
    await this.createAuditLog({
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
  public async getReviews(submissionId?: string): Promise<Review[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const query = submissionId ? { submission_id: submissionId } : {};
        const revs = await db.collection<Review>('reviews').find(query).toArray();
        return stripId<Review[]>(revs);
      } catch (e) {
        console.warn('getReviews mongo error, falling back:', (e as Error).message);
      }
    }
    const all = this.readDbLocal().reviews;
    if (submissionId) {
      return all.filter((r) => r.submission_id === submissionId);
    }
    return all;
  }

  public async createReview(data: {
    submission_id: string;
    reviewer_id: string;
    decision: 'approve' | 'request_changes';
    comment: string;
  }): Promise<Review> {
    const reviewer = (await this.getUserById(data.reviewer_id)) || (await this.getUsers()).find((u) => u.role === 'reviewer');

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      submission_id: data.submission_id,
      reviewer_id: reviewer?.id || 'usr-reviewer-01',
      reviewer_name: reviewer?.name || 'Marcus Vance',
      decision: data.decision,
      comment: data.comment,
      created_at: new Date().toISOString(),
    };

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('reviews').insertOne({ ...newRev, _id: newRev.id } as any);
        await db.collection('submissions').updateOne(
          { id: data.submission_id },
          {
            $set: {
              status: 'reviewed',
              review_status: data.decision === 'approve' ? 'approved' : 'changes_requested',
            },
          }
        );
      } catch (e) {
        console.warn('createReview mongo error:', (e as Error).message);
      }
    }

    const localDb = this.readDbLocal();
    localDb.reviews.push(newRev);
    const sub = localDb.submissions.find((s) => s.id === data.submission_id);
    if (sub) {
      sub.status = 'reviewed';
      sub.review_status = data.decision === 'approve' ? 'approved' : 'changes_requested';
    }
    this.writeDbLocal(localDb);

    await this.createAuditLog({
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
  public async getAuditLogs(): Promise<AuditLog[]> {
    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        const logs = await db.collection<AuditLog>('audit_logs').find({}).sort({ created_at: -1 }).limit(200).toArray();
        return stripId<AuditLog[]>(logs);
      } catch (e) {
        console.warn('getAuditLogs mongo error, falling back:', (e as Error).message);
      }
    }
    return this.readDbLocal().audit_logs;
  }

  public async createAuditLog(entry: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    if (isMongoConfigured()) {
      try {
        const db = await getMongoDb();
        await db.collection('audit_logs').insertOne({ ...log, _id: log.id } as any);
      } catch (e) {
        console.warn('createAuditLog mongo error:', (e as Error).message);
      }
    }

    const data = this.readDbLocal();
    data.audit_logs.unshift(log);
    if (data.audit_logs.length > 200) {
      data.audit_logs = data.audit_logs.slice(0, 200);
    }
    this.writeDbLocal(data);
    return log;
  }
}

export const serverDb = new ServerDatabase();
if (isMongoConfigured()) {
  serverDb.initFromMongo().catch((e) => console.warn('serverDb initFromMongo non-blocking error:', e.message));
}
