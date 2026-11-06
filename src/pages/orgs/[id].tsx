import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Building2,
  Users,
  UserPlus,
  Shield,
  Copy,
  Check,
  Trash2,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { Organization, OrganizationMember, OrgRole, OrganizationInvite } from '@/types/org';
import { SEEDED_USERS } from '@/data/seedData';

const ROLE_BADGE: Record<OrgRole, string> = {
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  creator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reviewer: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function OrgDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const orgId = typeof id === 'string' ? id : '';

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [userRole, setUserRole] = useState<OrgRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(SEEDED_USERS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Invite Generator State (Admin Only)
  const [inviteRole, setInviteRole] = useState<OrgRole>('creator');
  const [expiresInHours, setExpiresInHours] = useState<number>(48);
  const [maxUses, setMaxUses] = useState<number>(5);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete Organisation State (Admin Only)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Active user retrieval
  useEffect(() => {
    try {
      const stored = localStorage.getItem('brandlint_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) setCurrentUserId(parsed.id);
      }
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch organization details
      const orgRes = await fetch(`/api/orgs/${orgId}?userId=${encodeURIComponent(currentUserId)}`, {
        headers: { 'x-user-id': currentUserId },
      });
      const orgData = await orgRes.json();
      if (!orgRes.ok) {
        throw new Error(orgData.error || 'Failed to load organisation');
      }

      setOrg(orgData.organization);
      setUserRole(orgData.organization.user_role || null);

      // 2. Fetch members
      const memRes = await fetch(`/api/orgs/${orgId}/members?userId=${encodeURIComponent(currentUserId)}`, {
        headers: { 'x-user-id': currentUserId },
      });
      const memData = await memRes.json();
      if (memRes.ok) {
        setMembers(memData.members || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading organisation.');
    } finally {
      setLoading(false);
    }
  }, [orgId, currentUserId]);

  useEffect(() => {
    if (router.isReady && orgId) {
      loadData();
    }
  }, [router.isReady, orgId, loadData]);

  // Handle Role Change (Admin only)
  const handleRoleChange = async (targetUserId: string, newRole: OrgRole) => {
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${targetUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({ role: newRole, userId: currentUserId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member role');
      }

      setSuccessMsg(`Role updated to ${newRole}.`);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === targetUserId ? { ...m, role: newRole } : m))
      );

      // If user modified their own role, update state
      if (targetUserId === currentUserId) {
        setUserRole(newRole);
      }
    } catch (err: any) {
      setError(err.message || 'Error updating member role.');
    }
  };

  // Handle Remove Member (Admin only)
  const handleRemoveMember = async (targetUserId: string, targetName?: string) => {
    if (!confirm(`Are you sure you want to remove ${targetName || 'this member'} from the organisation?`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/orgs/${orgId}/members/${targetUserId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUserId,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      setSuccessMsg('Member removed successfully.');
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
    } catch (err: any) {
      setError(err.message || 'Error removing member.');
    }
  };

  // Handle Invite Generation (Admin only)
  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingInvite(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch(`/api/orgs/${orgId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({
          role: inviteRole,
          expires_in_hours: expiresInHours,
          max_uses: maxUses,
          userId: currentUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invitation');
      }

      setGeneratedInviteUrl(data.joinUrl);
      setSuccessMsg('Invite link generated!');
    } catch (err: any) {
      setError(err.message || 'Failed to generate invitation.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Handle Delete Organisation (Admin Only)
  const handleDeleteOrg = async () => {
    if (!org) return;
    if (confirmNameInput.trim() !== org.name) {
      setDeleteError(`Please type "${org.name}" exactly to confirm.`);
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/orgs/${orgId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
        },
        body: JSON.stringify({
          confirmName: confirmNameInput.trim(),
          userId: currentUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete organisation.');
      }

      // Clear any active workspace session in local storage
      try {
        localStorage.removeItem('brandlint_active_org_id');
      } catch {}

      // Redirect Admin to the main BrandLint landing page
      router.push('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting organisation.');
      setDeleting(false);
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <OrgLayout
      title={org?.name || 'Organisation'}
      subtitle={org?.description || 'Multi-tenant brand workspace.'}
      breadcrumbs={[{ label: org?.name || 'Details' }]}
      actions={
        <div className="flex items-center gap-2">
          {userRole && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
              <span className="text-slate-400 font-medium">Your Role:</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROLE_BADGE[userRole]}`}
              >
                {userRole}
              </span>
            </div>
          )}
        </div>
      }
    >
      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading organisation details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members Column (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Members & Roles</h2>
                    <p className="text-xs text-slate-500">
                      {members.length} {members.length === 1 ? 'member' : 'members'} in this organisation
                    </p>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div className="divide-y divide-slate-100">
                {members.map((member) => {
                  const isCurrent = member.user_id === currentUserId;
                  return (
                    <div
                      key={member.id}
                      className="py-3.5 flex items-center justify-between gap-4 first:pt-1 last:pb-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                          {member.user_name ? member.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {member.user_name || member.user_id}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {member.user_email || `Joined ${new Date(member.joined_at).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>

                      {/* Role selection & admin actions */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {isAdmin ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.user_id, e.target.value as OrgRole)
                            }
                            className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                              ROLE_BADGE[member.role]
                            }`}
                          >
                            <option value="admin">Admin</option>
                            <option value="creator">Creator</option>
                            <option value="reviewer">Reviewer</option>
                          </select>
                        ) : (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              ROLE_BADGE[member.role]
                            }`}
                          >
                            {member.role}
                          </span>
                        )}

                        {/* Remove Member button (Admin only, cannot remove if only admin) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id, member.user_name)}
                            title="Remove member"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Context Card */}
            <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800">Fixed Role Permissions:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 pt-1">
                <li><strong className="text-slate-700">Admin:</strong> Manage organisation, create invites, change roles, remove members.</li>
                <li><strong className="text-slate-700">Creator:</strong> Submit content for checking, view own submissions.</li>
                <li><strong className="text-slate-700">Reviewer:</strong> View submissions in the organisation, approve or reject them.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Invite Generator (Admin only) or Informational Card */}
          <div className="space-y-6">
            {isAdmin ? (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Invite Members</h3>
                    <p className="text-[11px] text-slate-400">Generate a reusable join link</p>
                  </div>
                </div>

                <form onSubmit={handleGenerateInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="creator">Creator (Submit & check content)</option>
                      <option value="reviewer">Reviewer (Audit & approve submissions)</option>
                      <option value="admin">Admin (Full organisation control)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Expires In
                      </label>
                      <select
                        value={expiresInHours}
                        onChange={(e) => setExpiresInHours(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value={24}>24 hours</option>
                        <option value={48}>48 hours</option>
                        <option value={168}>7 days</option>
                        <option value={720}>30 days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Max Uses
                      </label>
                      <select
                        value={maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value={1}>1 use (Single)</option>
                        <option value={5}>5 uses</option>
                        <option value={20}>20 uses</option>
                        <option value={100}>100 uses</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={generatingInvite}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors shadow-sm"
                  >
                    {generatingInvite && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Generate Invite Link</span>
                  </button>
                </form>

                {/* Generated Link Display */}
                {generatedInviteUrl && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Copyable Join Link:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedInviteUrl}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 select-all font-mono"
                      />
                      <button
                        onClick={copyToClipboard}
                        className={`p-2 rounded-xl border transition-colors shrink-0 ${
                          copied
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    {copied && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Copied link to clipboard!
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">Admin-Only Controls</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Only administrators can create invitation links or change member roles for this organisation.
                </p>
              </div>
            )}
          </div>

          {/* Danger Zone: Delete Organisation (Admin Only) */}
          {isAdmin && (
            <div className="lg:col-span-3 mt-6 pt-6 border-t border-slate-200">
              <div className="bg-red-50/50 border border-red-200/80 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      <h3 className="text-sm font-bold">Danger Zone</h3>
                    </div>
                    <p className="text-xs text-red-600/90 mt-1 max-w-xl leading-relaxed">
                      Permanently delete this organisation and all associated guidelines, rules, fact vaults, invites, and member records. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setConfirmNameInput('');
                      setDeleteError(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Organisation</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal (Admin Only) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Organisation</h3>
                <p className="text-xs text-red-600 font-semibold">This action is permanent and irreversible.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Deleting <strong className="text-slate-900 font-semibold">{org?.name}</strong> will permanently remove all associated guidelines, rulebooks, fact vaults, invitation links, and membership records.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {deleteError}
              </div>
            )}

            <div className="space-y-2 mb-6">
              <label className="block text-xs text-slate-700">
                To confirm, please type <span className="font-mono font-bold text-slate-900 select-all bg-slate-100 px-1.5 py-0.5 rounded">{org?.name}</span> below:
              </label>
              <input
                type="text"
                placeholder="Type exact organisation name to confirm"
                value={confirmNameInput}
                onChange={(e) => setConfirmNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmNameInput('');
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrg}
                disabled={confirmNameInput.trim() !== org?.name || deleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shadow-sm"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Organisation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </OrgLayout>
  );
}

