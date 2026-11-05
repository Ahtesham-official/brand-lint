import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Fact, FactStatus } from '@/types';

interface FactsPageProps {
  facts: Fact[];
  onAddFact: (fact: Omit<Fact, 'id'>) => void;
  onUpdateFact: (id: string, updates: Partial<Fact>) => void;
  onDeleteFact: (id: string) => void;
}

const statusBadge: Record<FactStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  expired: 'bg-red-50 text-red-700',
  deprecated: 'bg-slate-100 text-slate-600',
};

const FactsPage: React.FC<FactsPageProps> = ({
  facts,
  onAddFact,
  onUpdateFact,
  onDeleteFact,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [claim, setClaim] = useState('');
  const [sourceDoc, setSourceDoc] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [status, setStatus] = useState<FactStatus>('active');

  const handleAdd = () => {
    if (!claim.trim() || !sourceDoc.trim() || !expiresAt) return;
    onAddFact({
      brand_id: facts[0]?.brand_id ?? '',
      claim: claim.trim(),
      source_document: sourceDoc.trim(),
      expires_at: new Date(expiresAt).toISOString(),
      status,
    });
    setClaim('');
    setSourceDoc('');
    setExpiresAt('');
    setStatus('active');
    setShowModal(false);
  };

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="min-h-full bg-slate-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Fact Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified claims and data points referenced during compliance checks.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Fact
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {facts.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-slate-400">
            No facts in the vault yet.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-2.5 font-medium">Claim</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Expires</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {facts.map((fact) => {
                const expired = isExpired(fact.expires_at);
                const displayStatus = expired ? 'expired' : fact.status;
                return (
                  <tr
                    key={fact.id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-slate-800 max-w-xs">
                      {fact.claim}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                      {fact.source_document}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(fact.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge[displayStatus]}`}
                      >
                        {displayStatus === 'active' ? 'Active' : displayStatus === 'expired' ? 'Expired' : 'Deprecated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDeleteFact(fact.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Fact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">Add Fact</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Claim</label>
                <input
                  type="text"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="e.g. 12-month warranty on all hardware"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Source Document
                </label>
                <input
                  type="text"
                  value={sourceDoc}
                  onChange={(e) => setSourceDoc(e.target.value)}
                  placeholder="e.g. Product Warranty Policy 2024"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Expires At
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as FactStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!claim.trim() || !sourceDoc.trim() || !expiresAt}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Add Fact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactsPage;
