import React, { useState } from 'react';
import { Submission, Issue, Severity, Brand, User } from '@/types';
import * as Diff from 'diff';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Sparkles, ChevronDown, 
  ChevronUp, ArrowLeft, Wand2, Check, ExternalLink, Image as ImageIcon, 
  Eye, RefreshCw, MessageSquare
} from 'lucide-react';

interface CitedIssueReportProps {
  submission: Submission;
  issues: Issue[];
  brand: Brand;
  currentUser: User;
  onApplyFix: (issueId: string, updatedCaption: string) => void;
  onBack: () => void;
  onSubmitForReview: () => void;
  onOpenReviewModal?: () => void;
}

export const CitedIssueReport: React.FC<CitedIssueReportProps> = ({
  submission,
  issues,
  brand,
  currentUser,
  onApplyFix,
  onBack,
  onSubmitForReview,
  onOpenReviewModal,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({
    [issues[0]?.id || '']: true, // First issue expanded by default
  });
  const [activeFixIssue, setActiveFixIssue] = useState<Issue | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIssues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredIssues = selectedSeverity === 'all'
    ? issues
    : issues.filter((i) => i.severity === selectedSeverity);

  const openIssues = issues.filter((i) => i.status === 'open');
  const fixedIssues = issues.filter((i) => i.status === 'fixed');

  const riskScore = submission.risk_score;
  const isCritical = riskScore > 75;
  const isHigh = riskScore > 50 && riskScore <= 75;
  const isModerate = riskScore > 25 && riskScore <= 50;

  // Interactive Text Highlighting with linked spans
  const renderInteractiveCaption = () => {
    const text = submission.caption;
    // Known violation phrases to highlight
    const highlights = [
      { text: "India's #1", type: 'high', label: 'Banned Superlative' },
      { text: "24-month warranty", type: 'high', label: 'Fact Contradiction' },
      { text: "Unleash the sound!", type: 'med', label: 'Tone Hype' },
      { text: "#unbeatable", type: 'high', label: 'Banned Word' },
      { text: "Grab yours before midnight!", type: 'med', label: 'Urgency Pressure' },
    ];

    // Simple robust tokenizer for highlighting
    let result: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find occurrences
    const matches: { start: number; end: number; item: typeof highlights[0] }[] = [];
    highlights.forEach((h) => {
      const idx = text.indexOf(h.text);
      if (idx !== -1) {
        matches.push({ start: idx, end: idx + h.text.length, item: h });
      }
    });

    matches.sort((a, b) => a.start - b.start);

    matches.forEach((m, i) => {
      if (m.start > lastIndex) {
        result.push(text.substring(lastIndex, m.start));
      }

      const isHighSev = m.item.type === 'high';
      const isSelected = activeHighlightId === m.item.text;

      result.push(
        <mark
          key={`hl-${i}`}
          onClick={() => setActiveHighlightId(m.item.text)}
          className={`cursor-pointer px-1 py-0.5 rounded transition-all font-semibold ${
            isSelected
              ? 'ring-2 ring-indigo-600 bg-yellow-200'
              : isHighSev
              ? 'bg-rose-100 text-rose-900 border-b-2 border-rose-500 hover:bg-rose-200'
              : 'bg-amber-100 text-amber-900 border-b-2 border-amber-500 hover:bg-amber-200'
          }`}
          title={`Violation: ${m.item.label} (Click to inspect)`}
        >
          {text.substring(m.start, m.end)}
        </mark>
      );
      lastIndex = m.end;
    });

    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }

    return result;
  };

  const handleAcceptFix = (issue: Issue) => {
    if (!issue.suggested_text) return;
    onApplyFix(issue.id, issue.suggested_text);
    setActiveFixIssue(null);
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Submissions</span>
        </button>

        <div className="flex items-center gap-3">
          {currentUser.role === 'reviewer' ? (
            <button
              onClick={onOpenReviewModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Reviewer Decision (Approve / Request Changes)</span>
            </button>
          ) : (
            <button
              onClick={onSubmitForReview}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Submit for Brand Review</span>
            </button>
          )}
        </div>
      </div>

      {/* OVERALL BRAND RISK SCORE BANNER (FR-9.4) */}
      <div
        className={`rounded-2xl border p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 ${
          isCritical
            ? 'bg-rose-50/60 border-rose-200'
            : isHigh
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-emerald-50/60 border-emerald-200'
        }`}
      >
        <div className="flex items-center gap-5">
          {/* Circular / Gauge Risk Indicator */}
          <div
            className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-extrabold shadow-sm ${
              isCritical
                ? 'bg-rose-600 text-white shadow-rose-500/20'
                : isHigh
                ? 'bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-emerald-600 text-white shadow-emerald-500/20'
            }`}
          >
            <span className="text-2xl leading-none">{riskScore}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 mt-0.5">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isCritical
                    ? 'bg-rose-200 text-rose-900'
                    : isHigh
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {submission.risk_level || 'Critical'} Brand Risk
              </span>
              <span className="text-xs text-slate-500">
                Formula: Weighted Severity × Confidence Aggregate
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Cited Issue Report: {submission.title}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Found <strong>{openIssues.length} open issues</strong> requiring attention. 
              {fixedIssues.length > 0 && ` (${fixedIssues.length} fixed)`}
            </p>
          </div>
        </div>

        {/* Severity Count Pills */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white/80 border border-slate-200 text-center shadow-sm">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">High Risk</div>
            <div className="text-lg font-bold text-rose-600">
              {issues.filter((i) => i.severity === 'high' && i.status === 'open').length}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-white/80 border border-slate-200 text-center shadow-sm">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medium</div>
            <div className="text-lg font-bold text-amber-600">
              {issues.filter((i) => i.severity === 'med' && i.status === 'open').length}
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-white/80 border border-slate-200 text-center shadow-sm">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Auto-Fixable</div>
            <div className="text-lg font-bold text-indigo-600">
              {issues.filter((i) => i.suggested_text && i.status === 'open').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Submission Content on Left, Cited Issues on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Submission Viewer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Submitted Copy & Poster</h3>
              <span className="text-[11px] text-slate-400">Click highlighted text to inspect</span>
            </div>

            {/* Interactive Caption View */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Caption Copy (Interactive Provenance)
              </label>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm leading-relaxed text-slate-800 font-sans">
                {renderInteractiveCaption()}
              </div>
            </div>

            {/* Poster Graphic Inspection View */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Poster Graphic & Visual Check Overlays
              </label>
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submission.image_url}
                  alt="Poster asset"
                  className="w-full h-64 object-cover"
                />

                {/* Overlaid Visual Diagnostics Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                  <div className="px-2 py-1 rounded bg-black/85 backdrop-blur text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/10 shadow">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                    <span>Dominant: #E11D48 (Off-brand)</span>
                  </div>

                  <div className="px-2 py-1 rounded bg-black/85 backdrop-blur text-amber-300 text-[11px] font-mono flex items-center gap-1.5 border border-white/10 shadow">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>WCAG: 2.8:1 (Needs 4.5:1)</span>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-indigo-900/90 text-white text-[10px] font-mono">
                  OCR: Provenance Verified
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cited Issues List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filter by Severity:</span>
              <div className="flex items-center gap-1">
                {['all', 'high', 'med', 'low'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                      selectedSeverity === sev
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-400">
              Showing {filteredIssues.length} of {issues.length} cited flags
            </span>
          </div>

          {/* Issues Accordion Cards */}
          <div className="space-y-3">
            {filteredIssues.map((issue) => {
              const isExpanded = !!expandedIssues[issue.id];
              const isFixed = issue.status === 'fixed';

              return (
                <div
                  key={issue.id}
                  className={`bg-white rounded-xl border transition-all shadow-sm ${
                    isFixed
                      ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                      : issue.severity === 'high'
                      ? 'border-rose-200 hover:border-rose-300'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Issue Header */}
                  <div
                    onClick={() => toggleExpand(issue.id)}
                    className="p-4 cursor-pointer flex items-start justify-between gap-3 select-none"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            issue.severity === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : issue.severity === 'med'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {issue.severity}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {issue.category.replace('_', ' ')}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                          {Math.round(issue.confidence * 100)}% Confidence
                        </span>

                        {isFixed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Fixed</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">
                        {issue.rule_title || issue.explanation}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {issue.explanation}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {issue.suggested_text && !isFixed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFixIssue(issue);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Apply Fix</span>
                        </button>
                      )}

                      <button className="p-1 text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* EXPANDABLE "WHY THIS FLAG?" EVIDENCE PANEL (FR-9.2) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50 rounded-b-xl">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>“Why this flag?” Evidence &amp; Citation Breakdown</span>
                      </div>

                      {/* Verbatim Citation Quote Box */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs">
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                          Exact Guideline / Fact Vault Citation:
                        </span>
                        <blockquote className="italic border-l-2 border-indigo-500 pl-2.5 text-slate-800 font-serif leading-relaxed">
                          “{issue.source_citation}”
                        </blockquote>
                      </div>

                      {/* Structured Evidence Chain */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {issue.evidence.matched_text && (
                          <div className="p-2.5 rounded bg-white border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Matched Span</span>
                            <span className="font-mono text-slate-900 font-semibold">{issue.evidence.matched_text}</span>
                          </div>
                        )}

                        {issue.evidence.conflicting_fact && (
                          <div className="p-2.5 rounded bg-white border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Conflicting Fact Vault Record</span>
                            <span className="font-semibold text-rose-800">{issue.evidence.conflicting_fact}</span>
                          </div>
                        )}

                        {issue.evidence.detected_color && (
                          <div className="p-2.5 rounded bg-white border border-slate-200 flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded border shadow-inner flex-shrink-0"
                              style={{ backgroundColor: issue.evidence.detected_color }}
                            />
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Non-Compliant Color</span>
                              <span className="font-mono text-slate-900">{issue.evidence.detected_color} (ΔE: {issue.evidence.delta_e})</span>
                            </div>
                          </div>
                        )}

                        {issue.evidence.contrast_ratio && (
                          <div className="p-2.5 rounded bg-white border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Contrast Ratio vs Required</span>
                            <span className="font-mono text-amber-800 font-bold">
                              {issue.evidence.contrast_ratio}:1 (Required: {issue.evidence.required_contrast}:1)
                            </span>
                          </div>
                        )}

                        <div className="p-2.5 rounded bg-white border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Provenance Source</span>
                          <span className="font-semibold text-slate-700 capitalize">
                            {issue.evidence.provenance === 'ocr' ? 'Poster Graphic OCR' : 'Caption Copy Text'}
                          </span>
                        </div>
                      </div>

                      {/* Suggestion & Resolution */}
                      <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950">
                        <span className="font-bold text-indigo-800 uppercase tracking-wider text-[10px] block mb-0.5">
                          Recommended Fix:
                        </span>
                        <p>{issue.suggestion}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ONE-CLICK FIX DIFF MODAL (FR-10.1 - 10.4) */}
      {activeFixIssue && activeFixIssue.suggested_text && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">One-Click Fix Diff Suggestion</h3>
              </div>
              <button onClick={() => setActiveFixIssue(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900">
                <strong>Rule / Fact Addressed:</strong> {activeFixIssue.rule_title || activeFixIssue.explanation}
              </div>

              {/* Visual Diff Rendering */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Visual Diff (Original vs Brand-Compliant Rewrite)
                </label>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono leading-relaxed space-y-3">
                  <div>
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-1">Original Text:</span>
                    <div className="p-2.5 rounded bg-red-50 text-red-900 border border-red-200 line-through">
                      {submission.caption}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Suggested Replacement:</span>
                    <div className="p-2.5 rounded bg-emerald-50 text-emerald-950 border border-emerald-200 font-semibold">
                      {activeFixIssue.suggested_text}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setActiveFixIssue(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAcceptFix(activeFixIssue)}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Fix &amp; Mutate Text</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
