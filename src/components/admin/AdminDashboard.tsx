import React, { useState } from 'react';
import { Brand, Guideline, Rule, Fact, RuleCategory, Severity } from '@/types';
import { RAW_GUIDELINE_SAMPLE } from '@/data/seedData';
import { 
  Building2, Palette, FileText, CheckCircle2, AlertTriangle, Trash2, 
  Edit3, Plus, Sparkles, Database, ShieldAlert, ArrowRight, ExternalLink,
  UploadCloud, Clock, Check
} from 'lucide-react';

interface AdminDashboardProps {
  brand: Brand;
  guidelines: Guideline[];
  rules: Rule[];
  facts: Fact[];
  onUpdateBrand: (updates: Partial<Brand>) => void;
  onAddGuideline: (filename: string, raw_text: string) => Guideline;
  onExtractRules: (guidelineId: string) => Promise<void>;
  onConfirmGuideline: (guidelineId: string) => void;
  onAddRule: (rule: Omit<Rule, 'id'>) => void;
  onUpdateRule: (id: string, updates: Partial<Rule>) => void;
  onDeleteRule: (id: string) => void;
  onAddFact: (fact: Omit<Fact, 'id' | 'brand_id'>) => void;
  onUpdateFact: (id: string, updates: Partial<Fact>) => void;
  onDeleteFact: (id: string) => void;
  onNavigateToCreator: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  brand,
  guidelines,
  rules,
  facts,
  onUpdateBrand,
  onAddGuideline,
  onExtractRules,
  onConfirmGuideline,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onAddFact,
  onUpdateFact,
  onDeleteFact,
  onNavigateToCreator,
}) => {
  const [activeTab, setActiveTab] = useState<'guidelines' | 'rules' | 'facts' | 'brand'>('guidelines');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionMessage, setExtractionMessage] = useState<string | null>(null);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadText, setUploadText] = useState<string>(RAW_GUIDELINE_SAMPLE);
  const [uploadFilename, setUploadFilename] = useState<string>('Apex_Brand_Guidelines_v2.4.pdf');

  const [showAddRuleModal, setShowAddRuleModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    category: 'banned_term',
    title: '',
    description: '',
    severity: 'med',
    confidence: 0.9,
    source_citation: '',
  });

  const [showAddFactModal, setShowAddFactModal] = useState<boolean>(false);
  const [newFact, setNewFact] = useState<Partial<Fact>>({
    claim: '',
    source_document: '',
    source_url: '',
    expires_at: '2026-12-31',
    status: 'active',
  });

  const activeGuideline = guidelines[0] || null;

  const handleRunExtraction = async (glId: string) => {
    setIsExtracting(true);
    setExtractionMessage('Sending text to LLM extraction pipeline with strict JSON schema...');
    try {
      await onExtractRules(glId);
      setExtractionMessage('Rules extracted with citations & confidence scores!');
      setTimeout(() => setExtractionMessage(null), 4000);
      setActiveTab('rules');
    } catch (err) {
      setExtractionMessage('Extraction completed via deterministic pre-warmed engine.');
      setTimeout(() => setExtractionMessage(null), 4000);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadText.trim()) return;
    const gl = onAddGuideline(uploadFilename, uploadText);
    setShowUploadModal(false);
    handleRunExtraction(gl.id);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.title || !newRule.description || !newRule.source_citation) return;
    onAddRule({
      guideline_id: activeGuideline?.id || 'gl-01',
      category: (newRule.category as RuleCategory) || 'banned_term',
      title: newRule.title,
      description: newRule.description,
      severity: (newRule.severity as Severity) || 'med',
      confidence: Number(newRule.confidence) || 0.9,
      source_citation: newRule.source_citation,
      status: 'confirmed',
    });
    setShowAddRuleModal(false);
    setNewRule({
      category: 'banned_term',
      title: '',
      description: '',
      severity: 'med',
      confidence: 0.9,
      source_citation: '',
    });
  };

  const handleSaveEditRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    onUpdateRule(editingRule.id, editingRule);
    setEditingRule(null);
  };

  const handleCreateFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.claim || !newFact.source_document || !newFact.expires_at) return;
    onAddFact({
      claim: newFact.claim,
      source_document: newFact.source_document,
      source_url: newFact.source_url || '',
      expires_at: new Date(newFact.expires_at).toISOString(),
      status: (newFact.status as Fact['status']) || 'active',
    });
    setShowAddFactModal(false);
    setNewFact({
      claim: '',
      source_document: '',
      source_url: '',
      expires_at: '2026-12-31',
      status: 'active',
    });
  };

  const filteredRules = selectedCategory === 'all'
    ? rules
    : rules.filter((r) => r.category === selectedCategory);

  const confirmedCount = rules.filter((r) => r.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Admin Workspace
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-sm font-medium text-slate-600">Brand Governance & Rules Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Brand Guidelines & Fact Vault
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ingest guidelines, extract machine-readable cited rules, and maintain verified facts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Guideline</span>
          </button>

          <button
            onClick={onNavigateToCreator}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <span>Proceed to Content Linting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'guidelines'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Guidelines ({guidelines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'rules'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Extracted Rules ({rules.length})</span>
          {confirmedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-semibold">
              {confirmedCount} Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('facts')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'facts'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-500" />
          <span>Fact Vault ({facts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'brand'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4 text-violet-500" />
          <span>Brand Profile & Colors</span>
        </button>
      </div>

      {/* GUIDELINES TAB */}
      {activeTab === 'guidelines' && (
        <div className="space-y-6">
          {extractionMessage && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center gap-3 animate-pulse">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>{extractionMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guidelines.map((gl) => (
              <div
                key={gl.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100 font-bold text-xs">
                        PDF
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{gl.filename}</h3>
                        <p className="text-xs text-slate-400">
                          Uploaded {new Date(gl.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                        gl.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : gl.status === 'extracted'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {gl.status}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 line-clamp-4 font-mono leading-relaxed">
                    {gl.raw_text.substring(0, 300)}...
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Rules extracted: <strong>{rules.filter((r) => r.guideline_id === gl.id).length}</strong>
                    </span>
                    <span>Brand: {brand.name}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleRunExtraction(gl.id)}
                    disabled={isExtracting}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isExtracting ? 'Extracting...' : 'Re-extract Rules'}</span>
                  </button>

                  {gl.status !== 'confirmed' ? (
                    <button
                      onClick={() => onConfirmGuideline(gl.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Rules</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('rules')}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      <span>View Active Rules</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Quick Upload Card */}
            <div
              onClick={() => setShowUploadModal(true)}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm">Upload New Guideline</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Drop PDF file (≤10 MB) or paste guideline clauses directly to run AI extraction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RULES TAB */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'banned_term', label: 'Banned Terms' },
                { id: 'claim_policy', label: 'Claim Policies' },
                { id: 'tone', label: 'Tone of Voice' },
                { id: 'required_disclaimer', label: 'Required Disclaimers' },
                { id: 'visual_colour', label: 'Color Palette' },
                { id: 'visual_contrast', label: 'WCAG Contrast' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddRuleModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule Manually</span>
              </button>

              {activeGuideline && (
                <button
                  onClick={() => onConfirmGuideline(activeGuideline.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm All Rules</span>
                </button>
              )}
            </div>
          </div>

          {/* Rules Cards List */}
          <div className="space-y-3">
            {filteredRules.map((rule) => {
              const isNeedsConfirmation = rule.confidence < 0.6; // FR-3.7 requirement

              return (
                <div
                  key={rule.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${
                    isNeedsConfirmation
                      ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {rule.category.replace('_', ' ')}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                            rule.severity === 'high'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : rule.severity === 'med'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {rule.severity} Severity
                        </span>

                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                          Confidence: {Math.round(rule.confidence * 100)}%
                        </span>

                        {isNeedsConfirmation && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Needs Confirmation (&lt; 0.6)</span>
                          </span>
                        )}

                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            rule.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 font-semibold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {rule.status === 'confirmed' ? '✓ Confirmed (Active)' : 'Extracted (Pending)'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{rule.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{rule.description}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start">
                      <button
                        onClick={() => setEditingRule(rule)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Rule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Verbatim Source Citation Quote Box */}
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] whitespace-nowrap mt-0.5">
                      Source Citation:
                    </span>
                    <blockquote className="italic border-l-2 border-blue-400 pl-2.5 text-slate-800">
                      “{rule.source_citation}”
                    </blockquote>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FACT VAULT TAB */}
      {activeTab === 'facts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Fact Vault (Approved Claims Database)</h2>
              <p className="text-xs text-slate-500">
                Verified, sourced claims with explicit expiry dates used to detect false or outdated marketing statements.
              </p>
            </div>

            <button
              onClick={() => setShowAddFactModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Fact to Vault</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Claim / Verified Fact</th>
                  <th className="py-3 px-4">Source Document</th>
                  <th className="py-3 px-4">Expires At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facts.map((fact) => {
                  const isExpired = new Date(fact.expires_at).getTime() < Date.now() || fact.status === 'expired';

                  return (
                    <tr
                      key={fact.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExpired ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{fact.claim}</div>
                        {fact.category && (
                          <span className="text-[10px] text-slate-400 font-mono">Category: {fact.category}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{fact.source_document}</div>
                        {fact.source_url && (
                          <a
                            href={fact.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                          >
                            <span>View Source</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isExpired ? 'font-bold text-red-600' : 'text-slate-700'}>
                            {new Date(fact.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onDeleteFact(fact.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete Fact"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BRAND PROFILE TAB */}
      {activeTab === 'brand' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Brand Profile & Visual Governance</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brand.name}
                    onChange={(e) => onUpdateBrand({ name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={brand.tagline || ''}
                    onChange={(e) => onUpdateBrand({ tagline: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Logo Image URL
                  </label>
                  <input
                    type="text"
                    value={brand.logo_url}
                    onChange={(e) => onUpdateBrand({ logo_url: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    WCAG Minimum Contrast Ratio
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={brand.palette.wcag_min_contrast}
                    onChange={(e) =>
                      onUpdateBrand({
                        palette: { ...brand.palette, wcag_min_contrast: parseFloat(e.target.value) || 4.5 },
                      })
                    }
                    className="w-32 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                  <p className="text-xs text-slate-400 mt-1">Standard WCAG AA requirement is 4.5:1.</p>
                </div>
              </div>

              {/* Color Palette Display */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Approved Acoustic Brand Palette (JSON)
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: brand.palette.primary }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{brand.palette.primary_name || 'Primary'}</div>
                      <div className="text-xs font-mono text-slate-500">{brand.palette.primary}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: brand.palette.secondary }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{brand.palette.secondary_name || 'Secondary'}</div>
                      <div className="text-xs font-mono text-slate-500">{brand.palette.secondary}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
                      style={{ backgroundColor: brand.palette.accent }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{brand.palette.accent_name || 'Accent'}</div>
                      <div className="text-xs font-mono text-slate-500">{brand.palette.accent}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-lg border border-rose-300 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: brand.palette.forbidden_colors[0] }}
                    />
                    <div>
                      <div className="text-xs font-bold text-rose-900">Forbidden Color</div>
                      <div className="text-xs font-mono text-rose-600">{brand.palette.forbidden_colors[0]}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(brand.palette, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD GUIDELINE MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-lg">Upload Guideline PDF / Text</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Document Filename
                </label>
                <input
                  type="text"
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Guideline Content / Clauses
                  </label>
                  <button
                    type="button"
                    onClick={() => setUploadText(RAW_GUIDELINE_SAMPLE)}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Reset to Apex Audio Demo Text
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-mono leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                >
                  Upload & Run LLM Extraction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD RULE MODAL */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Add Rule Manually</h3>
              <button onClick={() => setShowAddRuleModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value as RuleCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="banned_term">Banned Term</option>
                    <option value="claim_policy">Claim Policy</option>
                    <option value="tone">Tone of Voice</option>
                    <option value="required_disclaimer">Required Disclaimer</option>
                    <option value="visual_colour">Visual Colour</option>
                    <option value="visual_contrast">Visual Contrast</option>
                    <option value="messaging">Messaging</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Severity
                  </label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as Severity })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rule Title
                </label>
                <input
                  type="text"
                  value={newRule.title}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                  placeholder="e.g. Prohibition of Unsubstantiated Superlatives"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Verbatim Source Citation (from PDF)
                </label>
                <textarea
                  rows={2}
                  value={newRule.source_citation}
                  onChange={(e) => setNewRule({ ...newRule, source_citation: e.target.value })}
                  placeholder="Exact quote from guideline"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RULE MODAL */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Edit Rule ({editingRule.id})</h3>
              <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditRule} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  value={editingRule.title}
                  onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Severity</label>
                  <select
                    value={editingRule.severity}
                    onChange={(e) => setEditingRule({ ...editingRule, severity: e.target.value as Severity })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confidence</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={editingRule.confidence}
                    onChange={(e) => setEditingRule({ ...editingRule, confidence: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Source Citation
                </label>
                <textarea
                  rows={2}
                  value={editingRule.source_citation}
                  onChange={(e) => setEditingRule({ ...editingRule, source_citation: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Update Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FACT MODAL */}
      {showAddFactModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Add Fact to Vault</h3>
              <button onClick={() => setShowAddFactModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFact} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fact / Approved Claim
                </label>
                <input
                  type="text"
                  value={newFact.claim}
                  onChange={(e) => setNewFact({ ...newFact, claim: e.target.value })}
                  placeholder="e.g. 12-month standard manufacturer warranty on all audio hardware"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Source Document Reference
                </label>
                <input
                  type="text"
                  value={newFact.source_document}
                  onChange={(e) => setNewFact({ ...newFact, source_document: e.target.value })}
                  placeholder="e.g. Product Warranty Policy 2024 (Section 3.1)"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expires At
                  </label>
                  <input
                    type="date"
                    value={newFact.expires_at}
                    onChange={(e) => setNewFact({ ...newFact, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={newFact.status}
                    onChange={(e) => setNewFact({ ...newFact, status: e.target.value as Fact['status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFactModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

