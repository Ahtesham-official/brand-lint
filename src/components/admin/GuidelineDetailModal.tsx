import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Check,
  Quote,
  Target,
  ArrowRight,
  Split,
  Eye,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { Guideline, Rule } from '@/types';

interface GuidelineDetailModalProps {
  guideline: Guideline;
  rules: Rule[];
  isOpen: boolean;
  onClose: () => void;
  onSelectVersion: (guidelineId: string, version: 'original' | 'enhanced') => Promise<void>;
  onConfirmGuideline: (guidelineId: string) => void;
}

export const GuidelineDetailModal: React.FC<GuidelineDetailModalProps> = ({
  guideline,
  rules,
  isOpen,
  onClose,
  onSelectVersion,
  onConfirmGuideline,
}) => {
  const [activeTab, setActiveTab] = useState<'comprehension' | 'comparison' | 'rules'>('comprehension');
  const [selectingVersion, setSelectingVersion] = useState(false);

  if (!isOpen) return null;

  const currentVersion = guideline.selected_version || 'original';
  const analysis = guideline.ai_analysis;
  const enhancedText = guideline.enhanced_version || guideline.raw_text;

  const handleSelect = async (version: 'original' | 'enhanced') => {
    setSelectingVersion(true);
    try {
      await onSelectVersion(guideline.id, version);
    } finally {
      setSelectingVersion(false);
    }
  };

  const associatedRules = rules.filter((r) => r.guideline_id === guideline.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{guideline.filename}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                    currentVersion === 'enhanced'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  Active Version: {currentVersion.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                AI Comprehension &amp; Enhanced Guideline Comparison (Reviewer Review Workspace)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {guideline.status !== 'confirmed' && (
              <button
                onClick={() => onConfirmGuideline(guideline.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Confirm Rules (FR-4.4)
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-100 bg-white flex gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('comprehension')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'comprehension'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            AI Comprehension &amp; Enforced Rules
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'comparison'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-purple-600" />
            Side-by-Side Version Review (Original vs AI Enhanced)
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Extracted Rulebook ({associatedRules.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: AI Comprehension */}
          {activeTab === 'comprehension' && (
            <div className="space-y-5">
              {/* Executive Summary Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    What the AI Understood from this Document
                  </span>
                  {analysis?.strictness_level && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold border border-blue-300">
                      Strictness: {analysis.strictness_level}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 leading-relaxed text-xs font-sans">
                  {analysis?.summary ||
                    'The AI parsed the uploaded guidelines and identified atomic constraints covering prohibited superlatives, Fact Vault warranty validation, mandatory terms disclaimers, brand hex color bounds, and WCAG AA contrast standards.'}
                </p>
              </div>

              {/* Key Takeaways Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Core Constraints Being Enforced by the Engine
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(analysis?.key_takeaways || [
                    'Superlatives like "India\'s #1" or "unbeatable" are strictly forbidden without independent audit proof.',
                    'Hardware warranty commitments must be verified against current Fact Vault records (12-month limit).',
                    'Promotional copy must prominently include statutory disclaimer: "Terms & conditions apply. See website for details."',
                    'Visual graphics must strictly use approved Navy/Cyan colors and maintain WCAG AA 4.5:1 text contrast.',
                  ]).map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2 text-slate-700"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tone Profile & Target Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Detected Voice &amp; Tone Profile
                  </span>
                  <p className="font-semibold text-slate-800">
                    {analysis?.tone_profile || 'Calm, technical, understated acoustic authority without urgency hype.'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Target Creator &amp; Consumer Context
                  </span>
                  <p className="font-semibold text-slate-800">
                    {analysis?.target_audience || 'Acoustic engineers, premium audio consumers, and campaign copywriters.'}
                  </p>
                </div>
              </div>

              {/* AI Recommended Actions */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Recommended System Actions
                </h4>
                <div className="space-y-1.5">
                  {(analysis?.recommended_actions || [
                    'Extract atomic rules into confirmed rulebook for automated creator linting.',
                    'Review the AI Enhanced Guideline version below for clearer wording.',
                    'Confirm guideline to flip rules into active check engine status.',
                  ]).map((action, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50 border border-amber-200/70 text-amber-900">
                      <ArrowRight className="w-3 h-3 text-amber-600 flex-shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Side-by-Side Comparison */}
          {activeTab === 'comparison' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-900 block text-xs">Reviewer Guideline Decision</span>
                  <span className="text-[11px] text-purple-700">
                    Review both versions side by side. Choose which version BrandLint will compile into active rules.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelect('original')}
                    disabled={selectingVersion}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                      currentVersion === 'original'
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {currentVersion === 'original' ? '✓ Selected: Original' : 'Select Original'}
                  </button>
                  <button
                    onClick={() => handleSelect('enhanced')}
                    disabled={selectingVersion}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                      currentVersion === 'enhanced'
                        ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
                        : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    {currentVersion === 'enhanced' ? '✓ Selected: AI Enhanced' : 'Select AI Enhanced'}
                  </button>
                </div>
              </div>

              {/* Side-by-side columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original uploaded guideline */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">Uploaded Original Guideline</span>
                    <span className="text-[10px] text-slate-400 font-mono">{guideline.raw_text.length} chars</span>
                  </div>
                  <pre className="p-4 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap max-h-[50vh] overflow-y-auto bg-slate-50/40">
                    {guideline.raw_text}
                  </pre>
                </div>

                {/* AI Enhanced Version */}
                <div className="border border-purple-200 rounded-xl overflow-hidden flex flex-col bg-white shadow-sm">
                  <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      AI Enhanced Version (Groq Llama 3.3)
                    </span>
                    <span className="text-[10px] text-purple-600 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
                      Optimized Format
                    </span>
                  </div>
                  <div className="p-4 font-sans text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap max-h-[50vh] overflow-y-auto bg-purple-50/20">
                    {enhancedText}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Rules List */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700">
                  {associatedRules.length} rules active from this guideline
                </span>
                <span className="text-[11px] text-slate-400">
                  Confirmed rules are used live by the check engine
                </span>
              </div>

              <div className="space-y-2">
                {associatedRules.map((rule) => (
                  <div key={rule.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{rule.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                        {rule.category}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{rule.description}</p>
                    <div className="bg-slate-50 p-2 rounded-lg border-l-2 border-blue-500 font-serif italic text-slate-600 text-[11px]">
                      &quot;{rule.source_citation}&quot;
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

