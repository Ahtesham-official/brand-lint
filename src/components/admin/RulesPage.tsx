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

type FilterCategory = 'all' | RuleCategory;

const CATEGORIES: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'All' },
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
  confirmed: 'bg-emerald-50 text-emerald-700',
  extracted: 'bg-blue-50 text-blue-700',
  draft: 'bg-slate-100 text-slate-600',
};

const categoryColor: Record<RuleCategory, string> = {
  banned_term: 'bg-red-50 text-red-700',
  claim_policy: 'bg-violet-50 text-violet-700',
  tone: 'bg-sky-50 text-sky-700',
  required_disclaimer: 'bg-amber-50 text-amber-700',
  visual_colour: 'bg-fuchsia-50 text-fuchsia-700',
  visual_contrast: 'bg-indigo-50 text-indigo-700',
  messaging: 'bg-teal-50 text-teal-700',
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
  const [showModal, setShowModal] = useState(false);

  // Add rule form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<RuleCategory>('banned_term');
  const [newSeverity, setNewSeverity] = useState<Severity>('med');
  const [newDescription, setNewDescription] = useState('');
  const [newCitation, setNewCitation] = useState('');

  const filtered =
    filter === 'all' ? rules : rules.filter((r) => r.category === filter);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddRule = () => {
    if (!newTitle.trim()) return;
    const firstGl = guidelines[0];
    onAddRule({
      guideline_id: firstGl?.id ?? '',
      category: newCategory,
      title: newTitle.trim(),
      description: newDescription.trim(),
      severity: newSeverity,
      confidence: 1.0,
      source_citation: newCitation.trim(),
      status: 'draft',
    });
    setNewTitle('');
    setNewDescription('');
    setNewCitation('');
    setShowModal(false);
  };

  const firstGuideline = guidelines[0];

  return (
    <div className="min-h-full bg-slate-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Rules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {rules.length} rule{rules.length !== 1 && 's'} extracted
          </p>
        </div>
        <div className="flex items-center gap-2">
          {firstGuideline && firstGuideline.status !== 'confirmed' && (
            <button
              onClick={() => onConfirmGuideline(firstGuideline.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Confirm All
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
              filter === cat.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rules grid */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-400">
            No rules match this filter.
          </div>
        )}
        {filtered.map((rule) => (
          <div
            key={rule.id}
            className="bg-white border border-slate-200 rounded-xl p-4 group transition-colors hover:border-slate-300"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => toggleExpand(rule.id)}
                    className="flex items-center gap-1 text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors"
                  >
                    {expanded.has(rule.id) ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    )}
                    {rule.title}
                  </button>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                      categoryColor[rule.category]
                    }`}
                  >
                    {rule.category.replace(/_/g, ' ')}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${severityDot[rule.severity]}`}
                    />
                    {rule.severity}
                  </span>
                  <span className="text-xs text-slate-400">
                    {Math.round(rule.confidence * 100)}% conf
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                      statusStyle[rule.status]
                    }`}
                  >
                    {rule.status}
                  </span>
                  {rule.confidence < 0.6 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full bg-amber-50 text-amber-600 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Needs review
                    </span>
                  )}
                </div>
              </div>

              {/* Action icons */}
              <div className="flex items-center gap-1 transition-opacity">
                <button
                  onClick={() => {
                    const newTitle = prompt('Edit title:', rule.title);
                    if (newTitle !== null) onUpdateRule(rule.id, { title: newTitle });
                  }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Edit Title"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete Rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expandable description */}
            {expanded.has(rule.id) && (
              <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                {rule.description}
              </p>
            )}

            {/* Source citation */}
            <blockquote className="mt-2.5 pl-3 border-l-2 border-slate-200 text-xs text-slate-400 italic leading-relaxed line-clamp-2">
              {rule.source_citation}
            </blockquote>
          </div>
        ))}
      </div>

      {/* Add Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">Add Rule</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as RuleCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as Severity)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    <option value="low">Low</option>
                    <option value="med">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Source Citation
                </label>
                <input
                  type="text"
                  value={newCitation}
                  onChange={(e) => setNewCitation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
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
                onClick={handleAddRule}
                disabled={!newTitle.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPage;
