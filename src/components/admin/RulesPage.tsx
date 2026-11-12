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
  { value: 'needs_confirmation', label: 'Needs Confirmation (<60%)' },
  { value: 'banned_term', label: 'Banned Term' },
  { value: 'claim_policy', label: 'Claim Policy' },
  { value: 'tone', label: 'Tone' },
  { value: 'required_disclaimer', label: 'Disclaimer' },
  { value: 'visual_colour', label: 'Visual Colour' },
  { value: 'visual_contrast', label: 'Visual Contrast' },
  { value: 'messaging', label: 'Messaging' },
];

const SEVERITY_BADGE: Record<Severity, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-700',
  med:  'border-amber-200 bg-amber-50 text-amber-700',
  low:  'border-sky-200 bg-sky-50 text-sky-700',
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

  const filteredRules = rules.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'needs_confirmation') return r.confidence < 0.6 || r.status === 'extracted';
    return r.category === filter;
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    onAddRule({
      guideline_id: guidelines[0]?.id || 'gl-manual',
      category: newCategory,
      title: newTitle.trim(),
      description: newDescription.trim(),
      severity: newSeverity,
      confidence: newConfidence,
      source_citation: newCitation.trim() || 'Manual Admin Policy',
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

  const openEdit = (rule: Rule) => {
    setEditingRule(rule);
    setEditTitle(rule.title);
    setEditCategory(rule.category);
    setEditSeverity(rule.severity);
    setEditConfidence(rule.confidence);
    setEditDescription(rule.description);
    setEditCitation(rule.source_citation);
    setEditStatus(rule.status);
    setEditBannedWords(rule.banned_words?.join(', ') || '');
    setEditRequiredPhrase(rule.required_phrase || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
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

  const unconfirmedCount = rules.filter((r) => r.status !== 'confirmed').length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-sans text-slate-900">
      {/* ── Page Header ── */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="kicker-accent mb-1.5">Active Policy Rulebook</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            Compliance Rules
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inspect, edit, and approve rules extracted from your brand guidelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {unconfirmedCount > 0 && guidelines[0] && (
            <button
              type="button"
              onClick={() => onConfirmGuideline(guidelines[0].id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve All ({unconfirmedCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Rule
          </button>
        </div>
      </div>

      {/* ── Category Filters ── */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const isAct = filter === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setFilter(cat.value)}
              className={`btn-plain rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                isAct
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Rules List ── */}
      {filteredRules.length === 0 ? (
        <div className="saas-card p-14 text-center text-sm text-slate-500">
          No rules match the selected filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRules.map((rule) => {
            const isExpanded = expanded.has(rule.id);
            const isLowConf = rule.confidence < 0.6;
            const confPct = Math.round(rule.confidence * 100);

            return (
              <div key={rule.id} className="saas-card overflow-hidden">
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => toggleExpand(rule.id)}
                    className="btn-plain min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${SEVERITY_BADGE[rule.severity]}`}>
                        {rule.severity}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {rule.category.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`badge ${
                          rule.status === 'confirmed'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        {rule.status}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Conf {confPct}%
                      </span>
                      {isLowConf && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                          <AlertTriangle className="h-3 w-3" /> Needs review
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">{rule.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{rule.description}</p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {rule.status !== 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => onUpdateRule(rule.id, { status: 'confirmed' })}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(rule)}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                      title="Edit rule"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRule(rule.id)}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(rule.id)}
                      className="btn-plain p-1 text-slate-400 hover:text-slate-700"
                      aria-label="Toggle rule details"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs">
                    <p className="leading-relaxed text-slate-700">{rule.description}</p>
                    {rule.source_citation && (
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <Quote className="h-3 w-3 text-sky-600" /> Source Citation
                        </span>
                        <p className="font-mono text-[11px] italic text-slate-700">
                          &ldquo;{rule.source_citation}&rdquo;
                        </p>
                      </div>
                    )}
                    {rule.banned_words && rule.banned_words.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Banned Terms:
                        </span>
                        {rule.banned_words.map((w) => (
                          <span key={w} className="rounded bg-rose-50 px-2 py-0.5 font-mono text-[11px] text-rose-700">
                            {w}
                          </span>
                        ))}
                      </div>
                    )}
                    {rule.required_phrase && (
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Required Phrase:{' '}
                        </span>
                        <span className="font-mono text-xs text-emerald-700">{rule.required_phrase}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <RuleModal
          title="Add Compliance Rule"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddSubmit}
          ruleTitle={newTitle}
          setRuleTitle={setNewTitle}
          category={newCategory}
          setCategory={setNewCategory}
          severity={newSeverity}
          setSeverity={setNewSeverity}
          confidence={newConfidence}
          setConfidence={setNewConfidence}
          description={newDescription}
          setDescription={setNewDescription}
          citation={newCitation}
          setCitation={setNewCitation}
          bannedWords={newBannedWords}
          setBannedWords={setNewBannedWords}
          requiredPhrase={newRequiredPhrase}
          setRequiredPhrase={setNewRequiredPhrase}
          submitLabel="Create Rule"
        />
      )}

      {/* Edit Modal */}
      {editingRule && (
        <RuleModal
          title="Edit Compliance Rule"
          onClose={() => setEditingRule(null)}
          onSubmit={handleEditSubmit}
          ruleTitle={editTitle}
          setRuleTitle={setEditTitle}
          category={editCategory}
          setCategory={setEditCategory}
          severity={editSeverity}
          setSeverity={setEditSeverity}
          confidence={editConfidence}
          setConfidence={setEditConfidence}
          description={editDescription}
          setDescription={setEditDescription}
          citation={editCitation}
          setCitation={setEditCitation}
          bannedWords={editBannedWords}
          setBannedWords={setEditBannedWords}
          requiredPhrase={editRequiredPhrase}
          setRequiredPhrase={setEditRequiredPhrase}
          status={editStatus}
          setStatus={setEditStatus}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
};

function RuleModal({
  title,
  onClose,
  onSubmit,
  ruleTitle,
  setRuleTitle,
  category,
  setCategory,
  severity,
  setSeverity,
  confidence,
  setConfidence,
  description,
  setDescription,
  citation,
  setCitation,
  bannedWords,
  setBannedWords,
  requiredPhrase,
  setRequiredPhrase,
  status,
  setStatus,
  submitLabel,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  ruleTitle: string;
  setRuleTitle: (v: string) => void;
  category: RuleCategory;
  setCategory: (v: RuleCategory) => void;
  severity: Severity;
  setSeverity: (v: Severity) => void;
  confidence: number;
  setConfidence: (v: number) => void;
  description: string;
  setDescription: (v: string) => void;
  citation: string;
  setCitation: (v: string) => void;
  bannedWords: string;
  setBannedWords: (v: string) => void;
  requiredPhrase: string;
  setRequiredPhrase: (v: string) => void;
  status?: RuleStatus;
  setStatus?: (v: RuleStatus) => void;
  submitLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="animate-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
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
            <label className="kicker mb-1.5">Rule Title *</label>
            <input
              type="text"
              value={ruleTitle}
              onChange={(e) => setRuleTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="kicker mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RuleCategory)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="banned_term">Banned Term</option>
                <option value="claim_policy">Claim Policy</option>
                <option value="tone">Tone</option>
                <option value="required_disclaimer">Disclaimer</option>
                <option value="visual_colour">Visual Colour</option>
                <option value="visual_contrast">Visual Contrast</option>
                <option value="messaging">Messaging</option>
              </select>
            </div>
            <div>
              <label className="kicker mb-1.5">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {status && setStatus && (
            <div>
              <label className="kicker mb-1.5">Approval Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RuleStatus)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
              >
                <option value="confirmed">Confirmed</option>
                <option value="extracted">Extracted (Needs Review)</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          )}

          <div>
            <label className="kicker mb-1.5">Description *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="kicker mb-1.5">Source Citation</label>
            <input
              type="text"
              value={citation}
              onChange={(e) => setCitation(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="kicker mb-1.5">Banned Words (comma-sep)</label>
              <input
                type="text"
                value={bannedWords}
                onChange={(e) => setBannedWords(e.target.value)}
                placeholder="#1, unbeatable, guaranteed"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="kicker mb-1.5">Confidence ({Math.round(confidence * 100)}%)</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="mt-2 w-full accent-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="kicker mb-1.5">Required Phrase (optional)</label>
            <input
              type="text"
              value={requiredPhrase}
              onChange={(e) => setRequiredPhrase(e.target.value)}
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

export default RulesPage;
