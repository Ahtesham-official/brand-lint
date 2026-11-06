import React, { useState } from 'react';
import { Eye, CheckCircle2, XCircle, Send } from 'lucide-react';
import { Brand, User, Submission } from '@/types';

interface ReviewPageProps {
  brand: Brand;
  currentUser: User;
  submissions: Submission[];
  onSelectSubmission: (id: string) => void;
  onSubmitReview: (submissionId: string, decision: 'approve' | 'request_changes', comment: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  brand,
  currentUser,
  submissions,
  onSelectSubmission,
  onSubmitReview,
}) => {
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'approve' | 'request_changes'>('approve');
  const [comment, setComment] = useState('');

  const pending = submissions.filter(
    (s) => s.review_status === 'pending' || !s.review_status
  );
  const decided = submissions.filter(
    (s) => s.review_status === 'approved' || s.review_status === 'changes_requested'
  );

  const handleSubmit = () => {
    if (!decidingId) return;
    onSubmitReview(decidingId, decision, comment);
    setDecidingId(null);
    setDecision('approve');
    setComment('');
  };

  const handleCancel = () => {
    setDecidingId(null);
    setDecision('approve');
    setComment('');
  };

  const renderRow = (sub: Submission, showActions: boolean) => (
    <div
      key={sub.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        background: 'var(--white)',
        border: '1px solid var(--rule)',
        gap: 16,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
          {sub.title}
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
          {sub.creator_name ?? 'Unknown Creator'} · {timeAgo(sub.created_at)}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span
          className="badge"
          style={{
            background: sub.risk_score >= 70 ? '#fef2f2' : sub.risk_score >= 40 ? '#fef3c7' : '#f0fdf4',
            color: sub.risk_score >= 70 ? '#b91c1c' : sub.risk_score >= 40 ? '#92400e' : '#15803d',
            borderColor: sub.risk_score >= 70 ? '#fca5a5' : sub.risk_score >= 40 ? '#fcd34d' : '#86efac',
          }}
        >
          Score: {sub.risk_score}
        </span>

        {sub.review_status === 'approved' && (
          <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#86efac' }}>
            <CheckCircle2 style={{ width: 11, height: 11, marginRight: 4 }} /> Approved
          </span>
        )}
        {sub.review_status === 'changes_requested' && (
          <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }}>
            <XCircle style={{ width: 11, height: 11, marginRight: 4 }} /> Changes Requested
          </span>
        )}

        {showActions && (
          <>
            <button
              onClick={() => onSelectSubmission(sub.id)}
              style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--rule)', color: 'var(--ink)', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Eye style={{ width: 13, height: 13 }} /> Inspect
            </button>
            <button
              onClick={() => setDecidingId(sub.id)}
              style={{ padding: '6px 14px', background: 'var(--btn-primary)', border: '1px solid var(--rule-dark)', color: 'var(--white)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Decide
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div className="kicker-accent" style={{ marginBottom: 8 }}>Governance Queue</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 34, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', lineHeight: 1 }}>
            Review Queue
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 8, fontWeight: 300 }}>
            {pending.length} submission{pending.length === 1 ? '' : 's'} awaiting human review decision.
          </p>
        </div>
      </div>

      {/* Decision form overlay/card */}
      {decidingId && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--rule)', padding: '24px 28px', marginBottom: 28, boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}>
          <div className="kicker-accent" style={{ marginBottom: 6 }}>Action Decision</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, margin: '0 0 16px', color: 'var(--ink)' }}>
            Reviewing Submission
          </h2>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button
              onClick={() => setDecision('approve')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: decision === 'approve' ? '#f0fdf4' : 'transparent',
                color: decision === 'approve' ? '#15803d' : 'var(--ink-mid)',
                border: `1px solid ${decision === 'approve' ? '#86efac' : 'var(--rule)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <CheckCircle2 style={{ width: 14, height: 14 }} /> Approve for Publishing
            </button>
            <button
              onClick={() => setDecision('request_changes')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: decision === 'request_changes' ? '#fef2f2' : 'transparent',
                color: decision === 'request_changes' ? '#b91c1c' : 'var(--ink-mid)',
                border: `1px solid ${decision === 'request_changes' ? '#fca5a5' : 'var(--rule)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <XCircle style={{ width: 14, height: 14 }} /> Request Changes
            </button>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add review feedback comment..."
            rows={3}
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', outline: 'none', resize: 'vertical', marginBottom: 14 }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={handleCancel} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--rule)', color: 'var(--ink-mid)', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{ padding: '8px 22px', background: 'var(--btn-primary)', border: '1px solid var(--rule-dark)', color: 'var(--white)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Send style={{ width: 13, height: 13 }} /> Submit Review
            </button>
          </div>
        </div>
      )}

      {/* Pending section */}
      <div style={{ marginBottom: 40 }}>
        <div className="kicker" style={{ marginBottom: 14 }}>
          Awaiting Decision ({pending.length})
        </div>
        {pending.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--rule)' }}>
            <p style={{ fontSize: 13, color: 'var(--ink-faint)', margin: 0 }}>Queue clear — all items reviewed.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map((sub) => renderRow(sub, true))}
          </div>
        )}
      </div>

      {/* Decided section */}
      {decided.length > 0 && (
        <div>
          <div className="kicker" style={{ marginBottom: 14 }}>
            Past Decisions ({decided.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {decided.map((sub) => renderRow(sub, false))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
