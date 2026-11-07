import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Building2,
  Plus,
  Link as LinkIcon,
  Users,
  ArrowRight,
  Shield,
  X,
} from 'lucide-react';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { Organization, OrgRole } from '@/types/org';
import { SEEDED_USERS } from '@/data/seedData';

const ROLE_STYLES: Record<OrgRole, { bg: string; text: string; border: string }> = {
  admin: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  creator: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  reviewer: { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },
};

export default function OrgsListPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteTokenInput, setInviteTokenInput] = useState('');

  const fetchOrgs = async () => {
    setLoading(true);
    setError(null);
    try {
      let userId = SEEDED_USERS[0].id;
      const stored = localStorage.getItem('brandlint_current_user');
      if (stored) {
        try {
          userId = JSON.parse(stored).id || userId;
        } catch {}
      }

      const res = await fetch(`/api/orgs?userId=${encodeURIComponent(userId)}`, {
        headers: { 'x-user-id': userId },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch organisations');
      setOrgs(data.organizations || []);
    } catch (err: any) {
      setError(err.message || 'Error loading organisations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTokenInput.trim()) return;

    let token = inviteTokenInput.trim();
    if (token.includes('token=')) {
      try {
        const url = new URL(token, 'http://localhost');
        token = url.searchParams.get('token') || token;
      } catch {}
    }

    router.push(`/orgs/join?token=${encodeURIComponent(token)}`);
  };

  return (
    <OrgLayout
      title="Organisations"
      subtitle="Multi-tenant governance containers for brand assets, guidelines, and access control."
      actions={
        <>
          <button
            onClick={() => setShowJoinModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              fontSize: 12,
              fontWeight: 700,
              background: 'var(--white)',
              color: 'var(--ink)',
              border: '1px solid var(--rule-dark)',
              cursor: 'pointer',
            }}
          >
            <LinkIcon style={{ width: 14, height: 14, color: 'var(--ink-light)' }} />
            Join with Invite
          </button>
          <Link
            href="/orgs/new"
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease',
            }}
          >
            <Plus style={{ width: 15, height: 15 }} />
            Create Organisation
          </Link>
        </>
      }
    >
      {error && (
        <div style={{
          marginBottom: 24,
          padding: '16px 20px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 180,
                border: '1px solid var(--rule)',
                background: 'var(--white)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0.6,
              }}
            >
              <div>
                <div style={{ width: 36, height: 36, background: 'var(--paper-mid)', marginBottom: 16 }} />
                <div style={{ height: 16, width: '60%', background: 'var(--paper-mid)', marginBottom: 8 }} />
                <div style={{ height: 12, width: '90%', background: 'var(--paper-mid)' }} />
              </div>
              <div style={{ height: 12, width: '40%', background: 'var(--paper-mid)' }} />
            </div>
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--rule)',
          padding: '48px 32px',
          textAlign: 'center',
          maxWidth: 540,
          margin: '40px auto',
        }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid var(--rule)',
          }}>
            <Building2 style={{ width: 24, height: 24 }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: '0 0 8px' }}>
            No organisations found
          </h3>
          <p style={{ fontSize: 13, color: 'var(--ink-mid)', margin: '0 0 24px', lineHeight: 1.6 }}>
            You do not currently belong to any organisation. Create your first workspace container or join an existing one using an invite link.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button
              onClick={() => setShowJoinModal(true)}
              style={{
                padding: '9px 16px',
                fontSize: 12,
                fontWeight: 700,
                background: 'var(--white)',
                color: 'var(--ink)',
                border: '1px solid var(--rule-dark)',
                cursor: 'pointer',
              }}
            >
              Join with Invite
            </button>
            <Link
              href="/orgs/new"
              className="btn-primary"
              style={{
                padding: '9px 18px',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
              }}
            >
              Create Organisation
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {orgs.map((org) => {
            const role = org.role || 'creator';
            const roleStyle = ROLE_STYLES[role] || ROLE_STYLES.creator;

            return (
              <Link
                key={org.id}
                href={`/orgs/${org.id}`}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--rule)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(-2px, -2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '4.5px 4.5px 0px var(--btn-shadow)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '2.5px 2.5px 0px var(--btn-shadow)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      background: 'var(--ink)',
                      color: '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Building2 style={{ width: 20, height: 20 }} />
                    </div>
                    {org.role && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          background: roleStyle.bg,
                          color: roleStyle.text,
                          border: `1px solid ${roleStyle.border}`,
                        }}
                      >
                        {org.role}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                    {org.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>
                    {org.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{
                  paddingTop: 16,
                  marginTop: 20,
                  borderTop: '1px solid var(--rule)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--ink-light)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users style={{ width: 14, height: 14, color: 'var(--ink-faint)' }} />
                    <span>{org.member_count ?? 1} {org.member_count === 1 ? 'member' : 'members'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: 'var(--accent)' }}>
                    <span>Manage</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Join via Invite Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(28, 25, 23, 0.45)',
          backdropFilter: 'blur(3px)',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--white)',
            maxWidth: 480,
            width: '100%',
            padding: 28,
            border: '1px solid var(--rule-dark)',
            boxShadow: '6px 6px 0px var(--btn-shadow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--rule)',
                }}>
                  <LinkIcon style={{ width: 16, height: 16 }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Join with Invite Link
                </h3>
              </div>
              <button
                onClick={() => setShowJoinModal(false)}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--white)',
                  border: '1px solid var(--rule-dark)',
                  borderRadius: 'var(--radius-btn)',
                  cursor: 'pointer',
                  color: 'var(--ink)',
                  boxShadow: '2px 2px 0px var(--btn-shadow)',
                  padding: 0,
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--ink-mid)', marginBottom: 20, lineHeight: 1.5 }}>
              Paste the invitation token or full invitation URL shared by an organisation administrator.
            </p>

            <form onSubmit={handleJoinSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label className="kicker" style={{ marginBottom: 6 }}>
                  Invite Token or Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9b93ab8... or http://.../orgs/join?token=..."
                  value={inviteTokenInput}
                  onChange={(e) => setInviteTokenInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 13,
                    border: '1px solid var(--rule-dark)',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                  }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="btn-plain"
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--ink-mid)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '9px 18px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
                  }}
                >
                  Continue to Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OrgLayout>
  );
}
