import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  Calendar,
  Database,
  X,
} from 'lucide-react';
import { Fact, FactStatus } from '@/types';

interface FactsPageProps {
  facts: Fact[];
  onAddFact: (fact: Omit<Fact, 'id'>) => void;
  onUpdateFact: (id: string, updates: Partial<Fact>) => void;
  onDeleteFact: (id: string) => void;
}

const STATUS_CLASS: Record<FactStatus, { cls: string; label: string }> = {
  active:     { cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', label: 'Active' },
  expired:    { cls: 'border-rose-200 bg-rose-50 text-rose-700',          label: 'Expired' },
  deprecated: { cls: 'border-slate-200 bg-slate-100 text-slate-500',      label: 'Deprecated' },
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
    setEditCategory(fact.category || 'Hardware Specs');
    setEditNotes(fact.notes || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFact || !editClaim.trim() || !editSourceDoc.trim()) return;
    onUpdateFact(editingFact.id, {
      claim: editClaim.trim(),
      source_document: editSourceDoc.trim(),
      source_url: editSourceUrl.trim() || undefined,
      expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : editingFact.expires_at,
      status: editStatus,
      category: editCategory.trim(),
      notes: editNotes.trim() || undefined,
    });
    setEditingFact(null);
  };

  const filteredFacts = facts.filter((f) => {
    const expiredFlag = f.status === 'expired' || isExpired(f.expires_at);
    if (filter === 'active' && expiredFlag) return false;
    if (filter === 'expired' && !expiredFlag) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        f.claim.toLowerCase().includes(q) ||
        f.source_document.toLowerCase().includes(q) ||
        (f.category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-sans text-slate-900">
      {/* ── Page Header ── */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="kicker-accent mb-1.5">Verified Claims Repository</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            Fact Vault
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Approved product specs, warranties, and certifications with automatic expiry enforcement.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Verified Fact
        </button>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search verified claims…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex gap-1.5">
          {(['all', 'active', 'expired'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`btn-plain rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Facts List ── */}
      {filteredFacts.length === 0 ? (
        <div className="saas-card p-16 text-center">
          <Database className="mx-auto mb-3 h-9 w-9 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No facts found</p>
          <p className="mt-1 text-xs text-slate-400">
            Add approved product claims or adjust your search filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFacts.map((fact) => {
            const effectiveStatus: FactStatus =
              fact.status === 'deprecated'
                ? 'deprecated'
                : isExpired(fact.expires_at) || fact.status === 'expired'
                ? 'expired'
                : 'active';
            const st = STATUS_CLASS[effectiveStatus];

            return (
              <div key={fact.id} className="saas-card p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      {fact.category && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {fact.category}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                        <Calendar className="h-3 w-3" />
                        Expires {new Date(fact.expires_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900">{fact.claim}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Source: <strong className="font-medium text-slate-700">{fact.source_document}</strong></span>
                      {fact.source_url && (
                        <a
                          href={fact.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sky-600 hover:underline"
                        >
                          View doc <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {fact.notes && (
                      <p className="text-xs italic text-slate-400">{fact.notes}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(fact)}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                      title="Edit fact"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteFact(fact.id)}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete fact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Fact Modal */}
      {showAddModal && (
        <FactModal
          title="Add Verified Fact"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
          claim={claim}
          setClaim={setClaim}
          sourceDoc={sourceDoc}
          setSourceDoc={setSourceDoc}
          sourceUrl={sourceUrl}
          setSourceUrl={setSourceUrl}
          expiresAt={expiresAt}
          setExpiresAt={setExpiresAt}
          category={category}
          setCategory={setCategory}
          notes={notes}
          setNotes={setNotes}
          submitLabel="Save Fact"
        />
      )}

      {/* Edit Fact Modal */}
      {editingFact && (
        <FactModal
          title="Edit Verified Fact"
          onClose={() => setEditingFact(null)}
          onSubmit={handleEditSubmit}
          claim={editClaim}
          setClaim={setEditClaim}
          sourceDoc={editSourceDoc}
          setSourceDoc={setEditSourceDoc}
          sourceUrl={editSourceUrl}
          setSourceUrl={setEditSourceUrl}
          expiresAt={editExpiresAt}
          setExpiresAt={setEditExpiresAt}
          category={editCategory}
          setCategory={setEditCategory}
          notes={editNotes}
          setNotes={setEditNotes}
          status={editStatus}
          setStatus={setEditStatus}
          submitLabel="Update Fact"
        />
      )}
    </div>
  );
};

function FactModal({
  title,
  onClose,
  onSubmit,
  claim,
  setClaim,
  sourceDoc,
  setSourceDoc,
  sourceUrl,
  setSourceUrl,
  expiresAt,
  setExpiresAt,
  category,
  setCategory,
  notes,
  setNotes,
  status,
  setStatus,
  submitLabel,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  claim: string;
  setClaim: (v: string) => void;
  sourceDoc: string;
  setSourceDoc: (v: string) => void;
  sourceUrl: string;
  setSourceUrl: (v: string) => void;
  expiresAt: string;
  setExpiresAt: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  status?: FactStatus;
  setStatus?: (v: FactStatus) => void;
  submitLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="animate-in w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-serif text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6 text-xs">
          <div>
            <label className="kicker mb-1.5">Approved Claim *</label>
            <textarea
              rows={2}
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              required
              placeholder="e.g. Standard limited hardware warranty is 12 months."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="kicker mb-1.5">Source Document *</label>
              <input
                type="text"
                value={sourceDoc}
                onChange={(e) => setSourceDoc(e.target.value)}
                required
                placeholder="e.g. Legal Warranty Policy v2"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="kicker mb-1.5">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="kicker mb-1.5">Expiration Date *</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
            {status && setStatus ? (
              <div>
                <label className="kicker mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FactStatus)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="kicker mb-1.5">Source URL (optional)</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="kicker mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FactsPage;
