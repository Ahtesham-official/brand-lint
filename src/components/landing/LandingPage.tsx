import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ShieldCheck,
  Building2,
  UserPlus,
  ArrowRight,
  Users,
  Plus,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  Sparkles,
  UserCircle,
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { Organization, OrgRole } from '@/types/org';

interface LandingPageProps {
  currentUser: User;
  onOpenAuth: () => void;
  onEnterOrg: (orgId: string) => void;
}

const ROLE_BADGE: Record<OrgRole, string> = {
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  creator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reviewer: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onOpenAuth,
  onEnterOrg,
}) => {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Modal States
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const res = await fetch(`/api/orgs?userId=${encodeURIComponent(currentUser.id)}`, {
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      if (res.ok && data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingOrgs(false);
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
      onEnterOrg(data.orgId);
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
      onEnterOrg(data.organization.id);
    } catch (err: any) {
      setCreateError(err.message || 'Unable to create organisation.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative px-4 py-8 font-sans">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-100/40 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full mx-auto z-10 my-auto py-12">
        {/* Centre BrandLint Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg mx-auto mb-4 hover:scale-105 transition-transform">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome to BrandLint
            </h1>
            <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
              v1.0
            </span>
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Manage your brand governance in one place.
          </p>
        </div>

        {/* The Two Primary Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl mb-10">
          {/* Option 1: Join an Organisation */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400/80 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1.5">
                Join an Organisation
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter an invitation link or token shared by an administrator to collaborate on an existing brand.
              </p>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-800 transition-colors shadow-xs"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Join an Organisation</span>
            </button>
          </div>

          {/* Option 2: Create an Organisation */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400/80 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1.5">
                Create an Organisation
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Establish a new workspace for your brand guidelines, cited rulebooks, and invite team members.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create an Organisation</span>
            </button>
          </div>
        </div>

        {/* Existing Organisations Selection (if user belongs to any) */}
        {!loadingOrgs && organizations.length > 0 && (
          <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Your Organisations
              </span>
              <span className="text-[11px] text-slate-400">
                {organizations.length} {organizations.length === 1 ? 'workspace' : 'workspaces'}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {organizations.map((org) => {
                const roleBadgeClass =
                  org.role && ROLE_BADGE[org.role]
                    ? ROLE_BADGE[org.role]
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div
                    key={org.id}
                    className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {org.name}
                        </span>
                        {org.role && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider border ${roleBadgeClass}`}
                          >
                            {org.role}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {org.description || `${org.member_count ?? 1} members`}
                      </p>
                    </div>

                    <button
                      onClick={() => onEnterOrg(org.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors shrink-0"
                    >
                      <span>Enter Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom-Left: User Profile Option ONLY (No Admin/Creator/Reviewer pills) */}
      <div className="fixed bottom-5 left-5 z-20">
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left group"
          title="Account Profile & Settings"
        >
          <div className="relative">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                {currentUser.name.slice(0, 1)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="min-w-0 pr-1">
            <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Profile & Account
            </div>
          </div>
        </button>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 resize-none"
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

