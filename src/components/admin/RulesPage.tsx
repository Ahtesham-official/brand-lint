import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Quote,
} from 'lucide-react';
import {
  Rule,
  Guideline,
  RuleCategory,
  Severity,
  RuleStatus,
} from '@/types';

interface RulesPageProps {
  rules: Rule[];
  guidelines: Guideline[];
  onAddRule: (rule: Omit<Rule, 'id'>) => void;
  onUpdateRule: (id: string, updates: Partial<Rule>) => void;
  onDeleteRule: (id: string) => void;
  onConfirmGuideline: (id: string) => void;
}

type FilterCategory = 'all' | RuleCategory | 'needs_confirmation';

const CATEGORIES: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'All Rules' },
  { value: 'needs_confirmation', label: '⚠️ Needs Confirmation (<60%)' },
  { value: 'banned_term', label: 'Banned Term' },
  { value: 'claim_policy', label: 'Claim Policy' },
  { value: 'tone', label: 'Tone' },
  { value: 'required_disclaimer', label: 'Disclaimer' },
  { value: 'visual_colour', label: 'Visual Colour' },
  { value: 'visual_contrast', label: 'Visual Contrast' },
  { value: 'messaging', label: 'Messaging' },
];

const severityDot: Record<Severity, string> = {
  high: 'bg-red-500',
  med: 'bg-amber-400',
  low: 'bg-slate-400',
};

const statusStyle: Record<RuleStatus, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  extracted: 'bg-blue-50 text-blue-700 border border-blue-200',
  draft: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const categoryColor: Record<RuleCategory, string> = {
  banned_term: 'bg-red-50 text-red-700 border-red-200',
  claim_policy: 'bg-violet-50 text-violet-700 border-violet-200',
  tone: 'bg-sky-50 text-sky-700 border-sky-200',
  required_disclaimer: 'bg-amber-50 text-amber-700 border-amber-200',
  visual_colour: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  visual_contrast: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  messaging: 'bg-teal-50 text-teal-700 border-teal-200',
};

