import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import type { Submission } from '@/types';

interface SubmissionsPageProps {
  submissions: Submission[];
  onSelectSubmission: (id: string) => void;
}

const RISK_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  Critical: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  High:     { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  Moderate: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Low:      { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SubmissionsPage: React.FC<SubmissionsPageProps> = ({
  submissions,
  onSelectSubmission,
}) => {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div className="kicker-accent" style={{ marginBottom: 8 }}>Compliance Archive</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 34, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', lineHeight: 1 }}>
            Submissions
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 8, fontWeight: 300 }}>
            {submissions.length} content checks submitted for brand governance review.
          </p>
        </div>
      </div>

      {/* ── List ── */}
      {submissions.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--rule)' }}>
          <FileText style={{ width: 32, height: 32, color: 'var(--rule)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--ink-faint)' }}>No submissions found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {submissions.map((sub) => {
            const risk = RISK_BADGE[sub.risk_level || 'Low'] || RISK_BADGE.Low;
            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubmission(sub.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '20px 24px',
                  background: 'var(--white)',
                  border: '1px solid var(--rule)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>
                      {sub.title}
                    </span>
                    <span className="badge" style={{ background: risk.bg, color: risk.color, borderColor: risk.border }}>
                      Risk {sub.risk_score} / 100
                    </span>
                    {sub.review_status && (
                      <span className="badge" style={{ background: 'var(--paper-mid)', color: 'var(--ink-mid)', borderColor: 'var(--rule)' }}>
                        {sub.review_status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-light)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sub.caption}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>
                    {formatTime(sub.created_at)}
                  </span>
                  <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--btn-primary)', color: 'var(--white)', border: '1px solid var(--rule-dark)' }}>
                    <ArrowRight style={{ width: 14, height: 14, color: 'var(--white)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubmissionsPage;
