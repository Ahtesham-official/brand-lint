import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Organization, OrganizationMember, OrganizationInvite, OrgRole } from '@/types/org';
import { SEEDED_USERS } from '@/data/seedData';
import { getMongoDb, isMongoConfigured } from '@/lib/server/mongodb';

const DATA_DIR = path.join(process.cwd(), 'data');
const ORG_DB_FILE = path.join(DATA_DIR, 'organizations.json');

interface OrgStoreSchema {
  organizations: Organization[];
  members: OrganizationMember[];
  invites: OrganizationInvite[];
}

function getInitialStore(): OrgStoreSchema {
  const defaultOrg: Organization = {
    id: 'org-apex-global',
    name: 'Apex Global Brand',
    description: 'Primary corporate brand organisation for Apex Global marketing assets and guidelines.',
    created_by: SEEDED_USERS[0].id,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  };

  const defaultMembers: OrganizationMember[] = [
    {
      id: 'mem-admin-1',
      org_id: defaultOrg.id,
      user_id: SEEDED_USERS[0].id,
      role: 'admin',
      joined_at: defaultOrg.created_at,
      user_name: SEEDED_USERS[0].name,
      user_email: SEEDED_USERS[0].email,
    },
    {
      id: 'mem-creator-1',
      org_id: defaultOrg.id,
      user_id: SEEDED_USERS[1].id,
      role: 'creator',
      joined_at: defaultOrg.created_at,
      user_name: SEEDED_USERS[1].name,
      user_email: SEEDED_USERS[1].email,
    },
    {
      id: 'mem-reviewer-1',
      org_id: defaultOrg.id,
      user_id: SEEDED_USERS[2].id,
      role: 'reviewer',
      joined_at: defaultOrg.created_at,
      user_name: SEEDED_USERS[2].name,
      user_email: SEEDED_USERS[2].email,
    },
  ];

  return {
    organizations: [defaultOrg],
    members: defaultMembers,
    invites: [],
  };
}

function readLocalOrgStore(): OrgStoreSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORG_DB_FILE)) {
      const initial = getInitialStore();
      fs.writeFileSync(ORG_DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(ORG_DB_FILE, 'utf-8');
    return JSON.parse(content) as OrgStoreSchema;
  } catch (err) {
    console.error('Error reading local org store:', err);
    return getInitialStore();
  }
}

function writeLocalOrgStore(data: OrgStoreSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ORG_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local org store:', err);
  }
}

function getUserMeta(userId: string) {
  const seed = SEEDED_USERS.find((u) => u.id === userId);
  if (seed) {
    return { name: seed.name, email: seed.email, avatar: seed.avatar };
  }
  return { name: `User (${userId.slice(0, 6)})`, email: `${userId}@brandlint.ai` };
}

// --- MongoDB Helpers ---

async function syncOrgToMongo(doc: Organization) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getMongoDb();
    await db.collection('organizations').replaceOne(
      { id: doc.id },
      { ...doc, _id: doc.id as any },
      { upsert: true }
    );
  } catch (e) {
    console.warn('Mongo org sync failed:', (e as Error).message);
  }
}

async function syncMemberToMongo(doc: OrganizationMember) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getMongoDb();
    await db.collection('organization_members').replaceOne(
      { id: doc.id },
      { ...doc, _id: doc.id as any },
      { upsert: true }
    );
  } catch (e) {
    console.warn('Mongo member sync failed:', (e as Error).message);
  }
}

async function syncInviteToMongo(doc: OrganizationInvite) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getMongoDb();
    await db.collection('organization_invites').replaceOne(
      { id: doc.id },
      { ...doc, _id: doc.id as any },
      { upsert: true }
    );
  } catch (e) {
    console.warn('Mongo invite sync failed:', (e as Error).message);
  }
}

// --- Service Methods ---

