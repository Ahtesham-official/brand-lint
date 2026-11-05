import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  ExternalLink,
  AlertTriangle,
  Database,
  Calendar,
} from 'lucide-react';
import { Fact, FactStatus } from '@/types';

interface FactsPageProps {
  facts: Fact[];
  onAddFact: (fact: Omit<Fact, 'id'>) => void;
  onUpdateFact: (id: string, updates: Partial<Fact>) => void;
  onDeleteFact: (id: string) => void;
}

const statusBadge: Record<FactStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-red-50 text-red-700 border-red-300 font-semibold',
  deprecated: 'bg-slate-100 text-slate-600 border-slate-200',
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
    <div className="min-h-full bg-slate-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Approved Fact Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified, expiring claims referenced by AI check engine to prevent hallucinated/contradictory promises (PRD FR-5.1 - FR-5.4).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Fact (FR-5.1)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({facts.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              filter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              filter === 'expired'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Expired {expiredCount > 0 && `(${expiredCount})`}
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claims, sources..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {filteredFacts.length === 0 ? (
          <div className="px-5 py-12 text-center text-xs text-slate-400">
            No matching facts in the vault.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/70">
                <th className="px-4 py-3 font-semibold">Verified Claim</th>
                <th className="px-4 py-3 font-semibold">Source Document</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Expires At (FR-5.2)</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFacts.map((fact) => {
                const expired = isExpired(fact.expires_at) || fact.status === 'expired';
                const displayStatus: FactStatus = expired ? 'expired' : fact.status;

                return (
                  <tr
                    key={fact.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      expired ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-slate-900 font-medium max-w-sm">
                      <div className="flex items-start gap-2">
                        <Database className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span>{fact.claim}</span>
                          {fact.notes && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{fact.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{fact.source_document}</span>
                        {fact.source_url && (
                          <a
                            href={fact.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-blue-600"
                            title="Open source"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {fact.category || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 font-mono ${
                          expired ? 'text-red-700 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {new Date(fact.expires_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] rounded-full border uppercase tracking-wider ${statusBadge[displayStatus]}`}
                      >
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleOpenEdit(fact)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit fact"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete fact: "${fact.claim}"?`)) {
                              onDeleteFact(fact.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete fact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add Fact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Add Fact Vault Record</h3>
                <p className="text-xs text-slate-500">Document a verified claim with explicit source and expiry</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Verified Claim Statement</label>
                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="e.g. 12-month standard manufacturer warranty on all audio hardware"
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Source Document</label>
                  <input
                    type="text"
                    value={sourceDoc}
                    onChange={(e) => setSourceDoc(e.target.value)}
                    placeholder="e.g. Product Warranty Policy 2024"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Warranty & Support"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Expiry Date (FR-5.2)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Source URL (Optional)</label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Standard across all regional channels"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fact Modal */}
      {editingFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Edit Fact Vault Record</h3>
                <p className="text-xs text-slate-500">Update verified claim statement or extend expiry</p>
              </div>
              <button
                onClick={() => setEditingFact(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Claim Statement</label>
                <textarea
                  value={editClaim}
                  onChange={(e) => setEditClaim(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Source Document</label>
                  <input
                    type="text"
                    value={editSourceDoc}
                    onChange={(e) => setEditSourceDoc(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as FactStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Source URL</label>
                <input
                  type="url"
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFact(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactsPage;
