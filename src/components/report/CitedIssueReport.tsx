import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Quote,
  Database,
  Send,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Loader2,
  ScanText,
} from 'lucide-react';
import type { Submission, Issue, Brand, User, Severity } from '@/types';
import { FixDiffModal } from './FixDiffModal';
import {
  AnimatedCounter,
  AnimatedProgressBar,
  EASE_OUT_EXPO,
} from '@/components/motion/MotionPrimitives';

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
  onRecalculate?: (submissionId: string) => Promise<void>;
}

const SEVERITY_STYLE: Record<Severity, { badge: string; border: string; label: string }> = {
  high: {
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    border: 'border-l-rose-500',
    label: 'High',
  },
  med: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    border: 'border-l-amber-500',
    label: 'Medium',
  },
  low: {
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
    border: 'border-l-sky-500',
    label: 'Low',
  },
};

const categoryLabel = (cat: string): string =>
  cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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

  spans.forEach((span, idx) => {
    if (span.start < cursor) return;
    if (span.start > cursor) {
      parts.push(caption.slice(cursor, span.start));
    }

    const highlightClass =
      span.severity === 'high'
        ? 'bg-rose-100 text-rose-900 decoration-rose-400'
        : span.severity === 'med'
        ? 'bg-amber-100 text-amber-900 decoration-amber-400'
        : 'bg-sky-100 text-sky-900 decoration-sky-400';

    parts.push(
      <mark
        key={`${span.issueId}-${idx}`}
        onClick={() => onSelectIssue?.(span.issueId)}
        className={`cursor-pointer rounded px-1 py-0.5 font-medium underline decoration-wavy ${highlightClass}`}
        title="Click to inspect cited violation"
      >
        {span.text}
      </mark>
    );

    cursor = span.end;
  });

  if (cursor < caption.length) {
    parts.push(caption.slice(cursor));
  }

  return parts;
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
  onRecalculate,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(issues.map((i) => i.id)));
  const [fixModalIssue, setFixModalIssue] = useState<Issue | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const openIssues = useMemo(() => issues.filter((i) => i.status === 'open'), [issues]);
  const fixedIssues = useMemo(() => issues.filter((i) => i.status === 'fixed'), [issues]);

  const severityCounts = useMemo(
    () => ({
      high: openIssues.filter((i) => i.severity === 'high').length,
      med: openIssues.filter((i) => i.severity === 'med').length,
      low: openIssues.filter((i) => i.severity === 'low').length,
    }),
    [openIssues]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectSpan = (issueId: string) => {
    setExpandedIds((prev) => new Set(prev).add(issueId));
    const el = document.getElementById(`issue-${issueId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleRecalculateClick = async () => {
    if (!onRecalculate || recalculating) return;
    setRecalculating(true);
    try {
      await onRecalculate(submission.id);
    } finally {
      setRecalculating(false);
    }
  };

  const riskScore = submission.risk_score ?? 0;
  const riskColor =
    riskScore >= 70
      ? 'text-rose-600'
      : riskScore >= 40
      ? 'text-amber-600'
      : 'text-emerald-600';
  const riskBarColor =
    riskScore >= 70
      ? 'bg-rose-500'
      : riskScore >= 40
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const complianceStatusLabel =
    submission.review_status === 'approved'
      ? 'Approved for Publication'
      : submission.review_status === 'changes_requested'
      ? 'Changes Requested'
      : openIssues.length === 0
      ? 'Compliant · Ready for Sign-off'
      : 'Flagged · Pending Review';

  const isReviewer = currentUser.role === 'reviewer' || currentUser.role === 'admin';

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-sans text-slate-900">
      {/* ── Top Breadcrumb & Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to list
        </button>

        <div className="flex items-center gap-2.5">
          {onRecalculate && (
            <button
              type="button"
              onClick={handleRecalculateClick}
              disabled={recalculating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {recalculating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Recalculate Analysis
            </button>
          )}
          {currentUser.role === 'creator' && (
            <button
              type="button"
              onClick={onSubmitForReview}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Send className="h-3.5 w-3.5" />
              Send to Reviewer
            </button>
          )}
        </div>
      </div>

      {/* ── Hero Summary Banner ── */}
      <div className="saas-card p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="kicker-accent">Compliance Report</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-xs text-slate-500">{brand.name}</span>
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {submission.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span
                className={`badge ${
                  submission.review_status === 'approved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : submission.review_status === 'changes_requested'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : openIssues.length === 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {complianceStatusLabel}
              </span>
              <span className="text-xs text-slate-500">
                Submitted by <strong className="font-medium text-slate-700">{submission.creator_name || 'Creator'}</strong>
              </span>
            </div>
          </div>

          {/* Risk Gauge & Severity Breakdown */}
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50/80 px-6 py-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Risk Score
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <AnimatedCounter
                  value={riskScore}
                  className={`font-serif text-3xl font-bold ${riskColor}`}
                />
                <span className="font-mono text-xs text-slate-400">/ 100</span>
              </div>
              <div className="mt-2 w-28">
                <AnimatedProgressBar value={riskScore} barClassName={riskBarColor} />
              </div>
            </div>

            <div className="h-12 w-px bg-slate-200" />

            <div className="flex items-center gap-4 text-center">
              <div>
                <div className="font-mono text-lg font-bold text-rose-600">{severityCounts.high}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">High</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-amber-600">{severityCounts.med}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Med</div>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-sky-600">{severityCounts.low}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Low</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-Column Inspection Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Annotated Asset & Caption */}
        <div className="space-y-5 lg:col-span-5">
          <div className="saas-card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Annotated Marketing Copy
              </h2>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                {buildHighlightedCaption(submission.caption || '(No caption text)', issues, handleSelectSpan)}
              </div>
              {openIssues.length > 0 && (
                <p className="mt-2.5 text-[11px] text-slate-400">
                  Click any highlighted phrase to jump to its cited guideline violation.
                </p>
              )}
            </div>
          </div>

          {submission.image_url && (
            <div className="saas-card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Creative Asset Preview
                </h2>
              </div>
              <div className="p-5">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <img
                    src={submission.image_url}
                    alt={submission.title}
                    className="max-h-72 w-full object-cover"
                  />
                </div>
                {submission.ocr_text && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <ScanText className="h-3.5 w-3.5" /> Extracted Poster OCR
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700">
                      {submission.ocr_text}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviewer Sign-off Card */}
          {isReviewer && (
            <div className="saas-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Human Governance Decision
                </h2>
              </div>
              <p className="mb-4 text-xs text-slate-500">
                AI detects and explains. Humans decide and approve. Record your final sign-off below.
              </p>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add reviewer notes or rationale for audit log..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSubmitReview(submission.id, 'approve', reviewComment);
                    setReviewComment('');
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSubmitReview(submission.id, 'request_changes', reviewComment);
                    setReviewComment('');
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Request Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Cited Issues List */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Detected Issues ({openIssues.length} open · {fixedIssues.length} resolved)
            </h2>
          </div>

          {issues.length === 0 ? (
            <div className="saas-card p-10 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-emerald-500" />
              <h3 className="text-base font-semibold text-slate-900">No Compliance Issues Detected</h3>
              <p className="mt-1 text-xs text-slate-500">
                This submission passed all active brand rules and Fact Vault checks.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => {
                const isExpanded = expandedIds.has(issue.id);
                const sev = SEVERITY_STYLE[issue.severity] || SEVERITY_STYLE.med;
                const isFixed = issue.status === 'fixed';

                return (
                  <div
                    key={issue.id}
                    id={`issue-${issue.id}`}
                    className={`saas-card overflow-hidden border-l-4 ${
                      isFixed ? 'border-l-emerald-500 opacity-80' : sev.border
                    }`}
                  >
                    {/* Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(issue.id)}
                      className="btn-plain flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/70"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isFixed ? (
                            <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> Resolved
                            </span>
                          ) : (
                            <span className={`badge ${sev.badge}`}>
                              <AlertTriangle className="h-3 w-3" /> {sev.label}
                            </span>
                          )}
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {categoryLabel(issue.category)}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            Confidence {Math.round((issue.confidence || 0.85) * 100)}%
                          </span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">
                          {issue.rule_title || categoryLabel(issue.category)}
                        </h3>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                    </button>

                    {/* Body */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                          className="overflow-hidden border-t border-slate-100"
                        >
                          <div className="space-y-4 px-5 py-4 text-xs">
                        <p className="leading-relaxed text-slate-700">{issue.explanation}</p>

                        {/* Citation */}
                        {issue.source_citation && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              <Quote className="h-3 w-3 text-sky-600" /> Supporting Guideline Citation
                            </div>
                            <p className="font-mono text-[11px] italic text-slate-700">
                              &ldquo;{issue.source_citation}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Evidence Metadata */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {issue.evidence.matched_text && (
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Matched Evidence
                              </span>
                              <div className="mt-1 font-mono text-xs font-semibold text-rose-700">
                                &ldquo;{issue.evidence.matched_text}&rdquo;
                              </div>
                            </div>
                          )}

                          {issue.evidence.conflicting_fact && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                <Database className="h-3 w-3" /> Fact Vault Conflict
                              </span>
                              <div className="mt-1 text-xs font-medium text-slate-800">
                                {issue.evidence.conflicting_fact}
                              </div>
                              {issue.evidence.fact_expiry && (
                                <div className="mt-0.5 font-mono text-[10px] text-amber-700">
                                  Expired: {new Date(issue.evidence.fact_expiry).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          )}

                          {issue.evidence.detected_color && (
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Visual Colour Check
                              </span>
                              <div className="mt-1 flex items-center gap-2 font-mono text-xs">
                                <span
                                  className="h-4 w-4 rounded border border-slate-300"
                                  style={{ background: issue.evidence.detected_color }}
                                />
                                <span>{issue.evidence.detected_color}</span>
                                {issue.evidence.delta_e !== undefined && (
                                  <span className="text-slate-400">ΔE {issue.evidence.delta_e.toFixed(1)}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Suggestion & Fix Action */}
                        <div className="flex flex-col justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 sm:flex-row sm:items-center">
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                              Suggested Correction
                            </span>
                            <p className="text-xs font-medium text-slate-800">{issue.suggestion}</p>
                          </div>

                          {!isFixed && issue.suggested_text && (
                            <button
                              type="button"
                              onClick={() => setFixModalIssue(issue)}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                            >
                              <Wrench className="h-3.5 w-3.5" />
                              Review &amp; Apply Fix
                            </button>
                          )}
                        </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fix Diff Modal */}
      {fixModalIssue && (
        <FixDiffModal
          isOpen={!!fixModalIssue}
          onClose={() => setFixModalIssue(null)}
          issue={fixModalIssue}
          currentCaption={submission.caption}
          onAcceptFix={onApplyFix}
        />
      )}
    </div>
  );
};

export default CitedIssueReport;
