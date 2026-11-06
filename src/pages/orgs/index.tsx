import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Building2,
  Plus,
  Link as LinkIcon,
  Users,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { Organization, OrgRole } from '@/types/org';
import { SEEDED_USERS } from '@/data/seedData';

const ROLE_COLORS: Record<OrgRole, string> = {
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  creator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reviewer: 'bg-amber-100 text-amber-700 border-amber-200',
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
    // Support either bare token or full URL (e.g. http://localhost:3000/orgs/join?token=xyz)
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
            Join with Invite
          </button>
          <Link
            href="/orgs/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Organisation
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="h-4 w-3/4 bg-slate-100 rounded" />
                <div className="h-3 w-full bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-1/3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No organisations found</h3>
          <p className="text-xs text-slate-500 mt-1.5 mb-6">
            You do not currently belong to any organisation. Create your first organisation or join one via an invite link.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Join with Invite
            </button>
            <Link
              href="/orgs/new"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Create Organisation
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orgs.map((org) => {
            const role = org.role || 'member';
            const roleBadgeClass =
              org.role && ROLE_COLORS[org.role]
                ? ROLE_COLORS[org.role]
                : 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <Link
                key={org.id}
                href={`/orgs/${org.id}`}
                className="group relative bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white transition-colors flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {org.role && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${roleBadgeClass}`}
                      >
                        {org.role}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {org.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{org.member_count ?? 1} members</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Join via Invite Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <LinkIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Join with Invite Link</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Paste the invitation token or full invitation URL shared by an organisation admin.
            </p>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Invite Token or Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9b93ab8... or http://.../orgs/join?token=..."
                  value={inviteTokenInput}
                  onChange={(e) => setInviteTokenInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
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

