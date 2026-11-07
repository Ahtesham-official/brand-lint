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
  { value: 'needs_confirmation', label: '⚠️ Needs Confirmation (<60%)' },
  { value: 'banned_term', label: 'Banned Term' },
  { value: 'claim_policy', label: 'Claim Policy' },
  { value: 'tone', label: 'Tone' },
  { value: 'required_disclaimer', label: 'Disclaimer' },
  { value: 'visual_colour', label: 'Visual Colour' },
  { value: 'visual_contrast', label: 'Visual Contrast' },
  { value: 'messaging', label: 'Messaging' },
];

const SEVERITY_BADGE: Record<Severity, { bg: string; color: string; border: string }> = {
  high: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  med: { bg: '#e0f2fe', color: '#075985', border: '#7dd3fc' },
  low: { bg: 'var(--paper-mid)', color: 'var(--ink-mid)', border: 'var(--rule)' },
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

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = rules.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'needs_confirmation') return r.confidence < 0.6;
    return r.category === filter;
  });

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
      description: editDescription.trim() || editTitle.trim(),
      source_citation: editCitation.trim() || 'Custom brand rulebook policy',
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
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div className="kicker-accent" style={{ marginBottom: 8 }}>Knowledge Base</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 34, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', lineHeight: 1 }}>
            Rules &amp; Policies
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 8, fontWeight: 300 }}>
            {rules.length} structured rules cited from ingested guidelines and enforced by Groq GenAI.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {firstGuideline && firstGuideline.status !== 'confirmed' && (
            <button
              onClick={() => onConfirmGuideline(firstGuideline.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              <CheckCircle2 style={{ width: 14, height: 14 }} /> Confirm All Guidelines
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'var(--btn-primary)', color: 'var(--white)', border: '1px solid var(--rule-dark)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            <Plus style={{ width: 14, height: 14 }} /> Add Rule Manually
          </button>
        </div>
      </div>

      {/* ── Category Filter Chips ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {CATEGORIES.map((cat) => {
          const isActive = filter === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                background: isActive ? 'var(--ink)' : 'var(--white)',
                color: isActive ? 'var(--white)' : 'var(--ink-mid)',
                border: `1px solid ${isActive ? 'var(--ink)' : 'var(--rule)'}`,
                transition: 'all 0.1s',
              }}
            >
              <span>{cat.label}</span>
              {cat.value === 'needs_confirmation' && lowConfidenceCount > 0 && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 6px', background: '#e0f2fe', color: '#075985', border: '1px solid #7dd3fc' }}>
                  {lowConfidenceCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Rules List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--rule)' }}>
            <p style={{ fontSize: 14, color: 'var(--ink-faint)' }}>No rules match this category filter.</p>
          </div>
        )}

        {filtered.map((rule) => {
          const isLowConf = rule.confidence < 0.6;
          const isExp = expanded.has(rule.id);
          const sevStyle = SEVERITY_BADGE[rule.severity] || SEVERITY_BADGE.med;

          return (
            <div
              key={rule.id}
              style={{
                background: isLowConf ? '#fffbeb' : 'var(--white)',
                border: `1px solid ${isLowConf ? '#7dd3fc' : 'var(--rule)'}`,
                padding: '20px 24px',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => toggleExpand(rule.id)}
                    className="btn-plain"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'none',
                      border: 'none',
                      boxShadow: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left',
                      color: 'var(--ink)',
                      transform: 'none',
                    }}
                  >
                    {isExp ? (
                      <ChevronUp style={{ width: 16, height: 16, color: 'var(--ink-faint)', flexShrink: 0 }} />
                    ) : (
                      <ChevronDown style={{ width: 16, height: 16, color: 'var(--ink-faint)', flexShrink: 0 }} />
                    )}
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
                      {rule.title}
                    </span>
                  </button>

                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'var(--paper-mid)', color: 'var(--ink-mid)', borderColor: 'var(--rule)' }}>
                      {rule.category.replace(/_/g, ' ')}
                    </span>
                    <span className="badge" style={{ background: sevStyle.bg, color: sevStyle.color, borderColor: sevStyle.border }}>
                      {rule.severity}
                    </span>
                    <span className="badge" style={{ background: 'transparent', color: 'var(--ink-faint)', borderColor: 'var(--rule)', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(rule.confidence * 100)}% confidence
                    </span>
                    <span className="badge" style={{ background: rule.status === 'confirmed' ? '#f0fdf4' : 'transparent', color: rule.status === 'confirmed' ? '#15803d' : 'var(--ink-faint)', borderColor: rule.status === 'confirmed' ? '#86efac' : 'var(--rule)' }}>
                      {rule.status}
                    </span>
                    {isLowConf && (
                      <span className="badge" style={{ background: '#e0f2fe', color: '#075985', borderColor: '#7dd3fc' }}>
                        Needs confirmation
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--rule)', cursor: 'pointer', color: 'var(--ink-mid)' }}
                    title="Edit Rule"
                  >
                    <Pencil style={{ width: 13, height: 13 }} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete rule: "${rule.title}"?`)) {
                        onDeleteRule(rule.id);
                      }
                    }}
                    style={{ padding: '6px 10px', background: '#fef2f2', border: '1px solid #fca5a5', cursor: 'pointer', color: '#b91c1c' }}
                    title="Delete Rule"
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>

              {/* Description & Citation */}
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>{rule.description}</p>

                {isExp && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Source citation */}
                    <div style={{ background: 'var(--paper)', padding: '14px 18px', borderLeft: '3px solid var(--accent)' }}>
                      <span className="kicker" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Quote style={{ width: 11, height: 11, color: 'var(--accent)' }} /> Guideline Citation
                      </span>
                      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>
                        "{rule.source_citation}"
                      </p>
                    </div>

                    {/* Banned words */}
                    {rule.banned_words && rule.banned_words.length > 0 && (
                      <div style={{ background: '#fef2f2', padding: '12px 16px', border: '1px solid #fca5a5' }}>
                        <span className="kicker" style={{ color: '#b91c1c', marginBottom: 6 }}>Monitored Banned Terms</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {rule.banned_words.map((word, idx) => (
                            <span key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', background: '#ffffff', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                              "{word}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Required phrase */}
                    {rule.required_phrase && (
                      <div style={{ background: '#e0f2fe', padding: '12px 16px', border: '1px solid #7dd3fc' }}>
                        <span className="kicker" style={{ color: '#075985', marginBottom: 6 }}>Mandatory Disclaimer</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#075985' }}>
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

      {/* ── Edit Rule Modal ── */}
      {editingRule && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.55)', padding: 24 }}>
          <div className="animate-in" style={{ background: 'var(--white)', border: '1px solid var(--rule)', width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="kicker-accent" style={{ marginBottom: 4 }}>Rule Configuration</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: 0 }}>Edit Rule</h3>
              </div>
              <button onClick={() => setEditingRule(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '75vh', overflowY: 'auto' }}>
              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Rule Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={iStyle()} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Category</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as RuleCategory)} style={iStyle()}>
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
                  <label className="kicker" style={{ marginBottom: 6 }}>Severity</label>
                  <select value={editSeverity} onChange={(e) => setEditSeverity(e.target.value as Severity)} style={iStyle()}>
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Confidence (0.0 - 1.0)</label>
                  <input type="number" step="0.05" min="0" max="1" value={editConfidence} onChange={(e) => setEditConfidence(parseFloat(e.target.value) || 0.5)} style={iStyle()} />
                </div>
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Description</label>
                <textarea rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required style={{ ...iStyle(), resize: 'vertical' }} />
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Guideline Source Citation</label>
                <textarea rows={2} value={editCitation} onChange={(e) => setEditCitation(e.target.value)} required style={{ ...iStyle(), resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 11 }} />
              </div>

              {editCategory === 'banned_term' && (
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Banned Words (comma-separated)</label>
                  <input type="text" value={editBannedWords} onChange={(e) => setEditBannedWords(e.target.value)} placeholder="e.g. India's #1, unbeatable, cheapest" style={iStyle()} />
                </div>
              )}

              {editCategory === 'required_disclaimer' && (
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Required Disclaimer Phrase</label>
                  <input type="text" value={editRequiredPhrase} onChange={(e) => setEditRequiredPhrase(e.target.value)} placeholder="e.g. Terms & conditions apply." style={iStyle()} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
                <button type="button" onClick={() => setEditingRule(null)} style={ghostBtn()}>Cancel</button>
                <button type="submit" style={solidBtn()}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Rule Modal ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.55)', padding: 24 }}>
          <div className="animate-in" style={{ background: 'var(--white)', border: '1px solid var(--rule)', width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="kicker-accent" style={{ marginBottom: 4 }}>Manual Entry</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: 0 }}>Add New Rule</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleAddRule} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '75vh', overflowY: 'auto' }}>
              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Rule Title *</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Prohibition on Unsubstantiated #1 Claims" required autoFocus style={iStyle()} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as RuleCategory)} style={iStyle()}>
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
                  <label className="kicker" style={{ marginBottom: 6 }}>Severity</label>
                  <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value as Severity)} style={iStyle()}>
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Confidence</label>
                  <input type="number" step="0.05" min="0" max="1" value={newConfidence} onChange={(e) => setNewConfidence(parseFloat(e.target.value) || 0.9)} style={iStyle()} />
                </div>
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Description *</label>
                <textarea rows={2} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Operational explanation of what is prohibited..." required style={{ ...iStyle(), resize: 'vertical' }} />
              </div>

              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>Guideline Source Citation</label>
                <textarea rows={2} value={newCitation} onChange={(e) => setNewCitation(e.target.value)} placeholder="Section 3.2: Brand Superlatives & Authority..." style={{ ...iStyle(), resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 11 }} />
              </div>

              {newCategory === 'banned_term' && (
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Banned Words (comma-separated)</label>
                  <input type="text" value={newBannedWords} onChange={(e) => setNewBannedWords(e.target.value)} placeholder="e.g. #1, best, cheapest, guaranteed" style={iStyle()} />
                </div>
              )}

              {newCategory === 'required_disclaimer' && (
                <div>
                  <label className="kicker" style={{ marginBottom: 6 }}>Required Disclaimer Phrase</label>
                  <input type="text" value={newRequiredPhrase} onChange={(e) => setNewRequiredPhrase(e.target.value)} placeholder="e.g. Terms & conditions apply." style={iStyle()} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={ghostBtn()}>Cancel</button>
                <button type="submit" disabled={!newTitle.trim()} style={solidBtn(!newTitle.trim())}>Create Rule</button>
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

export default RulesPage;
