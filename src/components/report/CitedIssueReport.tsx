import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  X,
  Wrench,
  Quote,
  Database,
  Palette,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Send,
} from 'lucide-react';
import type { Submission, Issue, Brand, User, Severity } from '@/types';
import { FixDiffModal } from './FixDiffModal';

interface CitedIssueReportProps {
  submission: Submission;
  issues: Issue[];
  brand: Brand;
  currentUser: User;
  onApplyFix: (issueId: string, updatedCaption: string) => void;
  onBack: () => void;
  onSubmitForReview: () => void;
  onSubmitReview: (
    submissionId: string,
    decision: 'approve' | 'request_changes',
    comment: string
  ) => void;
}

const severityDot: Record<Severity, string> = {
  high: 'bg-red-500',
  med: 'bg-amber-500',
  low: 'bg-emerald-500',
};

const severityBg: Record<Severity, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  med: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const riskBg = (score: number): string => {
  if (score > 75) return 'bg-red-600 text-white';
  if (score > 50) return 'bg-amber-500 text-white';
  if (score > 25) return 'bg-amber-400 text-slate-900';
  return 'bg-emerald-500 text-white';
};

const categoryLabel = (cat: string): string =>
  cat
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/* Build highlighted caption: marks matched text spans */
const buildHighlightedCaption = (
  caption: string,
  issues: Issue[],
  onSelectIssue?: (issueId: string) => void
): React.ReactNode[] => {
  const spans: { start: number; end: number; severity: Severity; text: string; issueId: string }[] = [];
  issues.forEach((issue) => {
    if (issue.status === 'open') {
      let start = issue.evidence.span?.start;
      let end = issue.evidence.span?.end;

      if ((start === undefined || end === undefined) && issue.evidence.matched_text) {
        const idx = caption.toLowerCase().indexOf(issue.evidence.matched_text.toLowerCase());
        if (idx !== -1) {
          start = idx;
          end = idx + issue.evidence.matched_text.length;
        }
      }

      if (start !== undefined && end !== undefined && start >= 0 && end <= caption.length && start < end) {
        spans.push({
          start,
          end,
          severity: issue.severity,
          text: caption.slice(start, end),
          issueId: issue.id,
        });
      }
    }
  });

  if (spans.length === 0) return [caption];

  spans.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  spans.forEach((span, i) => {
    if (span.start < cursor) return;

    if (span.start > cursor) {
      parts.push(caption.slice(cursor, span.start));
    }
    const bg =
      span.severity === 'high'
        ? 'bg-red-100 text-red-900 border-b-2 border-red-500 font-semibold rounded px-1 cursor-pointer hover:bg-red-200'
        : 'bg-amber-100 text-amber-900 border-b-2 border-amber-500 font-semibold rounded px-1 cursor-pointer hover:bg-amber-200';
    parts.push(
      <mark
        key={i}
        onClick={() => onSelectIssue && onSelectIssue(span.issueId)}
        className={bg}
        title={`Click to inspect issue: ${span.text}`}
      >
        {caption.slice(span.start, span.end)}
      </mark>
    );
    cursor = span.end;
  });

  if (cursor < caption.length) {
    parts.push(caption.slice(cursor));
  }

  return parts;
};

