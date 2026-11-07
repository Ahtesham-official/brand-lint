import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Shield,
  Clock,
  Users,
} from 'lucide-react';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { OrganizationInvite, OrgRole } from '@/types/org';
import { SEEDED_USERS } from '@/data/seedData';

const ROLE_STYLES: Record<OrgRole, { bg: string; text: string; border: string }> = {
  admin: { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },
  creator: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  reviewer: { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },
};

export default function JoinOrgPage() {
  const router = useRouter();
  const { token } = router.query;

  const [inspecting, setInspecting] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invite, setInvite] = useState<(OrganizationInvite & { org_name: string }) | null>(null);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');

  const currentToken = typeof token === 'string' ? token.trim() : '';

  useEffect(() => {
    if (!router.isReady) return;

    if (!currentToken) {
      setInspecting(false);
      return;
    }

    const checkInvite = async () => {
      setInspecting(true);
      setError(null);
      setInvalidReason(null);
      try {
        const res = await fetch(`/api/orgs/join?token=${encodeURIComponent(currentToken)}`);
        const data = await res.json();

        if (!res.ok || !data.invite) {
          setInvalidReason(data.error || 'Invitation not found or invalid.');
        } else if (!data.valid) {
          setInvite(data.invite);
          setInvalidReason(data.reason || 'This invitation is no longer active.');
        } else {
          setInvite(data.invite);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to inspect invitation.');
      } finally {
        setInspecting(false);
      }
    };

    checkInvite();
  }, [router.isReady, currentToken]);

  const handleJoin = async () => {
    if (!currentToken) return;

    setJoining(true);
    setError(null);

    try {
      let userId = SEEDED_USERS[0].id;
      const stored = localStorage.getItem('brandlint_current_user');
      if (stored) {
        try {
          userId = JSON.parse(stored).id || userId;
        } catch {}
      }

      const res = await fetch('/api/orgs/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          token: currentToken,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join organisation');
      }

      router.push(`/orgs/${data.orgId}`);
    } catch (err: any) {
      setError(err.message || 'Unable to join organisation.');
      setJoining(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    let parsed = manualToken.trim();
    if (parsed.includes('token=')) {
      try {
        const url = new URL(parsed, 'http://localhost');
        parsed = url.searchParams.get('token') || parsed;
      } catch {}
    }

    router.push(`/orgs/join?token=${encodeURIComponent(parsed)}`);
  };

  return (
    <OrgLayout
      title="Join Organisation"
      subtitle="Accept an invitation to collaborate within a brand governance workspace."
      breadcrumbs={[{ label: 'Join' }]}
    >
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {inspecting ? (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--rule)',
            padding: 40,
            textAlign: 'center',
            boxShadow: '3px 3px 0px var(--btn-shadow)',
          }}>
            <Loader2 style={{ width: 28, height: 28, color: 'var(--accent)', margin: '0 auto 12px' }} className="animate-spin" />
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Verifying invitation token...</p>
          </div>
        ) : !currentToken ? (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--rule)',
            padding: '32px 36px',
            boxShadow: '3px 3px 0px var(--btn-shadow)',
          }}>
            <div style={{
              width: 38,
              height: 38,
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              border: '1px solid var(--rule)',
            }}>
              <Building2 style={{ width: 18, height: 18 }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
              Enter Invitation
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-mid)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Paste your invitation token or full invitation link below to join.
            </p>

            <form onSubmit={handleManualSubmit}>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Invite token or URL..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 13,
                    border: '1px solid var(--rule-dark)',
                    background: 'var(--paper)',
                    color: 'var(--ink)',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
                }}
              >
                Inspect Invitation
              </button>
            </form>
          </div>
        ) : invalidReason ? (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--rule)',
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: '3px 3px 0px var(--btn-shadow)',
          }}>
            <div style={{
              width: 44,
              height: 44,
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <XCircle style={{ width: 22, height: 22 }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
              Invalid Invitation
            </h2>
            <p style={{ fontSize: 13, color: '#dc2626', margin: '0 0 24px' }}>{invalidReason}</p>
            <Link
              href="/orgs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '9px 18px',
                fontSize: 12,
                fontWeight: 700,
                background: 'var(--paper-mid)',
                color: 'var(--ink)',
                border: '1px solid var(--rule-dark)',
                textDecoration: 'none',
              }}
            >
              Back to Organisations
            </Link>
          </div>
        ) : invite ? (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--rule)',
            padding: '32px 36px',
            boxShadow: '3px 3px 0px var(--btn-shadow)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 44,
                height: 44,
                background: 'var(--ink)',
                color: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <Building2 style={{ width: 22, height: 22 }} />
              </div>
              <span className="kicker-accent" style={{ marginBottom: 4 }}>
                Workspace Invite
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 900, color: 'var(--ink)', margin: '6px 0 4px', letterSpacing: '-0.01em' }}>
                {invite.org_name}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--ink-mid)', margin: 0 }}>
                You have been invited to collaborate in this brand governance container.
              </p>
            </div>

            {error && (
              <div style={{
                marginBottom: 20,
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div style={{
              background: 'var(--paper)',
              border: '1px solid var(--rule)',
              padding: '16px 20px',
              marginBottom: 24,
              fontSize: 13,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-mid)' }}>Assigned Role</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: ROLE_STYLES[invite.role]?.bg || '#e0f2fe',
                    color: ROLE_STYLES[invite.role]?.text || '#075985',
                    border: `1px solid ${ROLE_STYLES[invite.role]?.border || '#7dd3fc'}`,
                  }}
                >
                  {invite.role}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-mid)' }}>Expires</span>
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                  {new Date(invite.expires_at).toLocaleDateString()} at{' '}
                  {new Date(invite.expires_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-mid)' }}>Remaining Uses</span>
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                  {invite.max_uses - invite.uses_count} of {invite.max_uses}
                </span>
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-primary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: joining ? 'not-allowed' : 'pointer',
                boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
              }}
            >
              {joining ? (
                <>
                  <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                  <span>Joining Workspace...</span>
                </>
              ) : (
                <>
                  <span>Accept Invitation & Join</span>
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </OrgLayout>
  );
}