const RulesPage: React.FC<RulesPageProps> = ({
  rules,
  guidelines,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onConfirmGuideline,
}) => {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  // Add rule state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<RuleCategory>('banned_term');
  const [newSeverity, setNewSeverity] = useState<Severity>('med');
  const [newConfidence, setNewConfidence] = useState(0.9);
  const [newDescription, setNewDescription] = useState('');
  const [newCitation, setNewCitation] = useState('');
  const [newBannedWords, setNewBannedWords] = useState('');
  const [newRequiredPhrase, setNewRequiredPhrase] = useState('');

  // Edit rule state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<RuleCategory>('banned_term');
  const [editSeverity, setEditSeverity] = useState<Severity>('med');
  const [editConfidence, setEditConfidence] = useState(0.9);
  const [editDescription, setEditDescription] = useState('');
  const [editCitation, setEditCitation] = useState('');
  const [editStatus, setEditStatus] = useState<RuleStatus>('confirmed');
  const [editBannedWords, setEditBannedWords] = useState('');
  const [editRequiredPhrase, setEditRequiredPhrase] = useState('');

  const filtered = rules.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'needs_confirmation') return r.confidence < 0.6;
    return r.category === filter;
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOpenEdit = (rule: Rule) => {
    setEditingRule(rule);
    setEditTitle(rule.title);
    setEditCategory(rule.category);
    setEditSeverity(rule.severity);
    setEditConfidence(rule.confidence);
    setEditDescription(rule.description);
    setEditCitation(rule.source_citation);
    setEditStatus(rule.status);
    setEditBannedWords(rule.banned_words ? rule.banned_words.join(', ') : '');
    setEditRequiredPhrase(rule.required_phrase || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editTitle.trim()) return;

    onUpdateRule(editingRule.id, {
      title: editTitle.trim(),
      category: editCategory,
      severity: editSeverity,
      confidence: editConfidence,
      description: editDescription.trim(),
      source_citation: editCitation.trim(),
      status: editStatus,
      banned_words: editBannedWords.trim()
        ? editBannedWords.split(',').map((w) => w.trim()).filter(Boolean)
        : undefined,
      required_phrase: editRequiredPhrase.trim() || undefined,
    });

    setEditingRule(null);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const firstGl = guidelines[0];
    onAddRule({
      guideline_id: firstGl?.id ?? 'gl-01',
      category: newCategory,
      title: newTitle.trim(),
      description: newDescription.trim() || newTitle.trim(),
      severity: newSeverity,
      confidence: newConfidence,
      source_citation: newCitation.trim() || 'Custom brand rulebook policy',
      status: 'confirmed',
      banned_words: newBannedWords.trim()
        ? newBannedWords.split(',').map((w) => w.trim()).filter(Boolean)
        : undefined,
      required_phrase: newRequiredPhrase.trim() || undefined,
    });
    setNewTitle('');
    setNewDescription('');
    setNewCitation('');
    setNewBannedWords('');
    setNewRequiredPhrase('');
    setShowAddModal(false);
  };

  const firstGuideline = guidelines[0];
  const lowConfidenceCount = rules.filter((r) => r.confidence < 0.6).length;

  return (
    <div className="min-h-full bg-slate-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Extracted Rules & Policies</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {rules.length} structured rules cited from guideline documents (PRD FR-3.4, FR-4.1).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {firstGuideline && firstGuideline.status !== 'confirmed' && (
            <button
              onClick={() => onConfirmGuideline(firstGuideline.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-emerald-300 text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Confirm All Guidelines (FR-4.4)
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule Manually (FR-4.3)
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              filter === cat.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.label}
            {cat.value === 'needs_confirmation' && lowConfidenceCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                {lowConfidenceCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
            No rules match this category filter.
          </div>
        )}
        {filtered.map((rule) => {
          const isLowConf = rule.confidence < 0.6;
          const isExp = expanded.has(rule.id);

          return (
            <div
              key={rule.id}
              className={`bg-white border rounded-xl p-4 transition-all shadow-sm ${
                isLowConf
                  ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleExpand(rule.id)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                    >
                      {isExp ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span>{rule.title}</span>
                    </button>
                  </div>

                  {/* Meta badges */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] rounded-full font-medium border ${
                        categoryColor[rule.category]
                      }`}
                    >
                      {rule.category.replace(/_/g, ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${severityDot[rule.severity]}`}
                      />
                      {rule.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                      {Math.round(rule.confidence * 100)}% confidence
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] rounded-full font-medium uppercase tracking-wider ${
                        statusStyle[rule.status]
                      }`}
                    >
                      {rule.status}
                    </span>
                    {isLowConf && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-300 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Needs Confirmation (FR-3.7)
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons (FR-4.1, FR-4.2) */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit any field (FR-4.1)"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete rule: "${rule.title}"?`)) {
                        onDeleteRule(rule.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete rule (FR-4.2)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsed / Expanded details */}
              <div className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                <p>{rule.description}</p>

                {isExp && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    {/* Source citation */}
                    <div className="bg-slate-50 rounded-lg p-3 border-l-2 border-blue-500">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1 flex items-center gap-1">
                        <Quote className="w-3 h-3 text-blue-500" />
                        Exact Guideline Source Citation
                      </span>
                      <p className="italic text-slate-700 text-xs leading-relaxed font-serif">
                        "{rule.source_citation}"
                      </p>
                    </div>

                    {/* Specific category details */}
                    {rule.banned_words && rule.banned_words.length > 0 && (
                      <div className="bg-red-50/60 rounded-lg p-2.5 border border-red-100">
                        <span className="text-[10px] font-bold text-red-700 block mb-1 uppercase tracking-wider">
                          Monitored Banned Terms
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {rule.banned_words.map((word, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded font-mono"
                            >
                              "{word}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {rule.required_phrase && (
                      <div className="bg-amber-50/60 rounded-lg p-2.5 border border-amber-100">
                        <span className="text-[10px] font-bold text-amber-800 block mb-1 uppercase tracking-wider">
                          Mandatory Required Phrase
                        </span>
                        <span className="text-xs font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                          "{rule.required_phrase}"
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Rule Modal (FR-4.1) */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Edit Rule (FR-4.1)</h3>
                <p className="text-xs text-slate-500">Admin can modify any rule attribute or citation</p>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Rule Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as RuleCategory)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="banned_term">Banned Term</option>
                    <option value="claim_policy">Claim Policy</option>
                    <option value="tone">Tone</option>
                    <option value="required_disclaimer">Required Disclaimer</option>
                    <option value="visual_colour">Visual Colour</option>
                    <option value="visual_contrast">Visual Contrast</option>
                    <option value="messaging">Messaging</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Severity</label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value as Severity)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Confidence (0.0 - 1.0)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={editConfidence}
                    onChange={(e) => setEditConfidence(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Exact Guideline Source Citation</label>
                <textarea
                  value={editCitation}
                  onChange={(e) => setEditCitation(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              {editCategory === 'banned_term' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Banned Words (comma-separated)</label>
                  <input
                    type="text"
                    value={editBannedWords}
                    onChange={(e) => setEditBannedWords(e.target.value)}
                    placeholder="e.g. India's #1, unbeatable, cheapest"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {editCategory === 'required_disclaimer' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Required Disclaimer Phrase</label>
                  <input
                    type="text"
                    value={editRequiredPhrase}
                    onChange={(e) => setEditRequiredPhrase(e.target.value)}
                    placeholder="e.g. Terms & conditions apply. See website for details."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Rule Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Rule Manually Modal (FR-4.3) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Add Rule Manually (FR-4.3)</h3>
                <p className="text-xs text-slate-500">Insert an explicit compliance constraint into the active rulebook</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Rule Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mandatory Environmental Certifications"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as RuleCategory)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="banned_term">Banned Term</option>
                    <option value="claim_policy">Claim Policy</option>
                    <option value="tone">Tone</option>
                    <option value="required_disclaimer">Required Disclaimer</option>
                    <option value="visual_colour">Visual Colour</option>
                    <option value="visual_contrast">Visual Contrast</option>
                    <option value="messaging">Messaging</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as Severity)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Confidence</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(parseFloat(e.target.value) || 0.9)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Rule Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explain why this rule exists and how content creators should comply..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Guideline Source Citation</label>
                <textarea
                  value={newCitation}
                  onChange={(e) => setNewCitation(e.target.value)}
                  placeholder="Direct quotation from brand guideline document..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              {newCategory === 'banned_term' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Banned Words (comma-separated)</label>
                  <input
                    type="text"
                    value={newBannedWords}
                    onChange={(e) => setNewBannedWords(e.target.value)}
                    placeholder="e.g. cheapest, 100% free, guaranteed"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {newCategory === 'required_disclaimer' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mandatory Disclaimer Phrase</label>
                  <input
                    type="text"
                    value={newRequiredPhrase}
                    onChange={(e) => setNewRequiredPhrase(e.target.value)}
                    placeholder="e.g. Terms & conditions apply. See website for details."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

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
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPage;