const IssueCard: React.FC<{
  issue: Issue;
  caption: string;
  brand: Brand;
  isFocused?: boolean;
  onApplyFix: (issueId: string, updatedCaption: string) => void;
}> = ({ issue, caption, brand, isFocused, onApplyFix }) => {
  const [expanded, setExpanded] = useState(true);
  const [showFixModal, setShowFixModal] = useState(false);
  const isFixed = issue.status === 'fixed';

  return (
    <>
      <div
        id={`issue-${issue.id}`}
        className={`border rounded-xl transition-all shadow-sm ${
          isFocused ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200 hover:border-slate-300'
        } ${isFixed ? 'opacity-50 bg-slate-50' : 'bg-white'}`}
      >
        {/* Collapsed row */}
        <div className="w-full text-left px-4 py-3 flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDot[issue.severity]}`} />
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-medium border uppercase tracking-wider ${severityBg[issue.severity]} flex-shrink-0`}
          >
            {categoryLabel(issue.category)}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`text-xs font-semibold flex-1 truncate text-left hover:text-blue-600 transition-colors ${
              isFixed ? 'line-through text-slate-400' : 'text-slate-900'
            }`}
          >
            {issue.rule_title || categoryLabel(issue.category)}
          </button>
          <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
            {Math.round(issue.confidence * 100)}% conf
          </span>
          {issue.suggested_text && !isFixed && (
            <button
              onClick={() => setShowFixModal(true)}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg flex-shrink-0 shadow-sm transition-colors"
            >
              <Wrench className="w-3 h-3" />
              Apply Fix
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-4 pb-4 space-y-3.5 border-t border-slate-100 pt-3">
            {/* Explanation */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Violation Explanation
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-sans">{issue.explanation}</p>
            </div>

            {/* Source citation */}
            {issue.source_citation && (
              <div className="bg-slate-50 rounded-xl p-3 border-l-2 border-blue-500">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1">
                  <Quote className="w-3 h-3 text-blue-500" />
                  Cited Brand Rule / Guideline Source
                </span>
                <p className="italic text-slate-700 text-xs leading-relaxed font-serif">
                  "{issue.source_citation}"
                </p>
              </div>
            )}

            {/* Fact Vault Contradiction Evidence Card */}
            {issue.category === 'claim_policy' && issue.evidence.conflicting_fact && (
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-purple-900">
                  <Database className="w-3.5 h-3.5 text-purple-600" />
                  <span>Fact Vault Synchronization Conflict</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                    <span className="text-purple-600 block font-semibold mb-0.5">Claimed in Copy:</span>
                    <span className="font-mono text-red-600 font-semibold line-through">
                      "{issue.evidence.matched_text || 'Extended claim'}"
                    </span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                    <span className="text-purple-600 block font-semibold mb-0.5">Approved in Fact Vault:</span>
                    <span className="font-medium text-emerald-800">
                      "{issue.evidence.conflicting_fact}"
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Color Palette Violation Card */}
            {issue.category === 'visual_colour' && issue.evidence.detected_color && (
              <div className="p-3 rounded-xl bg-pink-50/70 border border-pink-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-pink-900">
                  <Palette className="w-3.5 h-3.5 text-pink-600" />
                  <span>Color Governance Violation (Off-Palette)</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-pink-100 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-md border border-slate-300 shadow-sm"
                      style={{ backgroundColor: issue.evidence.detected_color }}
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">Detected: {issue.evidence.detected_color}</span>
                      <span className="text-pink-700 font-medium">ΔE Distance: {issue.evidence.delta_e ?? 48.6} (Forbidden)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Approved Palette:</span>
                    <div className="flex items-center gap-1 justify-end">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-200"
                        style={{ backgroundColor: brand.palette.primary }}
                        title="Primary"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-200"
                        style={{ backgroundColor: brand.palette.secondary }}
                        title="Secondary"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-200"
                        style={{ backgroundColor: brand.palette.accent }}
                        title="Accent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contrast Ratio Evidence Card */}
            {issue.category === 'visual_contrast' && issue.evidence.contrast_ratio !== undefined && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900">WCAG AA Contrast Ratio Failure</span>
                  <span className="font-mono text-xs font-bold text-amber-900">
                    {issue.evidence.contrast_ratio}:1 (Min Required {issue.evidence.required_contrast || 4.5}:1)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, (issue.evidence.contrast_ratio / 4.5) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Suggested Fix Action */}
            {issue.suggestion && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs">
                <Wrench className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-blue-900 block mb-0.5">Actionable Suggestion:</span>
                  <p className="text-blue-800 leading-relaxed">{issue.suggestion}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <FixDiffModal
        isOpen={showFixModal}
        onClose={() => setShowFixModal(false)}
        issue={issue}
        currentCaption={caption}
        onAcceptFix={onApplyFix}
      />
    </>
  );
};

const CitedIssueReport: React.FC<CitedIssueReportProps> = ({
  submission,
  issues,
  brand,
  currentUser,
  onApplyFix,
  onBack,
  onSubmitForReview,
  onSubmitReview,
}) => {
  const [filter, setFilter] = useState<'all' | Severity>('all');
  const [reviewComment, setReviewComment] = useState('');
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);

  const openIssues = useMemo(
    () => issues.filter((i) => i.status === 'open'),
    [issues]
  );

  const countBySeverity = useMemo(() => {
    const counts = { high: 0, med: 0, low: 0 };
    openIssues.forEach((i) => counts[i.severity]++);
    return counts;
  }, [openIssues]);

  const filteredIssues = useMemo(
    () =>
      filter === 'all'
        ? issues
        : issues.filter((i) => i.severity === filter),
    [issues, filter]
  );

  const isReviewer = currentUser.role === 'reviewer';
  const isCreator = currentUser.role === 'creator';

  const filters: { label: string; value: 'all' | Severity }[] = [
    { label: 'All Issues', value: 'all' },
    { label: 'High Severity', value: 'high' },
    { label: 'Medium', value: 'med' },
    { label: 'Low', value: 'low' },
  ];

  const handleSelectSpan = (issueId: string) => {
    setFocusedIssueId(issueId);
    const element = document.getElementById(`issue-${issueId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Top section */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Submissions
        </button>

        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
          {/* Risk score Gauge (FR-9.4) */}
          <div
            className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-md ${riskBg(
              submission.risk_score
            )}`}
          >
            <span className="text-2xl font-bold leading-none tracking-tight">
              {submission.risk_score}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90 mt-0.5">
              Risk Score
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 truncate">
                {submission.title}
              </h1>
              {submission.risk_level && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    submission.risk_level === 'Critical' || submission.risk_level === 'High'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : submission.risk_level === 'Moderate'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {submission.risk_level} Risk Level
                </span>
              )}
              <span className="text-xs text-slate-400">
                Creator: {submission.creator_name || 'Alex Rivera'}
              </span>
            </div>

            {/* Stat counters */}
            <div className="flex gap-2.5 mt-3 flex-wrap">
              {(['high', 'med', 'low'] as const).map((sev) => (
                <div
                  key={sev}
                  className="flex items-center gap-1.5 text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 font-medium"
                >
                  <span className={`w-2 h-2 rounded-full ${severityDot[sev]}`} />
                  <span className="text-slate-500 capitalize">
                    {sev === 'med' ? 'Medium' : sev}:
                  </span>
                  <span className="font-bold text-slate-900">{countBySeverity[sev]}</span>
                </div>
              ))}
              <div className="text-xs text-slate-500 self-center ml-auto">
                {openIssues.length === 0 ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready for Publication
                  </span>
                ) : (
                  <span>{openIssues.length} open issue{openIssues.length !== 1 ? 's' : ''} require resolution</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column — submitted content */}
        <div className="lg:w-5/12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Submission Text &amp; Provenance
            </h2>
            <span className="text-[11px] text-slate-400">Click highlighted phrases to view citations</span>
          </div>

          {/* Caption with highlights (FR-9.3) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {buildHighlightedCaption(submission.caption, issues, handleSelectSpan)}
            </p>
          </div>

          {/* Image preview */}
          {submission.image_url && (
            <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-sm">
              <img
                src={submission.image_url}
                alt={submission.title}
                className="w-full object-cover max-h-72 opacity-95"
              />
              {/* Overlay badges for color/contrast issues */}
              {issues.some(
                (i) =>
                  i.status === 'open' &&
                  (i.category === 'visual_colour' || i.category === 'visual_contrast')
              ) && (
                <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                  {issues
                    .filter(
                      (i) =>
                        i.status === 'open' &&
                        (i.category === 'visual_colour' || i.category === 'visual_contrast')
                    )
                    .map((i) => (
                      <span
                        key={i.id}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md ${severityBg[i.severity]} backdrop-blur-md shadow-md`}
                      >
                        {i.category === 'visual_colour' ? 'Palette Delta-E Flag' : 'WCAG AA Contrast Flag'}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Review actions */}
          <div className="pt-2 space-y-2.5">
            {isCreator && (
              <button
                onClick={onSubmitForReview}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Content for Final Review
              </button>
            )}

            {isReviewer && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                <span className="text-xs font-semibold text-slate-800 block">Reviewer Decision (FR-11.3)</span>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Leave governance audit comment..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onSubmitReview(submission.id, 'approve', reviewComment)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Content
                  </button>
                  <button
                    onClick={() => onSubmitReview(submission.id, 'request_changes', reviewComment)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-300 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Request Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column — cited issue report */}
        <div className="lg:w-7/12 space-y-3">
          {/* Filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-xs text-slate-400 ml-auto font-medium">
              {filteredIssues.length} cited issue{filteredIssues.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Issue cards */}
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                caption={submission.caption}
                brand={brand}
                isFocused={focusedIssueId === issue.id}
                onApplyFix={onApplyFix}
              />
            ))}

            {filteredIssues.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                No issues match this filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitedIssueReport;
