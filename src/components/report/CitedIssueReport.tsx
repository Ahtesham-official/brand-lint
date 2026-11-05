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
} from 'lucide-react';
import type { Submission, Issue, Brand, User, Severity } from '@/types';

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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const severityDot: Record<Severity, string> = {
  high: 'bg-red-500',
  med: 'bg-amber-500',
  low: 'bg-green-500',
};

const severityBg: Record<Severity, string> = {
  high: 'bg-red-50 text-red-700',
  med: 'bg-amber-50 text-amber-700',
  low: 'bg-green-50 text-green-700',
};

const riskBg = (score: number): string => {
  if (score > 75) return 'bg-red-600 text-white';
  if (score > 50) return 'bg-amber-500 text-white';
  if (score > 25) return 'bg-amber-400 text-slate-900';
  return 'bg-green-500 text-white';
};

const categoryLabel = (cat: string): string =>
  cat
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/* Build highlighted caption: marks matched text spans */
const buildHighlightedCaption = (
  caption: string,
  issues: Issue[]
): React.ReactNode[] => {
  // Collect all spans from open issues
  const spans: { start: number; end: number; severity: Severity; text: string }[] = [];
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
        });
      }
    }
  });

  if (spans.length === 0) return [caption];

  // Sort by start
  spans.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  spans.forEach((span, i) => {
    if (span.start < cursor) return; // avoid overlapping issues

    if (span.start > cursor) {
      parts.push(caption.slice(cursor, span.start));
    }
    const bg =
      span.severity === 'high'
        ? 'bg-red-100 text-red-900 border-b border-red-400 font-medium rounded px-1'
        : 'bg-amber-100 text-amber-900 border-b border-amber-400 font-medium rounded px-1';
    parts.push(
      <mark key={i} className={bg} title={`Violation: ${span.text}`}>
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

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const IssueCard: React.FC<{
  issue: Issue;
  caption: string;
  onApplyFix: (issueId: string, updatedCaption: string) => void;
}> = ({ issue, caption, onApplyFix }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);
  const isFixed = issue.status === 'fixed';

  const handleAcceptFix = () => {
    if (!issue.suggested_text) return;
    // If suggested_text already contains the full rewritten copy
    const isFullText = issue.suggested_text.length > 40 && issue.suggested_text.includes(' ');
    const updated = isFullText
      ? issue.suggested_text
      : (issue.evidence.matched_text ? caption.replace(issue.evidence.matched_text, issue.suggested_text) : issue.suggested_text);
    onApplyFix(issue.id, updated);
    setShowFixModal(false);
  };

  return (
    <>
      <div
        className={`border border-slate-200 rounded-lg transition-colors ${
          isFixed ? 'opacity-50' : ''
        }`}
      >
        {/* Collapsed row */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-3 py-2.5 flex items-center gap-2"
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDot[issue.severity]}`}
          />
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${severityBg[issue.severity]} flex-shrink-0`}
          >
            {categoryLabel(issue.category)}
          </span>
          <span
            className={`text-sm flex-1 truncate ${
              isFixed ? 'line-through text-slate-400' : 'text-slate-800'
            }`}
          >
            {issue.rule_title || categoryLabel(issue.category)}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {Math.round(issue.confidence * 100)}%
          </span>
          {issue.suggested_text && !isFixed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFixModal(true);
              }}
              className="text-xs px-2 py-0.5 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 flex-shrink-0"
            >
              Apply Fix
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          )}
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-slate-100">
            {/* Explanation */}
            <p className="text-sm text-slate-700 mt-2">{issue.explanation}</p>

            {/* Source citation */}
            {issue.source_citation && (
              <blockquote className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border-l-2 border-slate-300">
                <Quote className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                <span className="italic">{issue.source_citation}</span>
              </blockquote>
            )}

            {/* Evidence details */}
            {(issue.evidence.matched_text ||
              issue.evidence.detected_color ||
              issue.evidence.contrast_ratio !== undefined ||
              issue.evidence.conflicting_fact) && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {issue.evidence.matched_text && (
                  <div className="bg-slate-50 rounded px-2 py-1.5">
                    <span className="text-slate-400 block mb-0.5">Matched Text</span>
                    <span className="text-slate-700 font-mono">
                      "{issue.evidence.matched_text}"
                    </span>
                  </div>
                )}
                {issue.evidence.detected_color && (
                  <div className="bg-slate-50 rounded px-2 py-1.5">
                    <span className="text-slate-400 block mb-0.5">Detected Color</span>
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span
                        className="w-3 h-3 rounded border border-slate-200"
                        style={{ backgroundColor: issue.evidence.detected_color }}
                      />
                      {issue.evidence.detected_color}
                    </span>
                  </div>
                )}
                {issue.evidence.contrast_ratio !== undefined && (
                  <div className="bg-slate-50 rounded px-2 py-1.5">
                    <span className="text-slate-400 block mb-0.5">Contrast Ratio</span>
                    <span className="text-slate-700">
                      {issue.evidence.contrast_ratio}:1
                      {issue.evidence.required_contrast &&
                        ` (required ${issue.evidence.required_contrast}:1)`}
                    </span>
                  </div>
                )}
                {issue.evidence.conflicting_fact && (
                  <div className="bg-slate-50 rounded px-2 py-1.5">
                    <span className="text-slate-400 block mb-0.5">Conflicting Fact</span>
                    <span className="text-slate-700">
                      {issue.evidence.conflicting_fact}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Suggestion */}
            {issue.suggestion && (
              <div className="flex items-start gap-2 text-xs bg-blue-50 rounded-lg px-3 py-2">
                <Wrench className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                <span className="text-blue-800">{issue.suggestion}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fix modal */}
      {showFixModal && issue.suggested_text && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Suggested Fix</h3>
              <button
                onClick={() => setShowFixModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <p className="text-xs text-slate-400 mb-1">Current Issue</p>
                <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  {issue.explanation}
                </p>
              </div>
              {issue.evidence.matched_text && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Flagged Text</p>
                  <p className="text-xs bg-red-50 rounded-lg px-3 py-2 text-red-700 font-mono line-through">
                    {issue.evidence.matched_text}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 mb-1">Updated Copy</p>
                <p className="text-xs bg-emerald-50 rounded-lg px-3 py-2 text-emerald-800 font-sans leading-relaxed">
                  {issue.suggested_text}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFixModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptFix}
                className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium"
              >
                Accept Fix & Mutate Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

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
    { label: 'All', value: 'all' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'med' },
    { label: 'Low', value: 'low' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Top section */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex items-start gap-4">
          {/* Risk score */}
          <div
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${riskBg(submission.risk_score)}`}
          >
            <span className="text-lg font-bold leading-none">
              {submission.risk_score}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-900 truncate">
                {submission.title}
              </h1>
              {submission.risk_level && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    submission.risk_level === 'Critical' || submission.risk_level === 'High'
                      ? 'bg-red-50 text-red-700'
                      : submission.risk_level === 'Moderate'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-green-50 text-green-700'
                  }`}
                >
                  {submission.risk_level}
                </span>
              )}
            </div>

            {/* Stat boxes */}
            <div className="flex gap-3 mt-2">
              {(['high', 'med', 'low'] as const).map((sev) => (
                <div
                  key={sev}
                  className="flex items-center gap-1.5 text-xs border border-slate-200 rounded px-2 py-1"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${severityDot[sev]}`}
                  />
                  <span className="text-slate-500 capitalize">
                    {sev === 'med' ? 'Medium' : sev}
                  </span>
                  <span className="font-medium text-slate-700">
                    {countBySeverity[sev]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Left column — submitted content */}
        <div className="w-5/12 space-y-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Submitted Content
          </h2>

          {/* Caption with highlights */}
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {buildHighlightedCaption(submission.caption, issues)}
            </p>
          </div>

          {/* Image preview */}
          {submission.image_url && (
            <div className="relative border border-slate-200 rounded-lg overflow-hidden">
              <img
                src={submission.image_url}
                alt={submission.title}
                className="w-full object-cover max-h-64"
              />
              {/* Overlay badges for color/contrast issues */}
              {issues.some(
                (i) =>
                  i.status === 'open' &&
                  (i.category === 'visual_colour' || i.category === 'visual_contrast')
              ) && (
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {issues
                    .filter(
                      (i) =>
                        i.status === 'open' &&
                        (i.category === 'visual_colour' ||
                          i.category === 'visual_contrast')
                    )
                    .map((i) => (
                      <span
                        key={i.id}
                        className={`text-xs px-1.5 py-0.5 rounded ${severityBg[i.severity]} backdrop-blur-sm`}
                      >
                        {i.category === 'visual_colour' ? 'Color' : 'Contrast'}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Review actions */}
          <div className="pt-2 space-y-2">
            {isCreator && submission.status === 'analyzed' && (
              <button
                onClick={onSubmitForReview}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit for Review
              </button>
            )}

            {isReviewer && submission.review_status === 'pending' && (
              <>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Review comment…"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      onSubmitReview(submission.id, 'approve', reviewComment)
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      onSubmitReview(
                        submission.id,
                        'request_changes',
                        reviewComment
                      )
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Request Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right column — issues */}
        <div className="w-7/12 space-y-3">
          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  filter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-xs text-slate-400 ml-auto">
              {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Issue cards */}
          <div className="space-y-2">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                caption={submission.caption}
                onApplyFix={onApplyFix}
              />
            ))}

            {filteredIssues.length === 0 && (
              <p className="text-sm text-slate-400 py-8 text-center">
                No issues match this filter.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitedIssueReport;
