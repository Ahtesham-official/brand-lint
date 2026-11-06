import React, { useState, useMemo } from 'react';
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

const SEVERITY_BADGE: Record<Severity, { bg: string; color: string; border: string }> = {
  high: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  med:  { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  low:  { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
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

    const isHigh = span.severity === 'high';
    parts.push(
      <mark
        key={`${span.issueId}-${i}`}
        onClick={() => onSelectIssue?.(span.issueId)}
        style={{
          cursor: 'pointer',
          padding: '2px 4px',
          background: isHigh ? '#fee2e2' : '#fef3c7',
          color: isHigh ? '#991b1b' : '#92400e',
          borderBottom: `2px solid ${isHigh ? '#dc2626' : '#d97706'}`,
        }}
        title={`Click to view citation: ${span.text}`}
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

const IssueCard: React.FC<{
  issue: Issue;
  caption: string;
  brand: Brand;
  isFocused?: boolean;
  onApplyFix: (issueId: string, updatedCaption: string) => void;
}> = ({ issue, caption, isFocused, onApplyFix }) => {
  const [expanded, setExpanded] = useState(true);
  const [showFixModal, setShowFixModal] = useState(false);
  const isFixed = issue.status === 'fixed';
  const sevStyle = SEVERITY_BADGE[issue.severity] || SEVERITY_BADGE.med;

  return (
    <>
      <div
        id={`issue-${issue.id}`}
        style={{
          background: isFixed ? 'var(--paper-mid)' : 'var(--white)',
          border: `1px solid ${isFocused ? 'var(--ink)' : 'var(--rule)'}`,
          boxShadow: isFocused ? '0 0 0 2px var(--ink)' : 'none',
          padding: '18px 20px',
          opacity: isFixed ? 0.6 : 1,
          transition: 'all 0.15s',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: sevStyle.bg, color: sevStyle.color, borderColor: sevStyle.border }}>
            {sevStyle.color === '#b91c1c' ? 'High' : sevStyle.color === '#92400e' ? 'Med' : 'Low'}
          </span>
          <span className="badge" style={{ background: 'var(--paper-mid)', color: 'var(--ink-mid)', borderColor: 'var(--rule)' }}>
            {categoryLabel(issue.category)}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--ink)',
              textDecoration: isFixed ? 'line-through' : 'none',
            }}
          >
            {issue.rule_title || categoryLabel(issue.category)}
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>
            {Math.round(issue.confidence * 100)}% conf
          </span>
          {issue.suggested_text && !isFixed && (
            <button
              onClick={() => setShowFixModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                background: 'var(--btn-primary)',
                color: 'var(--white)',
                border: '1px solid var(--rule-dark)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Wrench style={{ width: 12, height: 12 }} />
              Apply Fix
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 2 }}
          >
            {expanded ? <ChevronUp style={{ width: 15, height: 15 }} /> : <ChevronDown style={{ width: 15, height: 15 }} />}
          </button>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span className="kicker" style={{ marginBottom: 4 }}>Explanation</span>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
                {issue.explanation}
              </p>
            </div>

            {issue.source_citation && (
              <div style={{ background: 'var(--paper)', padding: '12px 16px', borderLeft: '3px solid var(--accent)' }}>
                <span className="kicker" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Quote style={{ width: 10, height: 10, color: 'var(--accent)' }} /> Guideline Citation
                </span>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink)', margin: 0, lineHeight: 1.6 }}>
                  "{issue.source_citation}"
                </p>
              </div>
            )}

            {issue.category === 'claim_policy' && issue.evidence.conflicting_fact && (
              <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', padding: '12px 16px' }}>
                <span className="kicker" style={{ color: '#86198f', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Database style={{ width: 11, height: 11 }} /> Fact Vault Conflict
                </span>
                <p style={{ fontSize: 12, color: '#701a75', margin: 0 }}>
                  Contradicts verified claim: "{issue.evidence.conflicting_fact}"
                </p>
              </div>
            )}

            {issue.suggestion && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px' }}>
                <span className="kicker" style={{ color: '#1e40af', marginBottom: 4 }}>Suggestion</span>
                <p style={{ fontSize: 12, color: '#1e3a8a', margin: 0, lineHeight: 1.5 }}>
                  {issue.suggestion}
                </p>
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

  const handleSelectSpan = (issueId: string) => {
    setFocusedIssueId(issueId);
    const element = document.getElementById(`issue-${issueId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Top Back Button ── */}
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Submissions
      </button>

      {/* ── Header Summary Card ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '24px 28px', background: 'var(--white)', border: '1px solid var(--rule)', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Risk score stamp */}
          <div
            style={{
              width: 68,
              height: 68,
              background: submission.risk_score >= 70 ? '#fef2f2' : submission.risk_score >= 40 ? '#fef3c7' : '#f0fdf4',
              border: `2px solid ${submission.risk_score >= 70 ? '#fca5a5' : submission.risk_score >= 40 ? '#fcd34d' : '#86efac'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, color: submission.risk_score >= 70 ? '#b91c1c' : submission.risk_score >= 40 ? '#92400e' : '#15803d', lineHeight: 1 }}>
              {submission.risk_score}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 2 }}>
              Risk
            </span>
          </div>

          <div>
            <div className="kicker-accent" style={{ marginBottom: 4 }}>Cited Compliance Report</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 900, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
              {submission.title}
            </h1>
            <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
              Creator: {submission.creator_name || 'Alex Rivera'} · Level: {submission.risk_level || 'Moderate'}
            </p>
          </div>
        </div>

        {/* Severity counters */}
        <div style={{ display: 'flex', gap: 10 }}>
          {(['high', 'med', 'low'] as const).map((sev) => {
            const b = SEVERITY_BADGE[sev];
            return (
              <div key={sev} style={{ padding: '8px 14px', background: b.bg, border: `1px solid ${b.border}`, textAlign: 'center', minWidth: 64 }}>
                <span className="kicker" style={{ color: b.color, marginBottom: 2 }}>{sev}</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: b.color }}>{countBySeverity[sev]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Two Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 28, alignItems: 'start' }}>
        {/* Left column — Submitted content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 8 }}>Submitted Caption Copy</div>
            <div style={{ background: 'var(--white)', border: '1px solid var(--rule)', padding: '20px', fontSize: 13, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
              {buildHighlightedCaption(submission.caption, issues, handleSelectSpan)}
            </div>
            <span className="kicker" style={{ marginTop: 6, color: 'var(--ink-faint)' }}>
              Click highlighted phrases to view citations in report.
            </span>
          </div>

          {submission.image_url && (
            <div>
              <div className="kicker" style={{ marginBottom: 8 }}>Poster Graphic</div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--rule)', padding: '8px' }}>
                <img src={submission.image_url} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>
          )}

          {isCreator && (
            <button
              onClick={onSubmitForReview}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', background: 'var(--btn-primary)', color: 'var(--white)', border: '1px solid var(--rule-dark)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              <Send style={{ width: 14, height: 14 }} /> Submit for Human Review
            </button>
          )}

          {isReviewer && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--rule)', padding: '20px' }}>
              <div className="kicker-accent" style={{ marginBottom: 8 }}>Reviewer Decision</div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Leave reviewer notes..."
                rows={2}
                style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', outline: 'none', resize: 'none', marginBottom: 10 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onSubmitReview(submission.id, 'approve', reviewComment)}
                  style={{ flex: 1, padding: '9px', background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                >
                  <CheckCircle2 style={{ width: 13, height: 13 }} /> Approve
                </button>
                <button
                  onClick={() => onSubmitReview(submission.id, 'request_changes', reviewComment)}
                  style={{ flex: 1, padding: '9px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                >
                  <AlertTriangle style={{ width: 13, height: 13 }} /> Request Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column — Cited issues */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="kicker">Compliance Violations ({filteredIssues.length})</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'high', 'med', 'low'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilter(sev)}
                  style={{
                    padding: '3px 10px',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    background: filter === sev ? 'var(--ink)' : 'transparent',
                    color: filter === sev ? 'var(--white)' : 'var(--ink-faint)',
                    border: `1px solid ${filter === sev ? 'var(--ink)' : 'var(--rule)'}`,
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--rule)' }}>
                <p style={{ fontSize: 13, color: 'var(--ink-faint)', margin: 0 }}>No issues in this filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitedIssueReport;
