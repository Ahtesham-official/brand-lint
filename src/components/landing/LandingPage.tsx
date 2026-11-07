import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Building2, UserPlus, ArrowRight, Plus, Link as LinkIcon, Loader2 } from 'lucide-react';
import { User } from '@/types';
import { Organization, OrgRole } from '@/types/org';

interface LandingPageProps {
  currentUser: User;
  onOpenAuth: () => void;
  onEnterOrg: (orgId: string) => void;
}

const ROLE_STYLE: Record<OrgRole, { bg: string; color: string; border: string }> = {
  admin:    { bg: '#102142', color: '#e0f2fe', border: '#102142' },
  creator:  { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  reviewer: { bg: '#e0f2fe', color: '#075985', border: '#7dd3fc' },
};

export const LandingPage: React.FC<LandingPageProps> = ({ currentUser, onOpenAuth, onEnterOrg }) => {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs]     = useState(true);
  const [showJoin, setShowJoin]           = useState(false);
  const [showCreate, setShowCreate]       = useState(false);
  const [inviteToken, setInviteToken]     = useState('');
  const [joining, setJoining]             = useState(false);
  const [joinError, setJoinError]         = useState<string | null>(null);
  const [createName, setCreateName]       = useState('');
  const [createDesc, setCreateDesc]       = useState('');
  const [creating, setCreating]           = useState(false);
  const [createError, setCreateError]     = useState<string | null>(null);

  const fetchOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const res  = await fetch(`/api/orgs?userId=${encodeURIComponent(currentUser.id)}`, { headers: { 'x-user-id': currentUser.id } });
      const data = await res.json();
      if (res.ok && data.organizations) setOrganizations(data.organizations);
    } catch {} finally { setLoadingOrgs(false); }
  }, [currentUser.id]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;
    let token = inviteToken.trim();
    if (token.includes('token=')) { try { const u = new URL(token, 'http://localhost'); token = u.searchParams.get('token') || token; } catch {} }
    setJoining(true); setJoinError(null);
    try {
      const res  = await fetch('/api/orgs/join', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }, body: JSON.stringify({ token, userId: currentUser.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join.');
      setShowJoin(false); setInviteToken(''); await fetchOrgs(); onEnterOrg(data.orgId);
    } catch (err: any) { setJoinError(err.message); } finally { setJoining(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true); setCreateError(null);
    try {
      const res  = await fetch('/api/orgs', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }, body: JSON.stringify({ name: createName.trim(), description: createDesc.trim(), userId: currentUser.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create.');
      setShowCreate(false); setCreateName(''); setCreateDesc(''); await fetchOrgs(); onEnterOrg(data.organization.id);
    } catch (err: any) { setCreateError(err.message); } finally { setCreating(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>

      {/* ── Top bar ───────────────────────────────── */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--rule)', padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/brandlint-mark.png" alt="" width={168} height={120} priority style={{ width: 'auto', height: 32, objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>BrandLint</span>
          <span className="badge" style={{ marginLeft: 4, borderColor: 'var(--rule)', color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>v1.0</span>
        </div>
        <button
          onClick={onOpenAuth}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: 'transparent', color: 'var(--ink-mid)', border: '1px solid var(--rule)', cursor: 'pointer', fontSize: 13 }}
        >
          <div style={{ width: 24, height: 24, background: 'var(--paper-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif)' }}>{currentUser.name[0]}</div>
          {currentUser.name}
        </button>
      </div>

      <main className="landing-stage">
        <div className="landing-watermark landing-watermark-left" aria-hidden="true">
          <div className="landing-watermark-window">
            <div className="landing-watermark-toolbar">
              <span /><span /><span />
            </div>
            <div className="landing-watermark-appbar">
              <span className="landing-watermark-symbol" />
              <span>BrandLint</span>
            </div>
            <div className="landing-watermark-content">
              <div className="landing-watermark-nav">
                <span className="landing-watermark-nav-active">Dashboard</span>
                <span>Guidelines</span>
                <span>Fact Vault</span>
                <span>Submissions</span>
                <span>Reviews</span>
              </div>
              <div className="landing-watermark-panel">
                <strong>Guideline Rules</strong>
                <div className="landing-watermark-check">Use approved brand colors</div>
                <div className="landing-watermark-check">Maintain brand tone</div>
                <div className="landing-watermark-check">Include required disclaimer</div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-watermark landing-watermark-right" aria-hidden="true">
          <div className="landing-watermark-window">
            <div className="landing-watermark-toolbar">
              <span /><span /><span />
            </div>
            <div className="landing-watermark-appbar">
              <span className="landing-watermark-symbol" />
              <span>BrandLint</span>
            </div>
            <div className="landing-watermark-content">
              <div className="landing-watermark-nav">
                <span className="landing-watermark-nav-active">Dashboard</span>
                <span>Guidelines</span>
                <span>Fact Vault</span>
                <span>Submissions</span>
                <span>Reviews</span>
              </div>
              <div className="landing-watermark-panel">
                <strong>Content Review</strong>
                <div className="landing-watermark-review">
                  <b>24-Month Warranty!</b>
                  <span>2 Issues Detected</span>
                  <span>Unsupported claim</span>
                </div>
                <div className="landing-watermark-fix">
                  <b>Suggested Fix</b>
                  <span>“12-Month Warranty”</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* ── Hero ─────────────────────────────────── */}
      <div className="landing-hero" style={{ maxWidth: 760, margin: '0 auto', padding: '80px 32px 60px', textAlign: 'center' }}>
        <div className="kicker-accent" style={{ marginBottom: 16, display: 'block', textAlign: 'center' }}>
          AI-Powered Brand Governance
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 52, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '0 0 20px', lineHeight: 1.1 }}>
          Welcome to BrandLint
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-light)', maxWidth: 480, margin: '0 auto 48px', lineHeight: 1.7, fontWeight: 300 }}>
          Manage brand guidelines, enforce compliance rules, and judge creative submissions — all in one governed workspace.
        </p>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: 'var(--btn-primary)', color: 'var(--white)', border: '1px solid var(--rule-dark)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            <Plus style={{ width: 16, height: 16 }} /> Create Workspace
          </button>
          <button
            onClick={() => setShowJoin(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--rule)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          >
            <LinkIcon style={{ width: 16, height: 16 }} /> Join via Invite
          </button>
        </div>
      </div>

      {/* ── Existing workspaces ───────────────────── */}
      <div className="landing-workspaces" style={{ maxWidth: 680, margin: '0 auto', padding: '0 32px 80px' }}>
        {loadingOrgs ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ink-faint)', padding: '32px 0' }}>
            <Loader2 style={{ width: 16, height: 16 }} /> Loading workspaces…
          </div>
        ) : organizations.length > 0 ? (
          <div>
            <div className="kicker" style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--rule)', textAlign: 'center' }}>
              Your Workspaces — {organizations.length}
            </div>
            {organizations.map((org) => {
              const rs = org.role && ROLE_STYLE[org.role] ? ROLE_STYLE[org.role] : { bg: 'var(--paper-mid)', color: 'var(--ink-mid)', border: 'var(--rule)' };
              return (
                <div
                  key={org.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 24px', marginBottom: 8, background: 'var(--white)', border: '1px solid var(--rule)' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>{org.name}</span>
                      {org.role && (
                        <span className="badge" style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}>
                          {org.role}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>{org.description || `${org.member_count ?? 1} member(s)`}</span>
                  </div>
                  <button
                    onClick={() => onEnterOrg(org.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--btn-primary)', color: 'var(--white)', border: '1px solid var(--rule-dark)', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                  >
                    Enter <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Features strip */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: '1px solid var(--rule)' }}>
          {[
            { title: 'AI Rule Extraction', desc: 'Groq LLM reads guidelines and structures enforceable rules automatically.' },
            { title: 'Cited Issue Reports', desc: 'Every compliance flag is cited back to the specific guideline rule.' },
            { title: 'Multi-Role Governance', desc: 'Admins, Creators, and Reviewers with scoped access and audit logs.' },
          ].map((f, i) => (
            <div key={f.title} style={{ padding: '28px 24px', background: 'var(--white)', borderRight: i < 2 ? '1px solid var(--rule)' : 'none' }}>
              <div className="kicker-accent" style={{ marginBottom: 8 }}>0{i + 1}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 16, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.2 }}>{f.title}</div>
              <p style={{ fontSize: 12, color: 'var(--ink-light)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
      </main>

      {/* ── Modals ───────────────────────────────── */}
      {showJoin && (
        <Modal title="Join an Organisation" onClose={() => setShowJoin(false)}>
          {joinError && <ErrBox msg={joinError} />}
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Invitation Token or Link">
              <input type="text" placeholder="Token or full invite URL" value={inviteToken} onChange={e => setInviteToken(e.target.value)} required autoFocus style={iStyle()} />
            </Field>
            <BtnRow>
              <Btn onClick={() => setShowJoin(false)}>Cancel</Btn>
              <Btn primary disabled={joining || !inviteToken.trim()} type="submit">
                {joining && <Loader2 style={{ width: 13, height: 13 }} />} Join
              </Btn>
            </BtnRow>
          </form>
        </Modal>
      )}

      {showCreate && (
        <Modal title="Create New Workspace" onClose={() => setShowCreate(false)}>
          {createError && <ErrBox msg={createError} />}
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Organisation Name *">
              <input type="text" placeholder="e.g. Apex Media Group" value={createName} onChange={e => setCreateName(e.target.value)} required autoFocus style={iStyle()} />
            </Field>
            <Field label="Description (optional)">
              <textarea rows={2} placeholder="Brand unit or division…" value={createDesc} onChange={e => setCreateDesc(e.target.value)} style={{ ...iStyle(), resize: 'none' }} />
            </Field>
            <BtnRow>
              <Btn onClick={() => setShowCreate(false)}>Cancel</Btn>
              <Btn primary disabled={creating || !createName.trim()} type="submit">
                {creating && <Loader2 style={{ width: 13, height: 13 }} />} Create
              </Btn>
            </BtnRow>
          </form>
        </Modal>
      )}
    </div>
  );
};

/* ── Tiny helpers ──────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.55)', padding: 24 }}>
      <div className="animate-in" style={{ background: 'var(--white)', border: '1px solid var(--rule)', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--white)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius-btn)',
              cursor: 'pointer',
              color: 'var(--ink-mid)',
              fontSize: 18,
              lineHeight: 1,
              padding: 0,
              boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="kicker" style={{ marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function BtnRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>{children}</div>;
}

function Btn({ children, primary, onClick, disabled, type }: { children: React.ReactNode; primary?: boolean; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        background: primary ? 'var(--btn-primary)' : 'transparent',
        color: primary ? 'var(--white)' : 'var(--ink-mid)',
        border: `1px solid ${primary ? 'var(--rule-dark)' : 'var(--rule)'}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '10px 14px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', fontSize: 13, marginBottom: 12 }}>
      {msg}
    </div>
  );
}

function iStyle(): React.CSSProperties {
  return {
    width: '100%', padding: '9px 12px', fontSize: 13,
    border: '1px solid var(--rule)', background: 'var(--paper)',
    color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)',
  };
}