export async function createOrganization(params: {
  name: string;
  description?: string;
  userId: string;
}): Promise<{ organization: Organization; member: OrganizationMember }> {
  const id = `org-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const newOrg: Organization = {
    id,
    name: params.name.trim(),
    description: params.description?.trim() || null,
    created_by: params.userId,
    created_at: now,
  };

  const userMeta = getUserMeta(params.userId);
  const newMember: OrganizationMember = {
    id: `mem-${crypto.randomUUID().slice(0, 8)}`,
    org_id: id,
    user_id: params.userId,
    role: 'admin',
    joined_at: now,
    user_name: userMeta.name,
    user_email: userMeta.email,
  };

  // Sync to MongoDB if configured
  await Promise.all([
    syncOrgToMongo(newOrg),
    syncMemberToMongo(newMember),
  ]);

  // Always sync to local store for reliability
  const store = readLocalOrgStore();
  store.organizations.unshift(newOrg);
  store.members.push(newMember);
  writeLocalOrgStore(store);

  return { organization: newOrg, member: newMember };
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  // If MongoDB is configured, attempt fetch
  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      const memberRows = await db
        .collection<OrganizationMember>('organization_members')
        .find({ user_id: userId })
        .toArray();

      if (memberRows && memberRows.length > 0) {
        const orgIds = memberRows.map((m) => m.org_id);
        const orgRows = await db
          .collection<Organization>('organizations')
          .find({ id: { $in: orgIds } })
          .sort({ created_at: -1 })
          .toArray();

        if (orgRows && orgRows.length > 0) {
          return orgRows.map((org) => {
            const mem = memberRows.find((m) => m.org_id === org.id);
            return {
              id: org.id,
              name: org.name,
              description: org.description,
              created_by: org.created_by,
              created_at: org.created_at,
              role: mem?.role as OrgRole,
            };
          });
        }
      }
    } catch {}
  }

  // Fallback to local store
  const store = readLocalOrgStore();
  const userMemberships = store.members.filter((m) => m.user_id === userId);
  const userOrgIds = new Set(userMemberships.map((m) => m.org_id));

  return store.organizations
    .filter((org) => userOrgIds.has(org.id))
    .map((org) => {
      const mem = userMemberships.find((m) => m.org_id === org.id);
      const totalMembers = store.members.filter((m) => m.org_id === org.id).length;
      return {
        ...org,
        role: mem?.role,
        member_count: totalMembers,
      };
    });
}

export async function getOrganizationById(
  orgId: string,
  userId?: string
): Promise<(Organization & { member_count: number; user_role?: OrgRole }) | null> {
  // Try MongoDB first
  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      const org = await db.collection<Organization>('organizations').findOne({ id: orgId });

      if (org) {
        const memberCount = await db
          .collection('organization_members')
          .countDocuments({ org_id: orgId });

        let userRole: OrgRole | undefined;
        if (userId) {
          const mem = await db
            .collection<OrganizationMember>('organization_members')
            .findOne({ org_id: orgId, user_id: userId });
          if (mem) userRole = mem.role as OrgRole;
        }

        return {
          id: org.id,
          name: org.name,
          description: org.description,
          created_by: org.created_by,
          created_at: org.created_at,
          member_count: memberCount || 1,
          user_role: userRole,
        };
      }
    } catch {}
  }

  const store = readLocalOrgStore();
  const org = store.organizations.find((o) => o.id === orgId);
  if (!org) return null;

  const members = store.members.filter((m) => m.org_id === orgId);
  const userMembership = userId ? members.find((m) => m.user_id === userId) : undefined;

  return {
    ...org,
    member_count: members.length,
    user_role: userMembership?.role,
  };
}

export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      const members = await db
        .collection<OrganizationMember>('organization_members')
        .find({ org_id: orgId })
        .sort({ joined_at: 1 })
        .toArray();

      if (members && members.length > 0) {
        return members.map((m) => {
          const meta = getUserMeta(m.user_id);
          return {
            id: m.id,
            org_id: m.org_id,
            user_id: m.user_id,
            role: m.role,
            joined_at: m.joined_at,
            user_name: m.user_name || meta.name,
            user_email: m.user_email || meta.email,
          };
        });
      }
    } catch {}
  }

  const store = readLocalOrgStore();
  return store.members
    .filter((m) => m.org_id === orgId)
    .map((m) => {
      const meta = getUserMeta(m.user_id);
      return {
        ...m,
        user_name: m.user_name || meta.name,
        user_email: m.user_email || meta.email,
      };
    });
}

export async function getMemberRole(orgId: string, userId: string): Promise<OrgRole | null> {
  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      const member = await db
        .collection<OrganizationMember>('organization_members')
        .findOne({ org_id: orgId, user_id: userId });

      if (member) {
        return member.role as OrgRole;
      }
    } catch {}
  }

  const store = readLocalOrgStore();
  const mem = store.members.find((m) => m.org_id === orgId && m.user_id === userId);
  return mem ? mem.role : null;
}

export async function createInvite(params: {
  orgId: string;
  role: OrgRole;
  expiresInHours?: number;
  maxUses?: number;
  userId: string;
}): Promise<OrganizationInvite> {
  const token = crypto.randomBytes(16).toString('hex');
  const hours = params.expiresInHours && params.expiresInHours > 0 ? params.expiresInHours : 48;
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  const maxUses = params.maxUses && params.maxUses > 0 ? params.maxUses : 10;
  const now = new Date().toISOString();

  const invite: OrganizationInvite = {
    id: `inv-${crypto.randomUUID().slice(0, 8)}`,
    org_id: params.orgId,
    token,
    role: params.role,
    expires_at: expiresAt,
    max_uses: maxUses,
    uses_count: 0,
    created_by: params.userId,
    revoked: false,
    created_at: now,
  };

  await syncInviteToMongo(invite);

  const store = readLocalOrgStore();
  store.invites.push(invite);
  writeLocalOrgStore(store);

  return invite;
}

export async function getInviteByToken(
  token: string
): Promise<(OrganizationInvite & { org_name: string }) | null> {
  const cleanToken = token.trim();

  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      const inv = await db
        .collection<OrganizationInvite>('organization_invites')
        .findOne({ token: cleanToken });

      if (inv) {
        const org = await db
          .collection<Organization>('organizations')
          .findOne({ id: inv.org_id });

        return {
          id: inv.id,
          org_id: inv.org_id,
          token: inv.token,
          role: inv.role,
          expires_at: inv.expires_at,
          max_uses: inv.max_uses,
          uses_count: inv.uses_count,
          created_by: inv.created_by,
          revoked: inv.revoked,
          created_at: inv.created_at,
          org_name: org?.name || 'Organization',
        };
      }
    } catch {}
  }

  const store = readLocalOrgStore();
  const inv = store.invites.find((i) => i.token === cleanToken);
  if (!inv) return null;

  const org = store.organizations.find((o) => o.id === inv.org_id);
  return {
    ...inv,
    org_name: org?.name || 'Organization',
  };
}

export async function joinOrganizationByToken(params: {
  token: string;
  userId: string;
}): Promise<{ success: boolean; orgId: string; role: OrgRole; message?: string }> {
  const invite = await getInviteByToken(params.token);

  if (!invite) {
    throw new Error('Invalid or non-existent invitation token.');
  }

  if (invite.revoked) {
    throw new Error('This invitation has been revoked by an administrator.');
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    throw new Error('This invitation has expired.');
  }

  if (invite.uses_count >= invite.max_uses) {
    throw new Error('This invitation has reached its maximum allowed uses.');
  }

  // Check if user is already a member
  const currentRole = await getMemberRole(invite.org_id, params.userId);
  if (currentRole) {
    return {
      success: true,
      orgId: invite.org_id,
      role: currentRole,
      message: 'You are already a member of this organisation.',
    };
  }

  const now = new Date().toISOString();
  const userMeta = getUserMeta(params.userId);
  const newMember: OrganizationMember = {
    id: `mem-${crypto.randomUUID().slice(0, 8)}`,
    org_id: invite.org_id,
    user_id: params.userId,
    role: invite.role,
    joined_at: now,
    user_name: userMeta.name,
    user_email: userMeta.email,
  };

  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      await db.collection('organization_members').replaceOne(
        { id: newMember.id },
        { ...newMember, _id: newMember.id as any },
        { upsert: true }
      );
      await db
        .collection('organization_invites')
        .updateOne({ id: invite.id }, { $inc: { uses_count: 1 } });
    } catch {}
  }

  const store = readLocalOrgStore();
  store.members.push(newMember);
  const invIndex = store.invites.findIndex((i) => i.id === invite.id);
  if (invIndex >= 0) {
    store.invites[invIndex].uses_count += 1;
  }
  writeLocalOrgStore(store);

  return {
    success: true,
    orgId: invite.org_id,
    role: invite.role,
  };
}

export async function updateMemberRole(params: {
  orgId: string;
  targetUserId: string;
  newRole: OrgRole;
}): Promise<OrganizationMember> {
  const store = readLocalOrgStore();
  const member = store.members.find(
    (m) => m.org_id === params.orgId && m.user_id === params.targetUserId
  );

  if (!member) {
    throw new Error('Member not found in this organisation.');
  }

  // An org must always keep at least 1 admin
  if (member.role === 'admin' && params.newRole !== 'admin') {
    const adminCount = store.members.filter(
      (m) => m.org_id === params.orgId && m.role === 'admin'
    ).length;
    if (adminCount <= 1) {
      throw new Error('Cannot downgrade the only admin. An organisation must keep at least 1 admin.');
    }
  }

  member.role = params.newRole;

  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      await db
        .collection('organization_members')
        .updateOne(
          { org_id: params.orgId, user_id: params.targetUserId },
          { $set: { role: params.newRole } }
        );
    } catch {}
  }

  writeLocalOrgStore(store);
  return member;
}

export async function removeMember(params: {
  orgId: string;
  targetUserId: string;
}): Promise<boolean> {
  const store = readLocalOrgStore();
  const member = store.members.find(
    (m) => m.org_id === params.orgId && m.user_id === params.targetUserId
  );

  if (!member) {
    throw new Error('Member not found in this organisation.');
  }

  // An org must always keep at least 1 admin
  if (member.role === 'admin') {
    const adminCount = store.members.filter(
      (m) => m.org_id === params.orgId && m.role === 'admin'
    ).length;
    if (adminCount <= 1) {
      throw new Error('Cannot remove the only admin. An organisation must keep at least 1 admin.');
    }
  }

  store.members = store.members.filter(
    (m) => !(m.org_id === params.orgId && m.user_id === params.targetUserId)
  );

  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      await db
        .collection('organization_members')
        .deleteOne({ org_id: params.orgId, user_id: params.targetUserId });
    } catch {}
  }

  writeLocalOrgStore(store);
  return true;
}

export async function deleteOrganization(params: {
  orgId: string;
  userId: string;
  confirmName?: string;
}): Promise<boolean> {
  const store = readLocalOrgStore();
  const org = store.organizations.find((o) => o.id === params.orgId);

  if (!org) {
    throw new Error('Organisation not found or already deleted.');
  }

  // 1. Verify user is still an Admin of that organisation
  const userMember = store.members.find(
    (m) => m.org_id === params.orgId && m.user_id === params.userId
  );
  if (!userMember || userMember.role !== 'admin') {
    throw new Error('Unauthorized: Only an organisation Admin can delete this organisation.');
  }

  // 2. Verify confirmation name if provided
  if (params.confirmName && params.confirmName !== org.name) {
    throw new Error(`Confirmation name does not match. Expected "${org.name}".`);
  }

  // 3. Database cleanup: MongoDB cascade
  if (isMongoConfigured()) {
    try {
      const db = await getMongoDb();
      await Promise.all([
        db.collection('organization_invites').deleteMany({ org_id: params.orgId }),
        db.collection('organization_members').deleteMany({ org_id: params.orgId }),
        db.collection('organizations').deleteOne({ id: params.orgId }),
      ]);
    } catch (err) {
      console.error('Error during Mongo org deletion:', err);
    }
  }

  // 4. Safe cleanup from local store (cascade)
  store.organizations = store.organizations.filter((o) => o.id !== params.orgId);
  store.members = store.members.filter((m) => m.org_id !== params.orgId);
  store.invites = store.invites.filter((i) => i.org_id !== params.orgId);

  writeLocalOrgStore(store);
  return true;
}
