import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  ArrowRight,
  Clock,
  Users,
} from 'lucide-react';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { OrganizationInvite, OrgRole } from '@/types/org';
import { SEEDED_USERS } from '@/data/seedData';

const ROLE_BADGE: Record<OrgRole, string> = {
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  creator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reviewer: 'bg-amber-100 text-amber-700 border-amber-200',
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

      // Redirect immediately to the organization
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
      <div className="max-w-md mx-auto">
        {inspecting ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-700">Verifying invitation...</p>
          </div>
        ) : !currentToken ? (
          /* Manual Token Input Form */
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Enter Invitation</h2>
            <p className="text-xs text-slate-500 mb-5">
              Paste your invitation token or full invitation link below to join.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Invite token or URL..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
              >
                Inspect Invitation
              </button>
            </form>
          </div>
        ) : invalidReason ? (
          /* Invalid Invitation State */
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Invalid Invitation</h2>
            <p className="text-xs text-red-600 mb-6">{invalidReason}</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/orgs"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Back to Organisations
              </Link>
            </div>
          </div>
        ) : invite ? (
          /* Valid Invitation Card */
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                Workspace Invite
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">{invite.org_name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                You have been invited to collaborate in this organisation.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Role</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${
                    ROLE_BADGE[invite.role]
                  }`}
                >
                  {invite.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Expires</span>
                <span className="text-slate-700 font-medium">
                  {new Date(invite.expires_at).toLocaleDateString()} at{' '}
                  {new Date(invite.expires_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Remaining Uses</span>
                <span className="text-slate-700 font-medium">
                  {invite.max_uses - invite.uses_count} of {invite.max_uses}
                </span>
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors shadow-sm"
            >
              {joining ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Joining Workspace...</span>
                </>
              ) : (
                <>
                  <span>Accept Invitation & Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </OrgLayout>
  );
}

