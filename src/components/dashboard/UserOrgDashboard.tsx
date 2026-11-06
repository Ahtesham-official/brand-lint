import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Building2,
  Plus,
  Link as LinkIcon,
  Users,
  Shield,
  ArrowRight,
  UserCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { Organization, OrgRole } from '@/types/org';

interface UserOrgDashboardProps {
  currentUser: User;
  onOpenAuth: () => void;
}

const ORG_ROLE_BADGE: Record<OrgRole, string> = {
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  creator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reviewer: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const UserOrgDashboard: React.FC<UserOrgDashboardProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Join Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Quick Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orgs?userId=${encodeURIComponent(currentUser.id)}`, {
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load organisations.');
      }
      setOrganizations(data.organizations || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching organisations.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;

    let token = inviteToken.trim();
    if (token.includes('token=')) {
      try {
        const url = new URL(token, 'http://localhost');
        token = url.searchParams.get('token') || token;
      } catch {}
    }

    setJoining(true);
    setJoinError(null);

    try {
      const res = await fetch('/api/orgs/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          token,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join organisation.');
      }

      setShowJoinModal(false);
      setInviteToken('');
      await fetchOrganizations();
      router.push(`/orgs/${data.orgId}`);
    } catch (err: any) {
      setJoinError(err.message || 'Unable to join organisation.');
    } finally {
      setJoining(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim(),
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create organisation.');
      }

      setShowCreateModal(false);
      setCreateName('');
      setCreateDescription('');
      await fetchOrganizations();
      router.push(`/orgs/${data.organization.id}`);
    } catch (err: any) {
      setCreateError(err.message || 'Unable to create organisation.');
    } finally {
      setCreating(false);
    }
  };

  const isFirstTime = organizations.length === 0 && !loading;

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {currentUser.name}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser.email}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">{currentUser.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 transition-colors"
          >
            <UserCircle className="w-3.5 h-3.5 text-slate-500" />
            Switch Account
          </button>
          <button
            onClick={fetchOrganizations}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/90 transition-colors"
            title="Refresh organisations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* First-Time Welcome / Onboarding Hero */}
      {isFirstTime && (
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/90 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              First Time Setup
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome to BrandLint, {currentUser.name}!
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              BrandLint isolates brand guidelines, cited rulebooks, and audit trails per organisation. To begin governing brand assets, please choose an option below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {/* Option 1: Create an Org */}
              <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Create an Organisation</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Establish a new workspace for your brand. You will be assigned the <span className="text-blue-700 font-semibold">Admin</span> role and can invite team members.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Organisation
                </button>
              </div>

              {/* Option 2: Join an Org */}
              <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Join with Invite Link</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Collaborate on an existing brand. Enter the invitation token or link shared by your administrator.
                  </p>
                </div>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  Enter Invite Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Organisations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">My Organisations</h3>
              <p className="text-xs text-slate-500">
                Workspaces and brand containers where you hold active membership.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              Join with Invite
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Organisation
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-1/3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : organizations.length === 0 ? (
          !isFirstTime && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center shadow-sm">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">No organisations found</h4>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                You are not currently a member of any organisation.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Join with Invite
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Create Organisation
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {organizations.map((org) => {
              const roleBadgeClass =
                org.role && ORG_ROLE_BADGE[org.role]
                  ? ORG_ROLE_BADGE[org.role]
                  : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <div
                  key={org.id}
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

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {org.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {org.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{org.member_count ?? 1} members</span>
                    </div>

                    <Link
                      href={`/orgs/${org.id}`}
                      className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition-colors group-hover:translate-x-0.5"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <LinkIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Join an Organisation</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Enter your invitation token or full invitation URL to join as a collaborator.
            </p>

            {joinError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Invitation Token or Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9b93ab8... or http://.../orgs/join?token=..."
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
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
                  disabled={joining || !inviteToken.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors shadow-sm"
                >
                  {joining && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Join Organisation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Create New Organisation</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              You will automatically become the Admin of this brand container.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Organisation Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Media Group, Apex Global"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Governed division, business unit, or marketing guidelines..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !createName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors shadow-sm"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

