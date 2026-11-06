import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Fact, FactStatus } from '@/types';

interface FactsPageProps {
  facts: Fact[];
  onAddFact: (fact: Omit<Fact, 'id'>) => void;
  onUpdateFact: (id: string, updates: Partial<Fact>) => void;
  onDeleteFact: (id: string) => void;
}

const STATUS_STYLE: Record<FactStatus, { bg: string; color: string; border: string; label: string }> = {
  active:     { bg: '#f0fdf4', color: '#15803d', border: '#86efac', label: 'Active' },
  expired:    { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5', label: 'Expired' },
  deprecated: { bg: 'var(--paper-mid)', color: 'var(--ink-faint)', border: 'var(--rule)', label: 'Deprecated' },
};

const FactsPage: React.FC<FactsPageProps> = ({
  facts,
  onAddFact,
  onUpdateFact,
  onDeleteFact,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFact, setEditingFact] = useState<Fact | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  // Add form state
  const [claim, setClaim] = useState('');
  const [sourceDoc, setSourceDoc] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [category, setCategory] = useState('Hardware Specs');
  const [notes, setNotes] = useState('');

  // Edit form state
  const [editClaim, setEditClaim] = useState('');
  const [editSourceDoc, setEditSourceDoc] = useState('');
  const [editSourceUrl, setEditSourceUrl] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editStatus, setEditStatus] = useState<FactStatus>('active');
  const [editCategory, setEditCategory] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim() || !sourceDoc.trim() || !expiresAt) return;
    onAddFact({
      brand_id: facts[0]?.brand_id ?? 'brand-apex-01',
      claim: claim.trim(),
      source_document: sourceDoc.trim(),
      source_url: sourceUrl.trim() || undefined,
      expires_at: new Date(expiresAt).toISOString(),
      status: isExpired(expiresAt) ? 'expired' : 'active',
      category: category.trim(),
      notes: notes.trim() || undefined,
    });
    setClaim('');
    setSourceDoc('');
    setSourceUrl('');
    setExpiresAt('');
    setCategory('Hardware Specs');
    setNotes('');
    setShowAddModal(false);
  };

  const handleOpenEdit = (fact: Fact) => {
    setEditingFact(fact);
    setEditClaim(fact.claim);
    setEditSourceDoc(fact.source_document);
    setEditSourceUrl(fact.source_url || '');
    setEditExpiresAt(fact.expires_at ? fact.expires_at.slice(0, 10) : '');
    setEditStatus(fact.status);
    setEditCategory(fact.category || 'General');
    setEditNotes(fact.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFact || !editClaim.trim()) return;

    onUpdateFact(editingFact.id, {
      claim: editClaim.trim(),
      source_document: editSourceDoc.trim(),
      source_url: editSourceUrl.trim() || undefined,
      expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : editingFact.expires_at,
      status: isExpired(editExpiresAt) ? 'expired' : editStatus,
      category: editCategory.trim(),
      notes: editNotes.trim() || undefined,
    });
    setEditingFact(null);
  };

  const filteredFacts = facts.filter((fact) => {
    const expired = isExpired(fact.expires_at) || fact.status === 'expired';
    if (filter === 'active' && expired) return false;
    if (filter === 'expired' && !expired) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      fact.claim.toLowerCase().includes(q) ||
      fact.source_document.toLowerCase().includes(q) ||
      (fact.category && fact.category.toLowerCase().includes(q))
    );
  });

  const expiredCount = facts.filter((f) => isExpired(f.expires_at) || f.status === 'expired').length;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div className="kicker-accent" style={{ marginBottom: 8 }}>Knowledge Base</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 34, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', lineHeight: 1 }}>
            Approved Fact Vault
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 8, fontWeight: 300 }}>
            Verified, expiring claims checked by AI to prevent hallucinated or contradictory statements.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'var(--btn-primary)', color: 'var(--white)', border: '1px solid var(--rule-dark)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <Plus style={{ width: 14, height: 14 }} /> Add Fact Record
        </button>
      </div>

      {/* ── Filter and Search ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'active', 'expired'] as const).map((tab) => {
            const isActive = filter === tab;
            const count = tab === 'all' ? facts.length : tab === 'active' ? facts.length - expiredCount : expiredCount;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  background: isActive ? 'var(--ink)' : 'var(--white)',
                  color: isActive ? 'var(--white)' : 'var(--ink-mid)',
                  border: `1px solid ${isActive ? 'var(--ink)' : 'var(--rule)'}`,
                  textTransform: 'capitalize',
                  transition: 'all 0.1s',
                }}
              >
                <span>{tab}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.8 }}>({count})</span>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <Search style={{ width: 14, height: 14, color: 'var(--ink-faint)', position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claims, sources..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              fontSize: 13,
              border: '1px solid var(--rule)',
              background: 'var(--white)',
              color: 'var(--ink)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--rule)' }}>
        {filteredFacts.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--ink-faint)' }}>No matching facts in the vault.</p>
          </div>
        ) : (
          <table className="ed-table">
            <thead>
              <tr>
                <th>Verified Claim</th>
                <th>Source Document</th>
                <th>Category</th>
                <th>Expires At</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFacts.map((fact) => {
                const expired = isExpired(fact.expires_at) || fact.status === 'expired';
                const st = STATUS_STYLE[expired ? 'expired' : fact.status] || STATUS_STYLE.active;

                return (
                  <tr key={fact.id}>
                    <td>
                      <div style={{ maxWidth: 360 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
                          {fact.claim}
                        </div>
                        {fact.notes && (
                          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                            {fact.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--ink-mid)' }}>{fact.source_document}</div>
                      {fact.source_url && (
                        <a
                          href={fact.source_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent)', marginTop: 2, textDecoration: 'none' }}
                        >
                          Source link <ExternalLink style={{ width: 10, height: 10 }} />
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--paper-mid)', color: 'var(--ink-mid)', borderColor: 'var(--rule)' }}>
                        {fact.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: expired ? '#b91c1c' : 'var(--ink-mid)' }}>
                        <Calendar style={{ width: 12, height: 12 }} />
                        {new Date(fact.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenEdit(fact)}
                          style={{ padding: '5px 10px', background: 'transparent', border: '1px solid var(--rule)', cursor: 'pointer', color: 'var(--ink-mid)' }}
                          title="Edit fact"
                        >
                          <Pencil style={{ width: 12, height: 12 }} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete fact: "${fact.claim}"?`)) {
                              onDeleteFact(fact.id);
                            }
                          }}
                          style={{ padding: '5px 10px', background: '#fef2f2', border: '1px solid #fca5a5', cursor: 'pointer', color: '#b91c1c' }}
                          title="Delete fact"
                        >
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Fact Modal ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.55)', padding: 24 }}>
          <div className="animate-in" style={{ background: 'var(--white)', border: '1px solid var(--rule)', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="kicker-accent" style={{ marginBottom: 4 }}>Fact Vault</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: 0 }}>Add Verified Claim</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleAdd} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Verified Claim Statement *</label>
                <textarea rows={2} value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="e.g. Apex 500 contains 100% recycled aerospace aluminum." required autoFocus style={{ ...iStyle(), resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Hardware, Warranty, Green..." style={iStyle()} />
                </div>
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Expires On *</label>
                  <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required style={iStyle()} />
                </div>
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Source Document or Citation *</label>
                <input type="text" value={sourceDoc} onChange={(e) => setSourceDoc(e.target.value)} placeholder="e.g. Materials Certification Report 2024" required style={iStyle()} />
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Source URL (optional)</label>
                <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." style={iStyle()} />
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Internal Notes (optional)</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Audit cert ref, legal approval notes..." style={{ ...iStyle(), resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={ghostBtn()}>Cancel</button>
                <button type="submit" disabled={!claim.trim() || !sourceDoc.trim() || !expiresAt} style={solidBtn(!claim.trim() || !sourceDoc.trim() || !expiresAt)}>Add Fact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Fact Modal ── */}
      {editingFact && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.55)', padding: 24 }}>
          <div className="animate-in" style={{ background: 'var(--white)', border: '1px solid var(--rule)', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="kicker-accent" style={{ marginBottom: 4 }}>Fact Vault</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: 0 }}>Edit Claim Record</h3>
              </div>
              <button onClick={() => setEditingFact(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Verified Claim Statement</label>
                <textarea rows={2} value={editClaim} onChange={(e) => setEditClaim(e.target.value)} required style={{ ...iStyle(), resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Category</label>
                  <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={iStyle()} />
                </div>
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Expires On</label>
                  <input type="date" value={editExpiresAt} onChange={(e) => setEditExpiresAt(e.target.value)} required style={iStyle()} />
                </div>
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Source Document</label>
                <input type="text" value={editSourceDoc} onChange={(e) => setEditSourceDoc(e.target.value)} required style={iStyle()} />
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Source URL</label>
                <input type="url" value={editSourceUrl} onChange={(e) => setEditSourceUrl(e.target.value)} style={iStyle()} />
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Internal Notes</label>
                <textarea rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} style={{ ...iStyle(), resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
                <button type="button" onClick={() => setEditingFact(null)} style={ghostBtn()}>Cancel</button>
                <button type="submit" style={solidBtn()}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function iStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    border: '1px solid var(--rule)',
    background: 'var(--paper)',
    color: 'var(--ink)',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  };
}

function ghostBtn(): React.CSSProperties {
  return {
    padding: '9px 20px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--ink-mid)',
    border: '1px solid var(--rule)',
  };
}

function solidBtn(disabled = false): React.CSSProperties {
  return {
    padding: '9px 22px',
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: 'var(--btn-primary)',
    color: 'var(--white)',
    border: '1px solid var(--rule-dark)',
    opacity: disabled ? 0.4 : 1,
  };
}

export default FactsPage;
