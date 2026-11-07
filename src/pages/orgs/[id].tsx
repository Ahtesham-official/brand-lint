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
  X,
} from 'lucide-react';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { Organization, OrganizationMember, OrgRole, OrganizationInvite } from '@/types/org';
import { SEEDED_USERS } from '@/data/seedData';

const ROLE_STYLES: Record<OrgRole, { bg: string; text: string; border: string }> = {
  admin: { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },
  creator: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  reviewer: { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },
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

  // Delete State (Admin Only)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch Organisation Data
  const fetchOrgDetails = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    let activeUser = SEEDED_USERS[0].id;
    try {
      const demoUser = localStorage.getItem('brandlint_demo_user_id');
      if (demoUser && SEEDED_USERS.some((u) => u.id === demoUser)) {
        activeUser = demoUser;
      } else {
        const stored = localStorage.getItem('brandlint_current_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.id && SEEDED_USERS.some((u) => u.id === parsed.id)) activeUser = parsed.id;
        }
      }
    } catch {}
    setCurrentUserId(activeUser);

    try {
      const res = await fetch(`/api/orgs/${orgId}?userId=${encodeURIComponent(activeUser)}`, {
        headers: { 'x-user-id': activeUser },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load organisation details');

      setOrg(data.organization);
      setMembers(data.members || []);
      setUserRole(data.userRole || null);
    } catch (err: any) {
      setError(err.message || 'Error fetching organisation details.');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchOrgDetails();
  }, [fetchOrgDetails]);

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

  // Handle Generate Invite (Admin only)
  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingInvite(true);
    setError(null);
    setSuccessMsg(null);
    setGeneratedInviteUrl(null);

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
        throw new Error(data.error || 'Failed to create invite link');
      }

      const fullUrl = `${window.location.origin}/orgs/join?token=${data.invite.token}`;
      setGeneratedInviteUrl(fullUrl);
      setSuccessMsg('Invite link generated successfully.');
    } catch (err: any) {
      setError(err.message || 'Error creating invite.');
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

      try {
        localStorage.removeItem('brandlint_active_org_id');
      } catch {}

      // Keep active demo persona selected, redirect directly to workspace selection with success message
      router.push(`/?view=workspaces&deleted=${encodeURIComponent(org.name)}`);
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting organisation.');
      setDeleting(false);
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <OrgLayout
      title={org?.name || 'Organisation'}
      subtitle={org?.description || 'Multi-tenant brand workspace governance.'}
      breadcrumbs={[{ label: org?.name || 'Details' }]}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {userRole && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: 'var(--white)',
              border: '1px solid var(--rule)',
              fontSize: 12,
            }}>
              <span style={{ color: 'var(--ink-faint)', fontWeight: 600 }}>Your Role:</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  background: ROLE_STYLES[userRole]?.bg || '#e0f2fe',
                  color: ROLE_STYLES[userRole]?.text || '#075985',
                  border: `1px solid ${ROLE_STYLES[userRole]?.border || '#7dd3fc'}`,
                }}
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
        <div style={{
          marginBottom: 20,
          padding: '14px 18px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div style={{
          marginBottom: 20,
          padding: '14px 18px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{
          padding: 48,
          textAlign: 'center',
          background: 'var(--white)',
          border: '1px solid var(--rule)',
          boxShadow: '3px 3px 0px var(--btn-shadow)',
        }}>
          <Loader2 style={{ width: 28, height: 28, color: 'var(--accent)', margin: '0 auto 12px' }} className="animate-spin" />
          <p style={{ fontSize: 13, color: 'var(--ink-mid)', fontWeight: 600 }}>Loading organisation details...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
          {/* Members Column */}
          <div style={{ gridColumn: 'span 2 / span 2', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--rule)',
              padding: '24px 28px',
              boxShadow: '3px 3px 0px var(--btn-shadow)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--rule)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    background: 'var(--accent-bg)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--rule)',
                  }}>
                    <Users style={{ width: 16, height: 16 }} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                      Members & Roles
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--ink-mid)', margin: '2px 0 0' }}>
                      {members.length} {members.length === 1 ? 'member' : 'members'} in this organisation
                    </p>
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {members.map((member, idx) => {
                  const isCurrent = member.user_id === currentUserId;
                  const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.creator;

                  return (
                    <div
                      key={member.id}
                      style={{
                        padding: '14px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        borderBottom: idx === members.length - 1 ? 'none' : '1px solid var(--rule)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          background: 'var(--paper-mid)',
                          border: '1px solid var(--rule)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                          fontFamily: 'var(--font-serif)',
                          color: 'var(--ink)',
                          flexShrink: 0,
                        }}>
                          {member.user_name ? member.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.user_name || member.user_id}
                            </span>
                            {isCurrent && (
                              <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 9,
                                background: 'var(--paper-dark)',
                                color: 'var(--ink-mid)',
                                padding: '1px 6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}>
                                You
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--ink-faint)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                            {member.user_email || `Joined ${new Date(member.joined_at).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>

                      {/* Role selection & admin actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {isAdmin ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.user_id, e.target.value as OrgRole)
                            }
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '4px 8px',
                              background: roleStyle.bg,
                              color: roleStyle.text,
                              border: `1px solid ${roleStyle.border}`,
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              outline: 'none',
                            }}
                          >
                            <option value="admin">Admin</option>
                            <option value="creator">Creator</option>
                            <option value="reviewer">Reviewer</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              padding: '2px 8px',
                              background: roleStyle.bg,
                              color: roleStyle.text,
                              border: `1px solid ${roleStyle.border}`,
                            }}
                          >
                            {member.role}
                          </span>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id, member.user_name)}
                            title="Remove member"
                            className="btn-plain"
                            style={{
                              padding: 6,
                              color: 'var(--ink-faint)',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Context Card */}
            <div style={{
              padding: '16px 20px',
              background: 'var(--paper-mid)',
              border: '1px solid var(--rule)',
              fontSize: 12,
              color: 'var(--ink-mid)',
              lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Fixed Role Permissions:</span>
              <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
                <li><strong style={{ color: 'var(--ink)' }}>Admin:</strong> Manage organisation, create invites, change roles, remove members.</li>
                <li><strong style={{ color: 'var(--ink)' }}>Creator:</strong> Submit content for checking, view own submissions.</li>
                <li><strong style={{ color: 'var(--ink)' }}>Reviewer:</strong> View submissions in the organisation, approve or reject them.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Invite Generator (Admin only) or Informational Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {isAdmin ? (
              <div style={{
                background: 'var(--white)',
                border: '1px solid var(--rule)',
                padding: '24px 24px',
                boxShadow: '3px 3px 0px var(--btn-shadow)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, marginBottom: 18, borderBottom: '1px solid var(--rule)' }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    background: 'var(--accent-bg)',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--rule)',
                  }}>
                    <UserPlus style={{ width: 16, height: 16 }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                      Invite Members
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '2px 0 0' }}>Generate a reusable join link</p>
                  </div>
                </div>

                <form onSubmit={handleGenerateInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="kicker" style={{ marginBottom: 6 }}>
                      Assigned Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        border: '1px solid var(--rule-dark)',
                        background: 'var(--paper)',
                        color: 'var(--ink)',
                        outline: 'none',
                      }}
                    >
                      <option value="creator">Creator (Submit & check content)</option>
                      <option value="reviewer">Reviewer (Audit & approve submissions)</option>
                      <option value="admin">Admin (Full organisation control)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="kicker" style={{ marginBottom: 6 }}>
                        Expires In
                      </label>
                      <select
                        value={expiresInHours}
                        onChange={(e) => setExpiresInHours(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          fontSize: 12,
                          border: '1px solid var(--rule-dark)',
                          background: 'var(--paper)',
                          color: 'var(--ink)',
                          outline: 'none',
                        }}
                      >
                        <option value={24}>24 hours</option>
                        <option value={48}>48 hours</option>
                        <option value={168}>7 days</option>
                        <option value={720}>30 days</option>
                      </select>
                    </div>

                    <div>
                      <label className="kicker" style={{ marginBottom: 6 }}>
                        Max Uses
                      </label>
                      <select
                        value={maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          fontSize: 12,
                          border: '1px solid var(--rule-dark)',
                          background: 'var(--paper)',
                          color: 'var(--ink)',
                          outline: 'none',
                        }}
                      >
                        <option value={1}>1 use</option>
                        <option value={5}>5 uses</option>
                        <option value={20}>20 uses</option>
                        <option value={100}>100 uses</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={generatingInvite}
                    className="btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: generatingInvite ? 'not-allowed' : 'pointer',
                      marginTop: 4,
                      boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
                    }}
                  >
                    {generatingInvite && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                    <span>Generate Invite Link</span>
                  </button>
                </form>

                {/* Generated Link Display */}
                {generatedInviteUrl && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
                    <label className="kicker" style={{ marginBottom: 6 }}>
                      Copyable Join Link:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="text"
                        readOnly
                        value={generatedInviteUrl}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          fontSize: 11,
                          border: '1px solid var(--rule-dark)',
                          background: 'var(--paper-mid)',
                          color: 'var(--ink)',
                          fontFamily: 'var(--font-mono)',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={copyToClipboard}
                        style={{
                          padding: '8px 12px',
                          background: copied ? '#dcfce7' : 'var(--white)',
                          color: copied ? '#166534' : 'var(--ink)',
                          border: '1px solid var(--rule-dark)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Copy to clipboard"
                      >
                        {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                      </button>
                    </div>
                    {copied && (
                      <p style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check style={{ width: 12, height: 12 }} /> Copied link to clipboard!
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: 'var(--white)',
                border: '1px solid var(--rule)',
                padding: '28px 24px',
                textAlign: 'center',
                boxShadow: '3px 3px 0px var(--btn-shadow)',
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  background: 'var(--paper-mid)',
                  color: 'var(--ink-faint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  <ShieldAlert style={{ width: 20, height: 20 }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>
                  Admin-Only Controls
                </h3>
                <p style={{ fontSize: 12, color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>
                  Only administrators can create invitation links or change member roles for this organisation.
                </p>
              </div>
            )}
          </div>

          {/* Danger Zone: Delete Organisation (Admin Only) */}
          {isAdmin && (
            <div style={{ gridColumn: '1 / -1', marginTop: 12, paddingTop: 20, borderTop: '1px solid var(--rule)' }}>
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9f1239' }}>
                    <AlertTriangle style={{ width: 16, height: 16 }} />
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 800, margin: 0 }}>Danger Zone</h3>
                  </div>
                  <p style={{ fontSize: 12, color: '#be123c', margin: '4px 0 0', maxWidth: 600, lineHeight: 1.5 }}>
                    Permanently delete this organisation and all associated guidelines, rules, fact vaults, invites, and member records. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setConfirmNameInput('');
                    setDeleteError(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 18px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#e11d48',
                    color: '#ffffff',
                    border: '1px solid #9f1239',
                    cursor: 'pointer',
                    boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
                  }}
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                  <span>Delete Organisation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal (Admin Only) */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(28, 25, 23, 0.5)',
          backdropFilter: 'blur(3px)',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--white)',
            maxWidth: 480,
            width: '100%',
            padding: 28,
            border: '1px solid #fecdd3',
            boxShadow: '6px 6px 0px var(--btn-shadow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#be123c', marginBottom: 16 }}>
              <div style={{
                width: 36,
                height: 36,
                background: '#ffe4e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertTriangle style={{ width: 20, height: 20, color: '#e11d48' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                  Delete Organisation
                </h3>
                <p style={{ fontSize: 12, color: '#be123c', fontWeight: 600, margin: '2px 0 0' }}>This action is permanent and irreversible.</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.6, marginBottom: 16 }}>
              Deleting <strong style={{ color: 'var(--ink)' }}>{org?.name}</strong> will permanently remove all associated guidelines, rulebooks, fact vaults, invitation links, and membership records.
            </p>

            {deleteError && (
              <div style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#be123c',
                fontSize: 12,
              }}>
                {deleteError}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                To confirm, please type <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'var(--paper-mid)', padding: '2px 6px' }}>{org?.name}</span> below:
              </label>
              <input
                type="text"
                placeholder="Type exact organisation name to confirm"
                value={confirmNameInput}
                onChange={(e) => setConfirmNameInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '1px solid var(--rule-dark)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  outline: 'none',
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmNameInput('');
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="btn-plain"
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--ink-mid)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrg}
                disabled={confirmNameInput.trim() !== org?.name || deleting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: '#e11d48',
                  color: '#ffffff',
                  border: '1px solid #9f1239',
                  cursor: confirmNameInput.trim() !== org?.name || deleting ? 'not-allowed' : 'pointer',
                  opacity: confirmNameInput.trim() !== org?.name || deleting ? 0.4 : 1,
                  boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
                }}
              >
                {deleting && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                <span>Delete Organisation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </OrgLayout>
  );
}
